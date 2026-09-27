/**
 * @file LeaveQuotaTracker.tsx
 * @description React component for rendering LeaveQuotaTracker UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React from 'react';
import { CheckCircle } from 'lucide-react';

interface LeaveQuotaTrackerProps {
  leaveQuotaStats: {
    totalQuota: number;
    approvedDays: number;
    pendingDays: number;
    monthlyBalance: number;
    usedPercentage: number;
    pendingPercentage: number;
    balancePercentage: number;
  };
}

const LeaveQuotaTracker: React.FC<LeaveQuotaTrackerProps> = ({ leaveQuotaStats }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
      {/* Visual Progress Card */}
      <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between relative group">
        <div className="space-y-4 w-full">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Leave Balance Overview</span>
              <h3 className="text-xl font-bold text-slate-800 mt-0.5">Monthly Time-Off Allocation</h3>
            </div>
            <span className="text-xs bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full font-bold text-indigo-600">
              Quota: {leaveQuotaStats.totalQuota} Days
            </span>
          </div>

          {/* Visual Progress Bar */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-sm font-bold text-slate-600">
              <span>Taken: {leaveQuotaStats.approvedDays}d</span>
              {leaveQuotaStats.pendingDays > 0 && <span className="text-amber-600">Pending: {leaveQuotaStats.pendingDays}d</span>}
              <span className="text-emerald-600">Balance: {leaveQuotaStats.monthlyBalance}d</span>
            </div>
            
            <div className="h-3 w-full bg-slate-100 rounded-full p-0.5 overflow-hidden flex border border-slate-200/50">
              <div 
                style={{ width: `${leaveQuotaStats.usedPercentage}%` }} 
                className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                title={`Used: ${leaveQuotaStats.usedPercentage}%`}
              />
              <div 
                style={{ width: `${leaveQuotaStats.pendingPercentage}%` }} 
                className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                title={`Pending: ${leaveQuotaStats.pendingPercentage}%`}
              />
              <div 
                style={{ width: `${leaveQuotaStats.balancePercentage}%` }} 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                title={`Balance: ${leaveQuotaStats.balancePercentage}%`}
              />
            </div>
            
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>0 Days</span>
              <span>Monthly Limit: {leaveQuotaStats.totalQuota} Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-50">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Leave Accrual System</span>
          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">Policy Info</span>
        </div>

        <div className="space-y-3 pt-3">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg mt-0.5">
              <CheckCircle size={14} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">2.5 Days Per Month</p>
              <p className="text-[10px] text-slate-400">Casual & Sick leaves combined have a limit of 2.5 days per month.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg mt-0.5">
              <CheckCircle size={14} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">30 Days Total per Year</p>
              <p className="text-[10px] text-slate-400">Your total calendar year allocation is capped at 30 days of leave.</p>
            </div>
          </div>
        </div>
        
        <p className="text-[10px] text-slate-400 font-medium text-center mt-3 pt-3 border-t border-slate-50">
          * Check your leaves tab to submit new requests.
        </p>
      </div>
    </div>
  );
};

export default LeaveQuotaTracker;
