/**
 * @file index.tsx
 * @description React component for rendering index UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React, { useState, useEffect } from 'react';
import { User, AttendanceRecord, LeaveRequest, Holiday } from '../../../types';
import {
    ArrowLeft,
    Download,
    Calendar as CalendarIcon,
    FileText
} from 'lucide-react';
import { db } from '../../../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { subscribeToAttendanceByUser } from '../../../services/dataService';
import { exportToCSV } from '../../../services/exportService';
import { formatHoursToHHMMSS } from './utils';

import UserHeader from './UserHeader';
import PersonalInfoTab from './PersonalInfoTab';
import AttendanceTab from './AttendanceTab';

interface UserDetailViewProps {
    user: User;
    onBack: () => void;
    onUserUpdate?: (updatedUser: User) => void;
}

const UserDetailView: React.FC<UserDetailViewProps> = ({ user, onBack, onUserUpdate }) => {
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'attendance' | 'details'>('attendance');
    const [holidays, setHolidays] = useState<Holiday[]>([]);

    const handleRemoveDocument = async (field: keyof User) => {
        if (!window.confirm('Are you sure you want to remove this document?')) return;

        try {
            const userRef = doc(db, 'users', user.id);
            await updateDoc(userRef, {
                [field]: ''
            });

            if (onUserUpdate) {
                onUserUpdate({ ...user, [field]: '' });
            }
            toast.success("Document removed successfully");
        } catch (error) {
            console.error("Error removing document:", error);
            toast.error("Failed to remove document");
        }
    };

    useEffect(() => {
        setLoading(true);

        const unsubscribeAttendance = subscribeToAttendanceByUser(user.id, (data) => {
            setAttendance(data);
        });

        const fetchLeavesAndHolidays = async () => {
            try {
                const leaveQuery = query(
                    collection(db, 'leaveRequests'),
                    where('userId', '==', user.id)
                );
                const leaveSnapshot = await getDocs(leaveQuery);
                const leaveData = leaveSnapshot.docs.map(doc => {
                    const data = doc.data() as LeaveRequest;
                    if (data.leaveType === 'Earned' as any) data.leaveType = 'Casual' as any;
                    return { id: doc.id, ...data };
                });
                setLeaveRequests(leaveData);

                // Fetch holidays
                const holidaysSnapshot = await getDocs(collection(db, 'holidays'));
                const hData = holidaysSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Holiday));
                setHolidays(hData);
            } catch (error) {
                console.error("Error fetching user data:", error);
                toast.error("Failed to load user details.");
            } finally {
                setLoading(false);
            }
        };

        fetchLeavesAndHolidays();
        return () => unsubscribeAttendance();
    }, [user.id]);

    const handleExportUserAttendance = () => {
        if (attendance.length === 0) {
            toast.error("No attendance data found for this user.");
            return;
        }

        const exportData = attendance.map(record => ({
            'Date': record.date,
            'Check In (1st)': record.sessions[0]?.checkIn || 'N/A',
            'Check Out (Last)': [...record.sessions].reverse().find(s => s.checkOut)?.checkOut || 'Active',
            'Total Hours': formatHoursToHHMMSS(record.totalHours),
            'Status': record.totalHours > 0 ? 'Present' : 'Absent'
        })).sort((a, b) => b.Date.localeCompare(a.Date));

        exportToCSV(exportData, `${user.name}_Attendance_History_${new Date().toISOString().split('T')[0]}`);
        toast.success("User attendance history exported!");
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 text-sm sm:text-base"
                >
                    <ArrowLeft size={18} />
                    <span>Back to Directory</span>
                </button>
                <button
                    onClick={handleExportUserAttendance}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-primary/25 transition-all active:scale-95 text-sm sm:text-base"
                >
                    <Download size={18} />
                    <span>Export Logs</span>
                </button>
            </div>

            {/* Profile Header Card */}
            <UserHeader user={user} />

            {/* Content Tabs */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-wrap sm:flex-nowrap gap-1.5 p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-2xl w-full sm:w-fit self-center border border-slate-200 justify-center">
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${activeTab === 'attendance'
                            ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <CalendarIcon size={18} />
                        Attendance Calendar
                    </button>
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${activeTab === 'details'
                            ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <FileText size={18} />
                        Detailed Profile
                    </button>
                </div>

                {/* Tab Panels */}
                <div className="min-h-[600px]">
                    {loading ? (
                        <div className="flex items-center justify-center py-40">
                            <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'attendance' && (
                                <AttendanceTab 
                                    user={user}
                                    attendance={attendance}
                                    leaveRequests={leaveRequests}
                                    holidays={holidays}
                                    onExportAttendance={handleExportUserAttendance}
                                />
                            )}
                            {activeTab === 'details' && (
                                <PersonalInfoTab 
                                    user={user}
                                    onRemoveDocument={handleRemoveDocument}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDetailView;
