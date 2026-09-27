/**
 * File: components/shared/ManageAttendance/index.tsx
 * Purpose: Top-level Admin & HR Attendance Management Dashboard.
 * Module: components/shared/ManageAttendance
 * Author: Hirush Global AMS
 */

"use client";

import React from 'react';
import { Download, FileText } from 'lucide-react';
import AttendanceTable from './AttendanceTable';
import EditAttendanceModal from './EditAttendanceModal';
import AttendanceDetailModal from './AttendanceDetailModal';
import { AttendanceOverviewCards } from './AttendanceOverviewCards';
import { useManageAttendanceData } from './useManageAttendanceData';
import { formatHoursToHHMMSS } from './utils';

const ManageAttendance: React.FC = () => {
  const {
    filterDate,
    setFilterDate,
    searchTerm,
    setSearchTerm,
    expandedRecordId,
    setExpandedRecordId,
    filteredAttendance,
    loading,
    holidays,
    selectedDetailRecord,
    setSelectedDetailRecord,
    hasMore,
    handleLoadMore,
    stats,
    isEditModalOpen,
    setIsEditModalOpen,
    editingRecord,
    setEditingRecord,
    isSaving,
    handleEditClick,
    handleSaveAttendance,
    handleExportDaily,
    handleExportMonthly,
  } = useManageAttendanceData();

  const handleToggleDetails = (recordId: string) => {
    setExpandedRecordId((currentId) => (currentId === recordId ? null : recordId));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Attendance Overview</h1>
          <p className="text-slate-500">Monitor employee check-ins and working hours</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportDaily}
            className="flex-1 sm:flex-initial justify-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 hover:text-indigo-600 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2 text-sm"
          >
            <Download size={18} /> Daily Export
          </button>
          <button
            onClick={handleExportMonthly}
            className="flex-1 sm:flex-initial justify-center px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 text-sm"
          >
            <FileText size={18} /> Monthly Report
          </button>
        </div>
      </div>

      <AttendanceOverviewCards stats={stats} />

      <AttendanceTable
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterDate={filterDate}
        setFilterDate={setFilterDate}
        filteredAttendance={filteredAttendance}
        loading={loading}
        holidays={holidays}
        expandedRecordId={expandedRecordId}
        handleToggleDetails={handleToggleDetails}
        handleEditClick={handleEditClick}
        setSelectedDetailRecord={setSelectedDetailRecord}
        hasMore={hasMore}
        handleLoadMore={handleLoadMore}
        formatHoursToHHMMSS={formatHoursToHHMMSS}
      />

      <EditAttendanceModal
        isEditModalOpen={isEditModalOpen}
        setIsEditModalOpen={setIsEditModalOpen}
        editingRecord={editingRecord}
        setEditingRecord={setEditingRecord}
        isSaving={isSaving}
        handleSaveAttendance={handleSaveAttendance}
        formatHoursToHHMMSS={formatHoursToHHMMSS}
      />

      <AttendanceDetailModal
        selectedDetailRecord={selectedDetailRecord}
        setSelectedDetailRecord={setSelectedDetailRecord}
        filterDate={filterDate}
        formatHoursToHHMMSS={formatHoursToHHMMSS}
      />
    </div>
  );
};

export default ManageAttendance;