/**
 * File: components/admin/crm/LeadCategoryTabs.tsx
 * Purpose: Category switcher tabs (Company vs Raw Scraped) and View mode switcher (Table vs Calendar).
 * Author: Hirush Global AMS
 */

import React from 'react';
import { LayoutDashboard, Briefcase, Layers, List, Calendar as CalendarIcon } from 'lucide-react';
import { LeadCategory, Lead } from '../../../types';

interface LeadCategoryTabsProps {
  activeCategoryTab: LeadCategory | 'ALL';
  onCategoryChange: (cat: LeadCategory | 'ALL') => void;
  activeTab: 'list' | 'calendar';
  onTabChange: (tab: 'list' | 'calendar') => void;
  leads: Lead[];
}

export const LeadCategoryTabs: React.FC<LeadCategoryTabsProps> = ({
  activeCategoryTab,
  onCategoryChange,
  activeTab,
  onTabChange,
  leads,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      {/* Category Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 gap-3 pb-1">
        <button
          onClick={() => onCategoryChange('ALL')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
            activeCategoryTab === 'ALL'
              ? 'bg-slate-800 text-white shadow-lg shadow-slate-300'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <LayoutDashboard size={18} />
          <span>All Leads</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
            activeCategoryTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {leads.length}
          </span>
        </button>

        <button
          onClick={() => onCategoryChange(LeadCategory.COMPANY)}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
            activeCategoryTab === LeadCategory.COMPANY
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Briefcase size={18} />
          <span>Company Leads</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
            activeCategoryTab === LeadCategory.COMPANY ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {leads.filter((l) => (l.category || LeadCategory.COMPANY) === LeadCategory.COMPANY).length}
          </span>
        </button>

        <button
          onClick={() => onCategoryChange(LeadCategory.RAW_SCRAPED)}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
            activeCategoryTab === LeadCategory.RAW_SCRAPED
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-200'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers size={18} />
          <span>Raw Scraped Leads</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
            activeCategoryTab === LeadCategory.RAW_SCRAPED ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {leads.filter((l) => l.category === LeadCategory.RAW_SCRAPED).length}
          </span>
        </button>
      </div>

      {/* View Switcher: Table vs Calendar */}
      <div className="flex bg-slate-100 p-1 rounded-xl self-end sm:self-auto">
        <button
          onClick={() => onTabChange('list')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <List size={16} />
          <span>Table View</span>
        </button>
        <button
          onClick={() => onTabChange('calendar')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'calendar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarIcon size={16} />
          <span>Calendar</span>
        </button>
      </div>
    </div>
  );
};
