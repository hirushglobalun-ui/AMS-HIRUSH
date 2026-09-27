/**
 * File: tests/leave.test.ts
 * Purpose: Automated unit tests for leave days estimation and actual deduction rules.
 * Author: Hirush Global AMS
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { getLeaveDays, getActualLeaveDaysDeducted } from '../components/user/attendance/utils';
import { LeaveRequest, AttendanceRecord, Holiday, LeaveStatus, LeaveType } from '../types';

describe('Leave Calculation & Deduction Rules', () => {
  test('getLeaveDays correctly calculates duration for half-day requests', () => {
    const halfDayReq: LeaveRequest = {
      id: 'leave-1',
      userId: 'user-1',
      startDate: '2026-10-05',
      endDate: '2026-10-05',
      duration: 'Half Day',
      leaveType: LeaveType.CASUAL,
      reason: 'Doctor appointment',
      status: LeaveStatus.APPROVED,
      createdAt: '2026-10-01T09:00:00Z',
    };

    assert.strictEqual(getLeaveDays(halfDayReq), 0.5);
  });

  test('getLeaveDays correctly calculates duration for multi-day full requests', () => {
    const multiDayReq: LeaveRequest = {
      id: 'leave-2',
      userId: 'user-1',
      startDate: '2026-10-05', // Monday
      endDate: '2026-10-07',   // Wednesday (3 inclusive days)
      duration: 'Full Day',
      leaveType: LeaveType.CASUAL,
      reason: 'Vacation',
      status: LeaveStatus.APPROVED,
      createdAt: '2026-10-01T09:00:00Z',
    };

    assert.strictEqual(getLeaveDays(multiDayReq), 3);
  });

  test('getActualLeaveDaysDeducted excludes Sundays and designated Holidays', () => {
    // 2026-10-09 (Friday) to 2026-10-12 (Monday) -> 4 calendar days
    // 2026-10-11 is Sunday (excluded)
    // 2026-10-12 is designated as a Public Holiday (excluded)
    // Net deducted should be: 2 days (Friday Oct 9, Saturday Oct 10)
    const req: LeaveRequest = {
      id: 'leave-3',
      userId: 'user-1',
      startDate: '2026-10-09',
      endDate: '2026-10-12',
      duration: 'Full Day',
      leaveType: LeaveType.CASUAL,
      reason: 'Personal',
      status: LeaveStatus.APPROVED,
      createdAt: '2026-10-01T09:00:00Z',
    };

    const holidays: Holiday[] = [
      { id: 'h-1', name: 'Special Holiday', date: '2026-10-12', type: 'National' },
    ];
    const attendance: AttendanceRecord[] = []; // No worked days

    const deducted = getActualLeaveDaysDeducted(req, attendance, holidays);
    assert.strictEqual(deducted, 2);
  });

  test('getActualLeaveDaysDeducted does not deduct days where employee actually worked', () => {
    // Oct 5 to Oct 7 (Mon, Tue, Wed) = 3 business days
    // Employee came in and worked on Oct 6 (Tue)
    const req: LeaveRequest = {
      id: 'leave-4',
      userId: 'user-1',
      startDate: '2026-10-05',
      endDate: '2026-10-07',
      duration: 'Full Day',
      leaveType: LeaveType.CASUAL,
      reason: 'Emergency',
      status: LeaveStatus.APPROVED,
      createdAt: '2026-10-01T09:00:00Z',
    };

    const holidays: Holiday[] = [];
    const attendance: AttendanceRecord[] = [
      {
        id: 'att-1',
        userId: 'user-1',
        date: '2026-10-06',
        sessions: [{ id: 'sess-1', checkIn: '09:00:00', checkOut: '17:00:00' }],
        totalHours: 8.0,
      },
    ];

    const deducted = getActualLeaveDaysDeducted(req, attendance, holidays);
    // 3 days - 1 worked day = 2 days deducted
    assert.strictEqual(deducted, 2);
  });

  test('getActualLeaveDaysDeducted for half-day on weekend or holiday returns 0', () => {
    // 2026-10-11 is Sunday
    const sundayHalfDayReq: LeaveRequest = {
      id: 'leave-5',
      userId: 'user-1',
      startDate: '2026-10-11',
      endDate: '2026-10-11',
      duration: 'Half Day',
      leaveType: LeaveType.CASUAL,
      reason: 'Weekend test',
      status: LeaveStatus.APPROVED,
      createdAt: '2026-10-01T09:00:00Z',
    };

    assert.strictEqual(getActualLeaveDaysDeducted(sundayHalfDayReq, [], []), 0);
  });
});
