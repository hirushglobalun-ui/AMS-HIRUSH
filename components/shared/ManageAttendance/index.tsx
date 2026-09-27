/**
 * @file index.tsx
 * @description React component for rendering index UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React, { useState, useMemo, Fragment, useEffect, useCallback } from 'react';
import Card from '../../common/Card';
import Modal from '../../common/Modal';
import { Role, User, AttendanceRecord, Holiday } from '../../../types';

import { ChevronDown, ChevronUp, Edit, Plus, Trash2, X, Save, Briefcase } from 'lucide-react';
import { db } from '../../../firebase';
import { toast } from 'react-hot-toast';
import { fetchUsers, fetchAttendance, invalidateCache, fetchLeaveRequests, getLocalDateString } from '../../../services/dataService';
import { doc, updateDoc, collection, getDocs, query, orderBy, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

import { Download, FileText, Users, Calendar, CalendarCheck, CheckCircle, Clock } from 'lucide-react';
import { exportToCSV } from '../../../services/exportService';
import AttendanceTable from './AttendanceTable';
import EditAttendanceModal from './EditAttendanceModal';
import AttendanceDetailModal from './AttendanceDetailModal';

/**
 * Helper function to format decimal hours into standard HH:MM:SS format
 * @param decimalHours - The total hours in decimal format (e.g., 1.5)
 * @returns Formatted time string (e.g., "01:30:00")
 */
const formatHoursToHHMMSS = (decimalHours: number): string => {
    if (!decimalHours || decimalHours <= 0) return '00:00:00';

    const hours = Math.floor(decimalHours);
    const remainingMinutes = (decimalHours - hours) * 60;
    const minutes = Math.floor(remainingMinutes);
    const seconds = Math.round((remainingMinutes - minutes) * 60);

    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');

    return `${hh}:${mm}:${ss}`;
};

const calculateTotalHours = (sessions: any[], dateStr?: string) => {
    let total = 0;
    if (sessions && Array.isArray(sessions)) {
        const todayStr = getLocalDateString();
        sessions.forEach(session => {
            if (session.checkIn && session.checkOut) {
                const datePrefix = dateStr || '1970-01-01';
                const start = new Date(`${datePrefix}T${session.checkIn}`);
                let end = new Date(`${datePrefix}T${session.checkOut}`);
                let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                if (diff < 0) diff += 24; // Handle cross-midnight / cross-day timestamp ordering
                if (diff > 0) {
                    const isAuto = !session.isManuallyEdited && (session.autoCheckedOut === true || (session.autoCheckedOut !== false && (session.checkOut === '23:50:00' || session.checkOut === '22:20:00'))) && (session.checkOut === '23:50:00' || session.checkOut === '22:20:00');
                    if (isAuto) {
                        diff = Math.min(diff, 4.0);
                    }
                    total += diff;
                }
            } else if (session.checkIn && !session.checkOut && dateStr) {
                if (dateStr === todayStr) {
                    const start = new Date(`${dateStr}T${session.checkIn}`);
                    const now = new Date();
                    const diff = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
                    if (diff > 0) total += diff;
                } else {
                    const start = new Date(`${dateStr}T${session.checkIn}`);
                    const autoCheckOutDate = new Date(`${dateStr}T23:50:00`);
                    let diff = (autoCheckOutDate.getTime() - start.getTime()) / (1000 * 60 * 60);
                    if (diff < 0) diff = 0;
                    total += Math.min(diff, 4.0);
                }
            }
        });
    }
    return parseFloat(total.toFixed(2));
};

