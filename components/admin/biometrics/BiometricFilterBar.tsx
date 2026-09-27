/**
 * File: components/admin/biometrics/BiometricFilterBar.tsx
 * Purpose: Search input and filtering buttons for the biometric staff table.
 * Author: Hirush Global AMS
 */

import React from 'react';
import { Search, Clock, Check, MapPin } from 'lucide-react';
import { BiometricStatusFilter, BiometricStats } from './types';

interface BiometricFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: BiometricStatusFilter;
  onFilterChange: (filter: BiometricStatusFilter) => void;
  stats: BiometricStats;
}

export const BiometricFilterBar: React.FC<BiometricFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onFilterChange,
  stats,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="relative w-full md:w-80">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search employee by name, ID..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
        <button
          onClick={() => onFilterChange('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => onFilterChange('pending')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            statusFilter === 'pending'
              ? 'bg-amber-500 text-white'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          <Clock size={13} /> Pending ({stats.pending})
        </button>
        <button
          onClick={() => onFilterChange('approved')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            statusFilter === 'approved'
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <Check size={13} /> Approved ({stats.approved})
        </button>
        <button
          onClick={() => onFilterChange('exempted')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            statusFilter === 'exempted'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 hover:bg-blue-100'
          }`}
        >
          <MapPin size={13} /> Exempted ({stats.exempted})
        </button>
        <button
          onClick={() => onFilterChange('not_registered')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            statusFilter === 'not_registered'
              ? 'bg-slate-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
          }`}
        >
          Not Enrolled ({stats.notRegistered})
        </button>
      </div>
    </div>
  );
};
