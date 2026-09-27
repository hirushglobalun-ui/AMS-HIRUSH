/**
 * File: components/shared/DomainManager.tsx
 * Purpose: Top-level Domain & Hosting Health Monitor component with automated audits and alerting.
 * Author: Hirush Global AMS
 */

"use client";

import React, { useState } from 'react';
import { Globe, Clock, RefreshCw, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { CustomDomain } from '../../types';
import { ConsolidatedDomain, DomainFormData } from './DomainManager/types';
import { sendWhatsAppAlert } from './DomainManager/domainUtils';
import { useDomainData } from './DomainManager/useDomainData';
import { DomainStatsCards } from './DomainManager/DomainStatsCards';
import { DomainFilterBar } from './DomainManager/DomainFilterBar';
import { DomainCard } from './DomainManager/DomainCard';
import { DomainModal } from './DomainManager/DomainModal';

const initialForm: DomainFormData = {
  projectName: '',
  domainDetail: '',
  expiryDate: '',
  pocName: '',
  pocEmail: '',
  pocPhone: '',
  remark: '',
};

const DomainManager: React.FC = () => {
  const {
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    consolidatedList,
    filteredList,
    loadData,
    runAudit,
    saveDomain,
    deleteDomain,
  } = useDomainData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<CustomDomain | null>(null);
  const [formData, setFormData] = useState<DomainFormData>(initialForm);

  const openAddModal = () => {
    setEditingDomain(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (domain: ConsolidatedDomain) => {
    setEditingDomain({
      id: domain.id,
      projectName: domain.projectName,
      domainDetail: domain.domainDetail,
      expiryDate: domain.expiryDate,
      pocName: domain.pocName,
      pocEmail: domain.pocEmail,
      pocPhone: domain.pocPhone,
      remark: domain.remark,
    });
    setFormData({
      projectName: domain.projectName,
      domainDetail: domain.domainDetail,
      expiryDate: domain.expiryDate,
      pocName: domain.pocName,
      pocEmail: domain.pocEmail,
      pocPhone: domain.pocPhone,
      remark: domain.remark,
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await saveDomain(formData, editingDomain?.id);
    if (success) setIsModalOpen(false);
  };

  const testEmailAlert = async (domain: ConsolidatedDomain) => {
    const toastId = toast.loading(`Sending email alert for ${domain.projectName}...`);
    try {
      const res = await fetch('/api/send-domain-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: domain.projectName,
          domainDetail: domain.domainDetail,
          expiryDate: domain.expiryDate || 'N/A',
          dnsStatus: domain.dnsStatus || 'Healthy',
          sslStatus: domain.sslStatus || 'Healthy',
          healthError: domain.healthError || '',
          alertReason: 'Manual status check dispatched from Domain Manager',
          toEmail: 'hirushglobalun@gmail.com',
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch email');
      }

      toast.success(`Alert email sent via Nodemailer for ${domain.projectName}!`, { id: toastId });
    } catch (err: any) {
      toast.error(`Failed to send email: ${err?.message || 'Unknown error'}`, { id: toastId });
    }
  };

  const healthIssueCount = consolidatedList.filter(
    (i) => i.dnsStatus === 'Issue Detected' || i.sslStatus === 'Issue Detected'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Globe className="text-indigo-600 animate-spin-slow" size={28} />
            Domain & Hosting Health Monitor
          </h1>
          <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
            <Clock size={14} className="text-indigo-600" />
            <span>Automated Daily Email Audits: <strong className="text-slate-700 dark:text-slate-300">6:30 PM IST</strong> &bull; Recipient: <strong className="text-indigo-600">hirushglobalun@gmail.com</strong></span>
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={loadData}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-all active:scale-95 flex items-center gap-2 text-xs font-bold"
            title="Run Full Audit & Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Run Audits</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-md shadow-indigo-100 text-sm"
          >
            <Plus size={18} />
            Add Domain
          </button>
        </div>
      </div>

      <DomainStatsCards domains={consolidatedList} />

      <DomainFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        totalCount={consolidatedList.length}
        healthIssueCount={healthIssueCount}
      />

      {loading ? (
        <div className="text-center py-20 bg-white/50 backdrop-blur-sm border border-slate-100 dark:border-slate-800 rounded-2xl">
          <Globe size={40} className="text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Syncing domains database...</p>
        </div>
      ) : filteredList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredList.map((domain) => (
            <DomainCard
              key={domain.id}
              domain={domain}
              onAudit={runAudit}
              onWhatsApp={sendWhatsAppAlert}
              onEmail={testEmailAlert}
              onEdit={openEditModal}
              onDelete={deleteDomain}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <Globe size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-600 dark:text-slate-300">No domains found</h3>
          <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or add a new manual domain entry.</p>
          <button
            onClick={openAddModal}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-all active:scale-95 shadow-md shadow-indigo-100"
          >
            Add Manual Domain
          </button>
        </div>
      )}

      <DomainModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        editingDomain={editingDomain}
        formData={formData}
        onChange={handleFormChange}
      />
    </div>
  );
};

export default DomainManager;
