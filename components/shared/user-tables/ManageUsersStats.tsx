/**
 * File: ManageUsersStats.tsx
 * Purpose: Renders the 4 summary statistics cards at the top of the Manage Users page.
 * Layer: UI / Component
 * Notes: Extracted to keep parent under 300 lines.
 */

import React from 'react';
import { Users, Target, Zap, Building2 } from 'lucide-react';
import { User, UserStatus } from '../../../types';

interface ManageUsersStatsProps {
    users: User[];
}

const ManageUsersStats: React.FC<ManageUsersStatsProps> = ({ users }) => {
    return (
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-indigo-50 text-indigo-600 rounded-xl flex-shrink-0">
                    <Users size={22} />
                </div>
                <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-500">Total Staff</p>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{users.length}</h3>
                </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-teal-50 text-teal-600 rounded-xl flex-shrink-0">
                    <Target size={22} />
                </div>
                <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-500">Active Now</p>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{users.filter(u => u.status !== UserStatus.INACTIVE).length}</h3>
                </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-orange-50 text-orange-600 rounded-xl flex-shrink-0">
                    <Zap size={22} />
                </div>
                <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-500">Inactive</p>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{users.filter(u => u.status === UserStatus.INACTIVE).length}</h3>
                </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-blue-50 text-blue-600 rounded-xl flex-shrink-0">
                    <Building2 size={22} />
                </div>
                <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-500">Departments</p>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{new Set(users.map(u => u.department).filter(Boolean)).size}</h3>
                </div>
            </div>
        </div>
    );
};

export default ManageUsersStats;
