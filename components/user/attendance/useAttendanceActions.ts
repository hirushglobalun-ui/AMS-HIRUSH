/**
 * File: components/user/attendance/useAttendanceActions.ts
 * Purpose: Custom hook for check-in, check-out, geolocation verification, and biometric checks.
 * Author: Hirush Global AMS
 */

import { useState } from 'react';
import { db } from '../../../firebase';
import { doc, updateDoc, addDoc, collection, getDoc } from 'firebase/firestore';
import { AttendanceRecord, Session, BiometricSettings, BiometricDevice, User } from '../../../types';
import { toast } from 'react-hot-toast';
import { invalidateCache } from '../../../services/dataService';
import { registerDeviceBiometrics, verifyBiometricPresence, getLocalDeviceId } from '../../../utils/biometricService';
import { getTodayWFHStatus } from '../../../utils/wfhHelper';
import { calculateDistance, calculateTotalHours, getLocalDateString } from './utils';

interface UseAttendanceActionsProps {
  user: User | null;
  updateUser: (user: User) => void;
  todayRecord: AttendanceRecord | null;
  setTodayRecord: React.Dispatch<React.SetStateAction<AttendanceRecord | null>>;
  activeSession: Session | null;
  biometricSettings: BiometricSettings;
  loadAttendance: () => Promise<void>;
}

