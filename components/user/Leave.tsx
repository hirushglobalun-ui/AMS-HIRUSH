/**
 * @file Leave.tsx
 * @description React component for rendering Leave UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */


import React, { useState, useEffect, useCallback } from 'react';
import { LeaveRequest, LeaveType, LeaveStatus, AttendanceRecord, User, Holiday } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import { toast } from 'react-hot-toast';
import { db } from '../../firebase';
import { addDoc, serverTimestamp, collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { fetchLeaveRequests, invalidateCache, fetchAttendance } from '../../services/dataService';
import { Clock, CheckCircle, XCircle, Plus, FileText, Trash2, Pencil } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const getLocalDateString = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatApplyDate = (createdAt: any) => {
  if (!createdAt) return 'N/A';
  if (typeof createdAt.toDate === 'function') {
    const d = createdAt.toDate();
    return getLocalDateString(d);
  }
  if (createdAt.seconds) {
    const d = new Date(createdAt.seconds * 1000);
    return getLocalDateString(d);
  }
  try {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) {
      return getLocalDateString(d);
    }
  } catch (e) {}
  return 'N/A';
};

const getLeaveDays = (req: LeaveRequest) => {
  if (req.duration === 'Half Day') return 0.5;
  if (!req.startDate || !req.endDate) return 0;
  const start = new Date(req.startDate);
  const end = new Date(req.endDate);
  const diffTime = end.getTime() - start.getTime();
  if (diffTime < 0) return 0;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return isNaN(diffDays) ? 0 : diffDays;
};

const getActualLeaveDaysDeducted = (req: LeaveRequest, attendance: AttendanceRecord[], holidays: Holiday[] = []) => {
  if (!req.startDate || !req.endDate) return 0;
  if (req.duration === 'Half Day') {
    // A half day leave always deducts 0.5 days, unless it falls on a weekend/holiday
    const d = new Date(req.startDate);
    const isWeekend = d.getDay() === 0;
    const isHoliday = holidays.some(h => h.date === req.startDate);
    if (isWeekend || isHoliday) return 0;
    
    return 0.5;
  }
  
  const start = new Date(req.startDate);
  const end = new Date(req.endDate);
  let deductedDays = 0;
  
  const d = new Date(start);
  while (d <= end) {
    const dateStr = getLocalDateString(d);
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0;
    const isHoliday = holidays.some(h => h.date === dateStr);
    
    if (!isWeekend && !isHoliday) {
      const hasWorked = attendance.some(a => a.date === dateStr && a.totalHours > 0);
      if (!hasWorked) {
        deductedDays += 1;
      }
    }
    d.setDate(d.getDate() + 1);
  }
  
  return deductedDays;
};

