/**
 * @file UserHeader.tsx
 * @description React component for rendering UserHeader UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React from 'react';
import { User, Role } from '../../../types';
import { Shield, Building2, Briefcase, Mail, Phone } from 'lucide-react';

interface UserHeaderProps {
    user: User;
}

const UserHeader: React.FC<UserHeaderProps> = ({ user }) => {
    return (
        <div className="relative overflow-hidden bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            {/* Decorative Background Element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50"></div>

            <div className="relative p-8 sm:p-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                <div className="relative">
                    <img
                        src={user.profilePhoto || `https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff`}
                        alt={user.name}
                        className="w-32 h-32 md:w-40 md:h-40 rounded-[3rem] object-cover border-8 border-slate-50 shadow-inner"
                    />
                    <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-4 border-white shadow-sm ${user.role === Role.ADMIN ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-white'}`}>
                        {user.role}
                    </div>
                </div>

                <div className="flex-1 space-y-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-1">{user.name}</h1>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center mt-2">
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold ring-1 ring-slate-200">
                                <Shield size={14} className="text-primary" /> {user.employeeId}
                            </span>
                            {user.department && (
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-bold ring-1 ring-teal-100">
                                    <Building2 size={14} /> {user.department}
                                </span>
                            )}
                            {user.position && (
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold ring-1 ring-indigo-100">
                                    <Briefcase size={14} /> {user.position}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl">
                            <div className="p-2 bg-white rounded-xl shadow-sm"><Mail size={16} className="text-slate-400" /></div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                                <p className="text-sm font-bold text-slate-700">{user.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl">
                            <div className="p-2 bg-white rounded-xl shadow-sm"><Phone size={16} className="text-slate-400" /></div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Number</p>
                                <p className="text-sm font-bold text-slate-700">{user.phone}</p>
                            </div>
                        </div>
                        {user.emergencyPhone && (
                            <div className="flex items-center gap-3 px-4 py-3 bg-orange-50/50 rounded-2xl ring-1 ring-orange-100">
                                <div className="p-2 bg-white rounded-xl shadow-sm"><Phone size={16} className="text-orange-400" /></div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Emergency Contact</p>
                                    <p className="text-sm font-bold text-slate-700">{user.emergencyPhone}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserHeader;
