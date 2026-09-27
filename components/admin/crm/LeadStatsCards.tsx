/**
 * File: components/admin/crm/LeadStatsCards.tsx
 * Purpose: Top-level summary cards showing lead counts broken down by pipeline stage.
 * Author: Hirush Global AMS
 */

import React from 'react';
import { Briefcase, Clock, CheckCircle, PauseCircle, Send, XCircle } from 'lucide-react';

interface LeadStatsCardsProps {
  stats: {
    total: number;
    pending: number;
    ongoing: number;
    completed: number;
    onHold: number;
    proposalSent: number;
    disposed: number;
  };
}

export const LeadStatsCards: React.FC<LeadStatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
          <Briefcase size={20} />
        </div>
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total</div>
          <div className="text-xl font-extrabold text-slate-800">{stats.total}</div>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-sm flex items-center gap-3">
        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
          <Clock size={20} />
        </div>
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending</div>
          <div className="text-xl font-extrabold text-amber-600">{stats.pending}</div>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-sm flex items-center gap-3">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
          <Clock size={20} />
        </div>
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ongoing</div>
          <div className="text-xl font-extrabold text-blue-600">{stats.ongoing}</div>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-3">
        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
          <CheckCircle size={20} />
        </div>
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completed</div>
          <div className="text-xl font-extrabold text-emerald-600">{stats.completed}</div>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-orange-100 shadow-sm flex items-center gap-3">
        <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg">
          <PauseCircle size={20} />
        </div>
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">On Hold</div>
          <div className="text-xl font-extrabold text-orange-600">{stats.onHold}</div>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-purple-100 shadow-sm flex items-center gap-3">
        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
          <Send size={20} />
        </div>
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Proposal</div>
          <div className="text-xl font-extrabold text-purple-600">{stats.proposalSent}</div>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="p-2.5 bg-slate-100 text-slate-500 rounded-lg">
          <XCircle size={20} />
        </div>
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Disposed</div>
          <div className="text-xl font-extrabold text-slate-600">{stats.disposed}</div>
        </div>
      </div>
    </div>
  );
};
