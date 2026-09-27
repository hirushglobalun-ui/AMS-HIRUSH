/**
 * @file LeaveActionModal.tsx
 * @description React component for rendering LeaveActionModal UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { LeaveStatus } from '../../../types';

interface LeaveActionModalProps {
    statusAction: { id: string; status: LeaveStatus; employeeName: string } | null;
    setStatusAction: (action: { id: string; status: LeaveStatus; employeeName: string } | null) => void;
    statusReasonText: string;
    setStatusReasonText: (text: string) => void;
    handleStatusChange: (id: string, newStatus: LeaveStatus, reason?: string) => void;
}

const LeaveActionModal: React.FC<LeaveActionModalProps> = ({
    statusAction,
    setStatusAction,
    statusReasonText,
    setStatusReasonText,
    handleStatusChange
}) => {
    if (!statusAction) return null;

    return createPortal(
        <div 
            onClick={() => setStatusAction(null)}
            className="fixed inset-0 bg-transparent z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col transform transition-all scale-100"
            >
                {/* Header */}
                <div className={`p-6 border-b border-slate-100 flex justify-between items-center ${
                    statusAction.status === LeaveStatus.APPROVED ? 'bg-green-50/50' : 'bg-red-50/50'
                }`}>
                    <h3 className={`text-lg font-bold ${
                        statusAction.status === LeaveStatus.APPROVED ? 'text-green-800' : 'text-red-800'
                    }`}>
                        {statusAction.status === LeaveStatus.APPROVED ? 'Approve Leave Request' : 'Reject Leave Request'}
                    </h3>
                    <button
                        onClick={() => setStatusAction(null)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Are you sure you want to <span className="font-bold">{statusAction.status.toLowerCase()}</span> the leave request for <span className="font-bold text-slate-800">{statusAction.employeeName}</span>?
                    </p>

                    <div className="space-y-1.5">
                        <label htmlFor="statusReason" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Reason / Remarks (Optional)
                        </label>
                        <textarea
                            id="statusReason"
                            rows={3}
                            value={statusReasonText}
                            onChange={(e) => setStatusReasonText(e.target.value)}
                            placeholder={statusAction.status === LeaveStatus.APPROVED ? "Enter any comments (e.g., coverage arranged)..." : "Enter reason for rejection (e.g., high project load)..."}
                            className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none placeholder-slate-400"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-3 justify-end">
                    <button
                        onClick={() => setStatusAction(null)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            handleStatusChange(statusAction.id, statusAction.status, statusReasonText);
                            setStatusAction(null);
                        }}
                        className={`px-5 py-2 text-white font-bold rounded-xl transition-all shadow-md text-sm ${
                            statusAction.status === LeaveStatus.APPROVED 
                                ? 'bg-green-600 hover:bg-green-700 shadow-green-200' 
                                : 'bg-red-600 hover:bg-red-700 shadow-red-200'
                        }`}
                    >
                        Confirm {statusAction.status === LeaveStatus.APPROVED ? 'Approval' : 'Rejection'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default LeaveActionModal;
