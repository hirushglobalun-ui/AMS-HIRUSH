/**
 * File: components/user/leave/leaveUtils.ts
 * Purpose: Leave calculation, duration computation, and date formatting utilities.
 * Author: Hirush Global AMS
 */

import { LeaveRequest, AttendanceRecord, Holiday } from '../../../types';

export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatApplyDate = (createdAt: any): string => {
  if (!createdAt) return 'N/A';
  if (typeof createdAt.toDate === 'function') {
    return getLocalDateString(createdAt.toDate());
  }
  if (createdAt.seconds) {
    return getLocalDateString(new Date(createdAt.seconds * 1000));
  }
  try {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) {
      return getLocalDateString(d);
    }
  } catch {}
  return 'N/A';
};

export const getLeaveDays = (req: LeaveRequest): number => {
  if (req.duration === 'Half Day') return 0.5;
  if (!req.startDate || !req.endDate) return 0;
  const start = new Date(req.startDate);
  const end = new Date(req.endDate);
  const diffTime = end.getTime() - start.getTime();
  if (diffTime < 0) return 0;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return isNaN(diffDays) ? 0 : diffDays;
};

export const getActualLeaveDaysDeducted = (
  req: LeaveRequest,
  attendance: AttendanceRecord[],
  holidays: Holiday[] = []
): number => {
  if (!req.startDate || !req.endDate) return 0;
  if (req.duration === 'Half Day') {
    const d = new Date(req.startDate);
    const isWeekend = d.getDay() === 0;
    const isHoliday = holidays.some((h) => h.date === req.startDate);
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
    const isHoliday = holidays.some((h) => h.date === dateStr);

    if (!isWeekend && !isHoliday) {
      const hasWorked = attendance.some((a) => a.date === dateStr && a.totalHours > 0);
      if (!hasWorked) deductedDays += 1;
    }
    d.setDate(d.getDate() + 1);
  }

  return deductedDays;
};
