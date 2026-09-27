/**
 * File: components/shared/ManageAttendance/AttendanceOverviewCards.tsx
 * Purpose: Top-level summary cards for administrative attendance overview.
 * Author: Hirush Global AMS
 */

import React from 'react';
import { Users, CalendarCheck, CheckCircle, Clock, X } from 'lucide-react';

interface AttendanceOverviewCardsProps {
  stats: {
    total: number;
    present: number;
    absent: number;
    fullDay: number;
    halfDay: number;
    leave: number;
    leaveFull: number;
    leaveHalf: number;
  };
}

export const AttendanceOverviewCards: React.FC<AttendanceOverviewCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-3 sm:gap-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
          <Users size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Total Employees</p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.total}</h3>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
        <div className="p-3 bg-green-50 dark:bg-green-950/50 text-green-600 rounded-xl">
          <CalendarCheck size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Present Today</p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.present}</h3>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl">
          <CheckCircle size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Full Days</p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.fullDay}</h3>
          {stats.leaveFull > 0 && (
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">
              +{stats.leaveFull} Full Day Leave{stats.leaveFull > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
        <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-xl">
          <Clock size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Half Days</p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.halfDay}</h3>
          {stats.leaveHalf > 0 && (
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">
              +{stats.leaveHalf} Half Day Leave{stats.leaveHalf > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
        <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-xl">
          <X size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Absent</p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.absent}</h3>
          {stats.leave > 0 && (
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">
              {stats.leave} on approved leave
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
