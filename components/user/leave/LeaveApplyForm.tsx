/**
 * File: components/user/leave/LeaveApplyForm.tsx
 * Purpose: Form card for submitting new leave requests or updating existing pending ones.
 * Author: Hirush Global AMS
 */

import React from 'react';
import Card from '../../common/Card';
import { Plus, Pencil } from 'lucide-react';
import { LeaveType } from '../../../types';

interface LeaveApplyFormProps {
  editingLeaveId: string | null;
  duration: 'Full Day' | 'Half Day';
  setDuration: (val: 'Full Day' | 'Half Day') => void;
  halfDayType: 'Morning' | 'Afternoon';
  setHalfDayType: (val: 'Morning' | 'Afternoon') => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  leaveType: LeaveType;
  setLeaveType: (val: LeaveType) => void;
  reason: string;
  setReason: (val: string) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
  firstDayOfMonth: string;
}

export const LeaveApplyForm: React.FC<LeaveApplyFormProps> = ({
  editingLeaveId,
  duration,
  setDuration,
  halfDayType,
  setHalfDayType,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  leaveType,
  setLeaveType,
  reason,
  setReason,
  submitting,
  onSubmit,
  onCancelEdit,
  firstDayOfMonth,
}) => {
  return (
    <Card className="sticky top-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
          {editingLeaveId ? <Pencil size={20} /> : <Plus size={20} />}
        </div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {editingLeaveId ? 'Edit Request' : 'New Request'}
        </h2>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="leaveType" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Leave Type
          </label>
          <select
            id="leaveType"
            name="leaveType"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as LeaveType)}
            className="block w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100"
            required
          >
            {Object.values(LeaveType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Duration
          </label>
          <select
            id="duration"
            name="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value as 'Full Day' | 'Half Day')}
            className="block w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100"
            required
          >
            <option value="Full Day">Full Day</option>
            <option value="Half Day">Half Day</option>
          </select>
        </div>

        {duration === 'Half Day' && (
          <div>
            <label htmlFor="halfDayType" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Half Day Period
            </label>
            <select
              id="halfDayType"
              name="halfDayType"
              value={halfDayType}
              onChange={(e) => setHalfDayType(e.target.value as 'Morning' | 'Afternoon')}
              className="block w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100"
              required
            >
              <option value="Morning">First Half (Morning)</option>
              <option value="Afternoon">Second Half (Afternoon)</option>
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {duration === 'Half Day' ? 'Date' : 'Start Date'}
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              min={firstDayOfMonth}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (duration === 'Half Day') setEndDate(e.target.value);
              }}
              className="block w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100"
              required
            />
          </div>
          {duration !== 'Half Day' && (
            <div>
              <label htmlFor="endDate" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                min={startDate || firstDayOfMonth}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100"
                required
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Reason
          </label>
          <textarea
            id="reason"
            name="reason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="block w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none text-slate-800 dark:text-slate-100"
            placeholder="Please describe why you need this leave..."
            required
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-70 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
          >
            {submitting ? 'Submitting...' : editingLeaveId ? 'Update Request' : 'Submit Request'}
          </button>
          {editingLeaveId && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </Card>
  );
};
