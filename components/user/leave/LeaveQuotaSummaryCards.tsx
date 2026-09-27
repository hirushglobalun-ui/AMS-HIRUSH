/**
 * File: components/user/leave/LeaveQuotaSummaryCards.tsx
 * Purpose: Progress bar and KPI metric cards for user leave balances and status counts.
 * Author: Hirush Global AMS
 */

import React from 'react';

interface LeaveQuotaSummaryCardsProps {
  quotaStats: {
    totalQuota: number;
    approvedDays: number;
    pendingDays: number;
    monthlyBalance: number;
    usedPercentage: number;
    pendingPercentage: number;
    balancePercentage: number;
  };
  stats: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

export const LeaveQuotaSummaryCards: React.FC<LeaveQuotaSummaryCardsProps> = ({
  quotaStats,
  stats,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Monthly Quota Progress Card */}
      <div className="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-full">
                Monthly Allowance
              </span>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-2">
                Leave Quota Tracker
              </h3>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                {quotaStats.monthlyBalance}
              </span>
              <span className="text-xs text-slate-400 font-bold block">Days Left</span>
            </div>
          </div>

          <div className="space-y-2 my-4">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-500">Consumed: {quotaStats.approvedDays} Days</span>
              <span className="text-amber-500">Pending: {quotaStats.pendingDays} Days</span>
              <span className="text-emerald-500">Balance: {quotaStats.monthlyBalance} Days</span>
            </div>

            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex p-0.5 gap-0.5">
              <div
                style={{ width: `${quotaStats.usedPercentage}%` }}
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                title={`Used: ${quotaStats.usedPercentage}%`}
              />
              <div
                style={{ width: `${quotaStats.pendingPercentage}%` }}
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                title={`Pending: ${quotaStats.pendingPercentage}%`}
              />
              <div
                style={{ width: `${quotaStats.balancePercentage}%` }}
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                title={`Balance: ${quotaStats.balancePercentage}%`}
              />
            </div>

            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>0 Days</span>
              <span>Monthly Limit: {quotaStats.totalQuota} Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Counts Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-50 dark:border-slate-800">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Request Stats
          </span>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold">
            Total History
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-4">
          <div className="text-center p-2 rounded-xl bg-yellow-50/50 dark:bg-yellow-950/20 border border-yellow-100/50 dark:border-yellow-900/30">
            <span className="text-[9px] font-bold text-yellow-600 block uppercase">Pending</span>
            <span className="text-lg font-black text-yellow-700 dark:text-yellow-400 block mt-1">
              {stats.pending}
            </span>
          </div>
          <div className="text-center p-2 rounded-xl bg-green-50/50 dark:bg-green-950/20 border border-green-100/50 dark:border-green-900/30">
            <span className="text-[9px] font-bold text-green-600 block uppercase">Approved</span>
            <span className="text-lg font-black text-green-700 dark:text-green-400 block mt-1">
              {stats.approved}
            </span>
          </div>
          <div className="text-center p-2 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/30">
            <span className="text-[9px] font-bold text-red-600 block uppercase">Rejected</span>
            <span className="text-lg font-black text-red-700 dark:text-red-400 block mt-1">
              {stats.rejected}
            </span>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 font-medium text-center mt-4">
          * 2 Full Days & 1 Half Day are credited monthly.
        </p>
      </div>
    </div>
  );
};
