/**
 * File: components/user/Attendance.tsx
 * Purpose: Top-level User Attendance view containing CheckIn/Out, Quota tracking, and timeline.
 * Module: components/user
 * Author: Hirush Global AMS
 */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AttendanceRecord, Session, Holiday, LeaveRequest, LeaveStatus, LeaveType, BiometricSettings } from '../../types';
import { db } from '../../firebase';
import { doc, getDoc, getDocs, collection, query, orderBy } from 'firebase/firestore';
import { fetchAttendance as fetchAttendanceData, fetchLeaveRequests } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { getLocalDateString } from './attendance/utils';
import AttendanceCheckIn from './attendance/AttendanceCheckIn';
import LeaveQuotaTracker from './attendance/LeaveQuotaTracker';
import AttendanceTimeline from './attendance/AttendanceTimeline';
import AttendanceDetailModal from './attendance/AttendanceDetailModal';
import { useAttendanceStats } from './attendance/useAttendanceStats';
import { useAttendanceActions } from './attendance/useAttendanceActions';

const Attendance: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [biometricSettings, setBiometricSettings] = useState<BiometricSettings>({
    enabled: true,
    autoApproveFirstDevice: false,
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadAttendance = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const history = await fetchAttendanceData({ userId: user.id });
      setAttendanceHistory(history);

      const hSnap = await getDocs(query(collection(db, 'holidays'), orderBy('date', 'asc')));
      setHolidays(hSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Holiday)));

      const leaves = await fetchLeaveRequests({ userId: user.id });
      setLeaveRequests(leaves);

      const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
      if (settingsSnap.exists() && settingsSnap.data().biometricSettings) {
        setBiometricSettings(settingsSnap.data().biometricSettings);
      }
    } catch (err) {
      console.error('Error fetching attendance data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  useEffect(() => {
    const todayStr = getLocalDateString();
    const todayRecords = attendanceHistory.filter((rec) => rec.date === todayStr);
    const recordWithActive = todayRecords.find((rec) => rec.sessions.some((s) => !s.checkOut));
    const bestRecord = recordWithActive || (todayRecords.length > 0 ? todayRecords[todayRecords.length - 1] : null);

    setTodayRecord(bestRecord);
    setActiveSession(bestRecord?.sessions.find((s) => s.checkOut === null) || null);
  }, [attendanceHistory]);

  const {
    currentDate,
    handlePrevMonth,
    handleNextMonth,
    calendarData,
    stats,
    leaveQuotaStats,
  } = useAttendanceStats({
    user,
    attendanceHistory,
    leaveRequests,
    holidays,
  });

  const {
    processingAction,
    registeringBiometric,
    handleRegisterSlot,
    handleCheckIn,
    handleCheckOut,
  } = useAttendanceActions({
    user,
    updateUser,
    todayRecord,
    setTodayRecord,
    activeSession,
    biometricSettings,
    loadAttendance,
  });

  const isBiometricMandatory = useMemo(() => {
    if (user?.biometricExempt) return false;
    return biometricSettings.enabled && biometricSettings.verificationMode !== 'location_only';
  }, [biometricSettings.enabled, biometricSettings.verificationMode, user?.biometricExempt]);

  const biometricStatus = useMemo(() => {
    if (user?.biometricExempt) return 'exempted' as const;
    const devices = user?.biometricDevices || (user?.biometricDevice ? [user.biometricDevice] : []);
    if (devices.length === 0) return 'not_registered' as const;
    if (devices.some((d) => d.status === 'approved')) return 'approved' as const;
    if (devices.some((d) => d.status === 'pending_approval')) return 'pending_approval' as const;
    return 'not_registered' as const;
  }, [user?.biometricDevice, user?.biometricDevices, user?.biometricExempt]);

  const todayWFH = useMemo(() => {
    const todayStr = getLocalDateString();
    const todayReq = leaveRequests.find(
      (r) =>
        r.leaveType === LeaveType.WFH &&
        r.startDate &&
        r.endDate &&
        todayStr >= r.startDate &&
        todayStr <= r.endDate &&
        (r.status === LeaveStatus.APPROVED || r.status === LeaveStatus.PENDING)
    );
    if (!todayReq) return null;
    return {
      status: todayReq.status === LeaveStatus.APPROVED ? ('approved' as const) : ('pending' as const),
      request: todayReq,
    };
  }, [leaveRequests]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading attendance...</div>;
  }

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden sm:overflow-x-visible">
      <AttendanceCheckIn
        currentTime={currentTime}
        holidays={holidays}
        activeSession={activeSession}
        processingAction={processingAction}
        todayRecord={todayRecord}
        handleCheckIn={handleCheckIn}
        handleCheckOut={handleCheckOut}
        biometricStatus={biometricStatus}
        isBiometricMandatory={isBiometricMandatory}
        biometricDeviceName={user?.biometricDevice?.deviceName}
        biometricDevices={user?.biometricDevices || (user?.biometricDevice ? [user.biometricDevice] : [])}
        onRegisterSlot={handleRegisterSlot}
        registeringBiometric={registeringBiometric}
        wfhStatus={todayWFH?.status || (todayRecord?.isWFH ? todayRecord.wfhStatus || 'approved' : null)}
      />

      <LeaveQuotaTracker leaveQuotaStats={leaveQuotaStats} />

      <AttendanceTimeline
        stats={stats}
        currentDate={currentDate}
        handlePrevMonth={handlePrevMonth}
        handleNextMonth={handleNextMonth}
        holidays={holidays}
        calendarData={calendarData}
        attendanceHistory={attendanceHistory}
        user={user}
        setSelectedDay={setSelectedDay}
      />

      <AttendanceDetailModal selectedDay={selectedDay} onClose={() => setSelectedDay(null)} />
    </div>
  );
};

export default Attendance;