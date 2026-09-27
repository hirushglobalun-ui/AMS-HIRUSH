/**
 * File: components/admin/biometrics/BiometricModeCard.tsx
 * Purpose: Verification mode selector card (GPS Location Only vs Strict Biometric + GPS).
 * Author: Hirush Global AMS
 */

import React from 'react';
import Card from '../../common/Card';
import { ShieldCheck, MapPin, Fingerprint } from 'lucide-react';
import { BiometricSettings } from '../../../types';

interface BiometricModeCardProps {
  settings: BiometricSettings;
  onChange: (settings: BiometricSettings) => void;
}

export const BiometricModeCard: React.FC<BiometricModeCardProps> = ({ settings, onChange }) => {
  const isLocationOnly = settings.verificationMode === 'location_only' || !settings.enabled;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="text-primary" size={18} />
            Master Attendance Verification Mode
          </h2>
          <p className="text-xs text-slate-500">
            Select how employees are required to verify attendance when checking in or out.
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
            !isLocationOnly ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
          }`}
        >
          {!isLocationOnly ? '● Biometric Mode Active' : '● Location Only Mode'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option 1: Only Location */}
        <div
          onClick={() =>
            onChange({
              enabled: false,
              verificationMode: 'location_only',
              autoApproveFirstDevice: false,
            })
          }
          className={`cursor-pointer p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
            isLocationOnly
              ? 'border-blue-600 bg-blue-50/60 dark:bg-slate-800/80 shadow-md ring-2 ring-blue-500/20'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isLocationOnly ? 'bg-blue-600 text-white shadow' : 'bg-blue-100 text-blue-600'}`}>
                  <MapPin size={22} />
                </div>
                <span className="font-extrabold text-base text-slate-900 dark:text-white">
                  1. Only Location
                </span>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isLocationOnly ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                }`}
              >
                {isLocationOnly && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2 mb-3">
              Employees check in using Office GPS location only. Fingerprint scan is not required to check in. Employees can pre-register their thumb in advance.
            </p>
          </div>
          <span className="text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-lg w-fit">
            Standard Office GPS Mode
          </span>
        </div>

        {/* Option 2: Location + Fingerprint */}
        <div
          onClick={() =>
            onChange({
              enabled: true,
              verificationMode: 'location_and_biometric',
              autoApproveFirstDevice: false,
            })
          }
          className={`cursor-pointer p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
            !isLocationOnly
              ? 'border-emerald-600 bg-emerald-50/60 dark:bg-slate-800/80 shadow-md ring-2 ring-emerald-500/20'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${!isLocationOnly ? 'bg-emerald-600 text-white shadow' : 'bg-emerald-100 text-emerald-600'}`}>
                  <Fingerprint size={22} />
                </div>
                <span className="font-extrabold text-base text-slate-900 dark:text-white">
                  2. Location + Fingerprint
                </span>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  !isLocationOnly ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                }`}
              >
                {!isLocationOnly && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2 mb-3">
              Requires BOTH Office GPS location AND approved Phone Fingerprint Scan. Completely blocks buddy punching and proxy attendance from unauthorized devices.
            </p>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-lg w-fit">
            Strict Anti-Proxy Mode
          </span>
        </div>
      </div>
    </Card>
  );
};
