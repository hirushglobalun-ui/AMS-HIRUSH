/**
 * File: components/user/leave/LeaveHistoryTable.tsx
 * Purpose: Table component rendering user leave history with status pills and modification actions.
 * Author: Hirush Global AMS
 */

import React from 'react';
import Card from '../../common/Card';
import { LeaveRequest, LeaveStatus } from '../../../types';
import { Clock, CheckCircle, XCircle, FileText, Trash2, Pencil } from 'lucide-react';
import { formatApplyDate, getLeaveDays } from './leaveUtils';

interface LeaveHistoryTableProps {
  loading: boolean;
  leaveHistory: LeaveRequest[];
  onEditRequest: (req: LeaveRequest) => void;
  onDeleteRequest: (id: string) => void;
}

export const LeaveHistoryTable: React.FC<LeaveHistoryTableProps> = ({
  loading,
  leaveHistory,
  onEditRequest,
  onDeleteRequest,
}) => {
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Request History</h2>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left">
          <thead className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-xs uppercase font-semibold text-slate-500">
            <tr>
              <th className="px-6 py-4">Applied On</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Timeline</th>
              <th className="px-6 py-4 text-center">Duration</th>
              <th className="px-6 py-4">Reason</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center p-8 text-slate-500">
                  Loading history...
                </td>
              </tr>
            ) : leaveHistory.length > 0 ? (
              leaveHistory.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-500 font-medium">{formatApplyDate(req.createdAt)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{req.leaveType}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col text-sm">
                      <span className="font-medium text-slate-800 dark:text-slate-100">{req.startDate}</span>
                      {req.duration !== 'Half Day' && req.startDate !== req.endDate && (
                        <span className="text-xs text-slate-400">to {req.endDate}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {getLeaveDays(req)} Day{getLeaveDays(req) !== 1 ? 's' : ''}
                    </span>
                    {req.duration === 'Half Day' && (
                      <span className="block text-[10px] text-slate-400">({req.halfDayType || 'Morning'})</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300 max-w-[200px] truncate" title={req.reason}>
                      {req.reason}
                    </p>
                    {req.statusReason && (
                      <p className="text-[10px] text-indigo-600 mt-1 font-semibold bg-indigo-50/60 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-100/30 inline-block max-w-[200px] truncate" title={req.statusReason}>
                        Remarks: {req.statusReason}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                        req.status === LeaveStatus.APPROVED
                          ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800'
                          : req.status === LeaveStatus.REJECTED
                          ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800'
                      }`}
                    >
                      {req.status === LeaveStatus.APPROVED && <CheckCircle size={12} />}
                      {req.status === LeaveStatus.REJECTED && <XCircle size={12} />}
                      {req.status === LeaveStatus.PENDING && <Clock size={12} />}
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {req.status === LeaveStatus.PENDING && (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onEditRequest(req)}
                          className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 p-1.5 rounded-lg transition-colors"
                          title="Edit Request"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => onDeleteRequest(req.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 p-1.5 rounded-lg transition-colors"
                          title="Delete Request"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center p-12">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <FileText size={48} className="mb-2 opacity-20" />
                    <p>No leave requests found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
