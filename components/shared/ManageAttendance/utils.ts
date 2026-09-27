/**
 * File: components/shared/ManageAttendance/utils.ts
 * Purpose: Time formatting and total hours calculation utilities for attendance management.
 * Author: Hirush Global AMS
 */

import { getLocalDateString } from '../../../services/dataService';

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

export const calculateTotalHours = (sessions: any[], dateStr?: string): number => {
  let total = 0;
  if (sessions && Array.isArray(sessions)) {
    const todayStr = getLocalDateString();
    sessions.forEach((session) => {
      if (session.checkIn && session.checkOut) {
        const datePrefix = dateStr || '1970-01-01';
        const start = new Date(`${datePrefix}T${session.checkIn}`);
        let end = new Date(`${datePrefix}T${session.checkOut}`);
        let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        if (diff < 0) diff += 24;
        if (diff > 0) {
          const isAuto =
            !session.isManuallyEdited &&
            (session.autoCheckedOut === true ||
              (session.autoCheckedOut !== false &&
                (session.checkOut === '23:50:00' || session.checkOut === '22:20:00'))) &&
            (session.checkOut === '23:50:00' || session.checkOut === '22:20:00');
          if (isAuto) diff = Math.min(diff, 4.0);
          total += diff;
        }
      } else if (session.checkIn && !session.checkOut && dateStr) {
        if (dateStr === todayStr) {
          const start = new Date(`${dateStr}T${session.checkIn}`);
          const diff = (new Date().getTime() - start.getTime()) / (1000 * 60 * 60);
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
