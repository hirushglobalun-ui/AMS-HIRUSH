/**
 * @file AttendanceTimeline.tsx
 * @description React component for rendering AttendanceTimeline UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React from 'react';
import Card from '../../common/Card';
import { Calendar, History, CheckCircle, Clock, Zap, XCircle, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatHoursToHHMMSS } from './utils';

interface AttendanceTimelineProps {
  stats: any;
  currentDate: Date;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  holidays: any[];
  calendarData: any;
  attendanceHistory: any[];
  user: any;
  setSelectedDay: (day: any) => void;
}

const SummaryMiniCard = ({ label, value, suffix, icon, color }: any) => (
  <div className={`p-3 sm:p-4 rounded-2xl sm:rounded-3xl border flex flex-col gap-2 sm:gap-3 shadow-sm ${color}`}>
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

const AttendanceTimeline: React.FC<AttendanceTimelineProps> = ({
  stats,
  currentDate,
  handlePrevMonth,
  handleNextMonth,
  holidays,
  calendarData,
  attendanceHistory,
  user,
  setSelectedDay
}) => {
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dayCells = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      dayCells.push(<div key={`pad-${i}`} className="min-h-[50px] sm:min-h-[100px] border border-slate-50 bg-slate-50/30 rounded-lg sm:rounded-2xl"></div>);
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
        cellClass += ' border-indigo-100 bg-indigo-50/50';
        statusNode = (
          <div className="mt-auto space-y-0.5 sm:space-y-1">
            <div className="flex items-center gap-1 text-[8px] sm:text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-tight">
              <History size={8} className="shrink-0 sm:w-[10px] sm:h-[10px]" /> 
              <span className="sm:hidden">H</span>
              <span className="hidden sm:inline">Holiday</span>
            </div>
            <div className="hidden sm:block text-[10px] sm:text-xs font-bold text-indigo-700 truncate">{isHoliday.name}</div>
          </div>
        );
      } else if (statusData) {
        if (statusData.status === 'present') {
          const hours = statusData.hours || 0;
          const isWFH = statusData.isWFH;
          
          let statusText = 'Present';
          let statusColor = 'text-emerald-600';
          let labelBg = 'bg-emerald-50/50';
          let borderCol = 'border-emerald-100';

          const recordsForDate = attendanceHistory.filter((r: any) => r.date === dateStr);
          const isAutoCheckedOut = recordsForDate.some((r: any) => r.sessions?.some((s: any) => 
            !s.isManuallyEdited && (s.autoCheckedOut === true || (s.autoCheckedOut !== false && (s.checkOut === '23:50:00' || s.checkOut === '22:20:00'))) && (s.checkOut === '23:50:00' || s.checkOut === '22:20:00')
          ));

          if (isWFH) {
            if (hours >= 7) {
              statusText = hours > 7 ? 'WFH (Full Day + OT)' : 'WFH (Full Day)';
              statusColor = 'text-blue-600';
              labelBg = 'bg-blue-50/50';
              borderCol = 'border-blue-100';
            } else if (hours >= 4) {
              statusText = 'WFH (Half Day)';
              statusColor = 'text-sky-600';
              labelBg = 'bg-sky-50/50';
              borderCol = 'border-sky-100';
            } else {
              statusText = 'WFH (< 4h)';
              statusColor = 'text-rose-500';
              labelBg = 'bg-rose-50/50';
              borderCol = 'border-rose-100';
            }
          } else if (isAutoCheckedOut) {
            statusText = 'Half Day (Auto)';
            statusColor = 'text-sky-600';
            labelBg = 'bg-sky-50/50';
            borderCol = 'border-sky-100';
          } else if (hours >= 7) {
            statusText = hours > 7 ? 'Full Day + OT' : 'Full Day';
            statusColor = 'text-emerald-600';
          } else if (hours >= 4) {
            statusText = 'Half Day';
            statusColor = 'text-sky-600';
            labelBg = 'bg-sky-50/50';
            borderCol = 'border-sky-100';
          } else {
            statusText = 'Absent (< 4h)';
            statusColor = 'text-rose-500';
            labelBg = 'bg-rose-50/50';
            borderCol = 'border-rose-100';
          }

          const getMinStatus = (full: string) => {
            if (full.includes('Full Day + OT')) return 'FD+OT';
            if (full.includes('Full Day')) return 'FD';
            if (full.includes('Half Day')) return 'HD';
            if (full.includes('< 4h')) return 'ABS';
            if (full.includes('WFH')) return 'WFH';
            return 'P';
          };

          cellClass += ` ${borderCol} ${labelBg}`;
          statusNode = (
            <div className="mt-auto space-y-0.5 sm:space-y-1">
              <div className={`flex items-center flex-wrap gap-0.5 sm:gap-1 text-[7px] sm:text-[10px] font-bold ${statusColor} uppercase tracking-tighter leading-tight`}>
                <Clock size={8} className="shrink-0 sm:w-[10px] sm:h-[10px]" /> 
                <span className="sm:hidden">{getMinStatus(statusText)}</span>
                <span className="hidden sm:inline">{statusText}</span>
              </div>
              <div className={`hidden sm:block text-[9px] sm:text-xs md:text-sm font-black ${statusColor}`}>{formatHoursToHHMMSS(hours)}</div>
            </div>
          );
        } else if (statusData.status === 'leave') {
          cellClass += ' border-rose-100 bg-rose-50/50';
          statusNode = (
            <div className="mt-auto space-y-0.5 sm:space-y-1">
              <div className="flex items-center flex-wrap gap-0.5 sm:gap-1 text-[7px] sm:text-[10px] font-bold text-rose-600 uppercase tracking-tighter leading-tight">
                <Zap size={8} className="shrink-0 sm:w-[10px] sm:h-[10px]" /> 
                <span className="sm:hidden">L</span>
                <span className="hidden sm:inline">
                  {statusData.leaveType} {statusData.duration === 'Half Day' ? '(HD)' : ''}
                </span>
              </div>
              <div className="hidden sm:block text-[8px] sm:text-xs font-bold text-rose-700 truncate leading-tight">
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
          cellClass += ' border-slate-100 bg-slate-50/30';
          statusNode = (
            <div className="mt-auto">
              <div className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">N/A</div>
            </div>
          );
        } else {
          cellClass += ' border-rose-100 bg-rose-50/50';
          statusNode = (
            <div className="mt-auto">
              <div className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">Absent</div>
            </div>
          );
        }
      } else {
        cellClass += ' border-slate-100 bg-white';
      }

      if (isToday) {
        cellClass += ' ring-2 ring-indigo-600 ring-offset-2';
      }

      dayCells.push(
        <div 
          key={dateStr} 
          className={cellClass}
          onClick={() => {
            // Aggregate multiple records for the same day if they exist for the detail modal
            const recordsForDay = attendanceHistory.filter(r => r.date === dateStr);
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
                isHoliday: holidays.find(h => h.date === dateStr)
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
          <div className="grid grid-cols-7 gap-1 sm:gap-3">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-[10px] sm:text-[11px] font-black uppercase text-slate-400 text-center tracking-widest pb-2">{d}</div>
            ))}
            {dayCells}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
      {/* Fast stats for selected month */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryMiniCard
          label="Working Days"
          value={stats.workingDaysCount}
          suffix="Days"
          icon={<Calendar size={20} />}
          color="bg-slate-50 text-slate-600 border-slate-100"
        />
        <SummaryMiniCard
          label="Present (Month)"
          value={stats.presentDays}
          suffix="Days"
          icon={<History size={20} />}
          color="bg-emerald-50 text-emerald-600 border-emerald-100"
        />
        <SummaryMiniCard
          label="Full Day (Month)"
          value={stats.fullDays}
          suffix="Days"
          icon={<CheckCircle size={20} />}
          color="bg-indigo-50 text-indigo-600 border-indigo-100"
        />
        <SummaryMiniCard
          label="Half Day (Month)"
          value={stats.halfDays}
          suffix="Days"
          icon={<Clock size={20} />}
          color="bg-amber-50 text-amber-600 border-amber-100"
        />
        <SummaryMiniCard
          label="Absent (Month)"
          value={stats.absentDays}
          suffix="Days"
          icon={<XCircle size={20} />}
          color="bg-rose-50 text-rose-600 border-rose-100"
        />
        <SummaryMiniCard
          label="On Leave (Month)"
          value={stats.leaveDays}
          suffix="Days"
          icon={<Briefcase size={20} />}
          color="bg-blue-50 text-blue-600 border-blue-100"
        />
        <SummaryMiniCard
          label="Total Work (Month)"
          value={formatHoursToHHMMSS(stats.totalHours).split(':')[0]}
          suffix="Hours"
          icon={<Clock size={20} />}
          color="bg-slate-50 text-slate-600 border-slate-100"
        />
        <SummaryMiniCard
          label="Overtime (Month)"
          value={formatHoursToHHMMSS(stats.otHours).split(':')[0]}
          suffix="Hours"
          icon={<Zap size={20} />}
          color="bg-orange-50 text-orange-600 border-orange-100"
        />
      </div>

      <Card className="p-2 sm:p-8 shadow-2xl border-white/50 backdrop-blur-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-10 gap-3 sm:gap-6 px-1 sm:px-0">
          <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-center">
            <div className="p-2 sm:p-3 bg-indigo-50 rounded-xl sm:rounded-2xl text-indigo-600"><Calendar size={18} className="sm:w-6 sm:h-6" /></div>
            <div>
              <h3 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">Timeline View</h3>
              <p className="text-[10px] sm:text-sm text-slate-500">Track daily log entries and activity</p>
            </div>
          </div>
          <div className="flex items-center p-0.5 sm:p-1 bg-slate-100 border border-slate-200 rounded-lg sm:rounded-2xl shadow-inner w-full sm:w-auto justify-between">
            <button onClick={handlePrevMonth} className="p-1.5 sm:p-2.5 hover:bg-white rounded-md sm:rounded-xl transition-all text-slate-400 hover:text-indigo-600 active:scale-90"><ChevronLeft size={18} /></button>
            <span className="text-sm sm:text-lg font-black min-w-[6rem] sm:min-w-[12rem] text-center text-slate-800 px-1">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={handleNextMonth} className="p-1.5 sm:p-2.5 hover:bg-white rounded-md sm:rounded-xl transition-all text-slate-400 hover:text-indigo-600 active:scale-90"><ChevronRight size={18} /></button>
          </div>
        </div>

        {renderCalendar()}
      </Card>
    </div>
  );
};

export default AttendanceTimeline;
