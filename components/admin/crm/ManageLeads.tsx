/**
 * File: components/admin/crm/ManageLeads.tsx
 * Purpose: Enterprise Lead Management component with categorization, pipeline filters, calendar, and imports.
 * Author: Hirush Global AMS
 */

"use client";

import React from 'react';
import { Search, Download, UploadCloud, Plus } from 'lucide-react';
import { LeadCategory, Lead } from '../../../types';
import { bulkAddLeads } from '../../../services/crmService';
import { LeadFormModal } from './LeadFormModal';
import { LeadDetailView } from './LeadDetailView';
import { GlobalLeadCalendar } from './GlobalLeadCalendar';
import { ImportLeadsModal } from './ImportLeadsModal';
import { LeadStatsCards } from './LeadStatsCards';
import { LeadCategoryTabs } from './LeadCategoryTabs';
import { LeadTable } from './LeadTable';
import { useManageLeadsData } from './useManageLeadsData';

export const ManageLeads: React.FC = () => {
  const {
    leads,
    usersMap,
    activitiesMap,
    loading,
    searchTerm,
    setSearchTerm,
    filters,
    handleFilterChange,
    isFormOpen,
    setIsFormOpen,
    isDetailOpen,
    setIsDetailOpen,
    isImportOpen,
    setIsImportOpen,
    activeCategoryTab,
    setActiveCategoryTab,
    activeTab,
    setActiveTab,
    selectedLead,
    setSelectedLead,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    paginatedLeads,
    filteredLeads,
    availableCompanyOptions,
    stats,
    loadLeads,
    handleFormSubmit,
    handleDelete,
    handleExportLeads,
  } = useManageLeadsData();

  const handleAddClick = () => {
    setSelectedLead(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsFormOpen(true);
  };

  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailOpen(true);
  };

  const autoSlNo = `LEAD-${String(leads.length + 1).padStart(3, '0')}`;

  if (isDetailOpen && selectedLead) {
    return (
      <LeadDetailView
        lead={selectedLead}
        onBack={() => {
          setIsDetailOpen(false);
          setSelectedLead(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Lead Management</h2>

        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Global search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm text-slate-800 dark:text-slate-100"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportLeads}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200 font-bold active:scale-95 text-xs sm:text-sm"
              title="Export Leads to CSV"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
            <button
              onClick={() => setIsImportOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-2.5 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-colors shadow-md shadow-sky-200 font-bold active:scale-95 text-xs sm:text-sm"
              title="Import Leads from CSV"
            >
              <UploadCloud size={16} />
              <span>Import</span>
            </button>
            <button
              onClick={handleAddClick}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 sm:px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 font-bold active:scale-95 text-xs sm:text-sm"
            >
              <Plus size={16} />
              <span>Add Lead</span>
            </button>
          </div>
        </div>
      </div>

      <LeadCategoryTabs
        activeCategoryTab={activeCategoryTab}
        onCategoryChange={setActiveCategoryTab}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        leads={leads}
      />

      <LeadStatsCards stats={stats} />

      {activeTab === 'list' ? (
        <LeadTable
          loading={loading}
          filteredLeads={filteredLeads}
          paginatedLeads={paginatedLeads}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          filters={filters}
          onFilterChange={handleFilterChange}
          availableCompanyOptions={availableCompanyOptions}
          usersMap={usersMap}
          activitiesMap={activitiesMap}
          onViewDetails={handleViewDetails}
          onEdit={handleEditClick}
          onDelete={handleDelete}
          onPageChange={setCurrentPage}
        />
      ) : (
        <GlobalLeadCalendar leads={leads} onEventClick={handleViewDetails} />
      )}

      <LeadFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedLead}
        autoGeneratedSlNo={autoSlNo}
        defaultCategory={activeCategoryTab === 'ALL' ? LeadCategory.COMPANY : activeCategoryTab}
      />

      <ImportLeadsModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={loadLeads}
        bulkAddLeads={bulkAddLeads}
        defaultCategory={activeCategoryTab === 'ALL' ? LeadCategory.COMPANY : activeCategoryTab}
      />
    </div>
  );
};

export default ManageLeads;
