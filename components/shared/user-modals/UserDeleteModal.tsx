/**
 * File: UserDeleteModal.tsx
 * Purpose: Provides a confirmation dialog for securely deleting a user and their associated data.
 * Layer: UI / Component / Modal
 * Notes: Refactored for production readiness without behavior change.
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle } from 'lucide-react';
import { User } from '../../../types';
import { db } from '../../../firebase';
import { doc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { logAuditEvent, AuditActionType } from '../../../services/auditService';

interface UserDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    userToDelete: User | null;
    onSuccess: () => void;
}

const UserDeleteModal: React.FC<UserDeleteModalProps> = ({ isOpen, onClose, userToDelete, onSuccess }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmName, setConfirmName] = useState('');

    const handleDelete = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        try {
            const { id, name } = userToDelete;
            const batch = writeBatch(db);

            // Queue attendance for deletion
            const attendanceQuery = query(collection(db, 'attendance'), where('userId', '==', id));
            const attendanceSnapshot = await getDocs(attendanceQuery);
            attendanceSnapshot.forEach(doc => batch.delete(doc.ref));

            // Queue leave requests for deletion
            const leaveQuery = query(collection(db, 'leaveRequests'), where('userId', '==', id));
            const leaveSnapshot = await getDocs(leaveQuery);
            leaveSnapshot.forEach(doc => batch.delete(doc.ref));

            // Queue the user document for deletion
            const userRef = doc(db, "users", id);
            batch.delete(userRef);

            // Commit atomic operation
            await batch.commit();

            logAuditEvent({
                actionType: AuditActionType.USER_DELETED,
                userId: id,
                userName: name,
                details: `User deleted by admin/HR.`
            });

            toast.success(`User "${name}" and all associated data have been deleted.`);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error deleting user: ", error);
            toast.error("Failed to delete user. Please check the console for details.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (!isOpen || !userToDelete) return null;

    return createPortal(
        <div 
            onClick={onClose}
            className="fixed inset-0 bg-transparent flex justify-center items-center z-[9999] p-4 animate-in fade-in duration-200"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-0 w-full max-w-md m-4 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            >
                <div className="p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Delete User Account</h3>
                    <p className="text-slate-500 mb-6">
                        Are you sure you want to permanently delete <span className="font-bold text-slate-700">{userToDelete.name}</span>? This action cannot be undone.
                    </p>
                    
                    <div className="w-full text-left bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Type "{userToDelete.name}" to confirm</p>
                        <input
                            type="text"
                            value={confirmName}
                            onChange={(e) => setConfirmName(e.target.value)}
                            className="w-full max-w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-400 font-medium transition-all outline-none hover:border-slate-400 focus:border-red-600 focus:ring-4 focus:ring-red-500/15 shadow-sm"
                            placeholder="Type user's name"
                        />
                    </div>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                            disabled={isDeleting}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting || confirmName !== userToDelete.name}
                            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {isDeleting ? 'Deleting...' : 'Yes, Delete User'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default UserDeleteModal;
