/**
 * @file ManageBiometrics.tsx
 * @description Dedicated Admin & HR panel for managing employee biometric fingerprints, approvals, multi-finger devices, and attendance verification modes.
 * @module components/admin/biometrics
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../firebase';
import { collection, doc, getDocs, getDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { User, Role, BiometricDevice, BiometricSettings } from '../../../types';
import Card from '../../common/Card';
import Button from '../../common/Button';
import { 
    Fingerprint, 
    ShieldCheck, 
    Check, 
    X, 
    RefreshCw, 
    Search, 
    Smartphone, 
    MapPin, 
    AlertCircle, 
    Clock, 
    UserCheck, 
    Sparkles,
    Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ManageBiometrics: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'exempted' | 'not_registered'>('all');
    
    // Biometric Master Settings
    const [biometricSettings, setBiometricSettings] = useState<BiometricSettings>({
        enabled: true,
        verificationMode: 'location_and_biometric',
        autoApproveFirstDevice: false
    });

    // Load users & settings
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch Settings
                const settingsRef = doc(db, 'settings', 'general');
                const settingsSnap = await getDoc(settingsRef);
                if (settingsSnap.exists() && settingsSnap.data().biometricSettings) {
                    const bio = settingsSnap.data().biometricSettings;
                    const isBio = bio.enabled ?? true;
                    setBiometricSettings({
                        enabled: isBio,
                        verificationMode: bio.verificationMode || (isBio ? 'location_and_biometric' : 'location_only'),
                        autoApproveFirstDevice: bio.autoApproveFirstDevice || false
                    });
                }

                // Fetch Users
                const usersRef = collection(db, 'users');
                const q = query(usersRef, orderBy('name', 'asc'));
                const snap = await getDocs(q);
                const loadedUsers = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
                setUsers(loadedUsers);
            } catch (err) {
                console.error("Error loading biometric data:", err);
                toast.error("Failed to load biometric data.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Save Attendance Mode Setting
    const handleSaveSettings = async () => {
        setSavingSettings(true);
        try {
            const settingsRef = doc(db, 'settings', 'general');
            await updateDoc(settingsRef, { biometricSettings });
            toast.success("Attendance verification settings updated!");
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to update settings.");
        } finally {
            setSavingSettings(false);
        }
    };

    // Helper: Normalize devices list from user
    const getUserBiometricDevices = (u: User): BiometricDevice[] => {
        if (u.biometricDevices && u.biometricDevices.length > 0) {
            return u.biometricDevices;
        }
        if (u.biometricDevice) {
            return [{ ...u.biometricDevice, slotLabel: u.biometricDevice.slotLabel || 'Primary Finger (Thumb)' }];
        }
        return [];
    };

    // Approve a specific credential or all credentials for a user
    const handleApprove = async (targetUser: User, credentialId?: string) => {
        try {
            const userRef = doc(db, 'users', targetUser.id);
            const devices = getUserBiometricDevices(targetUser);

            let updatedDevice: BiometricDevice | undefined = targetUser.biometricDevice;
            let updatedDevices: BiometricDevice[] | undefined = undefined;

            if (devices.length > 0) {
                const nowIso = new Date().toISOString();
                updatedDevices = devices.map(d => {
                    if (!credentialId || d.credentialId === credentialId) {
                        return { ...d, status: 'approved', approvedAt: nowIso, approvedBy: 'Admin' };
                    }
                    return d;
                });
                updatedDevice = updatedDevices.find(d => d.status === 'approved') || updatedDevices[0];
            }

            const cleanDevices = updatedDevices ? JSON.parse(JSON.stringify(updatedDevices)) : null;
            const cleanDevice = updatedDevice ? JSON.parse(JSON.stringify(updatedDevice)) : null;

            await updateDoc(userRef, {
                biometricDevice: cleanDevice,
                biometricDevices: cleanDevices
            });

            setUsers(prev => prev.map(u => u.id === targetUser.id ? { 
                ...u, 
                biometricDevice: cleanDevice || undefined, 
                biometricDevices: cleanDevices || undefined 
            } : u));

            const matchedSlot = devices.find(d => d.credentialId === credentialId)?.slotLabel;
            toast.success(matchedSlot ? `Approved ${matchedSlot} for ${targetUser.name}!` : `Approved biometric for ${targetUser.name}!`);
        } catch (err) {
            console.error("Error approving biometric device:", err);
            toast.error("Failed to approve device.");
        }
    };

    // Reject a specific credential or all credentials for a user
    const handleReject = async (targetUser: User, credentialId?: string) => {
        try {
            const userRef = doc(db, 'users', targetUser.id);
            const devices = getUserBiometricDevices(targetUser);

            let updatedDevice: BiometricDevice | undefined = targetUser.biometricDevice;
            let updatedDevices: BiometricDevice[] | undefined = undefined;

            if (devices.length > 0) {
                updatedDevices = devices.map(d => {
                    if (!credentialId || d.credentialId === credentialId) {
                        return { ...d, status: 'rejected' };
                    }
                    return d;
                });
                updatedDevice = updatedDevices.find(d => d.status === 'approved') || updatedDevices[0];
            }

            const cleanDevices = updatedDevices ? JSON.parse(JSON.stringify(updatedDevices)) : null;
            const cleanDevice = updatedDevice ? JSON.parse(JSON.stringify(updatedDevice)) : null;

            await updateDoc(userRef, {
                biometricDevice: cleanDevice,
                biometricDevices: cleanDevices
            });

            setUsers(prev => prev.map(u => u.id === targetUser.id ? { 
                ...u, 
                biometricDevice: cleanDevice || undefined, 
                biometricDevices: cleanDevices || undefined 
            } : u));

            const matchedSlot = devices.find(d => d.credentialId === credentialId)?.slotLabel;
            toast.error(matchedSlot ? `Rejected ${matchedSlot} for ${targetUser.name}` : `Rejected biometric for ${targetUser.name}`);
        } catch (err) {
            console.error("Error rejecting biometric device:", err);
            toast.error("Failed to reject device.");
        }
    };

    // Delete a specific registered finger slot
    const handleDeleteDevice = async (targetUser: User, credentialId: string, slotLabel?: string) => {
        if (!window.confirm(`Delete ${slotLabel || 'this finger'} for ${targetUser.name}? The employee will be able to register it again.`)) {
            return;
        }
        try {
            const userRef = doc(db, 'users', targetUser.id);
            const devices = getUserBiometricDevices(targetUser);
            const updatedDevices = devices.filter(d => d.credentialId !== credentialId);
            const updatedDevice = updatedDevices.length > 0 ? (updatedDevices.find(d => d.status === 'approved') || updatedDevices[0]) : null;

            const cleanDevices = updatedDevices.length > 0 ? JSON.parse(JSON.stringify(updatedDevices)) : null;
            const cleanDevice = updatedDevice ? JSON.parse(JSON.stringify(updatedDevice)) : null;

            await updateDoc(userRef, {
                biometricDevice: cleanDevice,
                biometricDevices: cleanDevices
            });

            setUsers(prev => prev.map(u => u.id === targetUser.id ? {
                ...u,
                biometricDevice: cleanDevice || undefined,
                biometricDevices: cleanDevices || undefined
            } : u));

            toast.success(`Removed ${slotLabel || 'finger'} for ${targetUser.name}.`);
        } catch (err) {
            console.error("Error deleting biometric slot:", err);
            toast.error("Failed to remove finger.");
        }
    };

    // Reset/Clear Biometric Registration (Allow employee to register new phone or new finger)
    const handleReset = async (targetUser: User) => {
        if (!window.confirm(`Are you sure you want to reset biometric device registration for ${targetUser.name}? They will be able to register a fresh phone.`)) {
            return;
        }

        try {
            const userRef = doc(db, 'users', targetUser.id);
            await updateDoc(userRef, {
                biometricDevice: null,
                biometricDevices: null
            });

            setUsers(prev => prev.map(u => u.id === targetUser.id ? { 
                ...u, 
                biometricDevice: undefined, 
                biometricDevices: undefined 
            } : u));

            toast.success(`Biometric device reset for ${targetUser.name}.`);
        } catch (err) {
            console.error("Error resetting biometric device:", err);
            toast.error("Failed to reset device.");
        }
    };

    // Toggle Biometric Exemption (Allow Location-Only for employees without fingerprint sensors)
    const handleToggleExemption = async (targetUser: User) => {
        const newExemptState = !targetUser.biometricExempt;
        try {
            const userRef = doc(db, 'users', targetUser.id);
            await updateDoc(userRef, {
                biometricExempt: newExemptState
            });

            setUsers(prev => prev.map(u => u.id === targetUser.id ? { 
                ...u, 
                biometricExempt: newExemptState 
            } : u));

            if (newExemptState) {
                toast.success(`${targetUser.name} is now exempted (Location-Only attendance).`);
            } else {
                toast.success(`Biometric requirement restored for ${targetUser.name}.`);
            }
        } catch (err) {
            console.error("Error toggling biometric exemption:", err);
            toast.error("Failed to update exemption status.");
        }
    };

    // Filter Users
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesSearch = 
                u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.department?.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (statusFilter === 'exempted') return !!u.biometricExempt;

            const devices = getUserBiometricDevices(u);
            const hasPending = devices.some(d => d.status === 'pending_approval');
            const hasApproved = devices.some(d => d.status === 'approved');
            const notRegistered = devices.length === 0;

            if (statusFilter === 'pending') return hasPending && !u.biometricExempt;
            if (statusFilter === 'approved') return hasApproved && !hasPending && !u.biometricExempt;
            if (statusFilter === 'not_registered') return notRegistered && !u.biometricExempt;

            return true;
        });
    }, [users, searchQuery, statusFilter]);

    // Statistics
    const stats = useMemo(() => {
        let approved = 0;
        let pending = 0;
        let notRegistered = 0;
        let exempted = 0;

        users.forEach(u => {
            if (u.biometricExempt) {
                exempted++;
            }
            const devices = getUserBiometricDevices(u);
            if (devices.length === 0) {
                notRegistered++;
            } else if (devices.some(d => d.status === 'pending_approval')) {
                pending++;
            } else if (devices.some(d => d.status === 'approved')) {
                approved++;
            }
        });

        return { total: users.length, approved, pending, notRegistered, exempted };
    }, [users]);

    const isLocationOnly = biometricSettings.verificationMode === 'location_only' || !biometricSettings.enabled;

    if (loading) {
        return (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="animate-spin text-primary" size={28} />
                <span>Loading biometric dashboard...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <Fingerprint size={24} />
                        </div>
                        Biometric Authentication Hub
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Control company-wide check-in modes, review employee thumbprint registrations, and manage device approvals.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        onClick={handleSaveSettings} 
                        disabled={savingSettings}
                        className="py-2 px-5 text-sm font-bold shadow-md"
                    >
                        {savingSettings ? 'Saving Settings...' : 'Save Mode Setting'}
                    </Button>
                </div>
            </div>

            {/* Attendance Mode Configuration Card */}
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
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                        !isLocationOnly ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                        {!isLocationOnly ? '● Biometric Mode Active' : '● Location Only Mode'}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Option 1: Only Location */}
                    <div
                        onClick={() => {
                            setBiometricSettings({
                                enabled: false,
                                verificationMode: 'location_only',
                                autoApproveFirstDevice: false
                            });
                        }}
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
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    isLocationOnly ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                                }`}>
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
                        onClick={() => {
                            setBiometricSettings({
                                enabled: true,
                                verificationMode: 'location_and_biometric',
                                autoApproveFirstDevice: false
                            });
                        }}
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
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    !isLocationOnly ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                                }`}>
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

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
                <div 
                    onClick={() => setStatusFilter('all')}
                    className="cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5 hover:border-primary/50 transition-all"
                >
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl">
                        <UserCheck size={22} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Staff</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</p>
                    </div>
                </div>

                <div 
                    onClick={() => setStatusFilter('approved')}
                    className="cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-950 shadow-sm flex items-center gap-3.5 hover:border-emerald-400 transition-all"
                >
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
                        <ShieldCheck size={22} />
                    </div>
                    <div>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wider">Approved</p>
                        <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{stats.approved}</p>
                    </div>
                </div>

                <div 
                    onClick={() => setStatusFilter('pending')}
                    className="cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-950 shadow-sm flex items-center gap-3.5 hover:border-amber-400 transition-all"
                >
                    <div className="p-3 bg-amber-100 dark:bg-amber-950/60 text-amber-600 rounded-xl">
                        <Clock size={22} />
                    </div>
                    <div>
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold uppercase tracking-wider">Pending Review</p>
                        <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{stats.pending}</p>
                    </div>
                </div>

                <div 
                    onClick={() => setStatusFilter('exempted')}
                    className="cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-xl border border-blue-200 dark:border-blue-950 shadow-sm flex items-center gap-3.5 hover:border-blue-400 transition-all"
                >
                    <div className="p-3 bg-blue-100 dark:bg-blue-950/60 text-blue-600 rounded-xl">
                        <MapPin size={22} />
                    </div>
                    <div>
                        <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold uppercase tracking-wider">Exempted</p>
                        <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{stats.exempted}</p>
                    </div>
                </div>

                <div 
                    onClick={() => setStatusFilter('not_registered')}
                    className="cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5 hover:border-slate-400 transition-all"
                >
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl">
                        <AlertCircle size={22} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Not Enrolled</p>
                        <p className="text-2xl font-black text-slate-600 dark:text-slate-400">{stats.notRegistered}</p>
                    </div>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search employee by name, ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            statusFilter === 'all'
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                    >
                        All ({users.length})
                    </button>
                    <button
                        onClick={() => setStatusFilter('pending')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            statusFilter === 'pending'
                                ? 'bg-amber-500 text-white'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 hover:bg-amber-100'
                        }`}
                    >
                        <Clock size={13} /> Pending ({stats.pending})
                    </button>
                    <button
                        onClick={() => setStatusFilter('approved')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            statusFilter === 'approved'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                    >
                        <Check size={13} /> Approved ({stats.approved})
                    </button>
                    <button
                        onClick={() => setStatusFilter('exempted')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            statusFilter === 'exempted'
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 hover:bg-blue-100'
                        }`}
                    >
                        <MapPin size={13} /> Exempted ({stats.exempted})
                    </button>
                    <button
                        onClick={() => setStatusFilter('not_registered')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            statusFilter === 'not_registered'
                                ? 'bg-slate-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                        }`}
                    >
                        Not Enrolled ({stats.notRegistered})
                    </button>
                </div>
            </div>

            {/* Employee Biometric Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                        <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4">Employee</th>
                                <th className="px-6 py-4">Department & Role</th>
                                <th className="px-6 py-4">Registered Fingerprints & Devices</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        <Fingerprint className="mx-auto mb-2 text-slate-300" size={36} />
                                        No employee records found matching your filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => {
                                    const devices = getUserBiometricDevices(u);
                                    const hasPending = devices.some(d => d.status === 'pending_approval');
                                    const hasApproved = devices.some(d => d.status === 'approved');

                                    return (
                                        <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                            {/* Employee Column */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={u.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60'}
                                                        alt={u.name}
                                                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-900 dark:text-white truncate">
                                                            {u.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            ID: {u.employeeId || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Department & Role */}
                                            <td className="px-6 py-4">
                                                <span className="inline-block font-semibold text-xs text-slate-800 dark:text-slate-200">
                                                    {u.department || 'General'}
                                                </span>
                                                <span className="block text-[11px] text-slate-500">
                                                    {u.role}
                                                </span>
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

                                                                {/* Individual device status badge & Actions */}
                                                                <div className="flex items-center gap-1.5 shrink-0 justify-end">
                                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0 ${
                                                                        device.status === 'approved' 
                                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300' 
                                                                            : device.status === 'pending_approval'
                                                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                                                                            : 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300'
                                                                    }`}>
                                                                        {device.status === 'pending_approval' ? 'Pending' : device.status}
                                                                    </span>

                                                                    {/* Individual Finger Actions */}
                                                                    {device.status === 'pending_approval' && (
                                                                        <button
                                                                            onClick={() => handleApprove(u, device.credentialId)}
                                                                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-xs transition-all active:scale-95 flex items-center gap-0.5"
                                                                            title="Approve this finger"
                                                                        >
                                                                            <Check size={11} /> Approve
                                                                        </button>
                                                                    )}
                                                                    {device.status === 'pending_approval' && (
                                                                        <button
                                                                            onClick={() => handleReject(u, device.credentialId)}
                                                                            className="px-1.5 py-0.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded text-[10px] font-bold transition-all active:scale-95 flex items-center gap-0.5"
                                                                            title="Reject this finger"
                                                                        >
                                                                            <X size={11} /> Reject
                                                                        </button>
                                                                    )}
                                                                    {device.status === 'approved' && (
                                                                        <button
                                                                            onClick={() => handleReject(u, device.credentialId)}
                                                                            className="px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded text-[10px] font-bold transition-all active:scale-95"
                                                                            title="Revoke approval for this finger"
                                                                        >
                                                                            Revoke
                                                                        </button>
                                                                    )}
                                                                    {device.status === 'rejected' && (
                                                                        <button
                                                                            onClick={() => handleApprove(u, device.credentialId)}
                                                                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-all active:scale-95 flex items-center gap-0.5"
                                                                            title="Approve this finger"
                                                                        >
                                                                            <Check size={11} /> Approve
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => handleDeleteDevice(u, device.credentialId, device.slotLabel)}
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
                                                {u.biometricExempt ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                        <MapPin size={12} /> Location Only (Exempt)
                                                    </span>
                                                ) : devices.length === 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                        Unregistered
                                                    </span>
                                                ) : (
                                                    (() => {
                                                        const appCount = devices.filter(d => d.status === 'approved').length;
                                                        const pendCount = devices.filter(d => d.status === 'pending_approval').length;

                                                        if (appCount === devices.length && appCount > 0) {
                                                            return (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                                    <Check size={12} /> All {appCount} Verified
                                                                </span>
                                                            );
                                                        }
                                                        if (appCount > 0 && pendCount > 0) {
                                                            return (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                                                    <ShieldCheck size={12} className="text-emerald-600" /> {appCount} Active, {pendCount} Pending
                                                                </span>
                                                            );
                                                        }
                                                        if (pendCount > 0) {
                                                            return (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
                                                                    <Clock size={12} /> {pendCount} Pending Review
                                                                </span>
                                                            );
                                                        }
                                                        return (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                                                <X size={12} /> Rejected
                                                            </span>
                                                        );
                                                    })()
                                                )}
                                            </td>

                                            {/* Action Buttons Column */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Toggle Biometric Exemption */}
                                                    <button
                                                        onClick={() => handleToggleExemption(u)}
                                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border ${
                                                            u.biometricExempt
                                                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                                                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                                                        }`}
                                                        title={u.biometricExempt ? "Require phone biometric for this user" : "Exempt employee from fingerprint (Location Only)"}
                                                    >
                                                        {u.biometricExempt ? (
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
                                                                onClick={() => handleApprove(u)}
                                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                                                                title="Approve Thumbprint"
                                                            >
                                                                <Check size={14} /> Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(u)}
                                                                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                                                                title="Reject Thumbprint"
                                                            >
                                                                <X size={14} /> Reject
                                                            </button>
                                                        </>
                                                    )}

                                                    {!hasPending && hasApproved && (
                                                        <button
                                                            onClick={() => handleReject(u)}
                                                            className="px-2.5 py-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors"
                                                            title="Revoke / Reject Biometric"
                                                        >
                                                            Revoke
                                                        </button>
                                                    )}

                                                    {devices.length > 0 && (
                                                        <button
                                                            onClick={() => handleReset(u)}
                                                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                            title="Reset Biometrics (Allow employee to register new phone or new finger)"
                                                        >
                                                            <RefreshCw size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManageBiometrics;