const ManageAttendance: React.FC = () => {
    const [filterDate, setFilterDate] = useState(getLocalDateString());
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
    const [selectedDetailRecord, setSelectedDetailRecord] = useState<any>(null);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const formInputClasses = "mt-1 block w-full border-slate-200 dark:border-slate-700 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-slate-50";

    const [limitCount, setLimitCount] = useState(50);
    const [hasMore, setHasMore] = useState(true);

    /**
     * Fetches all active users and their attendance records for the selected date.
     * Incorporates pagination limits to ensure performance scalability.
     * @param currentLimit - The maximum number of attendance records to fetch
     */
    const fetchUsersAndAttendance = useCallback(async (currentLimit = limitCount) => {
        setLoading(true);
        try {
            // Fetch users, attendance, leaves, and holidays in parallel for maximum speed
            const holidaysQuery = query(collection(db, 'holidays'), orderBy('date', 'asc'));
            const [usersData, attendanceData, leavesData, holidaysSnapshot] = await Promise.all([
                fetchUsers(),
                fetchAttendance({ date: filterDate, limitCount: currentLimit }),
                fetchLeaveRequests(),
                getDocs(holidaysQuery)
            ]);

            setUsers(usersData);
            setAttendance(attendanceData);
            setHasMore(attendanceData.length === currentLimit);
            setLeaveRequests(leavesData);

            const holidaysData = holidaysSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Holiday));
            setHolidays(holidaysData);

        } catch (error) {

            console.error("Error fetching data:", error);
            toast.error("Failed to load attendance data.");
        }
        setLoading(false);
    }, [filterDate]);

    const handleLoadMore = () => {
        const newLimit = limitCount + 50;
        setLimitCount(newLimit);
        fetchUsersAndAttendance(newLimit);
    };

    useEffect(() => {
        fetchUsersAndAttendance();
    }, [fetchUsersAndAttendance]);


    /**
     * Consolidates and computes the final attendance representation for the UI table.
     * Merges user data with attendance records, checks for WFH constraints, and
     * integrates approved leave records for precise tracking.
     */
    const filteredAttendance = useMemo(() => {
        const dateObj = new Date(filterDate + 'T00:00:00');
        const isSunday = dateObj.getDay() === 0;
        const holiday = holidays.find(h => h.date === filterDate);

        return users
            .filter(user => user.status === 'Active' && user.role !== Role.ADMIN && user.role !== Role.HR) // Show active non-admin/non-hr users
            .filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(user => {
                // Find all records for this user on this specific date
                const userRecords = attendance.filter(att => att.userId === user.id && att.date === filterDate);
                
                let consolidatedRecord: AttendanceRecord | null = null;
                if (userRecords.length > 0) {
                    const allSessions = userRecords.reduce((all, r) => [...all, ...(r.sessions || [])], [] as any[]);
                    // Deduplicate identical sessions by checkIn and checkOut
                    const seen = new Set<string>();
                    const uniqueSessions = allSessions.filter(s => {
                        const key = `${s.checkIn || ''}_${s.checkOut || ''}`;
                        if (!key || key === '_') return true;
                        if (seen.has(key)) return false;
                        seen.add(key);
                        return true;
                    });

                    consolidatedRecord = {
                        ...userRecords[0],
                        totalHours: calculateTotalHours(uniqueSessions, filterDate),
                        sessions: uniqueSessions
                    };
                }
                
                const record = consolidatedRecord;
                
                // Check if user has an approved WFH leave for this date
                const hasWFH = leaveRequests.find(l => 
                    l.userId === user.id && 
                    l.leaveType === 'WFH' && 
                    l.status === 'Approved' &&
                    filterDate >= l.startDate && 
                    filterDate <= l.endDate
                );

                // Check if user has an approved non-WFH leave for this date
                const approvedLeave = leaveRequests.find(l => 
                    l.userId === user.id && 
                    l.leaveType !== 'WFH' && 
                    l.status === 'Approved' &&
                    filterDate >= l.startDate && 
                    filterDate <= l.endDate
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
                    record: record // reference for editing
                };

            })
            .sort((a, b) => {
                // Sort present people first
                if (a.isPresent && !b.isPresent) return -1;
                if (!a.isPresent && b.isPresent) return 1;
                return a.userName.localeCompare(b.userName);
            });
    }, [users, attendance, filterDate, searchTerm, leaveRequests, holidays]);

    const handleToggleDetails = (recordId: string) => {
        setExpandedRecordId(currentId => currentId === recordId ? null : recordId);
    };

    // Edit Functions
    const handleEditClick = (record: any, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row expansion
        if (record.record) {
            setEditingRecord(JSON.parse(JSON.stringify(record.record)));
        } else {
            // Create a virtual record for absent users
            setEditingRecord({
                id: `new-${record.userId}-${record.date}`,
                userId: record.userId,
                date: record.date,
                sessions: [],
                totalHours: 0,
                isWFH: false
            } as AttendanceRecord);
        }
        setIsEditModalOpen(true);
    };

    const handleSessionChange = (index: number, field: 'checkIn' | 'checkOut', value: string) => {
        if (!editingRecord) return;

        const updatedSessions = [...editingRecord.sessions];
        updatedSessions[index] = { 
            ...updatedSessions[index], 
            [field]: value,
            autoCheckedOut: false,
            isManuallyEdited: true
        };

        setEditingRecord({
            ...editingRecord,
            sessions: updatedSessions
        });
    };

    const handleAddSession = () => {
        if (!editingRecord) return;
        setEditingRecord({
            ...editingRecord,
            sessions: [
                ...editingRecord.sessions,
                { id: Date.now().toString(), checkIn: '', checkOut: '', isManuallyEdited: true, autoCheckedOut: false }
            ]
        });
    };

    const handleRemoveSession = (index: number) => {
        if (!editingRecord) return;
        const updatedSessions = editingRecord.sessions.filter((_, i) => i !== index);
        setEditingRecord({
            ...editingRecord,
            sessions: updatedSessions
        });
    };

    const handleSaveAttendance = async () => {
        if (!editingRecord) return;

        setIsSaving(true);
        try {
            // Clean up sessions: if any session checkout was modified away from auto-checkout times, ensure autoCheckedOut is cleared
            const cleanedSessions = editingRecord.sessions.map(s => {
                const isAuto = !s.isManuallyEdited && (s.autoCheckedOut === true && (s.checkOut === '23:50:00' || s.checkOut === '22:20:00'));
                return {
                    ...s,
                    autoCheckedOut: isAuto,
                    isManuallyEdited: !isAuto ? true : !!s.isManuallyEdited
                };
            });

            const totalHours = calculateTotalHours(cleanedSessions, editingRecord.date);
            
            // Delete any other duplicate documents in Firestore for this user on this date
            const otherDuplicates = attendance.filter(
                att => att.userId === editingRecord.userId && 
                       att.date === editingRecord.date && 
                       att.id !== editingRecord.id &&
                       !att.id.startsWith('new-')
            );

            for (const dup of otherDuplicates) {
                try {
                    await deleteDoc(doc(db, 'attendance', dup.id));
                } catch (err) {
                    console.error("Error cleaning up duplicate attendance document:", err);
                }
            }

            if (editingRecord.id.startsWith('new-')) {
                // Create new record
                await addDoc(collection(db, 'attendance'), {
                    userId: editingRecord.userId,
                    date: editingRecord.date,
                    sessions: cleanedSessions,
                    totalHours: totalHours,
                    isWFH: !!editingRecord.isWFH,
                    isManuallyEdited: true,
                    updatedAt: serverTimestamp()
                });
            } else {
                // Update existing record
                const recordRef = doc(db, 'attendance', editingRecord.id);
                await updateDoc(recordRef, {
                    sessions: cleanedSessions,
                    totalHours: totalHours,
                    isWFH: !!editingRecord.isWFH,
                    isManuallyEdited: true,
                    updatedAt: serverTimestamp()
                });
            }

            toast.success("Attendance updated successfully!");
            invalidateCache('attendance');
            await fetchUsersAndAttendance(); // Refresh data
            setIsEditModalOpen(false);
            setEditingRecord(null);
        } catch (error) {
            console.error("Error updating attendance:", error);
            toast.error("Failed to update attendance.");
        } finally {
            setIsSaving(false);
        }
    };

    // Export Functions
    const handleExportDaily = () => {
        if (filteredAttendance.length === 0) {
            toast.error("No data to export for this date.");
            return;
        }

        const isSunday = new Date(filterDate + 'T00:00:00').getDay() === 0;
        const exportData = filteredAttendance.map(record => ({
            'Date': record.date,
            'Employee ID': users.find(u => u.id === record.userId)?.employeeId || 'N/A',
            'Name': record.userName,
            'Department': record.department,
            'Status': record.isPresent
                ? (record.sessions.some(s => !s.checkOut) ? 'Active' : 'Completed')
                : (record.joiningDate && record.joiningDate > filterDate
                    ? 'Not Joined'
                    : (isSunday ? 'Holiday' : 'Absent')),
            'Sessions': record.sessions.length > 0 ? record.sessions.map(s => `${s.checkIn} - ${s.checkOut || 'Active'}`).join(' | ') : 'N/A',
            'Total Hours': formatHoursToHHMMSS(record.totalHours)
        }));

        exportToCSV(exportData, `Attendance_Daily_${filterDate}`);
        toast.success("Daily report exported!");
    };

    const handleExportFullDetailed = async () => {
        setLoading(true);
        try {
            const allAttendance = await fetchAttendance();
            const exportData = allAttendance.map(record => {
                const user = users.find(u => u.id === record.userId);
                return {
                    'Date': record.date,
                    'Employee ID': user?.employeeId || 'N/A',
                    'Name': user?.name || 'Unknown',
                    'Department': user?.department || 'N/A',
                    'Sessions': record.sessions.map(s => `${s.checkIn} - ${s.checkOut || 'Active'}`).join(' | '),
                    'Total Hours': formatHoursToHHMMSS(record.totalHours)
                };
            }).sort((a, b) => b.Date.localeCompare(a.Date));

            exportToCSV(exportData, `Attendance_Full_Detailed_${new Date().toISOString().split('T')[0]}`);
            toast.success("Full detailed report exported!");
        } catch (error) {
            toast.error("Failed to export full report.");
        }
        setLoading(false);
    };

    const handleExportStaffWise = async () => {
        setLoading(true);
        try {
            const allAttendance = await fetchAttendance();

            const staffSummary = users.map(user => {
                const userAttendance = allAttendance.filter(a => a.userId === user.id);
                const totalHours = userAttendance.reduce((sum, current) => sum + (current.totalHours || 0), 0);
                const daysPresent = userAttendance.length;

                return {
                    'Employee ID': user.employeeId,
                    'Name': user.name,
                    'Email': user.email,
                    'Department': user.department || 'N/A',
                    'Position': user.position || 'N/A',
                    'Total Days Present': daysPresent,
                    'Total Hours Worked': formatHoursToHHMMSS(totalHours)
                };
            }).filter(s => s['Total Days Present'] > 0);

            exportToCSV(staffSummary, `Staff_Wise_Attendance_Summary_${new Date().toISOString().split('T')[0]}`);
            toast.success("Staff-wise summmary exported!");
        } catch (error) {
            toast.error("Failed to export staff summary.");
        }
        setLoading(false);
    };

    const handleExportMonthly = async () => {
        setLoading(true);
        try {
            const currentMonth = filterDate.substring(0, 7); // "YYYY-MM"
            const allAttendance = await fetchAttendance();
            const monthlyAttendance = allAttendance.filter(a => a.date.startsWith(currentMonth));

            if (monthlyAttendance.length === 0) {
                toast.error("No data found for the selected month.");
                setLoading(false);
                return;
            }

            const exportData = monthlyAttendance.map(record => {
                const user = users.find(u => u.id === record.userId);
                const firstCheckIn = record.sessions[0]?.checkIn || 'N/A';
                const lastCheckOut = [...record.sessions].reverse().find(s => s.checkOut)?.checkOut || 'Active';

                return {
                    'Date': record.date,
                    'Employee ID': user?.employeeId || 'N/A',
                    'Name': user?.name || 'Unknown',
                    'Department': user?.department || 'N/A',
                    'First Check In': firstCheckIn,
                    'Last Check Out': lastCheckOut,
                    'Total Hours': formatHoursToHHMMSS(record.totalHours),
                    'Sessions Count': record.sessions.length
                };
            }).sort((a, b) => a.Date.localeCompare(b.Date));

            exportToCSV(exportData, `Monthly_Attendance_Report_${currentMonth}`);
            toast.success(`Report for ${currentMonth} exported!`);
        } catch (error) {
            toast.error("Failed to export monthly report.");
        }
        setLoading(false);
    };

    /**
     * Computes the top-level attendance statistics for the dashboard cards.
     * Differentiates between Full Days, Half Days, Leaves, WFH, and Absences.
     */
    const stats = useMemo(() => {
        const activeUsersOnDate = users.filter(u => {
            const isActive = u.status === 'Active' && u.role !== Role.ADMIN && u.role !== Role.HR;
            if (!isActive) return false;
            if (u.joiningDate && u.joiningDate > filterDate) return false;
            return true;
        });

        const totalEmployees = activeUsersOnDate.length;
        const dailyRecordsRaw = attendance.filter(a => a.date === filterDate);
        
        // Consolidate multiple records for same user
        const userMap = new Map<string, AttendanceRecord>();
        dailyRecordsRaw.forEach(rec => {
            if (userMap.has(rec.userId)) {
                const existing = userMap.get(rec.userId)!;
                userMap.set(rec.userId, {
                    ...existing,
                    totalHours: (existing.totalHours || 0) + (rec.totalHours || 0)
                });
            } else {
                userMap.set(rec.userId, rec);
            }
        });
        
        const dailyRecords = Array.from(userMap.values());
        
        let fullDayCount = 0;
        let halfDayCount = 0;
        let wfhCount = 0;

        dailyRecords.forEach(rec => {
            if (rec.isWFH) wfhCount++;
            if (rec.totalHours >= 7) fullDayCount++;
            else if (rec.totalHours >= 4) halfDayCount++;
        });

        // Add WFH from leave requests
        leaveRequests.forEach(l => {
            if (l.leaveType === 'WFH' && l.status === 'Approved' && filterDate >= l.startDate && filterDate <= l.endDate) {
                // Only count as WFH if they didn't already have an attendance record (to avoid double counting)
                const hasRecord = dailyRecords.some(r => r.userId === l.userId);
                if (!hasRecord) wfhCount++;
            }
        });

        const presentCount = dailyRecords.length + wfhCount;
        
        // Count approved non-WFH leaves for active employees who are not present
        let leaveCount = 0;
        let leaveFullDayCount = 0;
        let leaveHalfDayCount = 0;

        activeUsersOnDate.forEach(u => {
            const hasRecord = dailyRecords.some(r => r.userId === u.id);
            const hasWFH = leaveRequests.some(l => 
                l.userId === u.id && 
                l.leaveType === 'WFH' && 
                l.status === 'Approved' &&
                filterDate >= l.startDate && 
                filterDate <= l.endDate
            );

            // If user has no record and no WFH, but has an approved non-WFH leave
            if (!hasRecord && !hasWFH) {
                const leave = leaveRequests.find(l => 
                    l.userId === u.id && 
                    l.leaveType !== 'WFH' &&
                    l.status === 'Approved' &&
                    filterDate >= l.startDate && 
                    filterDate <= l.endDate
                );
                if (leave) {
                    leaveCount++;
                    if (leave.duration === 'Half Day') {
                        leaveHalfDayCount++;
                    } else {
                        leaveFullDayCount++;
                    }
                }
            }
        });

        const absentCount = Math.max(0, totalEmployees - presentCount - leaveCount);

        return { 
            total: totalEmployees, 
            present: presentCount, 
            absent: absentCount,
            fullDay: fullDayCount + wfhCount, // WFH counts as Full Day
            halfDay: halfDayCount,
            leave: leaveCount,
            leaveFull: leaveFullDayCount,
            leaveHalf: leaveHalfDayCount
        };
    }, [users, attendance, filterDate, leaveRequests]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Attendance Overview</h1>
                    <p className="text-slate-500">Monitor employee check-ins and working hours</p>
                </div>
                <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleExportDaily}
                        className="flex-1 sm:flex-initial justify-center px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2 text-sm"
                    >
                        <Download size={18} /> Daily Export
                    </button>
                    <button
                        onClick={handleExportMonthly}
                        className="flex-1 sm:flex-initial justify-center px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 text-sm"
                    >
                        <FileText size={18} /> Monthly Report
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 sm:gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Employees</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stats.total}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                        <CalendarCheck size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Present Today</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stats.present}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Full Days</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stats.fullDay}</h3>
                        {stats.leaveFull > 0 && (
                            <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                                +{stats.leaveFull} Full Day Leave{stats.leaveFull > 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Half Days</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stats.halfDay}</h3>
                        {stats.leaveHalf > 0 && (
                            <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                                +{stats.leaveHalf} Half Day Leave{stats.leaveHalf > 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                        <X size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Absent</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stats.absent}</h3>
                        {stats.leave > 0 && (
                            <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                                {stats.leave} on approved leave
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <AttendanceTable
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterDate={filterDate}
                setFilterDate={setFilterDate}
                filteredAttendance={filteredAttendance}
                loading={loading}
                holidays={holidays}
                expandedRecordId={expandedRecordId}
                handleToggleDetails={handleToggleDetails}
                handleEditClick={handleEditClick}
                setSelectedDetailRecord={setSelectedDetailRecord}
                hasMore={hasMore}
                handleLoadMore={handleLoadMore}
                formatHoursToHHMMSS={formatHoursToHHMMSS}
            />

            <EditAttendanceModal
                isEditModalOpen={isEditModalOpen}
                setIsEditModalOpen={setIsEditModalOpen}
                editingRecord={editingRecord}
                setEditingRecord={setEditingRecord}
                isSaving={isSaving}
                handleSaveAttendance={handleSaveAttendance}
                formatHoursToHHMMSS={formatHoursToHHMMSS}
            />

            <AttendanceDetailModal
                selectedDetailRecord={selectedDetailRecord}
                setSelectedDetailRecord={setSelectedDetailRecord}
                filterDate={filterDate}
                formatHoursToHHMMSS={formatHoursToHHMMSS}
            />
        </div>
    );
};

export default ManageAttendance;