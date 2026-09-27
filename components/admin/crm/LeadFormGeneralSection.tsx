/**
 * File: components/admin/crm/LeadFormGeneralSection.tsx
 * Purpose: Form fields for general lead details (SL No, Category, Project Name, Status, Dates).
 * Author: Hirush Global AMS
 */

import React from 'react';
import { Briefcase } from 'lucide-react';
import FormInput from '../../common/FormInput';
import { LeadCategory, LeadStatus } from '../../../types';

interface LeadFormGeneralSectionProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export const LeadFormGeneralSection: React.FC<LeadFormGeneralSectionProps> = ({
  formData,
  onChange,
}) => {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <Briefcase size={16} className="text-indigo-600" />
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
          General Information
        </h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormInput
          label="SL No"
          name="slNo"
          value={formData.slNo}
          onChange={onChange}
          placeholder="LEAD-001"
          required
        />

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Lead Category *</label>
          <select
            name="category"
            value={formData.category}
            onChange={onChange}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
            required
          >
            <option value={LeadCategory.COMPANY}>Company Lead (Active Business)</option>
            <option value={LeadCategory.RAW_SCRAPED}>Raw Scraped Lead (Outreach)</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <FormInput
            label="Project Name *"
            name="projectName"
            value={formData.projectName}
            onChange={onChange}
            placeholder="e.g. Acme Website Revamp"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Status *</label>
          <select
            name="status"
            value={formData.status}
            onChange={onChange}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
            required
          >
            {Object.values(LeadStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <FormInput
          label="First Start Date *"
          name="firstStartDate"
          type="date"
          value={formData.firstStartDate}
          onChange={onChange}
          required
        />

        <FormInput
          label="Work Commencement Date"
          name="workCommencementDate"
          type="date"
          value={formData.workCommencementDate}
          onChange={onChange}
        />
      </div>
    </div>
  );
};
