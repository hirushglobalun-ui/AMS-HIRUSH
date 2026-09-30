/**
 * @file EditAttendanceModal.tsx
 * @description React component for rendering EditAttendanceModal UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React from 'react';
import { X, Briefcase, Plus, Trash2, Save } from 'lucide-react';
import { AttendanceRecord } from '../../../types';

interface EditAttendanceModalProps {
    isEditModalOpen: boolean;
    setIsEditModalOpen: (isOpen: boolean) => void;
    editingRecord: AttendanceRecord | null;
    setEditingRecord: (record: AttendanceRecord | null) => void;
    isSaving: boolean;
    handleSaveAttendance: () => void;
    formatHoursToHHMMSS: (hours: number) => string;
}

const EditAttendanceModal: React.FC<EditAttendanceModalProps> = ({
    isEditModalOpen,
    setIsEditModalOpen,
    editingRecord,
    setEditingRecord,
    isSaving,
    handleSaveAttendance,
    formatHoursToHHMMSS
}) => {
    if (!isEditModalOpen || !editingRecord) return null;

    const handleSessionChange = (index: number, field: 'checkIn' | 'checkOut', value: string) => {
        if (!editingRecord) return;
        const updatedSessions = [...editingRecord.sessions];
        updatedSessions[index] = { 
            ...updatedSessions[index], 
            [field]: value,
            autoCheckedOut: false,
            isManuallyEdited: true
        };
        setEditingRecord({ ...editingRecord, sessions: updatedSessions });
    };

    const handleAddSession = () => {
        if (!editingRecord) return;
        setEditingRecord({
            ...editingRecord,
            sessions: [...editingRecord.sessions, { id: Date.now().toString(), checkIn: '', checkOut: '', isManuallyEdited: true, autoCheckedOut: false }]
        });
    };

    const handleRemoveSession = (index: number) => {
        if (!editingRecord) return;
        const updatedSessions = editingRecord.sessions.filter((_, i) => i !== index);
        setEditingRecord({ ...editingRecord, sessions: updatedSessions });
    };

    const calculateTotalHours = (sessions: any[]) => {
        let total = 0;
        sessions.forEach(session => {
            if (session.checkIn && session.checkOut) {
                const start = new Date(`1970-01-01T${session.checkIn}`);
                const end = new Date(`1970-01-01T${session.checkOut}`);
                let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                if (diff < 0) diff += 24;
                if (diff > 0) {
                    const isAuto = !session.isManuallyEdited && (session.autoCheckedOut === true || (session.autoCheckedOut !== false && (session.checkOut === '23:50:00' || session.checkOut === '22:20:00'))) && (session.checkOut === '23:50:00' || session.checkOut === '22:20:00');
                    if (isAuto) {
                        diff = Math.min(diff, 4.0);
                    }
                    total += diff;
                }
            }
        });
        return parseFloat(total.toFixed(2));
    };

    return (
        <div 
            onClick={() => setIsEditModalOpen(false)}
            className="fixed inset-0 bg-transparent flex justify-center items-center z-50 p-4 animate-in fade-in duration-200"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Edit Attendance Record</h3>
                        <p className="text-sm text-slate-500">{editingRecord.date}</p>
                    </div>
                    <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isWFH"
                                checked={editingRecord.isWFH || false}
                                onChange={(e) => setEditingRecord({ ...editingRecord, isWFH: e.target.checked })}
                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="isWFH" className="text-sm font-bold text-slate-700 cursor-pointer flex items-center gap-2">
                                <Briefcase size={16} className="text-indigo-500" />
                                Mark as Work From Home (WFH)
                            </label>
                        </div>
                        {editingRecord.isWFH && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-white px-2 py-1 rounded-md border border-indigo-100">
                                Full Day Credit
                            </span>
                        )}
                    </div>

                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-700">Time Sessions</h4>
                        <button
                            onClick={handleAddSession}
                            disabled={editingRecord.isWFH}
                            className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${editingRecord.isWFH ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100'}`}
                        >
                            <Plus size={16} /> Add Session
                        </button>
                    </div>

                    <div className="space-y-3">
                        {editingRecord.sessions.map((session, index) => (
                            <div key={session.id} className="flex flex-col sm:flex-row gap-4 items-end sm:items-center bg-slate-50 p-4 rounded-xl border border-slate-200 group hover:border-indigo-200 transition-colors">
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Check In</label>
                                    <input
                                        type="time"
                                        step="1"
                                        value={session.checkIn}
                                        onChange={(e) => handleSessionChange(index, 'checkIn', e.target.value)}
                                        className="block w-full max-w-full bg-white border border-slate-300 rounded-lg text-sm px-3 py-2 outline-none hover:border-slate-400 focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-600 transition-all font-mono shadow-sm"
                                    />
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Check Out</label>
                                    <input
                                        type="time"
                                        step="1"
                                        value={session.checkOut || ''}
                                        onChange={(e) => handleSessionChange(index, 'checkOut', e.target.value)}
                                        className="block w-full max-w-full bg-white border border-slate-300 rounded-lg text-sm px-3 py-2 outline-none hover:border-slate-400 focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-600 transition-all font-mono shadow-sm"
                                    />
                                </div>
                                <button
                                    onClick={() => handleRemoveSession(index)}
                                    className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="Remove Session"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        {editingRecord.sessions.length === 0 && (
                            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                <p className="text-slate-400 text-sm">No sessions recorded.</p>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <span className="font-medium text-slate-600">Total Calculated Hours</span>
                            <span className="text-2xl font-bold text-indigo-600 font-mono">
                                {formatHoursToHHMMSS(calculateTotalHours(editingRecord.sessions))}
                            </span>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveAttendance}
                                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditAttendanceModal;
