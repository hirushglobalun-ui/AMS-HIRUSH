/**
 * File: components/user/leave/useLeaveData.ts
 * Purpose: Custom hook managing user leave requests, quota calculations, and Firestore CRUD operations.
 * Author: Hirush Global AMS
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../../firebase';
import { addDoc, serverTimestamp, collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { LeaveRequest, LeaveType, LeaveStatus, AttendanceRecord, Holiday, User } from '../../../types';
import { fetchLeaveRequests, invalidateCache, fetchAttendance } from '../../../services/dataService';
import { toast } from 'react-hot-toast';
import { getLocalDateString, getActualLeaveDaysDeducted, getLeaveDays } from './leaveUtils';

export const useLeaveData = (user: User | null) => {
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequest[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState<'Full Day' | 'Half Day'>('Full Day');
  const [halfDayType, setHalfDayType] = useState<'Morning' | 'Afternoon'>('Morning');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveType>(LeaveType.CASUAL);
  const [reason, setReason] = useState('');
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const snap = await getDocs(collection(db, 'holidays'));
        setHolidays(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Holiday)));
      } catch (error) {
        console.error('Error fetching holidays:', error);
      }
    };
    fetchHolidays();
  }, []);

  const loadLeaveHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const history = await fetchLeaveRequests({ userId: user.id });
      const sorted = history.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      setLeaveHistory(sorted);

      const attendance = await fetchAttendance({ userId: user.id });
      setAttendanceHistory(attendance);
    } catch (error) {
      console.error('Error fetching leave history:', error);
      toast.error('Could not fetch leave history.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadLeaveHistory();
  }, [loadLeaveHistory]);

  const firstDayOfMonth = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  }, []);

  const quotaStats = useMemo(() => {
    const totalQuota = 2.5;
    const currentMonthStr = new Date().toISOString().substring(0, 7);

    const monthLeaves = leaveHistory.filter(
      (l) => l.startDate && typeof l.startDate === 'string' && l.startDate.startsWith(currentMonthStr)
    );
    const monthAttendance = attendanceHistory.filter(
      (a) => a.date && typeof a.date === 'string' && a.date.startsWith(currentMonthStr)
    );

    const approvedLeaves = monthLeaves.filter(
      (l) => l.status === LeaveStatus.APPROVED && l.leaveType !== 'WFH' && l.leaveType !== 'Unpaid'
    );
    const approvedDays = approvedLeaves.reduce(
      (sum, l) => sum + getActualLeaveDaysDeducted(l, monthAttendance, holidays),
      0
    );

    const pendingLeaves = monthLeaves.filter(
      (l) => l.status === LeaveStatus.PENDING && l.leaveType !== 'WFH' && l.leaveType !== 'Unpaid'
    );
    const pendingDays = pendingLeaves.reduce((sum, l) => sum + getLeaveDays(l), 0);

    const monthlyBalance = Math.max(0, parseFloat((totalQuota - approvedDays).toFixed(1)));
    const usedPercentage = Math.min(100, Math.round((approvedDays / totalQuota) * 100));
    const pendingPercentage = Math.min(100 - usedPercentage, Math.round((pendingDays / totalQuota) * 100));
    const balancePercentage = Math.max(0, 100 - usedPercentage - pendingPercentage);

    return {
      totalQuota,
      approvedDays,
      pendingDays,
      monthlyBalance,
      usedPercentage,
      pendingPercentage,
      balancePercentage,
    };
  }, [leaveHistory, attendanceHistory, holidays]);

  const stats = useMemo(() => {
    return {
      pending: leaveHistory.filter((l) => l.status === LeaveStatus.PENDING).length,
      approved: leaveHistory.filter((l) => l.status === LeaveStatus.APPROVED).length,
      rejected: leaveHistory.filter((l) => l.status === LeaveStatus.REJECTED).length,
    };
  }, [leaveHistory]);

  const handleEditRequest = (req: LeaveRequest) => {
    setEditingLeaveId(req.id);
    setLeaveType(req.leaveType);
    setDuration(req.duration || 'Full Day');
    setHalfDayType(req.halfDayType || 'Morning');
    setStartDate(req.startDate);
    setEndDate(req.endDate);
    setReason(req.reason);
  };

  const cancelEdit = () => {
    setEditingLeaveId(null);
    setStartDate('');
    setEndDate('');
    setReason('');
    setDuration('Full Day');
    setLeaveType(LeaveType.CASUAL);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const finalEndDate = duration === 'Half Day' ? startDate : endDate;

      if (editingLeaveId) {
        const leaveRef = doc(db, 'leaveRequests', editingLeaveId);
        await updateDoc(leaveRef, {
          leaveType,
          duration,
          halfDayType: duration === 'Half Day' ? halfDayType : null,
          startDate,
          endDate: finalEndDate,
          reason,
          updatedAt: serverTimestamp(),
        });
        toast.success('Leave request updated successfully!');
      } else {
        await addDoc(collection(db, 'leaveRequests'), {
          userId: user.id,
          userName: user.name,
          leaveType,
          duration,
          halfDayType: duration === 'Half Day' ? halfDayType : null,
          startDate,
          endDate: finalEndDate,
          reason,
          status: LeaveStatus.PENDING,
          createdAt: serverTimestamp(),
        });
        toast.success('Leave request submitted successfully!');
      }

      invalidateCache('leaveRequests');
      cancelEdit();
      loadLeaveHistory();
    } catch {
      toast.error('Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this pending request?')) return;
    try {
      await deleteDoc(doc(db, 'leaveRequests', id));
      toast.success('Leave request deleted.');
      invalidateCache('leaveRequests');
      loadLeaveHistory();
    } catch {
      toast.error('Failed to delete leave request.');
    }
  };

  return {
    leaveHistory,
    loading,
    duration,
    setDuration,
    halfDayType,
    setHalfDayType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    leaveType,
    setLeaveType,
    reason,
    setReason,
    editingLeaveId,
    submitting,
    firstDayOfMonth,
    quotaStats,
    stats,
    handleEditRequest,
    cancelEdit,
    handleSubmit,
    handleDeleteRequest,
  };
};
