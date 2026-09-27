/**
 * @file HomeAttendanceWidget.tsx
 * @description React component for rendering HomeAttendanceWidget UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React from 'react';
import { Play, Square, Clock, TrendingUp, CheckCircle, Fingerprint, MapPin } from 'lucide-react';
import { formatHoursToHHMMSS } from '../attendance/utils';
import { Session } from '../../../types';

interface HomeAttendanceWidgetProps {
  currentTime: Date;
  activeSession: Session | null;
  processingAction: string | null;
  handleAction: (type: 'checkin' | 'checkout') => void;
  getLiveTodayHours: () => number;
  monthlyAvg: string;
  fullDaysCount: number;
  halfDaysCount: number;
  isBiometricRequired?: boolean;
  biometricStatus?: 'approved' | 'pending_approval' | 'exempted' | 'not_registered';
}

const HomeAttendanceWidget: React.FC<HomeAttendanceWidgetProps> = ({
  currentTime,
  activeSession,
  processingAction,
  handleAction,
  getLiveTodayHours,
  monthlyAvg,
  fullDaysCount,
  halfDaysCount,
  isBiometricRequired,
  biometricStatus
}) => {
  return (
    <div className="lg:col-span-5 flex flex-col gap-6">
      <div className="bg-gradient-to-br from-indigo-50 to-white rounded-3xl p-6 border border-white shadow-xl shadow-indigo-100/50 flex flex-col items-center justify-center text-center relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-indigo-300"></div>

        {/* Clock Visual */}
        <div className="relative mb-6">
          <div className="w-40 h-40 rounded-full border-4 border-slate-100 flex items-center justify-center shadow-inner bg-white relative">
            <div className="absolute inset-2 rounded-full border border-slate-100 border-dashed"></div>
            <div className="flex flex-col items-center z-10">
              <span className="text-3xl font-black text-slate-800 tracking-tight">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">
                {currentTime.toLocaleTimeString([], { hour12: true }).slice(-2)}
              </span>
            </div>
            {/* Active Indicator Ring */}
            {activeSession && (
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-pulse"></div>
            )}
          </div>
          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm ${activeSession ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${activeSession ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
            {activeSession ? 'Active' : 'Inactive'}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            {currentTime.toLocaleDateString([], { weekday: 'long' })}
          </p>
          <p className="text-base font-bold text-slate-700">
            {currentTime.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {!activeSession ? (
          <button
            onClick={() => handleAction('checkin')}
            disabled={!!processingAction}
            className="w-full max-w-[180px] py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-600/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
          >
            {isBiometricRequired ? <Fingerprint size={16} /> : <Play size={16} fill="currentColor" />}
            {processingAction === 'checkin' ? 'Starting...' : 'Start Work'}
          </button>
        ) : (
          <button
            onClick={() => handleAction('checkout')}
            disabled={!!processingAction}
            className="w-full max-w-[180px] py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
          >
            {isBiometricRequired ? <Fingerprint size={16} /> : <Square size={16} fill="currentColor" />}
            {processingAction === 'checkout' ? 'Stopping...' : 'End Work'}
          </button>
        )}

        {isBiometricRequired && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <Fingerprint size={13} className="text-emerald-500" />
            <span>GPS + Phone Biometric</span>
          </div>
        )}

        {biometricStatus === 'exempted' && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-blue-600">
            <MapPin size={13} className="text-blue-500" />
            <span>Office GPS Mode (Exempted)</span>
          </div>
        )}
      </div>

      {/* Tiny Stats Grid - Vertically Compact */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-indigo-200 transition-all">
          <Clock size={16} className="text-indigo-500 mb-2" />
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Today</p>
            <p className="text-sm font-black text-slate-800">{(() => {
              const h = getLiveTodayHours();
              return formatHoursToHHMMSS(h).split(':')[0] + 'h ' + formatHoursToHHMMSS(h).split(':')[1] + 'm';
            })()}</p>
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-indigo-200 transition-all">
          <TrendingUp size={16} className="text-emerald-500 mb-2" />
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Monthly Avg</p>
            <p className="text-sm font-black text-slate-800">{monthlyAvg} hrs</p>
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-indigo-200 transition-all">
          <CheckCircle size={16} className="text-indigo-600 mb-2" />
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Full Days (Month)</p>
            <p className="text-sm font-black text-slate-800">{fullDaysCount}</p>
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-amber-200 transition-all">
          <Clock size={16} className="text-amber-500 mb-2" />
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Half Days (Month)</p>
            <p className="text-sm font-black text-slate-800">{halfDaysCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeAttendanceWidget;
