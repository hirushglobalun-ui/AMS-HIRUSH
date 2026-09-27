/**
 * File: components/admin/biometrics/BiometricStatsCards.tsx
 * Purpose: KPI summary cards displaying counts for total staff, approved, pending, exempted, and un-enrolled.
 * Author: Hirush Global AMS
 */

import React from 'react';
import { UserCheck, ShieldCheck, Clock, MapPin, AlertCircle } from 'lucide-react';
import { BiometricStats, BiometricStatusFilter } from './types';

interface BiometricStatsCardsProps {
  stats: BiometricStats;
  onFilterChange: (filter: BiometricStatusFilter) => void;
}

export const BiometricStatsCards: React.FC<BiometricStatsCardsProps> = ({ stats, onFilterChange }) => {
  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      <div
        onClick={() => onFilterChange('all')}
        className="cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5 hover:border-primary/50 transition-all"
      >
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl">
          <UserCheck size={22} />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Staff</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</p>
        </div>
      </div>

      <div
        onClick={() => onFilterChange('approved')}
        className="cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-950 shadow-sm flex items-center gap-3.5 hover:border-emerald-400 transition-all"
      >
        <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
          <ShieldCheck size={22} />
        </div>
        <div>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wider">Approved</p>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{stats.approved}</p>
        </div>
      </div>

      <div
        onClick={() => onFilterChange('pending')}
        className="cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-950 shadow-sm flex items-center gap-3.5 hover:border-amber-400 transition-all"
      >
        <div className="p-3 bg-amber-100 dark:bg-amber-950/60 text-amber-600 rounded-xl">
          <Clock size={22} />
        </div>
        <div>
          <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold uppercase tracking-wider">Pending Review</p>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{stats.pending}</p>
        </div>
      </div>

      <div
        onClick={() => onFilterChange('exempted')}
        className="cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-xl border border-blue-200 dark:border-blue-950 shadow-sm flex items-center gap-3.5 hover:border-blue-400 transition-all"
      >
        <div className="p-3 bg-blue-100 dark:bg-blue-950/60 text-blue-600 rounded-xl">
          <MapPin size={22} />
        </div>
        <div>
          <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold uppercase tracking-wider">Exempted</p>
          <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{stats.exempted}</p>
        </div>
      </div>

      <div
        onClick={() => onFilterChange('not_registered')}
        className="cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5 hover:border-slate-400 transition-all"
      >
        <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl">
          <AlertCircle size={22} />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Not Enrolled</p>
          <p className="text-2xl font-black text-slate-600 dark:text-slate-400">{stats.notRegistered}</p>
        </div>
      </div>
    </div>
  );
};
