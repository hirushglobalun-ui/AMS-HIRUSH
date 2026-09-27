/**
 * File: components/admin/crm/LeadFormProjectSection.tsx
 * Purpose: Form inputs for Domain hosting info, Sales representative assignment, Department tags, and remarks.
 * Author: Hirush Global AMS
 */

import React from 'react';
import { FileText, X } from 'lucide-react';
import FormInput from '../../common/FormInput';

interface LeadFormProjectSectionProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  salesUsers: { id: string; name: string }[];
  departmentInput: string;
  setDepartmentInput: (val: string) => void;
  onAddDepartment: () => void;
  onRemoveDepartment: (dept: string) => void;
}

export const LeadFormProjectSection: React.FC<LeadFormProjectSectionProps> = ({
  formData,
  onChange,
  salesUsers,
  departmentInput,
  setDepartmentInput,
  onAddDepartment,
  onRemoveDepartment,
}) => {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <FileText size={16} className="text-indigo-600" />
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Additional Details</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormInput
          label="Domain Detail"
          name="domainDetail"
          value={formData.domainDetail}
          onChange={onChange}
          placeholder="e.g. www.example.com"
        />
        <FormInput
          label="Expiry Date"
          name="expiryDate"
          type="date"
          value={formData.expiryDate || ''}
          onChange={onChange}
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Assigned Member (Sales)
        </label>
        <select
          name="assignedTo"
          value={formData.assignedTo || ''}
          onChange={onChange}
          className="w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50/50 focus:border-indigo-500 transition-all outline-none font-medium text-slate-700 border"
        >
          <option value="">Unassigned</option>
          {salesUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Departments
        </label>
        <div className="flex gap-2 mb-2">
          <select
            value={departmentInput}
            onChange={(e) => setDepartmentInput(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border-slate-200 bg-slate-50/50 focus:border-indigo-500 transition-all outline-none font-medium text-slate-700 border"
          >
            <option value="">Select Department...</option>
            <option value="SEO">SEO</option>
            <option value="Development">Development</option>
            <option value="Product">Product</option>
            <option value="Media">Media</option>
            <option value="Sales">Sales</option>
            <option value="Visitor">Visitor</option>
          </select>
          <button
            type="button"
            onClick={onAddDepartment}
            disabled={!departmentInput}
            className="px-6 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.department.map((dept: string) => (
            <span
              key={dept}
              className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium"
            >
              {dept}
              <button
                type="button"
                onClick={() => onRemoveDepartment(dept)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Remark
        </label>
        <textarea
          name="remark"
          rows={3}
          value={formData.remark}
          onChange={onChange}
          className="w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50/50 focus:border-indigo-500 transition-all outline-none font-medium text-slate-700 border resize-none"
          placeholder="Any additional remarks..."
        />
      </div>
    </div>
  );
};
