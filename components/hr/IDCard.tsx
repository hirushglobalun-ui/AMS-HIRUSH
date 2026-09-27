/**
 * @file IDCard.tsx
 * @description React component for rendering IDCard UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React, { forwardRef } from 'react';
import { User } from '../../types';
import { Phone, Mail, Droplets } from 'lucide-react';
import companyLogo from '../../assets/company-logo.png';

interface IDCardProps {
  user: User;
}

const IDCard = forwardRef<HTMLDivElement, IDCardProps>(({ user }, ref) => {
  return (
    <div
      ref={ref}
      className="relative w-[340px] h-[540px] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col border border-slate-100 print:shadow-none print:border print:border-slate-200 select-none font-sans"
    >
      {/* Top Accent Bar */}
      <div className="h-32 bg-blue-950 relative overflow-hidden">

        {/* Logo Section */}
        <div className="relative z-10 flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-lg p-1.5 shadow-sm">
              <img src={companyLogo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white text-sm tracking-widest uppercase leading-none">Hirush</span>
              <span className="text-[10px] text-blue-200 tracking-wider uppercase font-medium">Global LLP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Section - Overlapping */}
      <div className="relative z-10 -mt-16 flex flex-col items-center">
        <div className="p-1.5 bg-white rounded-full shadow-md">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-950 bg-slate-100">
            <img
              src={user.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=172554&color=fff&size=200`}
              alt={user.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=172554&color=fff&size=200`; }}
            />
          </div>
        </div>

        <div className="text-center mt-3 px-4">
          <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">{user.name}</h2>
          <p className="text-blue-700 font-bold text-sm uppercase tracking-widest mt-1">{user.position || 'Employee'}</p>
        </div>
      </div>

      {/* Details Section */}
      <div className="flex-1 px-8 mt-6 flex flex-col gap-5">

        {/* ID & Blood Group */}
        <div className="flex items-center justify-between py-3 border-b border-slate-100">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">ID Number</span>
            <span className="text-xl font-mono font-bold text-slate-800">{user.employeeId}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Blood Group</span>
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold text-slate-800">{user.bloodGroup || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-700">
              <Phone size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Phone</span>
              <span className="text-sm font-semibold text-slate-700">{user.phone}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 shrink-0">
              <Mail size={18} />
            </div>
            <div className="flex flex-col flex-1 min-w-0 justify-center">
              <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider leading-none mb-0.5">Email</span>
              <span className="text-sm font-semibold text-slate-700 block truncate w-full leading-relaxed pb-2" title={user.email}>{user.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="h-12 bg-blue-950 flex items-center justify-center">
        <span className="text-blue-200 text-[10px] tracking-widest uppercase font-medium">www.hirushglobal.com</span>
      </div>
    </div>
  );
});

IDCard.displayName = 'IDCard';

export default IDCard;