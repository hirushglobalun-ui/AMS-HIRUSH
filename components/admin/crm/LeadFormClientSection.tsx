/**
 * File: components/admin/crm/LeadFormClientSection.tsx
 * Purpose: Form inputs for Client details, Client Type, Point of Contact (POC), and dynamic Company selector.
 * Author: Hirush Global AMS
 */

import React from 'react';
import { User, Building2, Plus, X, Info } from 'lucide-react';
import FormInput from '../../common/FormInput';
import { ClientType } from '../../../types';
import { getClientTypeConfig } from './leadFormUtils';

interface LeadFormClientSectionProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  companies: string[];
  isAddingCompany: boolean;
  setIsAddingCompany: (val: boolean) => void;
  newCompanyInput: string;
  setNewCompanyInput: (val: string) => void;
  handleSaveNewCompany: () => Promise<void>;
  isSavingCompany: boolean;
  salesUsers: { id: string; name: string }[];
}

export const LeadFormClientSection: React.FC<LeadFormClientSectionProps> = ({
  formData,
  onChange,
  companies,
  isAddingCompany,
  setIsAddingCompany,
  newCompanyInput,
  setNewCompanyInput,
  handleSaveNewCompany,
  isSavingCompany,
  salesUsers,
}) => {
  const clientTypeConfig = getClientTypeConfig(formData.clientType);
  const ConfigIcon = clientTypeConfig.icon;
  const isB2B = formData.clientType === ClientType.B2B;

  return (
    <div className="space-y-6">
      {/* Point of Contact */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User size={16} className="text-indigo-600" />
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Point of Contact</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="POC Name" name="pocName" value={formData.pocName} onChange={onChange} placeholder="John Doe" />
          <FormInput label="POC Email" name="pocEmail" type="email" value={formData.pocEmail} onChange={onChange} placeholder="john@example.com" />
          <FormInput label="POC Phone" name="pocPhone" type="tel" value={formData.pocPhone} onChange={onChange} placeholder="+1 234 567 8900" />
        </div>
      </div>

      {/* Client Details */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 size={16} className="text-indigo-600" />
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Client Details</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="Client Name" name="clientName" value={formData.clientName} onChange={onChange} placeholder="Acme Corp" />
          <FormInput label="Client Phone" name="clientPhone" type="tel" value={formData.clientPhone} onChange={onChange} placeholder="+1 234 567 8900" />
          <FormInput label="Client Email" name="clientEmail" type="email" value={formData.clientEmail} onChange={onChange} placeholder="client@company.com" />
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Client Type</label>
            <select
              name="clientType"
              value={formData.clientType}
              onChange={onChange}
              className="w-full max-w-full truncate px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium transition-all outline-none hover:border-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/15 shadow-sm"
            >
              {Object.values(ClientType).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Dynamic Client Type Detail Field */}
          <div className="md:col-span-2 p-4 rounded-xl border border-indigo-100/80 bg-indigo-50/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="clientTypeDetail" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ConfigIcon size={15} className="text-indigo-600" />
                {clientTypeConfig.label}
              </label>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${clientTypeConfig.badgeColor}`}>
                {formData.clientType}
              </span>
            </div>

            {isB2B ? (
              isAddingCompany ? (
                <div className="space-y-2 bg-white p-3.5 rounded-xl border border-indigo-200 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                    <span>Add New Company</span>
                    <button type="button" onClick={() => { setIsAddingCompany(false); setNewCompanyInput(''); }} className="text-slate-400 hover:text-slate-600 p-1">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCompanyInput}
                      onChange={(e) => setNewCompanyInput(e.target.value)}
                      placeholder="Enter company name..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveNewCompany();
                        }
                      }}
                      className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white hover:border-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/15 text-sm font-medium text-slate-800 outline-none shadow-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleSaveNewCompany}
                      disabled={!newCompanyInput.trim() || isSavingCompany}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                    >
                      {isSavingCompany ? 'Saving...' : 'Save & Select'}
                    </button>
                    <button type="button" onClick={() => { setIsAddingCompany(false); setNewCompanyInput(''); }} className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    id="clientTypeDetail"
                    name="clientTypeDetail"
                    value={formData.clientTypeDetail || ''}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') setIsAddingCompany(true);
                      else onChange(e);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium text-sm transition-all outline-none hover:border-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/15 shadow-sm"
                  >
                    <option value="">-- Select Company --</option>
                    {companies.map((comp) => (
                      <option key={comp} value={comp}>{comp}</option>
                    ))}
                    {formData.clientTypeDetail && !companies.includes(formData.clientTypeDetail) && (
                      <option value={formData.clientTypeDetail}>{formData.clientTypeDetail} (Custom)</option>
                    )}
                    <option value="__add_new__" className="text-indigo-600 font-bold">➕ + Add New Company...</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsAddingCompany(true)}
                    className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-200 flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Plus size={14} /> Add New
                  </button>
                </div>
              )
            ) : (
              <input
                id="clientTypeDetail"
                name="clientTypeDetail"
                list={formData.clientType === ClientType.SALES ? 'sales-team-datalist' : undefined}
                value={formData.clientTypeDetail || ''}
                onChange={onChange}
                placeholder={clientTypeConfig.placeholder}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium text-sm transition-all outline-none hover:border-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/15 shadow-sm"
              />
            )}
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
              <Info size={13} className="text-indigo-500 flex-shrink-0" />
              {clientTypeConfig.hint}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
