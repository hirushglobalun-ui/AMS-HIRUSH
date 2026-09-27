/**
 * @file AttendanceDetailModal.tsx
 * @description React component for rendering AttendanceDetailModal UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React from 'react';
import Modal from '../../common/Modal';
import { Clock } from 'lucide-react';

interface AttendanceDetailModalProps {
    selectedDetailRecord: any;
    setSelectedDetailRecord: (record: any) => void;
    filterDate: string;
    formatHoursToHHMMSS: (hours: number) => string;
}

const AttendanceDetailModal: React.FC<AttendanceDetailModalProps> = ({
    selectedDetailRecord,
    setSelectedDetailRecord,
    filterDate,
    formatHoursToHHMMSS
}) => {
    return (
        <Modal
            isOpen={!!selectedDetailRecord}
            onClose={() => setSelectedDetailRecord(null)}
            title={`Details: ${selectedDetailRecord?.userName}`}
        >
            <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                        {selectedDetailRecord?.userName?.charAt(0)}
                    </div>
                    <div>
                        <p className="font-bold text-slate-800">{selectedDetailRecord?.userName}</p>
                        <p className="text-sm text-slate-500">{selectedDetailRecord?.department} • {filterDate}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Total Hours</p>
                        <p className="text-lg font-black text-indigo-600">{formatHoursToHHMMSS(selectedDetailRecord?.totalHours || 0)}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Status</p>
                        <p className="text-sm font-bold text-slate-700">
                            {(() => {
                                const isAuto = selectedDetailRecord?.sessions?.some((s: any) => 
                                    !s.isManuallyEdited && (s.autoCheckedOut === true || (s.autoCheckedOut !== false && (s.checkOut === '23:50:00' || s.checkOut === '22:20:00'))) && (s.checkOut === '23:50:00' || s.checkOut === '22:20:00')
                                );
                                if (selectedDetailRecord?.isWFH) return 'Work From Home';
                                if (isAuto) return 'Half Day (Auto Checkout)';
                                if (selectedDetailRecord?.totalHours >= 7) return selectedDetailRecord?.totalHours > 7 ? 'Full Day + OT' : 'Full Day';
                                if (selectedDetailRecord?.totalHours >= 4) return 'Half Day';
                                return 'Absent (< 4 hrs)';
                            })()}
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={16} /> Session Logs
                    </h4>
                    {selectedDetailRecord?.sessions && selectedDetailRecord.sessions.length > 0 ? (
                        <div className="space-y-2">
                            {selectedDetailRecord.sessions.map((session: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-400">Session {idx + 1}</span>
                                        {!session.isManuallyEdited && (session.autoCheckedOut === true || (session.autoCheckedOut !== false && (session.checkOut === '23:50:00' || session.checkOut === '22:20:00'))) && (session.checkOut === '23:50:00' || session.checkOut === '22:20:00') && (
                                            <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                                Auto Checked-Out
                                            </span>
                                        )}
                                        {session.isManuallyEdited && (
                                            <span className="inline-flex items-center text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                                                Edited
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 font-mono text-sm">
                                        <span className="text-emerald-600 font-bold">{session.checkIn}</span>
                                        <span className="text-slate-300">→</span>
                                        <span className="text-slate-600 font-bold">{session.checkOut || 'Active'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-100 text-slate-400 italic text-sm">
                            No sessions recorded for this day.
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setSelectedDetailRecord(null)}
                    className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all"
                >
                    Close
                </button>
            </div>
        </Modal>
    );
};

export default AttendanceDetailModal;