export const useAttendanceActions = ({
  user,
  updateUser,
  todayRecord,
  setTodayRecord,
  activeSession,
  biometricSettings,
  loadAttendance,
}: UseAttendanceActionsProps) => {
  const [processingAction, setProcessingAction] = useState<'checkin' | 'checkout' | null>(null);
  const [registeringBiometric, setRegisteringBiometric] = useState(false);

  const validateLocation = async (): Promise<{
    valid: boolean;
    isWFH: boolean;
    wfhStatus?: 'approved' | 'pending';
    coords?: { latitude: number; longitude: number; accuracy?: number };
  }> => {
    try {
      const todayStr = getLocalDateString();
      const settingsRef = doc(db, 'settings', 'general');
      const settingsSnap = await getDoc(settingsRef);

      if (!settingsSnap.exists()) return { valid: true, isWFH: false };
      const officeLoc = settingsSnap.data().officeLocation;
      if (!officeLoc || !officeLoc.enabled) return { valid: true, isWFH: false };

      if (user && officeLoc.bypassDepartments && user.department && officeLoc.bypassDepartments.includes(user.department)) {
        return { valid: true, isWFH: false };
      }

      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          toast.error('Geolocation is required for attendance.');
          resolve({ valid: false, isWFH: false });
          return;
        }

        toast.loading('Verifying location...', { id: 'loc-check' });

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            const userAccuracy = position.coords.accuracy;
            const dist = calculateDistance(userLat, userLng, officeLoc.latitude, officeLoc.longitude);
            toast.dismiss('loc-check');

            if (dist <= officeLoc.radius) {
              resolve({
                valid: true,
                isWFH: false,
                coords: { latitude: userLat, longitude: userLng, accuracy: userAccuracy },
              });
            } else {
              if (!user?.id) {
                toast.error('User identity missing.');
                resolve({ valid: false, isWFH: false });
                return;
              }
              const wfhInfo = await getTodayWFHStatus(user.id, todayStr);
              if (wfhInfo.hasWFH && wfhInfo.isApproved) {
                toast.success('Location verified (Work From Home).');
                resolve({
                  valid: true,
                  isWFH: true,
                  wfhStatus: 'approved',
                  coords: { latitude: userLat, longitude: userLng, accuracy: userAccuracy },
                });
              } else if (wfhInfo.hasWFH && wfhInfo.isPending) {
                toast.success('Home location captured (WFH pending approval).');
                resolve({
                  valid: true,
                  isWFH: true,
                  wfhStatus: 'pending',
                  coords: { latitude: userLat, longitude: userLng, accuracy: userAccuracy },
                });
              } else {
                toast.error(`You are away from office (${Math.round(dist)}m). You must be at office or have approved WFH.`, { duration: 6000 });
                resolve({ valid: false, isWFH: false });
              }
            }
          },
          (error) => {
            toast.dismiss('loc-check');
            let msg = 'Could not get your location.';
            if (error.code === 1) msg = 'Location permission denied.';
            else if (error.code === 2) msg = 'Location unavailable.';
            else if (error.code === 3) msg = 'Location request timed out.';
            toast.error(msg);
            resolve({ valid: false, isWFH: false });
          },
          { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
        );
      });
    } catch {
      return { valid: true, isWFH: false };
    }
  };

  const handleRegisterSlot = async (slotIndex: number, slotLabel: string) => {
    if (!user) return;
    setRegisteringBiometric(true);
    try {
      const existingDevices = user.biometricDevices || (user.biometricDevice ? [user.biometricDevice] : []);
      toast.loading(`Touch sensor to register ${slotLabel}...`, { id: 'bio-reg' });
      const res = await registerDeviceBiometrics(user, biometricSettings.autoApproveFirstDevice, slotLabel, slotIndex);
      toast.dismiss('bio-reg');

      if (!res.success || !res.device) {
        toast.error(res.error || 'Failed to register fingerprint.');
        return;
      }

      const filtered = existingDevices.filter((d) => (d.slotIndex ? d.slotIndex !== slotIndex : d.slotLabel !== slotLabel));
      const updatedDevices = [...filtered, res.device].sort((a, b) => (a.slotIndex || 1) - (b.slotIndex || 1));
      const cleanDevices: BiometricDevice[] = JSON.parse(JSON.stringify(updatedDevices));

      await updateDoc(doc(db, 'users', user.id), {
        biometricDevice: cleanDevices[0],
        biometricDevices: cleanDevices,
      });
      updateUser({ ...user, biometricDevice: cleanDevices[0], biometricDevices: cleanDevices });

      toast.success(
        biometricSettings.autoApproveFirstDevice && existingDevices.length === 0
          ? `${slotLabel} registered & approved!`
          : `${slotLabel} registered! Awaiting Admin/HR approval.`
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to register device.');
    } finally {
      setRegisteringBiometric(false);
    }
  };

  const verifyBiometricForAttendance = async (): Promise<boolean> => {
    const isBioActive = biometricSettings.enabled && biometricSettings.verificationMode !== 'location_only';
    if (!isBioActive || user?.biometricExempt) return true;

    const devices = user?.biometricDevices || (user?.biometricDevice ? [user.biometricDevice] : []);
    if (devices.length === 0) {
      toast.error("Phone biometric not registered. Tap 'Register My Thumb' above.", { duration: 5000 });
      return false;
    }

    const approvedDevices = devices.filter((d) => d.status === 'approved');
    if (approvedDevices.length === 0) {
      toast.error('Registered device pending approval. Please contact HR.', { duration: 5000 });
      return false;
    }

    const currentDeviceId = getLocalDeviceId();
    const matchingDevice = approvedDevices.find((d) => d.deviceId === currentDeviceId);
    if (!matchingDevice) {
      toast.error(`Unauthorized Device: Must mark attendance from approved phone (${approvedDevices[0].deviceName}).`, { duration: 6000 });
      return false;
    }

    toast.loading('Touch fingerprint sensor...', { id: 'bio-check' });
    const bioResult = await verifyBiometricPresence(approvedDevices.map((d) => d.credentialId));
    toast.dismiss('bio-check');

    if (!bioResult.success) {
      toast.error(bioResult.error || 'Biometric verification failed.');
      return false;
    }
    return true;
  };

  const handleCheckIn = async () => {
    if (!user || activeSession || processingAction) return;
    setProcessingAction('checkin');
    try {
      const locResult = await validateLocation();
      if (!locResult.valid) return;
      const isBioValid = await verifyBiometricForAttendance();
      if (!isBioValid) return;

      const nowStr = new Date().toLocaleTimeString('en-GB');
      const todayStr = getLocalDateString();
      const isBioActive = biometricSettings.enabled && biometricSettings.verificationMode !== 'location_only';

      const newSession: Session = {
        id: `s${Date.now()}`,
        checkIn: nowStr,
        checkOut: null,
        biometricVerified: isBioActive,
        deviceId: getLocalDeviceId(),
        isWFH: locResult.isWFH,
        ...(locResult.wfhStatus ? { wfhStatus: locResult.wfhStatus } : {}),
        ...(locResult.coords ? { location: locResult.coords } : {}),
      };

      if (todayRecord) {
        const updatedSessions = [...todayRecord.sessions, newSession];
        const updates: Partial<AttendanceRecord> = { sessions: updatedSessions };
        if (locResult.isWFH) {
          updates.isWFH = true;
          if (locResult.wfhStatus) updates.wfhStatus = locResult.wfhStatus;
        }
        await updateDoc(doc(db, 'attendance', todayRecord.id), updates);
        setTodayRecord((prev) => (prev ? { ...prev, ...updates } : prev));
      } else {
        const newRecordData = {
          userId: user.id,
          date: todayStr,
          sessions: [newSession],
          totalHours: 0,
          isWFH: locResult.isWFH || false,
          ...(locResult.wfhStatus ? { wfhStatus: locResult.wfhStatus } : {}),
        };
        const docRef = await addDoc(collection(db, 'attendance'), newRecordData);
        setTodayRecord({ id: docRef.id, ...newRecordData });
      }

      invalidateCache('attendance');
      toast.success(`Checked in successfully!${locResult.isWFH ? ' (WFH)' : ''}`);
    } catch {
      toast.error('Failed to check in.');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleCheckOut = async () => {
    if (!activeSession || !todayRecord || processingAction) return;
    setProcessingAction('checkout');
    try {
      const locResult = await validateLocation();
      if (!locResult.valid) return;
      const isBioValid = await verifyBiometricForAttendance();
      if (!isBioValid) return;

      const nowStr = new Date().toLocaleTimeString('en-GB');
      const updatedSessions = todayRecord.sessions.map((s) =>
        s.id === activeSession.id
          ? { ...s, checkOut: nowStr, ...(locResult.coords ? { checkOutLocation: locResult.coords } : {}) }
          : s
      );

      const totalHours = calculateTotalHours(todayRecord.date, updatedSessions);
      await updateDoc(doc(db, 'attendance', todayRecord.id), { sessions: updatedSessions, totalHours });
      invalidateCache('attendance');
      await loadAttendance();
      toast.success('Checked out successfully!');
    } catch {
      toast.error('Failed to check out.');
    } finally {
      setProcessingAction(null);
    }
  };

  return {
    processingAction,
    registeringBiometric,
    handleRegisterSlot,
    handleCheckIn,
    handleCheckOut,
  };
};
