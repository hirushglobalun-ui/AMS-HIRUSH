/**
 * File: tests/attendance.test.ts
 * Purpose: Automated unit tests for attendance hours calculation, auto-checkout rules, and formatting.
 * Author: Hirush Global AMS
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculateTotalHours, formatHoursToHHMMSS } from '../components/shared/ManageAttendance/utils';

describe('Attendance Hours & Time Calculations', () => {
  test('calculates correct hours for standard check-in and check-out', () => {
    const sessions = [
      { checkIn: '09:00:00', checkOut: '17:00:00', isManuallyEdited: false },
    ];
    const total = calculateTotalHours(sessions, '2026-09-20');
    assert.strictEqual(total, 8.0);
  });

  test('calculates multiple split sessions accurately', () => {
    const sessions = [
      { checkIn: '09:00:00', checkOut: '13:00:00' }, // 4 hrs
      { checkIn: '14:00:00', checkOut: '18:30:00' }, // 4.5 hrs
    ];
    const total = calculateTotalHours(sessions, '2026-09-20');
    assert.strictEqual(total, 8.5);
  });

  test('caps auto-checked-out sessions at 4.0 hours maximum', () => {
    const sessions = [
      {
        checkIn: '09:00:00',
        checkOut: '23:50:00',
        autoCheckedOut: true,
        isManuallyEdited: false,
      },
    ];
    const total = calculateTotalHours(sessions, '2026-09-20');
    assert.strictEqual(total, 4.0);
  });

  test('formats decimal hours to standard HH:MM:SS format', () => {
    assert.strictEqual(formatHoursToHHMMSS(0), '00:00:00');
    assert.strictEqual(formatHoursToHHMMSS(8.5), '08:30:00');
    assert.strictEqual(formatHoursToHHMMSS(7.25), '07:15:00');
    assert.strictEqual(formatHoursToHHMMSS(9.75), '09:45:00');
  });
});
