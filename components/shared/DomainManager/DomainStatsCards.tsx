/**
 * File: components/shared/DomainManager/DomainStatsCards.tsx
 * Purpose: Displays health summary KPI metrics cards for monitored domains.
 * Author: Hirush Global AMS
 */

import React from 'react';
import { Globe, ShieldCheck, ShieldAlert, Clock } from 'lucide-react';
import { ConsolidatedDomain } from './types';

interface DomainStatsCardsProps {
  domains: ConsolidatedDomain[];
}

export const DomainStatsCards: React.FC<DomainStatsCardsProps> = ({ domains }) => {
  const totalCount = domains.length;
  
  const healthyCount = domains.filter(
    (item) =>
      (item.dnsStatus || 'Healthy') === 'Healthy' &&
      (item.sslStatus || 'Healthy') === 'Healthy' &&
      item.daysRemaining > 7
  ).length;

  const expiringCount = domains.filter(
    (item) => item.daysRemaining >= 0 && item.daysRemaining <= 14
  ).length;

  const issuesCount = domains.filter(
    (item) =>
      item.dnsStatus === 'Issue Detected' ||
      item.sslStatus === 'Issue Detected' ||
      item.daysRemaining < 0
  ).length;

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Total Domains</span>
          <Globe size={18} className="text-indigo-500" />
        </div>
        <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalCount}</span>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-900/30 flex flex-col justify-between">
        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Healthy</span>
          <ShieldCheck size={18} className="text-emerald-500" />
        </div>
        <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{healthyCount}</span>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-amber-100 dark:border-amber-900/30 flex flex-col justify-between">
        <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Expiring Soon</span>
          <Clock size={18} className="text-amber-500" />
        </div>
        <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">{expiringCount}</span>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 flex flex-col justify-between">
        <div className="flex items-center justify-between text-red-600 dark:text-red-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Health Issues</span>
          <ShieldAlert size={18} className="text-red-500" />
        </div>
        <span className="text-2xl font-bold text-red-700 dark:text-red-400">{issuesCount}</span>
      </div>
    </div>
  );
};
