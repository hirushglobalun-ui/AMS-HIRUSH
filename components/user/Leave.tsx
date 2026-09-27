/**
 * File: components/user/Leave.tsx
 * Purpose: Top-level User Leave request page with monthly quotas, application form, and history table.
 * Module: components/user
 * Author: Hirush Global AMS
 */

"use client";

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLeaveData } from './leave/useLeaveData';
import { LeaveQuotaSummaryCards } from './leave/LeaveQuotaSummaryCards';
import { LeaveApplyForm } from './leave/LeaveApplyForm';
import { LeaveHistoryTable } from './leave/LeaveHistoryTable';

const Leave: React.FC = () => {
  const { user } = useAuth();
  const {
    leaveHistory,
    loading,
    duration,
    setDuration,
    halfDayType,
    setHalfDayType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    leaveType,
    setLeaveType,
    reason,
    setReason,
    editingLeaveId,
    submitting,
    firstDayOfMonth,
    quotaStats,
    stats,
    handleEditRequest,
    cancelEdit,
    handleSubmit,
    handleDeleteRequest,
  } = useLeaveData(user);

  return (
    <div className="space-y-6">
      <LeaveQuotaSummaryCards quotaStats={quotaStats} stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <LeaveApplyForm
            editingLeaveId={editingLeaveId}
            duration={duration}
            setDuration={setDuration}
            halfDayType={halfDayType}
            setHalfDayType={setHalfDayType}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            leaveType={leaveType}
            setLeaveType={setLeaveType}
            reason={reason}
            setReason={setReason}
            submitting={submitting}
            onSubmit={handleSubmit}
            onCancelEdit={cancelEdit}
            firstDayOfMonth={firstDayOfMonth}
          />
        </div>

        <div className="lg:col-span-2">
          <LeaveHistoryTable
            loading={loading}
            leaveHistory={leaveHistory}
            onEditRequest={handleEditRequest}
            onDeleteRequest={handleDeleteRequest}
          />
        </div>
      </div>
    </div>
  );
};

export default Leave;