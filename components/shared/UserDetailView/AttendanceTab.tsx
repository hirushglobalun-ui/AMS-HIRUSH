/**
 * @file AttendanceTab.tsx
 * @description React component for rendering AttendanceTab UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React, { useState, useMemo } from 'react';
import { User, AttendanceRecord, LeaveRequest, Holiday, LeaveStatus } from '../../../types';
import Card from '../../common/Card';
import Modal from '../../common/Modal';
import {
    ChevronLeft,
    ChevronRight,
    Download,
    Calendar as CalendarIcon,
    History,
    CheckCircle,
    XCircle,
    Clock,
    Zap,
    Briefcase
} from 'lucide-react';
import { 
    formatHoursToHHMMSS, 
    getLeaveDays, 
    getLocalDateString, 
    getActualLeaveDaysDeducted 
} from './utils';

interface AttendanceTabProps {
    user: User;
    attendance: AttendanceRecord[];
    leaveRequests: LeaveRequest[];
    holidays: Holiday[];
    onExportAttendance: () => void;
}

type CalendarData = {
    [date: string]: {
        status: 'present' | 'absent' | 'leave' | 'weekend';
        hours?: number;
        leaveType?: string;
        isWFH?: boolean;
        duration?: 'Full Day' | 'Half Day';
        halfDayType?: 'Morning' | 'Afternoon';
        onLeaveButWorked?: boolean;
    }
}

const SummaryMiniCard = ({ label, value, suffix, icon, color }: any) => (
    <div className={`p-4 rounded-2xl sm:rounded-3xl border flex flex-col gap-2 sm:gap-3 shadow-sm ${color}`}>
        <div className="flex justify-between items-start">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-70 leading-tight">{label}</span>
            <div className="opacity-40">{icon}</div>
        </div>
        <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black">{value}</span>
            <span className="text-[8px] sm:text-[10px] font-bold opacity-60 tracking-wider font-mono uppercase">{suffix}</span>
        </div>
    </div>
);

const AttendanceTab: React.FC<AttendanceTabProps> = ({ 
    user, 
    attendance, 
    leaveRequests, 
    holidays,
    onExportAttendance
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<any>(null);

    const calendarData = useMemo((): CalendarData => {
        const data: CalendarData = {};

        // 1. Process approved leave requests first
        leaveRequests.forEach(req => {
            if (req.status === LeaveStatus.APPROVED) {
                const start = new Date(req.startDate);
                const end = new Date(req.endDate);
                const d = new Date(start);
                while (d <= end) {
                    const dateStr = getLocalDateString(d);
                    data[dateStr] = { 
                        status: req.leaveType === 'WFH' ? 'present' : 'leave', 
                        leaveType: req.leaveType,
                        isWFH: req.leaveType === 'WFH',
                        duration: req.duration || 'Full Day',
                        halfDayType: req.halfDayType || null,
                        hours: req.leaveType === 'WFH' ? 8 : 0 // WFH counts as full day
                    };
                    d.setDate(d.getDate() + 1);
                }
            }
        });

        // 2. Process attendance records, letting actual work override leave visual indicators
        attendance.forEach(record => {
            const hasHours = record.totalHours > 0;
            const existing = data[record.date];

            if (existing) {
                if (existing.status === 'leave' && hasHours) {
                    // Approved leave but worked! Let's mark it as present
                    data[record.date] = {
                        ...existing,
                        status: 'present',
                        hours: record.totalHours,
                        onLeaveButWorked: true
                    };
                } else if (existing.status === 'present') {
                    if (existing.isWFH && record.totalHours > 0) {
                        data[record.date].hours = record.totalHours;
                    } else {
                        data[record.date].hours = (data[record.date].hours || 0) + record.totalHours;
                    }
                    data[record.date].isWFH = data[record.date].isWFH || !!record.isWFH;
                }
            } else if (hasHours) {
                data[record.date] = { status: 'present', hours: record.totalHours, isWFH: !!record.isWFH };
            }
        });

        // 3. Process unexcused absences (Absent without applying for leave -> Casual Leave Auto)
        if (user.joiningDate) {
            const start = new Date(user.joiningDate);
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
                        const hasWorked = data[dateStr] && data[dateStr].status === 'present' && (data[dateStr].hours || 0) > 0;
                        
                        // Check if covered by an approved leave request
                        const hasApprovedLeave = leaveRequests.some(req => {
                            if (req.status !== LeaveStatus.APPROVED) return false;
                            return dateStr >= req.startDate && dateStr <= req.endDate;
                        });

                        if (!hasWorked && !hasApprovedLeave) {
                            data[dateStr] = {
                                status: 'leave',
                                leaveType: 'Unpaid (Auto)',
                                isWFH: false,
                                duration: 'Full Day',
                                halfDayType: null,
                                hours: 0
                            };
                        }
                    }
                    d.setDate(d.getDate() + 1);
                }
            }
        }

        return data;
    }, [attendance, leaveRequests, holidays, user.joiningDate]);

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const dayCells = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            dayCells.push(<div key={`pad-${i}`} className="min-h-[50px] sm:min-h-[100px] border border-slate-50 bg-slate-50/10 rounded-lg sm:rounded-2xl"></div>);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0;
            const isHoliday = holidays.find(h => h.date === dateStr);
            const isToday = date.getTime() === today.getTime();

            const statusData = calendarData[dateStr];
            let cellClass = 'min-h-[50px] sm:min-h-[100px] p-1 sm:p-3 flex flex-col rounded-lg sm:rounded-2xl border transition-all duration-200 hover:shadow-md cursor-pointer';
            let statusNode = null;

            if (isWeekend) {
                cellClass += ' border-slate-100 bg-slate-50 text-slate-400 opacity-60';
            } else if (isHoliday) {
                cellClass += ' border-indigo-100 bg-indigo-50/30';
                statusNode = (
                    <div className="mt-auto space-y-0.5 sm:space-y-1">
                        <div className="flex items-center gap-1 text-[8px] sm:text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-tight">
                            <History size={8} className="shrink-0 sm:w-[10px] sm:h-[10px]" />
                            <span className="sm:hidden">H</span>
                            <span className="hidden sm:inline">Holiday</span>
                        </div>
                        <div className="hidden sm:block text-[9px] font-bold text-indigo-300 uppercase mt-0.5">{isHoliday.name}</div>
                    </div>
                );
            } else if (statusData) {
                if (statusData.status === 'present') {
                    const isWFH = statusData.isWFH;
                    const hours = statusData.hours || 0;
                    
                    const getMinStatus = (h: number, wfh: boolean) => {
                        if (wfh) return 'WFH';
                        if (h > 7) return 'FD+OT';
                        if (h >= 7) return 'FD';
                        if (h >= 4) return 'HD';
                        return 'ABS';
                    };

                    const getFullStatus = (h: number, wfh: boolean) => {
                        if (wfh) {
                            if (h > 7) return 'WFH (FD + OT)';
                            if (h >= 7) return 'WFH (Full Day)';
                            if (h >= 4) return 'WFH (Half Day)';
                            return 'WFH (< 4h)';
                        }
                        if (h > 7) return 'Full Day + OT';
                        if (h >= 7) return 'Full Day';
                        if (h >= 4) return 'Half Day';
                        return 'Absent (< 4h)';
                    };

                    const isHalfDay = hours >= 4 && hours < 7;
                    const isAbsentHours = hours < 4;
                    if (isWFH) {
                        cellClass += ' border-blue-100 bg-blue-50/50';
                    } else if (isHalfDay) {
                        cellClass += ' border-sky-100 bg-sky-50/50';
                    } else if (isAbsentHours) {
                        cellClass += ' border-rose-100 bg-rose-50/50';
                    } else {
                        cellClass += ' border-emerald-100 bg-emerald-50/50';
                    }

                    const statusColor = isWFH ? (isAbsentHours ? 'text-rose-500' : isHalfDay ? 'text-sky-600' : 'text-blue-600') : (isHalfDay ? 'text-sky-600' : isAbsentHours ? 'text-rose-500' : 'text-emerald-600');

                    statusNode = (
                        <div className="mt-auto space-y-0.5 sm:space-y-1">
                            <div className={`flex items-center flex-wrap gap-0.5 sm:gap-1 text-[7px] sm:text-[10px] font-black uppercase tracking-widest ${statusColor}`}>
                                {isWFH ? <Briefcase size={8} className="shrink-0 sm:w-[10px] sm:h-[10px]" /> : <CheckCircle size={8} className="shrink-0 sm:w-[10px] sm:h-[10px]" />}
                                <span className="sm:hidden">{getMinStatus(hours, !!isWFH)}</span>
                                <span className="hidden sm:inline">{getFullStatus(hours, !!isWFH)}</span>
                            </div>
                            <div className={`hidden sm:block text-xs md:text-sm font-black ${statusColor}`}>{formatHoursToHHMMSS(hours)}</div>
                        </div>
                    );
                } else if (statusData.status === 'leave') {
                    cellClass += ' border-amber-100 bg-amber-50/50';
                    statusNode = (
                        <div className="mt-auto space-y-0.5 sm:space-y-1">
                            <div className="flex items-center flex-wrap gap-0.5 sm:gap-1 text-[7px] sm:text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                <Zap size={8} className="shrink-0 sm:w-[10px] sm:h-[10px]" /> 
                                <span className="sm:hidden">L: {statusData.leaveType}</span>
                                <span className="hidden sm:inline">
                                    {statusData.leaveType} {statusData.duration === 'Half Day' ? '(HD)' : ''}
                                </span>
                            </div>
                            <div className="hidden sm:block text-[9px] font-bold text-amber-700 opacity-80 uppercase leading-tight">
                                {statusData.duration === 'Half Day' 
                                    ? `Half-Day (${statusData.halfDayType || 'Morning'})` 
                                    : 'Approved Leave'}
                            </div>
                        </div>
                    );
                }
            } else if (date < today && !isWeekend) {
                const isBeforeJoining = user.joiningDate && dateStr < user.joiningDate;
                if (isBeforeJoining) {
                    cellClass += ' border-slate-100 bg-slate-50/20';
                    statusNode = (
                        <div className="mt-auto">
                            <div className="text-[8px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                <span className="sm:hidden">PRE</span>
                                <span className="hidden sm:inline">Pre-Joining</span>
                            </div>
                        </div>
                    );
                } else {
                    cellClass += ' border-rose-100 bg-rose-50/50';
                    statusNode = (
                        <div className="mt-auto space-y-0.5">
                            <div className="text-[8px] sm:text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none">
                                <span className="sm:hidden">ABS</span>
                                <span className="hidden sm:inline">Absent</span>
                            </div>
                            <div className="hidden sm:block text-[9px] font-bold text-rose-400 uppercase mt-0.5">No Records</div>
                        </div>
                    );
                }
            } else {
                cellClass += ' border-slate-100 bg-white';
            }

            if (isToday) {
                cellClass += ' ring-2 ring-indigo-500 ring-offset-2';
            }

            dayCells.push(
                <div 
                    key={dateStr} 
                    className={cellClass}
                    onClick={() => {
                        // Aggregate multiple records for the same day if they exist for the detail modal
                        const recordsForDay = attendance.filter(r => r.date === dateStr);
                        let aggregatedRecord = null;
                        
                        if (recordsForDay.length > 0) {
                            aggregatedRecord = {
                                ...recordsForDay[0],
                                totalHours: recordsForDay.reduce((sum, r) => sum + (r.totalHours || 0), 0),
                                sessions: recordsForDay.reduce((all, r) => [...all, ...(r.sessions || [])], [] as any[])
                            };
                        }

                        setSelectedDay({ 
                            date: dateStr, 
                            statusData, 
                            record: aggregatedRecord,
                            isWeekend,
                            isHoliday
                        });
                    }}
                >
                    <span className={`text-sm font-black ${isToday ? 'text-indigo-600' : (isWeekend ? 'text-slate-400' : 'text-slate-900')}`}>{day}</span>
                    {statusNode}
                </div>
            );
        }

        return (
            <div className="w-full overflow-hidden">
                <div className="w-full">
                    <div className="grid grid-cols-7 gap-1 sm:gap-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="text-[10px] sm:text-[11px] font-black uppercase text-slate-400 text-center tracking-[0.2em] pb-2 sm:pb-3">{d}</div>
                        ))}
                        {dayCells}
                    </div>
                </div>
            </div>
        );
    };

    const stats = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let presentDays = 0, absentDays = 0, leaveDays = 0, casualSickLeaveDays = 0, unpaidLeaveDays = 0, wfhDays = 0, holidayDays = 0, totalHours = 0, otHours = 0, fullDays = 0, halfDays = 0, workingDaysCount = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0;
            const isHoliday = holidays.find(h => h.date === dateStr);

            if (!isWeekend && !isHoliday) {
                workingDaysCount++;
                const statusData = calendarData[dateStr];
                if (statusData?.status === 'present') {
                    presentDays++;
                    const dailyHours = statusData.hours || 0;
                    totalHours += dailyHours;
                    
                    if (statusData.isWFH) {
                        wfhDays++;
                    }
                    if (dailyHours >= 7) {
                        fullDays++;
                        if (dailyHours > 7) otHours += (dailyHours - 7);
                    } else if (dailyHours >= 4) {
                        halfDays++;
                    }
                } else if (statusData?.status === 'leave') {
                    leaveDays++;
                    if (statusData.leaveType === 'Casual' || statusData.leaveType === 'Sick') {
                        casualSickLeaveDays++;
                    } else if (statusData.leaveType === 'Unpaid' || statusData.leaveType === 'Unpaid (Auto)') {
                        unpaidLeaveDays++;
                    }
                } else if (date < today) {
                    const isBeforeJoining = user.joiningDate && dateStr < user.joiningDate;
                    if (!isBeforeJoining) {
                        absentDays++;
                    }
                }
            } else if (isHoliday || isWeekend) {
                holidayDays++;
                const statusData = calendarData[dateStr];
                if (statusData?.status === 'present') {
                    const dailyHours = statusData.hours || 0;
                    totalHours += dailyHours;
                    presentDays++;
                }
            }
        }
        return { presentDays, absentDays, leaveDays, casualSickLeaveDays, unpaidLeaveDays, wfhDays, holidayDays, totalHours, otHours, fullDays, halfDays, workingDaysCount };
    }, [calendarData, currentDate, user.joiningDate, holidays]);


    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">


            {/* Fast stats for selected month */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryMiniCard label="Working Days" value={stats.workingDaysCount} suffix="Days" icon={<CalendarIcon size={20} />} color="bg-slate-50 text-slate-600 border-slate-100" />
                <SummaryMiniCard label="Present" value={stats.presentDays} suffix="Days" icon={<History size={20} />} color="bg-emerald-50 text-emerald-600 border-emerald-100" />
                <SummaryMiniCard label="Leave (Casual+Sick)" value={stats.casualSickLeaveDays} suffix="Days" icon={<Briefcase size={20} />} color="bg-blue-50 text-blue-600 border-blue-100" />
                <SummaryMiniCard label="Unpaid Leave" value={stats.unpaidLeaveDays} suffix="Days" icon={<XCircle size={20} />} color="bg-rose-50 text-rose-600 border-rose-100" />
                <SummaryMiniCard label="WFH" value={stats.wfhDays} suffix="Days" icon={<Briefcase size={20} />} color="bg-indigo-50 text-indigo-600 border-indigo-100" />
                <SummaryMiniCard label="Half Day" value={stats.halfDays} suffix="Days" icon={<Clock size={20} />} color="bg-amber-50 text-amber-600 border-amber-100" />
                <SummaryMiniCard label="Holiday" value={stats.holidayDays} suffix="Days" icon={<CalendarIcon size={20} />} color="bg-teal-50 text-teal-600 border-teal-100" />
                <SummaryMiniCard label="Total Hours" value={formatHoursToHHMMSS(stats.totalHours).split(':')[0]} suffix="Hours" icon={<Clock size={20} />} color="bg-slate-50 text-slate-600 border-slate-100" />
            </div>

            <Card className="p-2 sm:p-8 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-10 gap-4 sm:gap-6 px-1 sm:px-0">
                    <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-center">
                        <div className="p-2 sm:p-3 bg-primary/10 rounded-xl sm:rounded-2xl text-primary"><CalendarIcon size={18} className="sm:w-6 sm:h-6" /></div>
                        <div>
                            <h3 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">Timeline View</h3>
                            <p className="text-[10px] sm:text-sm text-slate-500">Track daily log entries and activity</p>
                        </div>
                    </div>
                    <div className="flex items-center p-0.5 sm:p-1 bg-slate-100 border border-slate-200 rounded-lg sm:rounded-2xl shadow-inner w-full sm:w-auto justify-between">
                        <button onClick={handlePrevMonth} className="p-1.5 sm:p-2.5 hover:bg-white rounded-md sm:rounded-xl transition-all text-slate-400 hover:text-primary active:scale-90"><ChevronLeft size={18} /></button>
                        <span className="text-sm sm:text-lg font-black min-w-[6rem] sm:min-w-[12rem] text-center text-slate-800 px-1">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={handleNextMonth} className="p-1.5 sm:p-2.5 hover:bg-white rounded-md sm:rounded-xl transition-all text-slate-400 hover:text-primary active:scale-90"><ChevronRight size={18} /></button>
                    </div>
                </div>

                {renderCalendar()}
            </Card>

            <Modal
                isOpen={!!selectedDay}
                onClose={() => setSelectedDay(null)}
                title={`Attendance Details: ${selectedDay?.date}`}
            >
                <div className="space-y-6">
                    {selectedDay?.statusData && (
                        <div className={`p-4 rounded-xl border ${
                            selectedDay.statusData.onLeaveButWorked ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                            selectedDay.statusData.isWFH ? 'bg-blue-50 border-blue-100 text-blue-700' :
                            selectedDay.statusData.status === 'present' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                            'bg-amber-50 border-amber-100 text-amber-700'
                        }`}>
                            <div className="flex items-center justify-between font-bold mb-1 flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <Briefcase size={18} />
                                    Status: {selectedDay.statusData.isWFH ? 'Work From Home' : (
                                        selectedDay.statusData.status === 'present' 
                                            ? (selectedDay.record?.totalHours > 7 ? 'Full Day + OT' : selectedDay.record?.totalHours < 4 ? 'Absent (< 4h)' : selectedDay.record?.totalHours < 7 ? 'Half Day' : 'Full Day') 
                                            : (selectedDay.statusData.duration === 'Half Day' ? `On Half-Day Leave (${selectedDay.statusData.halfDayType || 'Morning'})` : 'On Leave (Full Day)')
                                    )}
                                </div>
                                {selectedDay.statusData.onLeaveButWorked && (
                                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-200">
                                        {selectedDay.statusData.leaveType} • WORKED
                                    </span>
                                )}
                            </div>
                            {selectedDay.statusData.leaveType && !selectedDay.statusData.onLeaveButWorked && (
                                <p className="text-sm opacity-80 font-semibold mt-1">Leave Type: {selectedDay.statusData.leaveType}</p>
                            )}
                        </div>
                    )}

                    {selectedDay?.record ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                    <Clock size={18} className="text-indigo-500" />
                                    Time Logs
                                </h4>
                                <span className="text-lg font-black text-indigo-600">
                                    Total: {formatHoursToHHMMSS(selectedDay.record.totalHours)}
                                </span>
                            </div>
                            
                            <div className="space-y-2">
                                {selectedDay.record.sessions.map((session: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Session {idx + 1}</span>
                                        <div className="flex items-center gap-3 font-mono text-sm">
                                            <span className="text-emerald-600 font-bold">{session.checkIn}</span>
                                            <span className="text-slate-300">→</span>
                                            <span className="text-slate-600 font-bold">{session.checkOut || 'Active'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : !selectedDay?.isWeekend && !selectedDay?.isHoliday && !selectedDay?.statusData ? (
                        <div className="p-10 text-center bg-rose-50 rounded-2xl border border-rose-100 text-rose-600">
                            <XCircle size={48} className="mx-auto mb-3 opacity-20" />
                            <p className="font-bold">Absent</p>
                            <p className="text-sm opacity-70">No attendance record found for this working day.</p>
                        </div>
                    ) : (
                        <div className="p-10 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-500">
                            <CalendarIcon size={48} className="mx-auto mb-3 opacity-20" />
                            <p className="font-bold">
                                {selectedDay?.isWeekend ? 'Weekly Holiday' : selectedDay?.isHoliday ? `Holiday: ${selectedDay.isHoliday.name}` : 'No Records'}
                            </p>
                            <p className="text-sm opacity-70">No activity recorded for this day.</p>
                        </div>
                    )}

                    <button
                        onClick={() => setSelectedDay(null)}
                        className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all"
                    >
                        Close
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default AttendanceTab;
