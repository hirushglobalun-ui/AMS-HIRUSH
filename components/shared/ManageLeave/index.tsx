/**
 * @file index.tsx
 * @description React component for rendering index UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Card from '../../common/Card';
import Button from '../../common/Button';
import { LeaveRequest, User, LeaveStatus, LeaveType } from '../../../types';
import { toast } from 'react-hot-toast';
import { db } from '../../../firebase';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { fetchUsers, fetchLeaveRequests, invalidateCache } from '../../../services/dataService';
import { Download, Clock, CheckCircle, XCircle } from 'lucide-react';
import { exportToCSV } from '../../../services/exportService';
import { logAuditEvent, AuditActionType } from '../../../services/auditService';
import { getLeaveDays } from './utils';

import LeaveTable from './LeaveTable';
import LeaveDetailModal from './LeaveDetailModal';
import LeaveActionModal from './LeaveActionModal';

const ManageLeave: React.FC = () => {
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [filterStatus, setFilterStatus] = useState<LeaveStatus | 'all'>('all');
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
    const [statusAction, setStatusAction] = useState<{ id: string; status: LeaveStatus; employeeName: string } | null>(null);
    const [statusReasonText, setStatusReasonText] = useState('');

    // Pagination State
    const [limitCount, setLimitCount] = useState(20);
    const [hasMore, setHasMore] = useState(true);

    const fetchLeaveRequestsAndUsers = useCallback(async (currentLimit = limitCount) => {
        setLoading(true);
        try {
            // Fetch leave requests (with caching bypassed due to limitCount)
            const requestsData = await fetchLeaveRequests({ limitCount: currentLimit });
            setLeaveRequests(requestsData);
            setHasMore(requestsData.length === currentLimit);

            // Fetch users (with caching)
            const usersData = await fetchUsers();
            setUsers(usersData);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load leave requests.");
        }
        setLoading(false);
    }, []);

    const handleLoadMore = () => {
        const newLimit = limitCount + 20;
        setLimitCount(newLimit);
        fetchLeaveRequestsAndUsers(newLimit);
    };

    useEffect(() => {
        fetchLeaveRequestsAndUsers();
    }, [fetchLeaveRequestsAndUsers]);


    const requestsWithUser = useMemo(() => {
        return leaveRequests.map(req => {
            const user = users.find(emp => emp.id === req.userId);
            return {
                ...req,
                userName: user?.name || 'Unknown',
                userEmail: user?.email || ''
            };
        }).sort((a, b) => {
            const getSeconds = (req: any) => {
                if (req.createdAt) {
                    if (typeof req.createdAt.toDate === 'function') {
                        return req.createdAt.toDate().getTime();
                    }
                    if (req.createdAt.seconds) {
                        return req.createdAt.seconds * 1000;
                    }
                    const d = new Date(req.createdAt);
                    if (!isNaN(d.getTime())) {
                        return d.getTime();
                    }
                }
                if (req.startDate) {
                    return new Date(req.startDate).getTime();
                }
                return 0;
            };
            return getSeconds(b) - getSeconds(a);
        });
    }, [leaveRequests, users]);

    const filteredRequests = useMemo(() => {
        if (filterStatus === 'all') return requestsWithUser;
        return requestsWithUser.filter(req => req.status === filterStatus);
    }, [requestsWithUser, filterStatus]);

    const handleStatusChange = async (id: string, newStatus: LeaveStatus, reason?: string) => {
        const reqRef = doc(db, 'leaveRequests', id);
        try {
            await updateDoc(reqRef, { 
                status: newStatus,
                ...(reason ? { statusReason: reason } : {})
            });
            setLeaveRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus, statusReason: reason || req.statusReason } : req));
            
            // Log Audit Event
            const req = leaveRequests.find(r => r.id === id);
            if (req) {
                const user = users.find(u => u.id === req.userId);
                logAuditEvent({
                    actionType: newStatus === LeaveStatus.APPROVED ? AuditActionType.LEAVE_APPROVAL : AuditActionType.LEAVE_REJECTION,
                    userId: req.userId,
                    userName: user?.name || 'Unknown',
                    targetId: id,
                    details: `Leave request ${newStatus.toLowerCase()} by admin/HR`
                });

                // If WFH approved, auto-approve any pending WFH attendance sessions recorded by the employee for those dates
                if (newStatus === LeaveStatus.APPROVED && req.leaveType === LeaveType.WFH) {
                    try {
                        const attQuery = query(
                            collection(db, 'attendance'),
                            where('userId', '==', req.userId)
                        );
                        const attSnap = await getDocs(attQuery);
                        const batchUpdates: Promise<void>[] = [];
                        attSnap.forEach(d => {
                            const attData = d.data();
                            if (attData.date && attData.date >= req.startDate && attData.date <= req.endDate) {
                                if (attData.wfhStatus === 'pending' || attData.isWFH) {
                                    const updatedSessions = (attData.sessions || []).map((s: any) => ({
                                        ...s,
                                        ...(s.isWFH ? { wfhStatus: 'approved' } : {})
                                    }));
                                    batchUpdates.push(
                                        updateDoc(doc(db, 'attendance', d.id), {
                                            isWFH: true,
                                            wfhStatus: 'approved',
                                            sessions: updatedSessions
                                        })
                                    );
                                }
                            }
                        });
                        if (batchUpdates.length > 0) {
                            await Promise.all(batchUpdates);
                            invalidateCache('attendance');
                        }
                    } catch (attErr) {
                        console.error("Error auto-validating WFH attendance sessions:", attErr);
                    }
                }
            }

            toast.success(`Leave request has been ${newStatus.toLowerCase()}.`);
            // Invalidate cache
            invalidateCache('leaveRequests');
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status.");
        }
    };

    const handleExportLeaves = () => {
        if (filteredRequests.length === 0) {
            toast.error("No data to export.");
            return;
        }

        const exportData = filteredRequests.map(req => ({
            'Employee': req.userName,
            'Email': req.userEmail,
            'Leave Type': req.leaveType,
            'Start Date': req.startDate,
            'End Date': req.endDate,
            'Reason': req.reason,
            'Status': req.status
        }));

        exportToCSV(exportData, `Leave_Requests_${new Date().toISOString().split('T')[0]}`);
        toast.success("Leave requests exported!");
    };


    // Calculate stats
    const stats = useMemo(() => {
        const pending = leaveRequests.filter(r => r.status === LeaveStatus.PENDING).length;
        const approved = leaveRequests.filter(r => r.status === LeaveStatus.APPROVED).length;
        const rejected = leaveRequests.filter(r => r.status === LeaveStatus.REJECTED).length;

        const approvedRequests = leaveRequests.filter(r => r.status === LeaveStatus.APPROVED);
        const approvedDays = approvedRequests.reduce((sum, r) => sum + getLeaveDays(r), 0);
        const approvedFullDays = approvedRequests.filter(r => r.duration !== 'Half Day').reduce((sum, r) => sum + getLeaveDays(r), 0);
        const approvedHalfDays = approvedRequests.filter(r => r.duration === 'Half Day').length;

        return { pending, approved, rejected, approvedDays, approvedFullDays, approvedHalfDays };
    }, [leaveRequests]);

    const [searchTerm, setSearchTerm] = useState('');

    const filteredAndSearchedRequests = useMemo(() => {
        let result = filteredRequests;
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(req =>
                req.userName.toLowerCase().includes(lowerTerm) ||
                req.leaveType.toLowerCase().includes(lowerTerm)
            );
        }
        return result;
    }, [filteredRequests, searchTerm]);

    // UI uses Load More, so we pass all loaded requests directly to the table
    const paginatedRequests = filteredAndSearchedRequests;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Leave Management</h1>
                    <p className="text-slate-500">Review and manage employee leave requests</p>
                </div>
                <button
                    onClick={handleExportLeaves}
                    className="w-full sm:w-auto justify-center px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2 text-sm"
                >
                    <Download size={18} /> Export CSV
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 sm:gap-4">
                    <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Pending Requests</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stats.pending}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Approved Days (Total)</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stats.approvedDays} Day{stats.approvedDays !== 1 ? 's' : ''}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{stats.approved} request{stats.approved !== 1 ? 's' : ''} ({stats.approvedFullDays} days full, {stats.approvedHalfDays} half-day)</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                        <XCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Rejected (Total)</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stats.rejected}</h3>
                    </div>
                </div>
            </div>

            <LeaveTable
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                paginatedRequests={paginatedRequests}
                loading={loading}
                hasMore={hasMore}
                handleLoadMore={handleLoadMore}
                setSelectedRequest={setSelectedRequest}
                setStatusAction={setStatusAction}
                setStatusReasonText={setStatusReasonText}
            />

            <LeaveDetailModal
                selectedRequest={selectedRequest}
                setSelectedRequest={setSelectedRequest}
                setStatusAction={setStatusAction}
                setStatusReasonText={setStatusReasonText}
            />

            <LeaveActionModal
                statusAction={statusAction}
                setStatusAction={setStatusAction}
                statusReasonText={statusReasonText}
                setStatusReasonText={setStatusReasonText}
                handleStatusChange={handleStatusChange}
            />
        </div>
    );
};

export default ManageLeave;
