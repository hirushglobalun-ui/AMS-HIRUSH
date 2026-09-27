/**
 * @file LeaveDetailModal.tsx
 * @description React component for rendering LeaveDetailModal UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Calendar } from 'lucide-react';
import { LeaveStatus } from '../../../types';
import { formatApplyDate, getLeaveDays } from './utils';

interface LeaveDetailModalProps {
    selectedRequest: any;
    setSelectedRequest: (req: any) => void;
    setStatusAction: (action: { id: string; status: LeaveStatus; employeeName: string } | null) => void;
    setStatusReasonText: (text: string) => void;
}

const LeaveDetailModal: React.FC<LeaveDetailModalProps> = ({
    selectedRequest,
    setSelectedRequest,
    setStatusAction,
    setStatusReasonText
}) => {
    if (!selectedRequest) return null;

    return createPortal(
        <div 
            onClick={() => setSelectedRequest(null)}
            className="fixed inset-0 bg-transparent z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Email Header */}
                <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg border-2 border-white shadow-sm">
                            {selectedRequest.userName.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">{selectedRequest.userName}</h3>
                            <p className="text-sm text-slate-500 flex items-center gap-1.5">
                                <Mail size={14} /> {selectedRequest.userEmail}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSelectedRequest(null)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Email Content */}
                <div className="p-8 flex-1 overflow-y-auto">
                    <div className="space-y-6">
                        <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</p>
                                <h2 className="text-xl font-bold text-slate-800">Leave Request: {selectedRequest.leaveType}</h2>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${selectedRequest.status === LeaveStatus.APPROVED ? 'bg-green-50 text-green-600 border-green-100' :
                                selectedRequest.status === LeaveStatus.REJECTED ? 'bg-red-50 text-red-600 border-red-100' :
                                    'bg-yellow-50 text-yellow-600 border-yellow-100'
                                }`}>
                                {selectedRequest.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">From Date</p>
                                <div className="flex items-center gap-2 text-slate-700 font-medium">
                                    <Calendar size={18} className="text-indigo-500" />
                                    {selectedRequest.startDate}
                                </div>
                            </div>
                            {selectedRequest.duration !== 'Half Day' ? (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">To Date</p>
                                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                                        <Calendar size={18} className="text-indigo-500" />
                                        {selectedRequest.endDate}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 opacity-50">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">To Date</p>
                                    <div className="text-slate-500 text-sm font-medium">
                                        N/A (Half Day)
                                    </div>
                                </div>
                            )}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Applied On</p>
                                <div className="flex items-center gap-2 text-slate-700 font-medium">
                                    <Calendar size={18} className="text-indigo-500" />
                                    {formatApplyDate(selectedRequest.createdAt)}
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 col-span-1">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Duration</p>
                                <div className="flex flex-col text-slate-700 font-bold">
                                    <span>{getLeaveDays(selectedRequest)} Day{getLeaveDays(selectedRequest) !== 1 ? 's' : ''}</span>
                                    {selectedRequest.duration === 'Half Day' && (
                                        <span className="text-xs font-medium text-slate-500">({selectedRequest.halfDayType || 'Morning'})</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reason</p>
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                                {selectedRequest.reason}
                            </div>
                        </div>

                        {selectedRequest.statusReason && (
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">HR/Admin Remarks</p>
                                <div className="bg-indigo-50/30 p-6 rounded-xl border border-indigo-100/50 text-indigo-900 leading-relaxed whitespace-pre-wrap text-sm font-medium">
                                    {selectedRequest.statusReason}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer Actions */}
                {selectedRequest.status === LeaveStatus.PENDING && (
                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
                        <button
                            onClick={() => {
                                setStatusAction({ id: selectedRequest.id, status: LeaveStatus.REJECTED, employeeName: selectedRequest.userName });
                                setStatusReasonText('');
                                setSelectedRequest(null);
                            }}
                            className="px-6 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors shadow-sm text-sm"
                        >
                            Reject Request
                        </button>
                        <button
                            onClick={() => {
                                setStatusAction({ id: selectedRequest.id, status: LeaveStatus.APPROVED, employeeName: selectedRequest.userName });
                                setStatusReasonText('');
                                setSelectedRequest(null);
                            }}
                            className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 text-sm"
                        >
                            Approve Request
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default LeaveDetailModal;
