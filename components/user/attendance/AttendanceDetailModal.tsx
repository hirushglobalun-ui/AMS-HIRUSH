/**
 * @file AttendanceDetailModal.tsx
 * @description React component for rendering AttendanceDetailModal UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React from 'react';
import Modal from '../../common/Modal';
import { Briefcase, Clock, Calendar, XCircle } from 'lucide-react';
import { formatHoursToHHMMSS } from './utils';

interface AttendanceDetailModalProps {
  selectedDay: any;
  onClose: () => void;
}

const AttendanceDetailModal: React.FC<AttendanceDetailModalProps> = ({ selectedDay, onClose }) => {
  return (
    <Modal
      isOpen={!!selectedDay}
      onClose={onClose}
      title={`Attendance Details: ${selectedDay?.date}`}
    >
      <div className="space-y-6">
        {selectedDay?.statusData && (
          <div className={`p-4 rounded-xl border ${
            selectedDay.statusData.isWFH ? 'bg-blue-50 border-blue-100 text-blue-700' :
            selectedDay.statusData.status === 'present' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
            'bg-blue-50 border-blue-100 text-blue-700'
          }`}>
            <div className="flex items-center gap-2 font-bold mb-1">
              <Briefcase size={18} />
              Status: {(() => {
                const hours = selectedDay.record?.totalHours || 0;
                const isAuto = selectedDay.record?.sessions?.some((s: any) => 
                  !s.isManuallyEdited && (s.autoCheckedOut === true || (s.autoCheckedOut !== false && (s.checkOut === '23:50:00' || s.checkOut === '22:20:00'))) && (s.checkOut === '23:50:00' || s.checkOut === '22:20:00')
                );
                if (selectedDay.statusData.isWFH) return 'Work From Home';
                if (selectedDay.statusData.status !== 'present') {
                  return selectedDay.statusData.duration === 'Half Day' 
                    ? `On Half-Day Leave (${selectedDay.statusData.halfDayType || 'Morning'})` 
                    : 'On Leave (Full Day)';
                }
                if (isAuto) return 'Half Day (Auto Checkout)';
                if (hours >= 7) return hours > 7 ? 'Full Day + OT' : 'Full Day';
                if (hours >= 4) return 'Half Day';
                return 'Absent (< 4h)';
              })()}
            </div>
            {selectedDay.statusData.leaveType && (
              <p className="text-sm opacity-80 flex items-center gap-2">
                Leave Type: {selectedDay.statusData.leaveType}
                {selectedDay.statusData.onLeaveButWorked && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                    Worked
                  </span>
                )}
              </p>
            )}
          </div>
        )}

        {selectedDay?.record ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-700 flex items-center gap-2">
                <Clock size={18} className="text-indigo-500" />
                Time Logs
              </h4>
              <span className="text-lg font-black text-indigo-600">
                Total: {formatHoursToHHMMSS(selectedDay.record.totalHours)}
              </span>
            </div>
            
            <div className="space-y-2">
              {selectedDay.record.sessions.map((session: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Session {idx + 1}</span>
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
          </div>
        ) : !selectedDay?.isWeekend && !selectedDay?.isHoliday && !selectedDay?.statusData ? (
          <div className="p-10 text-center bg-rose-50 rounded-2xl border border-rose-100 text-rose-600">
            <XCircle size={48} className="mx-auto mb-3 opacity-20" />
            <p className="font-bold">Absent</p>
            <p className="text-sm opacity-70">No attendance record found for this working day.</p>
          </div>
        ) : (
          <div className="p-10 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-500">
            <Calendar size={48} className="mx-auto mb-3 opacity-20" />
            <p className="font-bold">
              {selectedDay?.isWeekend ? 'Weekly Holiday' : selectedDay?.isHoliday ? `Holiday: ${selectedDay.isHoliday.name}` : 'No Records'}
            </p>
            <p className="text-sm opacity-70">No activity recorded for this day.</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default AttendanceDetailModal;
