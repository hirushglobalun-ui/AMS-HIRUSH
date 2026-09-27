/**
 * @file AttendanceCheckIn.tsx
 * @description React component for rendering AttendanceCheckIn UI with Biometric Phone Status.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React from 'react';
import Card from '../../common/Card';
import Button from '../../common/Button';
import { PartyPopper, Calendar, Fingerprint, ShieldCheck, AlertCircle, MapPin, CheckCircle2, RefreshCw, Plus, Home, Clock } from 'lucide-react';
import { Session, Holiday, AttendanceRecord, BiometricDevice } from '../../../types';
import { formatHoursToHHMMSS, calculateTotalHours, getLocalDateString } from './utils';

interface AttendanceCheckInProps {
  currentTime: Date;
  holidays: Holiday[];
  activeSession: Session | null;
  processingAction: 'checkin' | 'checkout' | null;
  todayRecord: AttendanceRecord | null;
  handleCheckIn: () => void;
  handleCheckOut: () => void;
  isBiometricMandatory?: boolean;
  biometricStatus?: 'not_registered' | 'pending_approval' | 'approved' | 'exempted' | 'not_required' | 'not_supported';
  biometricDeviceName?: string;
  biometricDevices?: BiometricDevice[];
  onRegisterSlot?: (slotIndex: number, slotLabel: string) => void;
  registeringBiometric?: boolean;
  wfhStatus?: 'approved' | 'pending' | null;
}

const FINGER_SLOTS = [
  { index: 1, label: 'Finger 1 (Primary / Thumb)', desc: 'Primary finger (Thumb or Index) for everyday attendance' },
  { index: 2, label: 'Finger 2 (Backup Finger)', desc: 'Secondary finger (Index or alternate hand)' },
];

const AttendanceCheckIn: React.FC<AttendanceCheckInProps> = ({
  currentTime,
  holidays,
  activeSession,
  processingAction,
  todayRecord,
  handleCheckIn,
  handleCheckOut,
  isBiometricMandatory = false,
  biometricStatus = 'not_required',
  biometricDeviceName,
  biometricDevices = [],
  onRegisterSlot,
  registeringBiometric = false,
  wfhStatus = null
}) => {
  const getTodayDateString = () => getLocalDateString();
  const todayStr = getTodayDateString();
  const holiday = holidays.find(h => h.date === todayStr);

  const approvedCount = biometricDevices.filter(d => d.status === 'approved').length;
  const pendingCount = biometricDevices.filter(d => d.status === 'pending_approval').length;

  return (
    <Card>
      <h2 className="text-2xl font-bold mb-4">Mark Your Attendance</h2>
      <div className="bg-slate-100 dark:bg-slate-800/60 p-4 rounded-lg text-center space-y-2 border border-slate-200 dark:border-slate-700">
        <p className="text-lg font-medium text-slate-500 dark:text-slate-400">{currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p className="text-4xl sm:text-5xl font-bold text-primary">{currentTime.toLocaleTimeString('en-US')}</p>
      </div>

      {/* WFH Status Banners */}
      {wfhStatus === 'approved' && (
        <div className="mt-4 p-3.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
              <Home size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">
                Work From Home (WFH) Active
              </span>
              <span className="text-[11px] text-blue-700 dark:text-blue-400">
                WFH approved for today. You can check in and out from home using phone biometric.
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-wider uppercase bg-blue-100 dark:bg-blue-900/80 text-blue-800 dark:text-blue-300 px-2.5 py-1 rounded-full shrink-0">
            WFH Approved
          </span>
        </div>
      )}

      {wfhStatus === 'pending' && (
        <div className="mt-4 p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                WFH Request Pending Approval
              </span>
              <span className="text-[11px] text-amber-700 dark:text-amber-400">
                You can check in from home now. Working hours will be officially credited once HR approves.
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-wider uppercase bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-full shrink-0">
            Pending HR
          </span>
        </div>
      )}

      {/* Exemption Banner */}
      {biometricStatus === 'exempted' && (
        <div className="mt-4 p-3.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
              <MapPin size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">
                Location-Only Attendance Active
              </span>
              <span className="text-[11px] text-blue-700 dark:text-blue-400">
                You are exempted from phone fingerprint scan by Admin/HR. Check in and out normally using Office GPS location.
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-wider uppercase bg-blue-100 dark:bg-blue-900/80 text-blue-800 dark:text-blue-300 px-2.5 py-1 rounded-full shrink-0">
            Exempted
          </span>
        </div>
      )}

      {/* Multi-Finger Biometric Enrollment Hub */}
      {biometricStatus !== 'exempted' && (
        <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
                <Fingerprint size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  Phone Biometrics
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {approvedCount} of 2 Verified
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Register 2 fingers (Primary + Backup). Admin verifies each finger. Any approved finger can mark attendance.
                </p>
              </div>
            </div>

            {/* Overall status badge */}
            <div className="shrink-0">
              {approvedCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-2.5 py-1 rounded-lg">
                  <ShieldCheck size={14} /> Ready for Attendance
                </span>
              ) : pendingCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-2.5 py-1 rounded-lg animate-pulse">
                  <AlertCircle size={14} /> Waiting Admin Approval
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2.5 py-1 rounded-lg">
                  Not Enrolled
                </span>
              )}
            </div>
          </div>

          {/* 2 Finger Slots Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {FINGER_SLOTS.map(slot => {
              // Find matching device by slotIndex or slotLabel
              const device = biometricDevices.find(d => 
                d.slotIndex === slot.index || 
                (d.slotLabel && d.slotLabel.toLowerCase().includes(slot.index === 1 ? 'thumb' : 'backup'))
              );

              const isApproved = device?.status === 'approved';
              const isPending = device?.status === 'pending_approval';
              const isRejected = device?.status === 'rejected';

              return (
                <div 
                  key={slot.index}
                  className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                    isApproved
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 shadow-sm'
                      : isPending
                      ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/80'
                      : isRejected
                      ? 'bg-red-50/60 dark:bg-red-950/30 border-red-200 dark:border-red-800/80'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {slot.label}
                      </span>
                      {isApproved ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                          <CheckCircle2 size={10} /> Active
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">
                          Pending
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/60 px-1.5 py-0.5 rounded">
                          Rejected
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                          Empty
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {device ? (
                        <span className="truncate block font-medium">
                          {device.deviceName}
                        </span>
                      ) : (
                        slot.desc
                      )}
                    </p>
                  </div>

                  <div className="pt-1">
                    {device ? (
                      <button
                        onClick={() => onRegisterSlot && onRegisterSlot(slot.index, slot.label)}
                        disabled={registeringBiometric}
                        className="w-full py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 active:scale-95 disabled:opacity-50"
                        title="Re-scan and update this finger"
                      >
                        <RefreshCw size={11} className={registeringBiometric ? "animate-spin" : ""} />
                        Re-scan Finger
                      </button>
                    ) : (
                      <button
                        onClick={() => onRegisterSlot && onRegisterSlot(slot.index, slot.label)}
                        disabled={registeringBiometric}
                        className="w-full py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm active:scale-95 disabled:opacity-50"
                      >
                        <Plus size={12} />
                        {registeringBiometric ? 'Scanning...' : `Register Finger`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {holiday ? (
        <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-4 animate-pulse">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <PartyPopper size={24} />
          </div>
          <div>
            <p className="text-sm font-black text-indigo-900 uppercase tracking-wide">Holiday: {holiday.name}</p>
            <p className="text-xs text-indigo-600 font-medium">{holiday.description || 'Enjoy your well-deserved holiday!'}</p>
          </div>
        </div>
      ) : new Date().getDay() === 0 ? (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm font-black text-blue-900 uppercase tracking-wide">Weekly Holiday (Sunday)</p>
            <p className="text-xs text-blue-600 font-medium">Recharge today! No attendance is required.</p>
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button onClick={handleCheckIn} disabled={!!activeSession || !!processingAction} className="py-3 px-6 text-lg w-full sm:w-auto flex items-center justify-center gap-2">
          <Fingerprint size={20} />
          <span>{processingAction === 'checkin' ? "Verifying..." : "Check In"}</span>
        </Button>
        <Button onClick={handleCheckOut} disabled={!activeSession || !!processingAction} variant="secondary" className="py-3 px-6 text-lg w-full sm:w-auto !bg-orange-500 hover:!bg-orange-600 !text-white !border-orange-600 flex items-center justify-center gap-2">
          <Fingerprint size={20} />
          <span>{processingAction === 'checkout' ? "Verifying..." : "Check Out"}</span>
        </Button>
      </div>
      {todayRecord && todayRecord.sessions.length > 0 && (
        <div className="mt-6 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 p-4 rounded-lg">
          <h3 className="font-semibold text-lg text-teal-900 dark:text-teal-200 text-center">Today's Sessions</h3>
          <ul className="mt-2 space-y-2">
            {todayRecord.sessions.map((session, index) => (
              <li key={session.id} className="text-teal-800 dark:text-teal-300 flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center bg-white dark:bg-slate-800 p-2.5 rounded-md border border-teal-100 dark:border-teal-900 gap-1 sm:gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Session {index + 1}:</span>
                  {session.biometricVerified && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded" title="Thumb Scan Verified">
                      <Fingerprint size={12} /> Verified
                    </span>
                  )}
                </div>
                <div>
                  <span>Check In: <span className="font-bold">{session.checkIn}</span></span>
                  <span className="mx-2 text-slate-400">|</span>
                  <span>Check Out: <span className="font-bold">{session.checkOut || (session.id === activeSession?.id ? 'Active' : 'N/A')}</span></span>
                </div>
              </li>
            ))}
          </ul>
          {calculateTotalHours(todayRecord.date, todayRecord.sessions) > 0 && (
            <p className="mt-4 text-teal-800 dark:text-teal-200 font-bold text-lg text-center">
              Total Hours Today: {formatHoursToHHMMSS(calculateTotalHours(todayRecord.date, todayRecord.sessions))}
            </p>
          )}
        </div>
      )}
    </Card>
  );
};

export default AttendanceCheckIn;
