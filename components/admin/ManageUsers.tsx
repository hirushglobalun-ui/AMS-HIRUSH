/**
 * @file ManageUsers.tsx
 * @description React component for rendering ManageUsers UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */


import React, { useState, useEffect, useCallback, useRef } from 'react';
import Card from '../common/Card';
import { User, Role, UserStatus } from '../../types';
import { toast } from 'react-hot-toast';
import {
    Download,
    Search,
    Edit,
    CheckCircle,
    XCircle,
    Trash2,
    CreditCard,
    Users,
    Target,
    Building2,
    Zap,
} from 'lucide-react';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import UserDetailView from '../shared/UserDetailView';
import { fetchUsers, invalidateCache } from '../../services/dataService';
import { exportToCSV } from '../../services/exportService';

import UserFormModal from '../shared/user-modals/UserFormModal';
import UserDeleteModal from '../shared/user-modals/UserDeleteModal';
import IDCardModal from '../shared/user-modals/IDCardModal';
import UsersTable from '../shared/user-tables/UsersTable';
import ManageUsersStats from '../shared/user-tables/ManageUsersStats';

/**
 * File: ManageUsers.tsx (Admin)
 * Purpose: Provides the main dashboard and table for Admins to view and manage all employees.
 * Layer: UI / View
 * Notes: Refactored for production readiness. Modals extracted to components/shared/user-modals.
 */