const Leave: React.FC = () => {
  const { user } = useAuth();
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
        const holidaysSnapshot = await getDocs(collection(db, 'holidays'));
        const hData = holidaysSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Holiday));
        setHolidays(hData);
      } catch (error) {
        console.error("Error fetching holidays:", error);
      }
    };
    fetchHolidays();
  }, []);

  // Current month boundaries
  const now = new Date();
  const firstDayOfMonth = getLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1));
  const lastDayOfMonth = getLocalDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const today = getLocalDateString(now);

  const loadLeaveHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Use optimized fetch with user filter
      const history = await fetchLeaveRequests({ userId: user.id });
      const sorted = history.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      setLeaveHistory(sorted);

      // Fetch attendance history to verify actual worked days
      const attendance = await fetchAttendance({ userId: user.id });
      setAttendanceHistory(attendance);
    } catch (error) {
      console.error("Error fetching leave history:", error);
      toast.error("Could not fetch leave history.");
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadLeaveHistory();
  }, [loadLeaveHistory]);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const durationVal = formData.get('duration') as 'Full Day' | 'Half Day';
    const halfDayTypeVal = formData.get('halfDayType') as 'Morning' | 'Afternoon';
    const startDateVal = formData.get('startDate') as string;
    const endDateVal = durationVal === 'Half Day' ? startDateVal : (formData.get('endDate') as string);

    if (!user) return;

    setSubmitting(true);
    const requestedReq = { startDate: startDateVal, endDate: endDateVal, duration: durationVal } as LeaveRequest;
    const requestedDays = (formData.get('leaveType') === 'WFH' || formData.get('leaveType') === 'Unpaid') ? 0 : getLeaveDays(requestedReq);
    
    // Only check quota if we are not editing, or if we are editing, we subtract the old days
    let oldRequestedDays = 0;
    if (editingLeaveId) {
       const oldReq = leaveHistory.find(l => l.id === editingLeaveId);
       if (oldReq) {
          oldRequestedDays = (oldReq.leaveType === 'WFH' || oldReq.leaveType === 'Unpaid') ? 0 : getLeaveDays(oldReq);
       }
    }

    // Check monthly quota for the target month of the requested leave
    const targetMonthStr = startDateVal ? startDateVal.substring(0, 7) : getLocalDateString(new Date()).substring(0, 7);
    const targetMonthLeaves = leaveHistory.filter(l => l.startDate && typeof l.startDate === 'string' && l.startDate.startsWith(targetMonthStr));
    const targetMonthAttendance = attendanceHistory.filter(a => a.date && typeof a.date === 'string' && a.date.startsWith(targetMonthStr));

    const targetApprovedLeaves = targetMonthLeaves.filter(l => l.status === LeaveStatus.APPROVED && l.leaveType !== 'WFH' && l.leaveType !== 'Unpaid');
    const targetApprovedDays = targetApprovedLeaves.reduce((sum, l) => sum + getActualLeaveDaysDeducted(l, targetMonthAttendance, holidays), 0);

    const targetPendingLeaves = targetMonthLeaves.filter(l => l.status === LeaveStatus.PENDING && l.leaveType !== 'WFH' && l.leaveType !== 'Unpaid');
    const targetPendingDays = targetPendingLeaves.reduce((sum, l) => sum + getLeaveDays(l), 0);

    if (targetApprovedDays + targetPendingDays - oldRequestedDays + requestedDays > 2.5) {
      const remainingBalance = Math.max(0, 2.5 - targetApprovedDays - targetPendingDays + oldRequestedDays);
      toast.error(`Request exceeds monthly limit of 2.5 days for ${targetMonthStr}. (Balance: ${remainingBalance}d)`);
      setSubmitting(false);
      return;
    }

    const leaveData = {
      userId: user.id,
      leaveType: formData.get('leaveType') as LeaveType,
      startDate: startDateVal,
      endDate: endDateVal,
      reason: formData.get('reason') as string,
      status: LeaveStatus.PENDING,
      duration: durationVal,
      halfDayType: durationVal === 'Half Day' ? halfDayTypeVal : null,
    };

    try {
      if (editingLeaveId) {
        await updateDoc(doc(db, 'leaveRequests', editingLeaveId), {
          ...leaveData,
          updatedAt: serverTimestamp()
        });
        toast.success("Leave request updated successfully!");
      } else {
        await addDoc(collection(db, 'leaveRequests'), {
          ...leaveData,
          createdAt: serverTimestamp()
        });
        toast.success("Leave request submitted successfully!");
      }
      form.reset();
      setStartDate('');
      setEndDate('');
      setDuration('Full Day');
      setHalfDayType('Morning');
      setLeaveType(LeaveType.CASUAL);
      setReason('');
      setEditingLeaveId(null);
      // Invalidate cache and reload
      invalidateCache('leaveRequests');
      await loadLeaveHistory(); // Refresh the list
    } catch (error: any) {
      console.error("Error submitting leave request:", error);
      toast.error(error?.message || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate stats for current month only
  const stats = React.useMemo(() => {
    const now = new Date();
    const currentMonthStr = getLocalDateString(now).substring(0, 7); // YYYY-MM

    // Filter requests for current month only
    const monthLeaves = leaveHistory.filter(l => l.startDate && typeof l.startDate === 'string' && l.startDate.startsWith(currentMonthStr));
    const monthAttendance = attendanceHistory.filter(a => a.date && typeof a.date === 'string' && a.date.startsWith(currentMonthStr));

    const pending = monthLeaves.filter(l => l.status === LeaveStatus.PENDING).length;
    const approved = monthLeaves.filter(l => l.status === LeaveStatus.APPROVED).length;
    const rejected = monthLeaves.filter(l => l.status === LeaveStatus.REJECTED).length;

    const approvedLeaves = monthLeaves.filter(l => l.status === LeaveStatus.APPROVED && l.leaveType !== 'WFH' && l.leaveType !== 'Unpaid');
    const approvedDaysDeducted = approvedLeaves.reduce((sum, l) => sum + getActualLeaveDaysDeducted(l, monthAttendance, holidays), 0);

    // Calculate unexcused absent days to treat as Unpaid Leave (for current month only)
    let unappliedAbsentDays = 0;
    if (user?.joiningDate) {
      const joining = new Date(user.joiningDate);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const start = joining > startOfMonth ? joining : startOfMonth;
      const today = new Date();
      today.setHours(0,0,0,0);
      const end = new Date(today);
      end.setDate(end.getDate() - 1); // Yesterday

      if (start <= end) {
        const d = new Date(start);
        while (d <= end) {
          const dateStr = getLocalDateString(d);
          const dayOfWeek = d.getDay();
          const isWeekend = dayOfWeek === 0;
          const isHoliday = holidays.some(h => h.date === dateStr);

          if (!isWeekend && !isHoliday) {
            const hasWorked = monthAttendance.some(a => a.date === dateStr && a.totalHours > 0);
            const hasAppliedLeave = monthLeaves.some(l => 
              (l.status === LeaveStatus.APPROVED || l.status === LeaveStatus.PENDING) && 
              dateStr >= l.startDate && dateStr <= l.endDate
            );

            if (!hasWorked && !hasAppliedLeave) {
              unappliedAbsentDays++;
            }
          }
          d.setDate(d.getDate() + 1);
        }
      }
    }

    const approvedDays = approvedDaysDeducted;

    const approvedFullDays = approvedLeaves.filter(l => l.duration !== 'Half Day').reduce((sum, l) => sum + getActualLeaveDaysDeducted(l, monthAttendance, holidays), 0);
    const approvedHalfDays = approvedLeaves.filter(l => l.duration === 'Half Day' && getActualLeaveDaysDeducted(l, monthAttendance, holidays) > 0).length;

    const pendingLeaves = monthLeaves.filter(l => l.status === LeaveStatus.PENDING && l.leaveType !== 'WFH' && l.leaveType !== 'Unpaid');
    const pendingDays = pendingLeaves.reduce((sum, l) => sum + getLeaveDays(l), 0);

    return { pending, approved, rejected, approvedDays, approvedFullDays, approvedHalfDays, pendingDays, unappliedAbsentDays };
  }, [leaveHistory, attendanceHistory, user?.joiningDate, holidays]);

  const quotaStats = React.useMemo(() => {
    const totalQuota = 2.5;
    
    const approvedDays = stats.approvedDays;
    const pendingDays = stats.pendingDays;
    
    const monthlyBalance = Math.max(0, parseFloat((totalQuota - approvedDays).toFixed(1)));
    
    const usedPercentage = Math.min(100, Math.round((approvedDays / totalQuota) * 100));
    const pendingPercentage = Math.min(100 - usedPercentage, Math.round((pendingDays / totalQuota) * 100));
    const balancePercentage = Math.max(0, 100 - usedPercentage - pendingPercentage);
    
    return {
      totalQuota,
      monthlyBalance,
      usedPercentage,
      pendingPercentage,
      balancePercentage,
    };
  }, [stats]);

  const handleDeleteRequest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pending leave request?')) return;
    try {
      await deleteDoc(doc(db, 'leaveRequests', id));
      toast.success('Leave request deleted successfully.');
      invalidateCache('leaveRequests');
      loadLeaveHistory();
    } catch (error) {
      console.error('Error deleting leave request:', error);
      toast.error('Failed to delete leave request.');
    }
  };

  const handleEditRequest = (req: LeaveRequest) => {
    setEditingLeaveId(req.id);
    setLeaveType(req.leaveType);
    setDuration(req.duration || 'Full Day');
    setHalfDayType(req.halfDayType || 'Morning');
    setStartDate(req.startDate);
    setEndDate(req.endDate);
    setReason(req.reason);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingLeaveId(null);
    setLeaveType(LeaveType.CASUAL);
    setDuration('Full Day');
    setHalfDayType('Morning');
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Leave & Time Off</h1>
        <p className="text-slate-500">Apply for leave and track your request history</p>
      </div>

      {/* Leave Quota & Balance Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Progress Card */}
        <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between relative group">
          <div className="space-y-4 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Leave Quota Overview</span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-800 mt-0.5">Monthly Time-Off Allocation</h3>
              </div>
              <span className="text-xs bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full font-bold text-indigo-600 self-start sm:self-auto">
                Quota: {quotaStats.totalQuota} Days
              </span>
            </div>

            {/* Visual Gauge Progress Bar */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between text-sm font-bold text-slate-600">
                <span>Taken: {stats.approvedDays}d</span>
                {stats.pendingDays > 0 && <span className="text-amber-600">Pending: {stats.pendingDays}d</span>}
                <span className="text-emerald-600">Balance: {quotaStats.monthlyBalance}d</span>
              </div>
              
              <div className="h-3 w-full bg-slate-100 rounded-full p-0.5 overflow-hidden flex border border-slate-200/50">
                <div 
                  style={{ width: `${quotaStats.usedPercentage}%` }} 
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                  title={`Used: ${quotaStats.usedPercentage}%`}
                />
                <div 
                  style={{ width: `${quotaStats.pendingPercentage}%` }} 
                  className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                  title={`Pending: ${quotaStats.pendingPercentage}%`}
                />
                <div 
                  style={{ width: `${quotaStats.balancePercentage}%` }} 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                  title={`Balance: ${quotaStats.balancePercentage}%`}
                />
              </div>
              
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>0 Days</span>
                <span>Monthly Limit: {quotaStats.totalQuota} Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Counts Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Request Stats</span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">Total History</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4">
            <div className="text-center p-2 rounded-xl bg-yellow-50/50 border border-yellow-100/50">
              <span className="text-[9px] font-bold text-yellow-600 block uppercase">Pending</span>
              <span className="text-lg font-black text-yellow-700 block mt-1">{stats.pending}</span>
            </div>
            <div className="text-center p-2 rounded-xl bg-green-50/50 border border-green-100/50">
              <span className="text-[9px] font-bold text-green-600 block uppercase">Approved</span>
              <span className="text-lg font-black text-green-700 block mt-1">{stats.approved}</span>
            </div>
            <div className="text-center p-2 rounded-xl bg-red-50/50 border border-red-100/50">
              <span className="text-[9px] font-bold text-red-600 block uppercase">Rejected</span>
              <span className="text-lg font-black text-red-700 block mt-1">{stats.rejected}</span>
            </div>
          </div>
          
          <p className="text-[10px] text-slate-400 font-medium text-center mt-4">
            * 2 Full Days & 1 Half Day are credited monthly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Form */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                {editingLeaveId ? <Pencil size={20} /> : <Plus size={20} />}
              </div>
              <h2 className="text-lg font-bold text-slate-800">{editingLeaveId ? 'Edit Request' : 'New Request'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="leaveType" className="block text-sm font-semibold text-slate-700 mb-1.5">Leave Type</label>
                <select 
                  id="leaveType" 
                  name="leaveType" 
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                  required
                >
                  {Object.values(LeaveType).map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-semibold text-slate-700 mb-1.5">Duration</label>
                <select
                  id="duration"
                  name="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value as 'Full Day' | 'Half Day')}
                  className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  required
                >
                  <option value="Full Day">Full Day</option>
                  <option value="Half Day">Half Day</option>
                </select>
              </div>

              {duration === 'Half Day' && (
                <div>
                  <label htmlFor="halfDayType" className="block text-sm font-semibold text-slate-700 mb-1.5">Half Day Period</label>
                  <select
                    id="halfDayType"
                    name="halfDayType"
                    value={halfDayType}
                    onChange={(e) => setHalfDayType(e.target.value as 'Morning' | 'Afternoon')}
                    className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    required
                  >
                    <option value="Morning">First Half (Morning)</option>
                    <option value="Afternoon">Second Half (Afternoon)</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {duration === 'Half Day' ? 'Date' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    min={firstDayOfMonth}
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (duration === 'Half Day') {
                        setEndDate(e.target.value);
                      }
                    }}
                    className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
                {duration !== 'Half Day' && (
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-semibold text-slate-700 mb-1.5">End Date</label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      min={startDate || firstDayOfMonth}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      required
                    />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-semibold text-slate-700 mb-1.5">Reason</label>
                <textarea
                  id="reason"
                  name="reason"
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                  placeholder="Please describe why you need this leave..."
                  required
                ></textarea>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-70 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                  {submitting ? 'Submitting...' : (editingLeaveId ? 'Update Request' : 'Submit Request')}
                </button>
                {editingLeaveId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </Card>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2">
          <Card className="!p-0 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Request History</h2>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-white border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Applied On</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Timeline</th>
                    <th className="px-6 py-4 text-center">Duration</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={7} className="text-center p-8 text-slate-500">Loading history...</td></tr>
                  ) : leaveHistory.length > 0 ? (
                    leaveHistory.map(req => (
                      <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-500 font-medium">{formatApplyDate(req.createdAt)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-700">{req.leaveType}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col text-sm">
                            <span className="font-medium text-slate-800">{req.startDate}</span>
                            {req.duration !== 'Half Day' && req.startDate !== req.endDate && (
                              <span className="text-xs text-slate-400">to {req.endDate}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-semibold text-slate-700">
                            {getLeaveDays(req)} Day{getLeaveDays(req) !== 1 ? 's' : ''}
                          </span>
                          {req.duration === 'Half Day' && (
                            <span className="block text-[10px] text-slate-400">
                              ({req.halfDayType || 'Morning'})
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-600 max-w-[200px] truncate" title={req.reason}>{req.reason}</p>
                          {req.statusReason && (
                            <p className="text-[10px] text-indigo-600 mt-1 font-semibold bg-indigo-50/60 px-2 py-0.5 rounded border border-indigo-100/30 inline-block max-w-[200px] truncate" title={req.statusReason}>
                              Remarks: {req.statusReason}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${req.status === LeaveStatus.APPROVED ? 'bg-green-50 text-green-700 border-green-100' :
                            req.status === LeaveStatus.REJECTED ? 'bg-red-50 text-red-700 border-red-100' :
                              'bg-yellow-50 text-yellow-700 border-yellow-100'
                            }`}>
                            {req.status === LeaveStatus.APPROVED && <CheckCircle size={12} />}
                            {req.status === LeaveStatus.REJECTED && <XCircle size={12} />}
                            {req.status === LeaveStatus.PENDING && <Clock size={12} />}
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {req.status === LeaveStatus.PENDING && (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditRequest(req)}
                                className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors"
                                title="Edit Request"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteRequest(req.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                title="Delete Request"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center p-12">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <FileText size={48} className="mb-2 opacity-20" />
                          <p>No leave requests found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Leave;