/**
 * File: components/shared/DomainManager/DomainFilterBar.tsx
 * Purpose: Search and filtering controls for the Domain Manager dashboard.
 * Author: Hirush Global AMS
 */

import React from 'react';
import { Search } from 'lucide-react';
import { DomainStatusFilter } from './types';

interface DomainFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: DomainStatusFilter;
  onStatusFilterChange: (status: DomainStatusFilter) => void;
  totalCount: number;
  healthIssueCount: number;
}

export const DomainFilterBar: React.FC<DomainFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  totalCount,
  healthIssueCount,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="md:col-span-2 relative">
        <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search by project name or domain URL..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none text-sm text-slate-700 dark:text-slate-200 transition-all shadow-sm"
        />
      </div>

      <div>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as DomainStatusFilter)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm focus:border-indigo-500 outline-none text-sm text-slate-700 dark:text-slate-200 transition-all shadow-sm"
        >
          <option value="all">All Domains</option>
          <option value="critical">Critical Expiry (0 - 2 Days)</option>
          <option value="warning">Warning Expiry (3 - 7 Days)</option>
          <option value="active">Active Expiry (&gt; 7 Days)</option>
          <option value="expired">Expired Domains</option>
          <option value="health-issue">DNS/SSL Issues</option>
        </select>
      </div>

      <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-1 flex gap-1">
        <button
          onClick={() => onStatusFilterChange('all')}
          className={`flex-1 text-xs py-2 rounded-lg font-bold transition-all ${
            statusFilter === 'all'
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Total ({totalCount})
        </button>
        <button
          onClick={() => onStatusFilterChange('health-issue')}
          className={`flex-1 text-xs py-2 rounded-lg font-bold transition-all ${
            statusFilter === 'health-issue'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
          }`}
        >
          Health Issues ({healthIssueCount})
        </button>
      </div>
    </div>
  );
};
