/**
 * @file utils.ts
 * @description Provides logic and utilities for utils.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import { LeaveRequest, AttendanceRecord, Holiday } from '../../../types';

export const formatHoursToHHMMSS = (decimalHours: number): string => {
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

export const getLeaveDays = (req: LeaveRequest) => {
    if (req.duration === 'Half Day') return 0.5;
    if (!req.startDate || !req.endDate) return 0;
    const start = new Date(req.startDate);
    const end = new Date(req.endDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diffDays) ? 0 : diffDays;
};

export const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getActualLeaveDaysDeducted = (req: LeaveRequest, attendance: AttendanceRecord[], holidays: Holiday[] = []) => {
    if (!req.startDate || !req.endDate) return 0;
    
    if (req.duration === 'Half Day') {
        const hasWorked = attendance.some(a => a.date === req.startDate && a.totalHours > 0);
        if (hasWorked) return 0;
        
        // Check if the single half-day date is a Sunday or a holiday
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
