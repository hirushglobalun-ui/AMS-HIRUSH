/**
 * File: components/user/attendance/useAttendanceStats.ts
 * Purpose: Custom hook calculating monthly attendance statistics, calendar data, and leave quota deductions.
 * Author: Hirush Global AMS
 */

import { useState, useMemo } from 'react';
import { AttendanceRecord, Holiday, LeaveRequest, LeaveStatus, User } from '../../../types';
import {
  calculateTotalHours,
  getLocalDateString,
  getActualLeaveDaysDeducted,
  getLeaveDays,
} from './utils';

interface UseAttendanceStatsProps {
  user: User | null;
  attendanceHistory: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  holidays: Holiday[];
}

export const useAttendanceStats = ({
  user,
  attendanceHistory,
  leaveRequests,
  holidays,
}: UseAttendanceStatsProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrevMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const calendarData = useMemo(() => {
    const data: Record<string, any> = {};
    const todayStr = getLocalDateString();

    attendanceHistory.forEach((record) => {
      if (!record.date || typeof record.date !== 'string') return;
      const dateKey = record.date.trim();
      const recTotalHours =
        dateKey === todayStr
          ? calculateTotalHours(record.date, record.sessions)
          : record.totalHours || calculateTotalHours(record.date, record.sessions);

      if (data[dateKey] && data[dateKey].status === 'present') {
        data[dateKey].hours = (data[dateKey].hours || 0) + recTotalHours;
        data[dateKey].isWFH = data[dateKey].isWFH || !!record.isWFH;
      } else {
        data[dateKey] = { status: 'present', hours: recTotalHours, isWFH: !!record.isWFH };
      }
    });

    leaveRequests
      .filter((req) => req.status === LeaveStatus.APPROVED)
      .forEach((req) => {
        const start = new Date(req.startDate);
        const end = new Date(req.endDate);
        const d = new Date(start);
        while (d <= end) {
          const dateStr = getLocalDateString(d);
          const hasAttendance =
            data[dateStr] && data[dateStr].status === 'present' && data[dateStr].hours > 0;

          if (!hasAttendance) {
            data[dateStr] = {
              status: req.leaveType === 'WFH' ? 'present' : 'leave',
              leaveType: req.leaveType,
              isWFH: req.leaveType === 'WFH',
              duration: req.duration || 'Full Day',
              halfDayType: req.halfDayType || null,
              hours: data[dateStr]?.hours,
            };
          } else {
            data[dateStr].leaveType = req.leaveType;
            data[dateStr].onLeaveButWorked = true;
            data[dateStr].leaveDuration = req.duration || 'Full Day';
            data[dateStr].leaveHalfDayType = req.halfDayType || null;
          }
          d.setDate(d.getDate() + 1);
        }
      });

    if (user?.joiningDate) {
      const start = new Date(user.joiningDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(today);
      end.setDate(end.getDate() - 1);

      if (start <= end) {
        const d = new Date(start);
        while (d <= end) {
          const dateStr = getLocalDateString(d);
          const dayOfWeek = d.getDay();
          const isWeekend = dayOfWeek === 0;
          const isHoliday = holidays.some((h) => h.date === dateStr);

          if (!isWeekend && !isHoliday) {
            const hasWorked =
              data[dateStr] && data[dateStr].status === 'present' && data[dateStr].hours > 0;
            const hasAppliedLeave = leaveRequests.some((req) => {
              if (req.status === LeaveStatus.REJECTED) return false;
              return dateStr >= req.startDate && dateStr <= req.endDate;
            });

            if (!hasWorked && !hasAppliedLeave) {
              data[dateStr] = {
                status: 'leave',
                leaveType: 'Unpaid (Auto)',
                isWFH: false,
                duration: 'Full Day',
                halfDayType: null,
                hours: 0,
              };
            }
          }
          d.setDate(d.getDate() + 1);
        }
      }
    }

    return data;
  }, [attendanceHistory, leaveRequests, holidays, user?.joiningDate]);

  const stats = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let presentDays = 0,
      absentDays = 0,
      leaveDays = 0,
      totalHours = 0,
      otHours = 0,
      fullDays = 0,
      halfDays = 0,
      workingDaysCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0;
      const isHoliday = holidays.find((h) => h.date === dateStr);

      if (!isWeekend && !isHoliday) {
        workingDaysCount++;
        const statusData = calendarData[dateStr];
        if (statusData?.status === 'present') {
          const dailyHours = statusData.hours || 0;
          totalHours += dailyHours;
          presentDays += 1;
          if (dailyHours >= 7) {
            fullDays += 1;
            if (dailyHours > 7) otHours += dailyHours - 7;
          } else if (dailyHours >= 4) {
            halfDays += 1;
          }
        } else if (statusData?.status === 'leave') {
          leaveDays++;
        } else if (date < today) {
          const isBeforeJoining = user?.joiningDate && dateStr < user.joiningDate;
          if (!isBeforeJoining) absentDays++;
        }
      } else if (isHoliday) {
        const statusData = calendarData[dateStr];
        if (statusData?.status === 'present') {
          const dailyHours = statusData.hours || 0;
          totalHours += dailyHours;
          presentDays += 1;
        }
      }
    }
    return {
      presentDays,
      absentDays,
      leaveDays,
      totalHours,
      otHours,
      fullDays,
      halfDays,
      workingDaysCount,
    };
  }, [calendarData, currentDate, user?.joiningDate, holidays]);

  const leaveQuotaStats = useMemo(() => {
    const totalQuota = 2.5;
    const now = new Date();
    const currentMonthStr = now.toISOString().substring(0, 7);

    const monthLeaves = leaveRequests.filter(
      (l) =>
        l.startDate &&
        typeof l.startDate === 'string' &&
        l.startDate.startsWith(currentMonthStr)
    );
    const monthAttendance = attendanceHistory.filter(
      (a) => a.date && typeof a.date === 'string' && a.date.startsWith(currentMonthStr)
    );

    const approvedLeaves = monthLeaves.filter(
      (l) =>
        l.status === LeaveStatus.APPROVED &&
        l.leaveType !== 'WFH' &&
        l.leaveType !== 'Unpaid'
    );
    const approvedDaysDeducted = approvedLeaves.reduce(
      (sum, l) => sum + getActualLeaveDaysDeducted(l, monthAttendance, holidays),
      0
    );

    const pendingLeaves = monthLeaves.filter(
      (l) =>
        l.status === LeaveStatus.PENDING &&
        l.leaveType !== 'WFH' &&
        l.leaveType !== 'Unpaid'
    );
    const pendingDays = pendingLeaves.reduce((sum, l) => sum + getLeaveDays(l), 0);

    const monthlyBalance = Math.max(0, parseFloat((totalQuota - approvedDaysDeducted).toFixed(1)));
    const usedPercentage = Math.min(100, Math.round((approvedDaysDeducted / totalQuota) * 100));
    const pendingPercentage = Math.min(
      100 - usedPercentage,
      Math.round((pendingDays / totalQuota) * 100)
    );
    const balancePercentage = Math.max(0, 100 - usedPercentage - pendingPercentage);

    return {
      totalQuota,
      approvedDays: approvedDaysDeducted,
      pendingDays,
      monthlyBalance,
      usedPercentage,
      pendingPercentage,
      balancePercentage,
    };
  }, [leaveRequests, attendanceHistory, holidays]);

  return {
    currentDate,
    handlePrevMonth,
    handleNextMonth,
    calendarData,
    stats,
    leaveQuotaStats,
  };
};
