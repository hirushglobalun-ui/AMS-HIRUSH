import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { LeaveType, LeaveStatus, LeaveRequest } from '../types';

export interface TodayWFHInfo {
  hasWFH: boolean;
  isApproved: boolean;
  isPending: boolean;
  status: 'Approved' | 'Pending' | null;
  request?: LeaveRequest;
}

/**
 * Checks whether a given user has an active WFH request (Approved or Pending) for the given date.
 * @param userId - ID of the user
 * @param dateStr - YYYY-MM-DD format date string
 */
export const getTodayWFHStatus = async (userId: string, dateStr: string): Promise<TodayWFHInfo> => {
  if (!userId || !dateStr) {
    return { hasWFH: false, isApproved: false, isPending: false, status: null };
  }

  try {
    const q = query(
      collection(db, 'leaveRequests'),
      where('userId', '==', userId),
      where('leaveType', '==', LeaveType.WFH)
    );

    const snap = await getDocs(q);
    const matchingRequests: LeaveRequest[] = [];

    snap.forEach((doc) => {
      const data = { id: doc.id, ...doc.data() } as LeaveRequest;
      // Check if dateStr falls between startDate and endDate (inclusive)
      if (data.startDate && data.endDate) {
        if (dateStr >= data.startDate && dateStr <= data.endDate) {
          matchingRequests.push(data);
        }
      } else if (data.startDate === dateStr) {
        matchingRequests.push(data);
      }
    });

    // Check for Approved first
    const approved = matchingRequests.find(r => r.status === LeaveStatus.APPROVED);
    if (approved) {
      return {
        hasWFH: true,
        isApproved: true,
        isPending: false,
        status: 'Approved',
        request: approved
      };
    }

    // Check for Pending
    const pending = matchingRequests.find(r => r.status === LeaveStatus.PENDING);
    if (pending) {
      return {
        hasWFH: true,
        isApproved: false,
        isPending: true,
        status: 'Pending',
        request: pending
      };
    }

    return { hasWFH: false, isApproved: false, isPending: false, status: null };
  } catch (error) {
    console.error("Error checking WFH status for date:", error);
    return { hasWFH: false, isApproved: false, isPending: false, status: null };
  }
};
