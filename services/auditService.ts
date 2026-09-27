/**
 * File: auditService.ts
 * Purpose: Centralized auditing for security and event tracking.
 */
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export enum AuditActionType {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ROLE_CHANGE = 'ROLE_CHANGE',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  LEAVE_APPROVAL = 'LEAVE_APPROVAL',
  LEAVE_REJECTION = 'LEAVE_REJECTION',
  USER_CREATED = 'USER_CREATED',
  USER_DELETED = 'USER_DELETED',
}

interface AuditLog {
  actionType: AuditActionType;
  userId: string;
  userName: string;
  targetId?: string; // ID of the user/entity being affected
  details: string;
  timestamp?: any;
}

export const logAuditEvent = async (log: Omit<AuditLog, 'timestamp'>) => {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      ...log,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Do not throw error here, auditing failure shouldn't break the main flow
  }
};
