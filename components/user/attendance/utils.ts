/**
 * @file utils.ts
 * @description Provides logic and utilities for utils.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import { Session, LeaveRequest, AttendanceRecord, Holiday } from '../../../types';

export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

export const calculateSingleSessionHours = (date: string, session: Session): number => {
  if (!session || !session.checkIn) return 0;
  const todayStr = getLocalDateString();

  if (!session.checkOut) {
    if (date === todayStr) {
      const start = new Date(`${date}T${session.checkIn}`);
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      return diffMs > 0 ? parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)) : 0;
    }
    // Past day un-closed session -> capped at 4.0 hours (Half Day credit)
    const start = new Date(`${date}T${session.checkIn}`);
    const autoCheckOutDate = new Date(`${date}T23:50:00`);
    let diffMs = autoCheckOutDate.getTime() - start.getTime();
    if (diffMs < 0) diffMs = 0;
    return parseFloat(Math.min(diffMs / (1000 * 60 * 60), 4.0).toFixed(2));
  }

  // Completed session with checkIn and checkOut
  const start = new Date(`${date}T${session.checkIn}`);
  const end = new Date(`${date}T${session.checkOut}`);
  let diffMs = end.getTime() - start.getTime();

  // If checkOut is earlier than checkIn (e.g. midnight crossing or out-of-order cross-day timestamps), add 24 hours
  if (diffMs < 0) {
    diffMs += 24 * 60 * 60 * 1000;
  }

  let hours = diffMs / (1000 * 60 * 60);

  // If auto-checked out (e.g. checkOut is 23:50:00, 22:20:00, or autoCheckedOut flag is set), cap credited hours at 4.0 hours max
  const isAuto = !(session as any).isManuallyEdited && ((session as any).autoCheckedOut === true || ((session as any).autoCheckedOut !== false && (session.checkOut === '23:50:00' || session.checkOut === '22:20:00'))) && (session.checkOut === '23:50:00' || session.checkOut === '22:20:00');
  if (isAuto) {
    hours = Math.min(hours, 4.0);
  }

  return parseFloat(hours.toFixed(2));
};

export const calculateTotalHours = (date: string, sessions: Session[]): number => {
  if (!sessions || !Array.isArray(sessions)) return 0;
  let totalHours = 0;
  sessions.forEach(session => {
    totalHours += calculateSingleSessionHours(date, session);
  });
  return parseFloat(totalHours.toFixed(2));
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // in metres
  return d;
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



export const getActualLeaveDaysDeducted = (req: LeaveRequest, attendance: AttendanceRecord[], holidays: Holiday[] = []) => {
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
