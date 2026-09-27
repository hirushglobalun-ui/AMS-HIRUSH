/**
 * File: components/shared/ManageAttendance/useManageAttendanceData.ts
 * Purpose: Custom hook managing data fetching, filtering, editing, and exports for ManageAttendance.
 * Author: Hirush Global AMS
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { db } from '../../../firebase';
import { doc, updateDoc, collection, getDocs, query, orderBy, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Role, User, AttendanceRecord, Holiday } from '../../../types';
import { toast } from 'react-hot-toast';
import { fetchUsers, fetchAttendance, invalidateCache, fetchLeaveRequests, getLocalDateString } from '../../../services/dataService';
import { exportToCSV } from '../../../services/exportService';
import { calculateTotalHours, formatHoursToHHMMSS } from './utils';

export const useManageAttendanceData = () => {
  const [filterDate, setFilterDate] = useState(getLocalDateString());
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [selectedDetailRecord, setSelectedDetailRecord] = useState<any>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [limitCount, setLimitCount] = useState(50);
  const [hasMore, setHasMore] = useState(true);

  const fetchUsersAndAttendance = useCallback(
    async (currentLimit = limitCount) => {
      setLoading(true);
      try {
        const holidaysQuery = query(collection(db, 'holidays'), orderBy('date', 'asc'));
        const [usersData, attendanceData, leavesData, holidaysSnapshot] = await Promise.all([
          fetchUsers(),
          fetchAttendance({ date: filterDate, limitCount: currentLimit }),
          fetchLeaveRequests(),
          getDocs(holidaysQuery),
        ]);

        setUsers(usersData);
        setAttendance(attendanceData);
        setHasMore(attendanceData.length === currentLimit);
        setLeaveRequests(leavesData);
        setHolidays(holidaysSnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Holiday)));
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        toast.error('Failed to load attendance data.');
      } finally {
        setLoading(false);
      }
    },
    [filterDate, limitCount]
  );

  useEffect(() => {
    fetchUsersAndAttendance();
  }, [fetchUsersAndAttendance]);

  const handleLoadMore = () => {
    const newLimit = limitCount + 50;
    setLimitCount(newLimit);
    fetchUsersAndAttendance(newLimit);
  };

  const filteredAttendance = useMemo(() => {
    const dateObj = new Date(filterDate + 'T00:00:00');
    const isSunday = dateObj.getDay() === 0;
    const holiday = holidays.find((h) => h.date === filterDate);

    return users
      .filter((user) => user.status === 'Active' && user.role !== Role.ADMIN && user.role !== Role.HR)
      .filter((user) => user.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map((user) => {
        const userRecords = attendance.filter((att) => att.userId === user.id && att.date === filterDate);
        let consolidatedRecord: AttendanceRecord | null = null;
        if (userRecords.length > 0) {
          const allSessions = userRecords.reduce((all, r) => [...all, ...(r.sessions || [])], [] as any[]);
          const seen = new Set<string>();
          const uniqueSessions = allSessions.filter((s) => {
            const key = `${s.checkIn || ''}_${s.checkOut || ''}`;
            if (!key || key === '_') return true;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

          consolidatedRecord = {
            ...userRecords[0],
            totalHours: calculateTotalHours(uniqueSessions, filterDate),
            sessions: uniqueSessions,
          };
        }

        const record = consolidatedRecord;
        const hasWFH = leaveRequests.find(
          (l) => l.userId === user.id && l.leaveType === 'WFH' && l.status === 'Approved' && filterDate >= l.startDate && filterDate <= l.endDate
        );
        const approvedLeave = leaveRequests.find(
          (l) => l.userId === user.id && l.leaveType !== 'WFH' && l.status === 'Approved' && filterDate >= l.startDate && filterDate <= l.endDate
        );

        return {
          id: record ? record.id : `absent-${user.id}-${filterDate}`,
          userId: user.id,
          userName: user.name,
          department: user.department || 'N/A',
          date: filterDate,
          joiningDate: user.joiningDate,
          sessions: record ? record.sessions : [],
          totalHours: record ? record.totalHours : 0,
          isPresent: !!record || !!hasWFH,
          isWFH: !!hasWFH || (record?.isWFH || false),
          isSunday,
          holiday,
          approvedLeave,
          record,
        };
      })
      .sort((a, b) => {
        if (a.isPresent && !b.isPresent) return -1;
        if (!a.isPresent && b.isPresent) return 1;
        return a.userName.localeCompare(b.userName);
      });
  }, [users, attendance, filterDate, searchTerm, leaveRequests, holidays]);

  const stats = useMemo(() => {
    const activeUsersOnDate = users.filter((u) => {
      const isActive = u.status === 'Active' && u.role !== Role.ADMIN && u.role !== Role.HR;
      if (!isActive) return false;
      if (u.joiningDate && u.joiningDate > filterDate) return false;
      return true;
    });

    const totalEmployees = activeUsersOnDate.length;
    const dailyRecordsRaw = attendance.filter((a) => a.date === filterDate);
    const userMap = new Map<string, AttendanceRecord>();

    dailyRecordsRaw.forEach((rec) => {
      if (userMap.has(rec.userId)) {
        const existing = userMap.get(rec.userId)!;
        userMap.set(rec.userId, { ...existing, totalHours: (existing.totalHours || 0) + (rec.totalHours || 0) });
      } else {
        userMap.set(rec.userId, rec);
      }
    });

    const dailyRecords = Array.from(userMap.values());
    let fullDayCount = 0;
    let halfDayCount = 0;
    let wfhCount = 0;

    dailyRecords.forEach((rec) => {
      if (rec.isWFH) wfhCount++;
      if (rec.totalHours >= 7) fullDayCount++;
      else if (rec.totalHours >= 4) halfDayCount++;
    });

    leaveRequests.forEach((l) => {
      if (l.leaveType === 'WFH' && l.status === 'Approved' && filterDate >= l.startDate && filterDate <= l.endDate) {
        if (!dailyRecords.some((r) => r.userId === l.userId)) wfhCount++;
      }
    });

    const presentCount = dailyRecords.length + wfhCount;
    let leaveCount = 0;
    let leaveFullDayCount = 0;
    let leaveHalfDayCount = 0;

    activeUsersOnDate.forEach((u) => {
      const hasRecord = dailyRecords.some((r) => r.userId === u.id);
      const hasWFH = leaveRequests.some((l) => l.userId === u.id && l.leaveType === 'WFH' && l.status === 'Approved' && filterDate >= l.startDate && filterDate <= l.endDate);
      if (!hasRecord && !hasWFH) {
        const leave = leaveRequests.find((l) => l.userId === u.id && l.leaveType !== 'WFH' && l.status === 'Approved' && filterDate >= l.startDate && filterDate <= l.endDate);
        if (leave) {
          leaveCount++;
          if (leave.duration === 'Half Day') leaveHalfDayCount++;
          else leaveFullDayCount++;
        }
      }
    });

    const absentCount = Math.max(0, totalEmployees - presentCount - leaveCount);
    return {
      total: totalEmployees,
      present: presentCount,
      absent: absentCount,
      fullDay: fullDayCount + wfhCount,
      halfDay: halfDayCount,
      leave: leaveCount,
      leaveFull: leaveFullDayCount,
      leaveHalf: leaveHalfDayCount,
    };
  }, [users, attendance, filterDate, leaveRequests]);

  const handleEditClick = (record: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (record.record) {
      setEditingRecord(JSON.parse(JSON.stringify(record.record)));
    } else {
      setEditingRecord({
        id: `new-${record.userId}-${record.date}`,
        userId: record.userId,
        date: record.date,
        sessions: [],
        totalHours: 0,
        isWFH: false,
      } as AttendanceRecord);
    }
    setIsEditModalOpen(true);
  };

  const handleSaveAttendance = async () => {
    if (!editingRecord) return;
    setIsSaving(true);
    try {
      const cleanedSessions = editingRecord.sessions.map((s) => {
        const isAuto = !s.isManuallyEdited && s.autoCheckedOut === true && (s.checkOut === '23:50:00' || s.checkOut === '22:20:00');
        return { ...s, autoCheckedOut: isAuto, isManuallyEdited: !isAuto ? true : !!s.isManuallyEdited };
      });

      const totalHours = calculateTotalHours(cleanedSessions, editingRecord.date);
      const otherDuplicates = attendance.filter(
        (att) => att.userId === editingRecord.userId && att.date === editingRecord.date && att.id !== editingRecord.id && !att.id.startsWith('new-')
      );

      for (const dup of otherDuplicates) {
        try {
          await deleteDoc(doc(db, 'attendance', dup.id));
        } catch (err) {
          console.error('Error cleaning up duplicate attendance document:', err);
        }
      }

      if (editingRecord.id.startsWith('new-')) {
        await addDoc(collection(db, 'attendance'), {
          userId: editingRecord.userId,
          date: editingRecord.date,
          sessions: cleanedSessions,
          totalHours,
          isWFH: !!editingRecord.isWFH,
          isManuallyEdited: true,
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, 'attendance', editingRecord.id), {
          sessions: cleanedSessions,
          totalHours,
          isWFH: !!editingRecord.isWFH,
          isManuallyEdited: true,
          updatedAt: serverTimestamp(),
        });
      }

      toast.success('Attendance updated successfully!');
      invalidateCache('attendance');
      await fetchUsersAndAttendance();
      setIsEditModalOpen(false);
      setEditingRecord(null);
    } catch {
      toast.error('Failed to update attendance.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportDaily = () => {
    if (filteredAttendance.length === 0) {
      toast.error('No data to export for this date.');
      return;
    }
    const isSunday = new Date(filterDate + 'T00:00:00').getDay() === 0;
    const exportData = filteredAttendance.map((record) => ({
      Date: record.date,
      'Employee ID': users.find((u) => u.id === record.userId)?.employeeId || 'N/A',
      Name: record.userName,
      Department: record.department,
      Status: record.isPresent
        ? record.sessions.some((s) => !s.checkOut)
          ? 'Active'
          : 'Completed'
        : record.joiningDate && record.joiningDate > filterDate
        ? 'Not Joined'
        : isSunday
        ? 'Holiday'
        : 'Absent',
      Sessions: record.sessions.length > 0 ? record.sessions.map((s) => `${s.checkIn} - ${s.checkOut || 'Active'}`).join(' | ') : 'N/A',
      'Total Hours': formatHoursToHHMMSS(record.totalHours),
    }));
    exportToCSV(exportData, `Attendance_Daily_${filterDate}`);
    toast.success('Daily report exported!');
  };

  const handleExportMonthly = async () => {
    setLoading(true);
    try {
      const currentMonth = filterDate.substring(0, 7);
      const allAttendance = await fetchAttendance();
      const monthlyAttendance = allAttendance.filter((a) => a.date.startsWith(currentMonth));
      if (monthlyAttendance.length === 0) {
        toast.error('No data found for the selected month.');
        return;
      }
      const exportData = monthlyAttendance
        .map((record) => {
          const user = users.find((u) => u.id === record.userId);
          const firstCheckIn = record.sessions[0]?.checkIn || 'N/A';
          const lastCheckOut = [...record.sessions].reverse().find((s) => s.checkOut)?.checkOut || 'Active';
          return {
            Date: record.date,
            'Employee ID': user?.employeeId || 'N/A',
            Name: user?.name || 'Unknown',
            Department: user?.department || 'N/A',
            'First Check In': firstCheckIn,
            'Last Check Out': lastCheckOut,
            'Total Hours': formatHoursToHHMMSS(record.totalHours),
            'Sessions Count': record.sessions.length,
          };
        })
        .sort((a, b) => a.Date.localeCompare(b.Date));

      exportToCSV(exportData, `Monthly_Attendance_Report_${currentMonth}`);
      toast.success(`Report for ${currentMonth} exported!`);
    } catch {
      toast.error('Failed to export monthly report.');
    } finally {
      setLoading(false);
    }
  };

  return {
    filterDate,
    setFilterDate,
    searchTerm,
    setSearchTerm,
    expandedRecordId,
    setExpandedRecordId,
    filteredAttendance,
    loading,
    holidays,
    selectedDetailRecord,
    setSelectedDetailRecord,
    hasMore,
    handleLoadMore,
    stats,
    isEditModalOpen,
    setIsEditModalOpen,
    editingRecord,
    setEditingRecord,
    isSaving,
    handleEditClick,
    handleSaveAttendance,
    handleExportDaily,
    handleExportMonthly,
  };
};
