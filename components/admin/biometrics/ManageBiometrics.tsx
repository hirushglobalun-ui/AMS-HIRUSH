/**
 * File: components/admin/biometrics/ManageBiometrics.tsx
 * Purpose: Dedicated Admin & HR panel for managing employee biometric fingerprints, approvals, and attendance modes.
 * Module: components/admin/biometrics
 * Author: Hirush Global AMS
 */

"use client";

import React from 'react';
import Button from '../../common/Button';
import { Fingerprint, RefreshCw } from 'lucide-react';
import { BiometricModeCard } from './BiometricModeCard';
import { BiometricStatsCards } from './BiometricStatsCards';
import { BiometricFilterBar } from './BiometricFilterBar';
import { BiometricUserRow } from './BiometricUserRow';
import { useBiometricsData, getUserBiometricDevices } from './useBiometricsData';

const ManageBiometrics: React.FC = () => {
  const {
    loading,
    savingSettings,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    biometricSettings,
    setBiometricSettings,
    handleSaveSettings,
    handleApprove,
    handleReject,
    handleDeleteDevice,
    handleReset,
    handleToggleExemption,
    filteredUsers,
    stats,
  } = useBiometricsData();

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="animate-spin text-primary" size={28} />
        <span>Loading biometric dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Fingerprint size={24} />
            </div>
            Biometric Authentication Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Control company-wide check-in modes, review employee thumbprint registrations, and manage device approvals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="py-2 px-5 text-sm font-bold shadow-md"
          >
            {savingSettings ? 'Saving Settings...' : 'Save Mode Setting'}
          </Button>
        </div>
      </div>

      {/* Attendance Mode Configuration Card */}
      <BiometricModeCard settings={biometricSettings} onChange={setBiometricSettings} />

      {/* Statistics Cards */}
      <BiometricStatsCards stats={stats} onFilterChange={setStatusFilter} />

      {/* Search & Filter Bar */}
      <BiometricFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onFilterChange={setStatusFilter}
        stats={stats}
      />

      {/* Employee Biometric Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Department & Role</th>
                <th className="px-6 py-4">Registered Fingerprints & Devices</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Fingerprint className="mx-auto mb-2 text-slate-300" size={36} />
                    No employee records found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <BiometricUserRow
                    key={u.id}
                    user={u}
                    devices={getUserBiometricDevices(u)}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onDeleteDevice={handleDeleteDevice}
                    onReset={handleReset}
                    onToggleExemption={handleToggleExemption}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageBiometrics;
