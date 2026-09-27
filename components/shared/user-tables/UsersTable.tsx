/**
 * File: UsersTable.tsx
 * Purpose: Reusable table and mobile card view for displaying user lists with Biometric Device controls.
 * Layer: UI / Component
 * Notes: Extracted to keep parent components under the 300-line limit.
 */

import React from 'react';
import { Edit, CheckCircle, XCircle, Trash2, CreditCard, Fingerprint, RefreshCw, Check, X } from 'lucide-react';
import { User, Role, UserStatus } from '../../../types';

interface UsersTableProps {
    users: User[];
    loading: boolean;
    searchQuery: string;
    onViewUser: (user: User) => void;
    onEditUser: (user: User) => void;
    onToggleStatus?: (user: User) => void;
    onViewIDCard?: (user: User) => void;
    onDeleteUser?: (user: User) => void;
    onApproveBiometric?: (user: User) => void;
    onRejectBiometric?: (user: User) => void;
    onResetBiometric?: (user: User) => void;
    hasMore: boolean;
    onLoadMore: () => void;
    hideActionsForRoles?: Role[];
}

const UsersTable: React.FC<UsersTableProps> = ({
    users,
    loading,
    searchQuery,
    onViewUser,
    onEditUser,
    onToggleStatus,
    onViewIDCard,
    onDeleteUser,
    onApproveBiometric,
    onRejectBiometric,
    onResetBiometric,
    hasMore,
    onLoadMore,
    hideActionsForRoles = [Role.ADMIN]
}) => {
    return (
        <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
                        <tr>
                            <th className="px-6 py-4">Employee</th>
                            <th className="px-6 py-4">Department</th>
                            <th className="px-6 py-4">Role & Status</th>
                            <th className="px-6 py-4">Fingerprint Device</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-slate-500 font-medium animate-pulse">Loading users...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                                    {searchQuery ? 'No users found matching your search.' : 'No users registered yet.'}
                                </td>
                            </tr>
                        ) : users.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img
                                                src={user.profilePhoto || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                                alt={user.name}
                                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                            />
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${user.status === UserStatus.INACTIVE ? 'bg-slate-300' : 'bg-green-500'}`}></div>
                                        </div>
                                        <div>
                                            <button
                                                onClick={() => onViewUser(user)}
                                                className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors text-left block"
                                            >
                                                {user.name}
                                            </button>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <span className="font-mono bg-slate-100 px-1.5 rounded">{user.employeeId}</span>
                                                <span>{user.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-slate-700">{user.department || 'General'}</span>
                                        <span className="text-xs text-slate-400">{user.position || 'N/A'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${user.role === Role.ADMIN ? 'bg-indigo-50 text-indigo-700' :
                                                (user.role === Role.HR ? 'bg-purple-50 text-purple-700' :
                                                    (user.role === Role.EMPLOYEE ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'))
                                                }`}>
                                                {user.role}
                                            </span>
                                        </div>
                                        <span className={`text-[11px] font-medium ${user.status === UserStatus.INACTIVE ? 'text-slate-400' : 'text-green-600'}`}>
                                            {user.status || 'ACTIVE'}
                                        </span>
                                    </div>
                                </td>

                                {/* Biometric Fingerprint Column with Approve & Reject */}
                                <td className="px-6 py-4">
                                    {user.biometricDevice ? (
                                        user.biometricDevice.status === 'approved' ? (
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                                                        <Fingerprint size={14} className="text-emerald-600" />
                                                        {user.biometricDevice.deviceName || 'Approved'}
                                                    </span>
                                                    <span className="text-[10px] text-emerald-600 font-bold">
                                                        ✓ Approved
                                                    </span>
                                                </div>
                                                {onRejectBiometric && (
                                                    <button
                                                        onClick={() => onRejectBiometric(user)}
                                                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                        title="Revoke / Reject"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ) : user.biometricDevice.status === 'pending_approval' ? (
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-1 text-[11px] text-slate-700 font-medium">
                                                    <Fingerprint size={14} className="text-amber-500" />
                                                    <span className="max-w-[130px] truncate" title={user.biometricDevice.deviceName}>
                                                        {user.biometricDevice.deviceName}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    {onApproveBiometric && (
                                                        <button
                                                            onClick={() => onApproveBiometric(user)}
                                                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1"
                                                            title="Approve Thumb"
                                                        >
                                                            <Check size={12} /> Approve
                                                        </button>
                                                    )}
                                                    {onRejectBiometric && (
                                                        <button
                                                            onClick={() => onRejectBiometric(user)}
                                                            className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                                                            title="Reject Thumb"
                                                        >
                                                            <X size={12} /> Reject
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
                                                    Rejected
                                                </span>
                                                {onApproveBiometric && (
                                                    <button
                                                        onClick={() => onApproveBiometric(user)}
                                                        className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold"
                                                        title="Re-Approve"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                                            <Fingerprint size={14} className="text-slate-300" /> Not registered
                                        </span>
                                    )}
                                </td>

                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {/* Reset Biometric Device Button */}
                                        {onResetBiometric && user.biometricDevice && (
                                            <button
                                                onClick={() => onResetBiometric(user)}
                                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                title="Reset Fingerprint (Allow employee to register new phone)"
                                            >
                                                <RefreshCw size={16} />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => onEditUser(user)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        {!hideActionsForRoles.includes(user.role as Role) && (
                                            <>
                                                {onToggleStatus && (
                                                    <button
                                                        onClick={() => onToggleStatus(user)}
                                                        className={`p-2 rounded-lg transition-colors ${user.status === UserStatus.INACTIVE ? 'text-slate-400 hover:text-green-600 hover:bg-green-50' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`}
                                                        title={user.status === UserStatus.INACTIVE ? 'Activate' : 'Deactivate'}
                                                    >
                                                        {user.status === UserStatus.INACTIVE ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                                    </button>
                                                )}
                                                {onViewIDCard && (
                                                    <button
                                                        onClick={() => onViewIDCard(user)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="ID Card"
                                                    >
                                                        <CreditCard size={16} />
                                                    </button>
                                                )}
                                                {onDeleteUser && (
                                                    <button
                                                        onClick={() => onDeleteUser(user)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {hasMore && !searchQuery && (
                <div className="p-4 text-center border-t border-slate-100 bg-slate-50/50 hidden md:block">
                    <button onClick={onLoadMore} disabled={loading} className="px-6 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-all shadow-sm disabled:opacity-50">
                        {loading ? 'Loading...' : 'Load More'}
                    </button>
                </div>
            )}

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 p-4">
                {loading ? (
                    <div className="flex flex-col items-center py-12 gap-3">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-500 font-medium tracking-tight">Loading...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 font-medium">
                        {searchQuery ? 'No users found matching your search.' : 'No users found.'}
                    </div>
                ) : users.map(user => (
                    <div key={user.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <img src={user.profilePhoto || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} className="w-14 h-14 rounded-2xl object-cover border border-slate-100" />
                                <div>
                                    <button onClick={() => onViewUser(user)} className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-left block">
                                        {user.name}
                                    </button>
                                    <p className="text-xs text-slate-400 font-mono mt-0.5">{user.employeeId}</p>
                                </div>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${user.status === UserStatus.INACTIVE ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700'}`}>
                                {user.status || UserStatus.ACTIVE}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-slate-50 p-3 rounded-xl">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-wider">Department</span>
                                <span className="text-sm font-bold text-slate-700">{user.department || 'General'}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-wider">Role</span>
                                <span className="text-sm font-bold text-slate-700">{user.role}</span>
                            </div>
                        </div>

                        {/* Mobile Biometric Info with Approve & Reject */}
                        <div className="bg-slate-50 p-3 rounded-xl mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Fingerprint size={16} className={user.biometricDevice?.status === 'approved' ? 'text-emerald-600' : (user.biometricDevice?.status === 'rejected' ? 'text-red-500' : 'text-slate-400')} />
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Fingerprint Device</span>
                                    <span className="text-xs font-semibold text-slate-700">
                                        {user.biometricDevice?.deviceName || 'Not Registered'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {user.biometricDevice?.status === 'pending_approval' && (
                                    <>
                                        {onApproveBiometric && (
                                            <button
                                                onClick={() => onApproveBiometric(user)}
                                                className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                                            >
                                                Approve
                                            </button>
                                        )}
                                        {onRejectBiometric && (
                                            <button
                                                onClick={() => onRejectBiometric(user)}
                                                className="px-2 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold"
                                            >
                                                Reject
                                            </button>
                                        )}
                                    </>
                                )}
                                {user.biometricDevice && onResetBiometric && (
                                    <button
                                        onClick={() => onResetBiometric(user)}
                                        className="p-1.5 text-slate-400 hover:text-amber-600"
                                        title="Reset Device"
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => onEditUser(user)}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all"
                            >
                                <Edit size={14} /> Edit
                            </button>
                            {!hideActionsForRoles.includes(user.role as Role) && (
                                <>
                                    {onViewIDCard && (
                                        <button
                                            onClick={() => onViewIDCard(user)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-all"
                                        >
                                            <CreditCard size={14} /> ID
                                        </button>
                                    )}
                                    {onDeleteUser && (
                                        <button
                                            onClick={() => onDeleteUser(user)}
                                            className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {hasMore && !searchQuery && (
                <div className="p-4 text-center border-t border-slate-100 bg-slate-50/50 md:hidden">
                    <button onClick={onLoadMore} disabled={loading} className="w-full py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50">
                        {loading ? 'Loading...' : 'Load More'}
                    </button>
                </div>
            )}
        </>
    );
};

export default UsersTable;
