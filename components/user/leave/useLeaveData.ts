/**
 * File: components/user/leave/useLeaveData.ts
 * Purpose: Custom hook managing user leave requests, quota calculations, and Firestore CRUD operations.
 * Author: Hirush Global AMS
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../../firebase';
import { addDoc, serverTimestamp, collection, getDocs, doc, deleteDoc, updateDoc, query, where } from 'firebase/firestore';
import { LeaveRequest, LeaveType, LeaveStatus, AttendanceRecord, Holiday, User, Role, UserStatus } from '../../../types';
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
        const newLeaveDoc = await addDoc(collection(db, 'leaveRequests'), {
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

        // 1. Fetch registered Admin and HR users from Firestore (their actual account emails and user IDs)
        let recipientEmails: string[] = [];
        let adminAndHrUserIds: string[] = [];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        try {
          const adminAndHrQuery = query(
            collection(db, 'users'),
            where('role', 'in', [Role.ADMIN, Role.HR])
          );
          const snap = await getDocs(adminAndHrQuery);
          snap.forEach((d) => {
            const uData = d.data();
            if (uData.status !== UserStatus.INACTIVE) {
              if (uData.email && typeof uData.email === 'string' && emailRegex.test(uData.email.trim())) {
                recipientEmails.push(uData.email.trim().toLowerCase());
              }
              adminAndHrUserIds.push(d.id);
            }
          });
          // De-duplicate emails
          recipientEmails = Array.from(new Set(recipientEmails));
        } catch (fetchErr) {
          console.warn('Could not query Admin & HR users:', fetchErr);
        }

        // 2. Send in-app message to both Admin and HR users (triggers sound, toast, and unread badge for both)
        try {
          const durationText = duration === 'Half Day' ? `Half Day (${halfDayType})` : 'Full Day';
          const dateText = startDate === finalEndDate ? startDate : `${startDate} to ${finalEndDate}`;

          await addDoc(collection(db, 'messages'), {
            title: `New Leave Request: ${user.name} (${leaveType})`,
            content: `Employee ${user.name} (${user.employeeId || 'N/A'}) has applied for ${durationText} ${leaveType} leave.\n\nDates: ${dateText}\nReason: ${reason}`,
            recipient: adminAndHrUserIds.length > 0 ? adminAndHrUserIds : [Role.ADMIN, Role.HR],
            recipientType: 'individual',
            senderId: user.id,
            senderName: user.name,
            timestamp: serverTimestamp(),
            type: 'leave_request',
            leaveRequestId: newLeaveDoc.id,
            link: '/leave',
          });
        } catch (msgErr) {
          console.warn('Failed to send in-app message to Admin & HR:', msgErr);
        }

        // 3. Dispatch automated email notification directly to Admin and HR registered email inboxes
        if (recipientEmails.length > 0) {
          try {
            fetch('/api/send-leave-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                employeeName: user.name,
                employeeId: user.employeeId,
                employeeEmail: user.email,
                employeeDepartment: user.department,
                leaveType,
                duration,
                halfDayType: duration === 'Half Day' ? halfDayType : null,
                startDate,
                endDate: finalEndDate,
                reason,
                recipientEmails,
                portalUrl: typeof window !== 'undefined' ? window.location.origin : undefined,
              }),
            }).catch((err) => console.warn('Background leave email request failed:', err));
          } catch (emailErr) {
            console.warn('Failed to trigger leave email endpoint:', emailErr);
          }
        }
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
