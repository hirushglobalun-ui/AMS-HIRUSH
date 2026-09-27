/**
 * File: components/admin/biometrics/useBiometricsData.ts
 * Purpose: Custom hook managing state, approval actions, and Firestore persistence for Biometric Hub.
 * Author: Hirush Global AMS
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../../../firebase';
import { collection, doc, getDocs, getDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { User, BiometricDevice, BiometricSettings } from '../../../types';
import { toast } from 'react-hot-toast';
import { BiometricStatusFilter, BiometricStats } from './types';

export const getUserBiometricDevices = (u: User): BiometricDevice[] => {
  if (u.biometricDevices && u.biometricDevices.length > 0) {
    return u.biometricDevices;
  }
  if (u.biometricDevice) {
    return [{ ...u.biometricDevice, slotLabel: u.biometricDevice.slotLabel || 'Primary Finger (Thumb)' }];
  }
  return [];
};

export const useBiometricsData = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BiometricStatusFilter>('all');

  const [biometricSettings, setBiometricSettings] = useState<BiometricSettings>({
    enabled: true,
    verificationMode: 'location_and_biometric',
    autoApproveFirstDevice: false,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const settingsRef = doc(db, 'settings', 'general');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists() && settingsSnap.data().biometricSettings) {
        const bio = settingsSnap.data().biometricSettings;
        const isBio = bio.enabled ?? true;
        setBiometricSettings({
          enabled: isBio,
          verificationMode: bio.verificationMode || (isBio ? 'location_and_biometric' : 'location_only'),
          autoApproveFirstDevice: bio.autoApproveFirstDevice || false,
        });
      }

      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('name', 'asc'));
      const snap = await getDocs(q);
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as User)));
    } catch (err) {
      console.error('Error loading biometric data:', err);
      toast.error('Failed to load biometric data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const settingsRef = doc(db, 'settings', 'general');
      await updateDoc(settingsRef, { biometricSettings });
      toast.success('Attendance verification settings updated!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to update settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleApprove = async (targetUser: User, credentialId?: string) => {
    try {
      const userRef = doc(db, 'users', targetUser.id);
      const devices = getUserBiometricDevices(targetUser);
      let updatedDevice: BiometricDevice | undefined = targetUser.biometricDevice;
      let updatedDevices: BiometricDevice[] | undefined = undefined;

      if (devices.length > 0) {
        const nowIso = new Date().toISOString();
        updatedDevices = devices.map((d) => {
          if (!credentialId || d.credentialId === credentialId) {
            return { ...d, status: 'approved' as const, approvedAt: nowIso, approvedBy: 'Admin' };
          }
          return d;
        });
        updatedDevice = updatedDevices.find((d) => d.status === 'approved') || updatedDevices[0];
      }

      const cleanDevices = updatedDevices ? JSON.parse(JSON.stringify(updatedDevices)) : null;
      const cleanDevice = updatedDevice ? JSON.parse(JSON.stringify(updatedDevice)) : null;

      await updateDoc(userRef, { biometricDevice: cleanDevice, biometricDevices: cleanDevices });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id
            ? { ...u, biometricDevice: cleanDevice || undefined, biometricDevices: cleanDevices || undefined }
            : u
        )
      );

      const matchedSlot = devices.find((d) => d.credentialId === credentialId)?.slotLabel;
      toast.success(matchedSlot ? `Approved ${matchedSlot} for ${targetUser.name}!` : `Approved biometric for ${targetUser.name}!`);
    } catch (err) {
      console.error('Error approving biometric device:', err);
      toast.error('Failed to approve device.');
    }
  };

  const handleReject = async (targetUser: User, credentialId?: string) => {
    try {
      const userRef = doc(db, 'users', targetUser.id);
      const devices = getUserBiometricDevices(targetUser);
      let updatedDevice: BiometricDevice | undefined = targetUser.biometricDevice;
      let updatedDevices: BiometricDevice[] | undefined = undefined;

      if (devices.length > 0) {
        updatedDevices = devices.map((d) => {
          if (!credentialId || d.credentialId === credentialId) {
            return { ...d, status: 'rejected' as const };
          }
          return d;
        });
        updatedDevice = updatedDevices.find((d) => d.status === 'approved') || updatedDevices[0];
      }

      const cleanDevices = updatedDevices ? JSON.parse(JSON.stringify(updatedDevices)) : null;
      const cleanDevice = updatedDevice ? JSON.parse(JSON.stringify(updatedDevice)) : null;

      await updateDoc(userRef, { biometricDevice: cleanDevice, biometricDevices: cleanDevices });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id
            ? { ...u, biometricDevice: cleanDevice || undefined, biometricDevices: cleanDevices || undefined }
            : u
        )
      );

      const matchedSlot = devices.find((d) => d.credentialId === credentialId)?.slotLabel;
      toast.error(matchedSlot ? `Rejected ${matchedSlot} for ${targetUser.name}` : `Rejected biometric for ${targetUser.name}`);
    } catch (err) {
      console.error('Error rejecting biometric device:', err);
      toast.error('Failed to reject device.');
    }
  };

  const handleDeleteDevice = async (targetUser: User, credentialId: string, slotLabel?: string) => {
    if (!window.confirm(`Delete ${slotLabel || 'this finger'} for ${targetUser.name}? The employee will be able to register it again.`)) {
      return;
    }
    try {
      const userRef = doc(db, 'users', targetUser.id);
      const devices = getUserBiometricDevices(targetUser);
      const updatedDevices = devices.filter((d) => d.credentialId !== credentialId);
      const updatedDevice = updatedDevices.length > 0 ? updatedDevices.find((d) => d.status === 'approved') || updatedDevices[0] : null;

      const cleanDevices = updatedDevices.length > 0 ? JSON.parse(JSON.stringify(updatedDevices)) : null;
      const cleanDevice = updatedDevice ? JSON.parse(JSON.stringify(updatedDevice)) : null;

      await updateDoc(userRef, { biometricDevice: cleanDevice, biometricDevices: cleanDevices });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id
            ? { ...u, biometricDevice: cleanDevice || undefined, biometricDevices: cleanDevices || undefined }
            : u
        )
      );
      toast.success(`Removed ${slotLabel || 'finger'} for ${targetUser.name}.`);
    } catch (err) {
      console.error('Error deleting biometric slot:', err);
      toast.error('Failed to remove finger.');
    }
  };

  const handleReset = async (targetUser: User) => {
    if (!window.confirm(`Are you sure you want to reset biometric device registration for ${targetUser.name}? They will be able to register a fresh phone.`)) {
      return;
    }
    try {
      const userRef = doc(db, 'users', targetUser.id);
      await updateDoc(userRef, { biometricDevice: null, biometricDevices: null });
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, biometricDevice: undefined, biometricDevices: undefined } : u))
      );
      toast.success(`Biometric device reset for ${targetUser.name}.`);
    } catch (err) {
      console.error('Error resetting biometric device:', err);
      toast.error('Failed to reset device.');
    }
  };

  const handleToggleExemption = async (targetUser: User) => {
    const newExemptState = !targetUser.biometricExempt;
    try {
      const userRef = doc(db, 'users', targetUser.id);
      await updateDoc(userRef, { biometricExempt: newExemptState });
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, biometricExempt: newExemptState } : u)));
      toast.success(newExemptState ? `${targetUser.name} is now exempted (Location-Only).` : `Biometric requirement restored for ${targetUser.name}.`);
    } catch (err) {
      console.error('Error toggling biometric exemption:', err);
      toast.error('Failed to update exemption status.');
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.department?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (statusFilter === 'exempted') return !!u.biometricExempt;

      const devices = getUserBiometricDevices(u);
      const hasPending = devices.some((d) => d.status === 'pending_approval');
      const hasApproved = devices.some((d) => d.status === 'approved');
      const notRegistered = devices.length === 0;

      if (statusFilter === 'pending') return hasPending && !u.biometricExempt;
      if (statusFilter === 'approved') return hasApproved && !hasPending && !u.biometricExempt;
      if (statusFilter === 'not_registered') return notRegistered && !u.biometricExempt;

      return true;
    });
  }, [users, searchQuery, statusFilter]);

  const stats: BiometricStats = useMemo(() => {
    let approved = 0;
    let pending = 0;
    let notRegistered = 0;
    let exempted = 0;

    users.forEach((u) => {
      if (u.biometricExempt) exempted++;
      const devices = getUserBiometricDevices(u);
      if (devices.length === 0) {
        notRegistered++;
      } else if (devices.some((d) => d.status === 'pending_approval')) {
        pending++;
      } else if (devices.some((d) => d.status === 'approved')) {
        approved++;
      }
    });

    return { total: users.length, approved, pending, notRegistered, exempted };
  }, [users]);

  return {
    users,
    loading,
    savingSettings,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    biometricSettings,
    setBiometricSettings,
    handleSaveSettings,
    handleApprove,
    handleReject,
    handleDeleteDevice,
    handleReset,
    handleToggleExemption,
    filteredUsers,
    stats,
  };
};
