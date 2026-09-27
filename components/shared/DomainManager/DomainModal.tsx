/**
 * File: components/shared/DomainManager/DomainModal.tsx
 * Purpose: Form modal to add a new custom domain or edit existing details.
 * Author: Hirush Global AMS
 */

import React from 'react';
import Modal from '../../common/Modal';
import FormInput from '../../common/FormInput';
import { CustomDomain } from '../../../types';
import { DomainFormData } from './types';

interface DomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingDomain: CustomDomain | null;
  formData: DomainFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const DomainModal: React.FC<DomainModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingDomain,
  formData,
  onChange,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingDomain ? `Edit Domain: ${editingDomain.projectName}` : 'Add New Custom Domain'}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormInput
          label="Project Name *"
          name="projectName"
          value={formData.projectName}
          onChange={onChange}
          placeholder="e.g. Acme Website Hosting"
          required
        />

        <FormInput
          label="Domain URL / IP *"
          name="domainDetail"
          value={formData.domainDetail}
          onChange={onChange}
          placeholder="e.g. www.acme.com"
          required
        />

        <FormInput
          label="Expiry Date *"
          name="expiryDate"
          type="date"
          value={formData.expiryDate}
          onChange={onChange}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
          <FormInput
            label="POC Name"
            name="pocName"
            value={formData.pocName}
            onChange={onChange}
            placeholder="John Doe"
          />
          <FormInput
            label="POC Phone"
            name="pocPhone"
            value={formData.pocPhone}
            onChange={onChange}
            placeholder="+91 9988776655"
          />
        </div>

        <FormInput
          label="POC Email"
          name="pocEmail"
          type="email"
          value={formData.pocEmail}
          onChange={onChange}
          placeholder="john@company.com"
        />

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Remarks
          </label>
          <textarea
            name="remark"
            rows={3}
            value={formData.remark}
            onChange={onChange}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-indigo-500 transition-all outline-none font-medium text-slate-700 text-sm resize-none"
            placeholder="Add server hosting details, panel URLs or notes..."
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-50 pt-4 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all active:scale-95 shadow-md shadow-indigo-100"
          >
            {editingDomain ? 'Save Changes' : 'Create Domain'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
