/**
 * File: components/admin/biometrics/BiometricUserRow.tsx
 * Purpose: Table row displaying single employee biometric devices, approval actions, and exemption toggles.
 * Author: Hirush Global AMS
 */

import React from 'react';
import { Fingerprint, Smartphone, Check, X, Trash2, MapPin, ShieldCheck, Clock, RefreshCw } from 'lucide-react';
import { User, BiometricDevice } from '../../../types';

interface BiometricUserRowProps {
  user: User;
  devices: BiometricDevice[];
  onApprove: (user: User, credentialId?: string) => void;
  onReject: (user: User, credentialId?: string) => void;
  onDeleteDevice: (user: User, credentialId: string, slotLabel?: string) => void;
  onReset: (user: User) => void;
  onToggleExemption: (user: User) => void;
}

export const BiometricUserRow: React.FC<BiometricUserRowProps> = ({
  user,
  devices,
  onApprove,
  onReject,
  onDeleteDevice,
  onReset,
  onToggleExemption,
}) => {
  const hasPending = devices.some((d) => d.status === 'pending_approval');
  const hasApproved = devices.some((d) => d.status === 'approved');
  const appCount = devices.filter((d) => d.status === 'approved').length;
  const pendCount = devices.filter((d) => d.status === 'pending_approval').length;

  return (
    <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
      {/* Employee Column */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <img
            src={user.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60'}
            alt={user.name}
            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
          />
          <div className="min-w-0">
            <p className="font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">ID: {user.employeeId || 'N/A'}</p>
          </div>
        </div>
      </td>

      {/* Department & Role */}
      <td className="px-6 py-4">
        <span className="inline-block font-semibold text-xs text-slate-800 dark:text-slate-200">
          {user.department || 'General'}
        </span>
        <span className="block text-[11px] text-slate-500">{user.role}</span>
      </td>

      {/* Registered Fingerprints & Devices */}
      <td className="px-6 py-4">
        {devices.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Fingerprint size={16} className="text-slate-300" />
            <span>Not registered yet</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {devices.map((device, idx) => (
              <div
                key={device.id || device.credentialId || idx}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg border text-xs ${
                  device.status === 'approved'
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                    : device.status === 'pending_approval'
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                    : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Fingerprint
                    size={16}
                    className={
                      device.status === 'approved'
                        ? 'text-emerald-600 shrink-0'
                        : device.status === 'pending_approval'
                        ? 'text-amber-500 shrink-0'
                        : 'text-red-500 shrink-0'
                    }
                  />
                  <div className="truncate">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                      {device.slotLabel || `Finger ${idx + 1}`}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Smartphone size={10} /> {device.deviceName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 justify-end">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0 ${
                      device.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                        : device.status === 'pending_approval'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300'
                    }`}
                  >
                    {device.status === 'pending_approval' ? 'Pending' : device.status}
                  </span>

                  {device.status === 'pending_approval' && (
                    <>
                      <button
                        onClick={() => onApprove(user, device.credentialId)}
                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-xs transition-all active:scale-95 flex items-center gap-0.5"
                        title="Approve this finger"
                      >
                        <Check size={11} /> Approve
                      </button>
                      <button
                        onClick={() => onReject(user, device.credentialId)}
                        className="px-1.5 py-0.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded text-[10px] font-bold transition-all active:scale-95 flex items-center gap-0.5"
                        title="Reject this finger"
                      >
                        <X size={11} /> Reject
                      </button>
                    </>
                  )}
                  {device.status === 'approved' && (
                    <button
                      onClick={() => onReject(user, device.credentialId)}
                      className="px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded text-[10px] font-bold transition-all active:scale-95"
                      title="Revoke approval for this finger"
                    >
                      Revoke
                    </button>
                  )}
                  {device.status === 'rejected' && (
                    <button
                      onClick={() => onApprove(user, device.credentialId)}
                      className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-all active:scale-95 flex items-center gap-0.5"
                      title="Approve this finger"
                    >
                      <Check size={11} /> Approve
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteDevice(user, device.credentialId, device.slotLabel)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-all"
                    title="Delete this finger slot"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </td>

      {/* Overall Status Column */}
      <td className="px-6 py-4 text-center">
        {user.biometricExempt ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <MapPin size={12} /> Location Only (Exempt)
          </span>
        ) : devices.length === 0 ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Unregistered
          </span>
        ) : appCount === devices.length && appCount > 0 ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Check size={12} /> All {appCount} Verified
          </span>
        ) : appCount > 0 && pendCount > 0 ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <ShieldCheck size={12} className="text-emerald-600" /> {appCount} Active, {pendCount} Pending
          </span>
        ) : pendCount > 0 ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
            <Clock size={12} /> {pendCount} Pending Review
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
            <X size={12} /> Rejected
          </span>
        )}
      </td>

      {/* Action Buttons Column */}
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onToggleExemption(user)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border ${
              user.biometricExempt
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
            }`}
            title={user.biometricExempt ? 'Require phone biometric for this user' : 'Exempt employee from fingerprint (Location Only)'}
          >
            {user.biometricExempt ? (
              <>
                <Fingerprint size={13} className="text-primary" /> Require Bio
              </>
            ) : (
              <>
                <MapPin size={13} /> Exempt (GPS)
              </>
            )}
          </button>

          {hasPending && (
            <>
              <button
                onClick={() => onApprove(user)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                title="Approve Thumbprint"
              >
                <Check size={14} /> Approve
              </button>
              <button
                onClick={() => onReject(user)}
                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                title="Reject Thumbprint"
              >
                <X size={14} /> Reject
              </button>
            </>
          )}

          {!hasPending && hasApproved && (
            <button
              onClick={() => onReject(user)}
              className="px-2.5 py-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors"
              title="Revoke / Reject Biometric"
            >
              Revoke
            </button>
          )}

          {devices.length > 0 && (
            <button
              onClick={() => onReset(user)}
              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title="Reset Biometrics"
            >
              <RefreshCw size={15} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};