const ManageUsers: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [viewingUser, setViewingUser] = useState<User | null>(null);
    const [idCardUser, setIdCardUser] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | UserStatus>('All');
    const [limitCount, setLimitCount] = useState(20);
    const [hasMore, setHasMore] = useState(true);

    const loadUsers = useCallback(async (forceRefresh = false, currentLimit = limitCount) => {
        if (!forceRefresh && currentLimit > 20) setLoading(false); // don't show full loading spinner for load more
        else setLoading(true);
        
        try {
            const usersData = await fetchUsers(forceRefresh, currentLimit);
            setUsers(usersData);
            setHasMore(usersData.length === currentLimit);
        } catch (error) {
            console.error("Error fetching users: ", error);
            toast.error("Could not fetch users.");
        }
        setLoading(false);
    }, []);

    const handleLoadMore = () => {
        const newLimit = limitCount + 20;
        setLimitCount(newLimit);
        loadUsers(false, newLimit);
    };

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // Filter users based on search query and status, then sort
    const filteredUsers = users
        .filter(user => {
            const query = searchQuery.toLowerCase();
            const matchesSearch = (
                user.name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query) ||
                user.employeeId.toLowerCase().includes(query) ||
                (user.department && user.department.toLowerCase().includes(query)) ||
                user.role.toLowerCase().includes(query)
            );
            const userStatus = user.status || UserStatus.ACTIVE;
            const matchesStatus = statusFilter === 'All' || userStatus === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            const statusA = a.status || UserStatus.ACTIVE;
            const statusB = b.status || UserStatus.ACTIVE;
            if (statusA === UserStatus.ACTIVE && statusB !== UserStatus.ACTIVE) return -1;
            if (statusA !== UserStatus.ACTIVE && statusB === UserStatus.ACTIVE) return 1;
            return 0;
        });

    const handleOpenModal = (user: User | null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleUserSaveSuccess = () => {
        invalidateCache('users');
        loadUsers(true).catch(err => console.error("Background refresh failed", err));
    };

    const handleOpenDeleteModal = (user: User) => {
        setUserToDelete(user);
    };

    const handleCloseDeleteModal = () => {
        setUserToDelete(null);
    };

    const handleDeleteSuccess = () => {
        invalidateCache('users');
        invalidateCache('attendance');
        invalidateCache('leaveRequests');
        loadUsers(true).catch(err => console.error(err));
    };

    const handleViewIDCard = (user: User) => {
        setIdCardUser(user);
    };

    const handleToggleStatus = async (user: User) => {
        if (!user || user.role === Role.ADMIN) return;

        const newStatus = (user.status === undefined || user.status === UserStatus.ACTIVE)
            ? UserStatus.INACTIVE
            : UserStatus.ACTIVE;

        const userRef = doc(db, 'users', user.id);

        try {
            await updateDoc(userRef, { status: newStatus });
            toast.success(`User "${user.name}" has been ${newStatus === UserStatus.ACTIVE ? 'activated' : 'deactivated'}.`);
            // Invalidate cache and refresh
            invalidateCache('users');
            await loadUsers(true);
        } catch (error) {
            console.error("Error updating user status:", error);
            toast.error("Failed to update user status.");
        }
    };

    const handleApproveBiometric = async (targetUser: User) => {
        if (!targetUser.biometricDevice) return;
        try {
            const userRef = doc(db, 'users', targetUser.id);
            const updatedDevice = {
                ...targetUser.biometricDevice,
                status: 'approved' as const,
                approvedBy: 'Admin',
                approvedAt: new Date().toISOString()
            };
            await updateDoc(userRef, { biometricDevice: updatedDevice });
            setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, biometricDevice: updatedDevice } : u));
            invalidateCache('users');
            toast.success(`Biometric device approved for ${targetUser.name}`);
        } catch (error) {
            console.error("Error approving biometric:", error);
            toast.error("Failed to approve biometric device.");
        }
    };

    const handleRejectBiometric = async (targetUser: User) => {
        if (!targetUser.biometricDevice) return;
        try {
            const userRef = doc(db, 'users', targetUser.id);
            const updatedDevice = {
                ...targetUser.biometricDevice,
                status: 'rejected' as const,
                approvedBy: 'Admin',
                approvedAt: new Date().toISOString()
            };
            await updateDoc(userRef, { biometricDevice: updatedDevice });
            setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, biometricDevice: updatedDevice } : u));
            invalidateCache('users');
            toast.error(`Biometric device rejected for ${targetUser.name}`);
        } catch (error) {
            console.error("Error rejecting biometric:", error);
            toast.error("Failed to reject biometric device.");
        }
    };

    const handleResetBiometric = async (targetUser: User) => {
        if (!window.confirm(`Reset biometric device for "${targetUser.name}"? They will be able to register their phone again.`)) return;
        try {
            const userRef = doc(db, 'users', targetUser.id);
            await updateDoc(userRef, { biometricDevice: null });
            setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, biometricDevice: undefined } : u));
            invalidateCache('users');
            toast.success(`Biometric device reset for ${targetUser.name}`);
        } catch (error) {
            console.error("Error resetting biometric:", error);
            toast.error("Failed to reset biometric device.");
        }
    };

    const handleExportUsers = () => {
        if (users.length === 0) {
            toast.error("No users to export.");
            return;
        }

        const exportData = users.map(user => ({
            'Employee ID': user.employeeId,
            'Name': user.name,
            'Email': user.email,
            'Phone': user.phone,
            'Department': user.department || 'N/A',
            'Position': user.position || 'N/A',
            'Role': user.role,
            'Status': user.status || UserStatus.ACTIVE,
            'Blood Group': user.bloodGroup || 'N/A',
            'Bank Name': user.bankName || 'N/A',
            'Account Number': user.accountNumber || 'N/A',
            'IFSC Code': user.ifscCode || 'N/A',
            'Aadhar Number': user.aadharNumber || 'N/A',
            'PAN Number': user.panNumber || 'N/A'
        }));

        exportToCSV(exportData, `Employee_List_${new Date().toISOString().split('T')[0]}`);
        toast.success("User list exported!");
    };


    if (viewingUser) {
        return (
            <UserDetailView
                user={viewingUser}
                onBack={() => setViewingUser(null)}
                onUserUpdate={(updatedUser) => {
                    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
                    setViewingUser(updatedUser);
                }}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
                    <p className="text-slate-500 mt-1">Manage employee profiles, roles, and system access.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={handleExportUsers}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-white transition-all shadow-sm shadow-slate-200"
                    >
                        <Download size={18} />
                        <span>Export CSV</span>
                    </button>
                    <button
                        onClick={() => handleOpenModal(null)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
                    >
                        <span>Add New User</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <ManageUsersStats users={users} />

            <Card className="overflow-hidden p-0">
                {/* Search and Filters Header */}
                <div className="p-6 border-b border-indigo-50 bg-indigo-50/30">
                    <div className="relative max-w-md w-full group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-2xl border-white bg-white/50 focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none shadow-sm"
                        />
                    </div>
                </div>

                {/* Table View Component */}
                <UsersTable
                    users={filteredUsers}
                    loading={loading}
                    searchQuery={searchQuery}
                    onViewUser={setViewingUser}
                    onEditUser={handleOpenModal}
                    onToggleStatus={handleToggleStatus}
                    onViewIDCard={handleViewIDCard}
                    onDeleteUser={handleOpenDeleteModal}
                    onApproveBiometric={handleApproveBiometric}
                    onRejectBiometric={handleRejectBiometric}
                    onResetBiometric={handleResetBiometric}
                    hasMore={hasMore}
                    onLoadMore={handleLoadMore}
                />
            </Card>

            {/* Optimized Modals */}
            <UserFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                editingUser={editingUser}
                allUsers={users}
                onSuccess={handleUserSaveSuccess}
            />

            <UserDeleteModal
                isOpen={!!userToDelete}
                onClose={handleCloseDeleteModal}
                userToDelete={userToDelete}
                onSuccess={handleDeleteSuccess}
            />

            <IDCardModal
                isOpen={!!idCardUser}
                onClose={() => setIdCardUser(null)}
                idCardUser={idCardUser}
            />
        </div>
    );
};

export default ManageUsers;