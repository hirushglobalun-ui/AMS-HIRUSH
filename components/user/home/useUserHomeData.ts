/**
 * File: components/user/home/useUserHomeData.ts
 * Purpose: Custom hook providing real-time data, announcements, celebrations, and check-in/out for UserHome.
 * Author: Hirush Global AMS
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, AttendanceRecord, Session, Message, Lead, BiometricSettings } from '../../../types';
import { fetchAttendance as fetchAttendanceData, fetchUsers, invalidateCache } from '../../../services/dataService';
import { db } from '../../../firebase';
import {
  doc,
  updateDoc,
  addDoc,
  collection,
  getDocs,
  query,
  orderBy,
  getDoc,
  serverTimestamp,
  limit,
  onSnapshot,
  where,
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { verifyBiometricPresence, getLocalDeviceId } from '../../../utils/biometricService';
import { getTodayWFHStatus } from '../../../utils/wfhHelper';
import { calculateDistance, calculateTotalHours, getLocalDateString } from '../attendance/utils';

export const useUserHomeData = (user: User | null) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Message[]>([]);
  const [biometricSettings, setBiometricSettings] = useState<BiometricSettings>({
    enabled: true,
    verificationMode: 'location_and_biometric',
    autoApproveFirstDevice: false,
  });
  const [birthdays, setBirthdays] = useState<{ user: User; dateStr: string; isToday: boolean }[]>([]);
  const [workAnniversaries, setWorkAnniversaries] = useState<{ user: User; years: number; dateStr: string; isToday: boolean }[]>([]);
  const [wishedUsers, setWishedUsers] = useState<Set<string>>(new Set());
  const [expiringDomains, setExpiringDomains] = useState<Lead[]>([]);

  const handleSendWish = async (targetUser: User, type: 'birthday' | 'anniversary', years?: number) => {
    if (!user) return;
    try {
      const title = type === 'birthday' ? `Happy Birthday, ${targetUser.name}! 🎂` : `Happy Work Anniversary, ${targetUser.name}! 🎉`;
      const content =
        type === 'birthday'
          ? `Wishing you a fantastic birthday filled with joy and success!\n\nBest wishes,\n${user.name}`
          : `Congratulations on completing ${years} year${years !== 1 ? 's' : ''} with us! Here's to many more successful years.\n\nBest regards,\n${user.name}`;

      await addDoc(collection(db, 'messages'), {
        title,
        content,
        recipient: [targetUser.id],
        senderId: user.id,
        senderName: user.name,
        timestamp: serverTimestamp(),
        type: 'wish',
      });

      toast.success(`Wish sent to ${targetUser.name}!`);
      setWishedUsers((prev) => new Set(prev).add(targetUser.id + type));
    } catch {
      toast.error('Failed to send wish.');
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const isUserAdminOrHR = user.role === 'Admin' || user.role === 'HR';
        const isUserSales = user.department && user.department.toLowerCase() === 'sales';

        const leadsPromise =
          isUserAdminOrHR || isUserSales
            ? getDocs(
                !isUserAdminOrHR && isUserSales
                  ? query(collection(db, 'leads'), where('assignedTo', '==', user.id))
                  : collection(db, 'leads')
              )
            : Promise.resolve(null);

        const [allUsers, settingsSnap, leadsSnap] = await Promise.all([
          fetchUsers(),
          getDoc(doc(db, 'settings', 'general')),
          leadsPromise,
        ]);

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentDay = today.getDate();

        const isUpcoming = (dateStr?: string) => {
          if (!dateStr) return null;
          const d = new Date(dateStr);
          const m = d.getMonth();
          const day = d.getDate();
          const occurrence = new Date(today.getFullYear(), m, day);
          if (occurrence < new Date(today.getFullYear(), currentMonth, currentDay)) {
            occurrence.setFullYear(today.getFullYear() + 1);
          }
          const diffDays = Math.ceil((occurrence.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const isToday = m === currentMonth && day === currentDay;
          if (isToday || (diffDays >= 0 && diffDays <= 3)) {
            return { isToday, dateStr: `${d.toLocaleString('default', { month: 'short' })} ${day}` };
          }
          return null;
        };

        const bdays: { user: User; dateStr: string; isToday: boolean }[] = [];
        const annivs: { user: User; years: number; dateStr: string; isToday: boolean }[] = [];

        allUsers.forEach((u) => {
          if (u.status !== 'Active') return;
          const bInfo = isUpcoming(u.dob);
          if (bInfo) bdays.push({ user: u, dateStr: bInfo.dateStr, isToday: bInfo.isToday });

          if (u.joiningDate) {
            const aInfo = isUpcoming(u.joiningDate);
            if (aInfo) {
              const joinYear = new Date(u.joiningDate).getFullYear();
              const years = Math.max(1, today.getFullYear() - joinYear);
              annivs.push({ user: u, years, dateStr: aInfo.dateStr, isToday: aInfo.isToday });
            }
          }
        });

        setBirthdays(bdays);
        setWorkAnniversaries(annivs);

        if (settingsSnap.exists() && settingsSnap.data().biometricSettings) {
          setBiometricSettings(settingsSnap.data().biometricSettings);
        }

        if (leadsSnap) {
          const leadsList: Lead[] = [];
          leadsSnap.docs.forEach((d) => {
            const data = d.data() as Lead;
            if (data.expiryDate) {
              const expDate = new Date(data.expiryDate);
              const diffTime = expDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays >= 0 && diffDays <= 2) leadsList.push({ id: d.id, ...data });
            }
          });
          setExpiringDomains(leadsList);
        }
      } catch (err) {
        console.error('Error fetching home overview:', err);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    const qMsg = query(collection(db, 'messages'), orderBy('timestamp', 'desc'), limit(10));
    return onSnapshot(qMsg, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((d) => {
        const m = { id: d.id, ...d.data() } as Message;
        if (m.recipient.includes('all') || m.recipient.includes(user.id) || (user.role && m.recipient.includes(user.role))) {
          msgs.push(m);
        }
      });
      setAnnouncements(msgs.slice(0, 3));
    });
  }, [user]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const history = await fetchAttendanceData({ userId: user.id });
      setAttendanceHistory(history);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const todayStr = getLocalDateString();
    const todayRecords = attendanceHistory.filter((r) => r.date === todayStr);
    const recordWithActive = todayRecords.find((r) => r.sessions?.some((s) => !s.checkOut));
    const bestRecord = recordWithActive || (todayRecords.length > 0 ? todayRecords[todayRecords.length - 1] : null);

    setTodayRecord(bestRecord || null);
    setActiveSession(bestRecord?.sessions?.find((s) => !s.checkOut) || null);
  }, [attendanceHistory]);

  const isBiometricMandatory = useMemo(() => {
    if (user?.biometricExempt) return false;
    return biometricSettings.enabled && biometricSettings.verificationMode !== 'location_only';
  }, [biometricSettings, user]);

  const biometricStatus = useMemo(() => {
    if (user?.biometricExempt) return 'exempted' as const;
    const devices = user?.biometricDevices || (user?.biometricDevice ? [user.biometricDevice] : []);
    if (devices.length === 0) return 'not_registered' as const;
    if (devices.some((d) => d.status === 'approved')) return 'approved' as const;
    if (devices.some((d) => d.status === 'pending_approval')) return 'pending_approval' as const;
    return 'not_registered' as const;
  }, [user]);

  const handleAction = async (type: 'checkin' | 'checkout') => {
    if (!user) return;
    setProcessingAction(type);
    try {
      const nowStr = new Date().toLocaleTimeString('en-GB');
      const todayStr = getLocalDateString();
      const isBioActive = biometricSettings.enabled && biometricSettings.verificationMode !== 'location_only';

      if (type === 'checkin') {
        const newSession: Session = {
          id: `s${Date.now()}`,
          checkIn: nowStr,
          checkOut: null,
          biometricVerified: isBioActive,
          deviceId: getLocalDeviceId() || '',
          isWFH: false,
        };

        if (todayRecord) {
          const updates: Partial<AttendanceRecord> = { sessions: [...(todayRecord.sessions || []), newSession] };
          await updateDoc(doc(db, 'attendance', todayRecord.id), updates);
          setTodayRecord({ ...todayRecord, ...updates });
          setActiveSession(newSession);
        } else {
          const newRecData = { userId: user.id, date: todayStr, sessions: [newSession], totalHours: 0, isWFH: false };
          const docRef = await addDoc(collection(db, 'attendance'), newRecData);
          setTodayRecord({ id: docRef.id, ...newRecData });
          setActiveSession(newSession);
        }
        toast.success('Checked in successfully!');
      } else {
        if (!todayRecord || !activeSession) return;
        const updatedSessions = (todayRecord.sessions || []).map((s) =>
          s.id === activeSession.id || !s.checkOut ? { ...s, checkOut: nowStr } : s
        );
        const finalHours = calculateTotalHours(todayRecord.date, updatedSessions);
        await updateDoc(doc(db, 'attendance', todayRecord.id), { sessions: updatedSessions, totalHours: finalHours });
        setTodayRecord({ ...todayRecord, sessions: updatedSessions, totalHours: finalHours });
        setActiveSession(null);
        toast.success('Checked out successfully!');
      }
      invalidateCache('attendance');
      await loadData();
    } catch {
      toast.error('Action failed.');
    } finally {
      setProcessingAction(null);
    }
  };

  const currentMonthHistory = useMemo(() => {
    const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    return attendanceHistory.filter((rec) => rec.date?.startsWith(currentMonthStr));
  }, [attendanceHistory]);

  const totalDaysWorked = currentMonthHistory.length;
  const monthlyTotalHours = currentMonthHistory.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
  const monthlyAvg = totalDaysWorked > 0 ? (monthlyTotalHours / totalDaysWorked).toFixed(1) : '0';

  let fullDaysCount = 0;
  let halfDaysCount = 0;
  currentMonthHistory.forEach((rec) => {
    const hours = rec.totalHours || 0;
    if (hours >= 7) fullDaysCount++;
    else if (hours >= 4) halfDaysCount++;
  });

  return {
    currentTime,
    activeSession,
    processingAction,
    announcements,
    birthdays,
    workAnniversaries,
    wishedUsers,
    expiringDomains,
    loading,
    monthlyAvg,
    fullDaysCount,
    halfDaysCount,
    isBiometricMandatory,
    biometricStatus,
    handleAction,
    handleSendWish,
    getLiveTodayHours: () => {
      const todayStr = getLocalDateString();
      const todayRecords = attendanceHistory.filter((r) => r.date === todayStr);
      return todayRecords.reduce((total, rec) => total + calculateTotalHours(rec.date, rec.sessions || []), 0);
    },
  };
};
