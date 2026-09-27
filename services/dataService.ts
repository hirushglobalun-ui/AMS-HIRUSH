/**
 * File: dataService.ts
 * Purpose: Centralized data fetching and subscription service.
 * Author: Refactored system
 * Notes: 
 *  - Added pagination support (startAfterDoc) for scalability.
 *  - Maintained backward compatibility with existing UI components.
 *  - Improved cache invalidation.
 */

import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  limit,
  orderBy,
  startAfter,
  QueryConstraint,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { User, AttendanceRecord, LeaveRequest, ResearchResource } from '../types';

// Simple in-memory cache
const cache = {
  users: null as User[] | null,
  usersTimestamp: 0,
  attendance: null as AttendanceRecord[] | null,
  attendanceTimestamp: 0,
  leaveRequests: null as LeaveRequest[] | null,
  leaveRequestsTimestamp: 0,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper to check if cache is valid
const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_DURATION;
};

/**
 * Fetch users with optional caching and pagination.
 * @param forceRefresh Bypass the cache
 * @param limitCount Maximum number of users to fetch
 * @param startAfterDoc Document snapshot to paginate from
 */
export const fetchUsers = async (
  forceRefresh = false,
  limitCount?: number,
  startAfterDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<User[]> => {
  
  // Only use cache if no pagination is requested
  const useCache = !limitCount && !startAfterDoc && !forceRefresh;

  if (useCache && cache.users && isCacheValid(cache.usersTimestamp)) {
    return cache.users;
  }

  try {
    const constraints: QueryConstraint[] = [];
    
    if (limitCount) {
      constraints.push(limit(limitCount));
    }
    if (startAfterDoc) {
      constraints.push(startAfter(startAfterDoc));
    }

    const usersQuery = constraints.length > 0 
      ? query(collection(db, 'users'), ...constraints)
      : collection(db, 'users');

    const usersSnapshot = await getDocs(usersQuery);
    const usersData: User[] = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User));

    if (useCache) {
      cache.users = usersData;
      cache.usersTimestamp = Date.now();
    }

    return usersData;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const autoCloseStaleAttendanceSessions = async (records: AttendanceRecord[]): Promise<boolean> => {
  if (!records || records.length === 0) return false;
  const todayStr = getLocalDateString();
  const now = new Date();
  const isPast1150PM = now.getHours() > 23 || (now.getHours() === 23 && now.getMinutes() >= 50);

  let updatesMade = false;

  for (const record of records) {
    if (!record.sessions || !Array.isArray(record.sessions) || record.sessions.length === 0) continue;
    const isPastDay = record.date < todayStr;
    const isTodayStale = record.date === todayStr && isPast1150PM;

    const hasOpenSession = record.sessions.some(s => !s.checkOut);
    const hasStaleAutoCheckedOut = record.sessions.some(s => (s as any).autoCheckedOut && s.checkOut && s.checkOut !== '23:50:00' && s.checkOut !== '22:20:00');
    const hasAutoCheckedOutSession = record.sessions.some(s => !(s as any).isManuallyEdited && ((s as any).autoCheckedOut || s.checkOut === '23:50:00' || s.checkOut === '22:20:00') && (s.checkOut === '23:50:00' || s.checkOut === '22:20:00'));

    if (((isPastDay || isTodayStale) && hasOpenSession) || hasAutoCheckedOutSession || hasStaleAutoCheckedOut) {
      let dailyTotalHours = 0;
      const updatedSessions = record.sessions.map(s => {
        if (!s.checkOut && (isPastDay || isTodayStale)) {
          return { ...s, checkOut: '23:50:00', autoCheckedOut: true };
        }
        // Self-heal: If session checkout was edited away from auto-checkout times, clear autoCheckedOut
        if (s.checkOut && s.checkOut !== '23:50:00' && s.checkOut !== '22:20:00' && (s as any).autoCheckedOut) {
          return { ...s, autoCheckedOut: false, isManuallyEdited: true };
        }
        return s;
      });

      updatedSessions.forEach(s => {
        if (!s.checkIn) return;
        const checkOutTime = s.checkOut || '23:50:00';
        const start = new Date(`${record.date}T${s.checkIn}`);
        const end = new Date(`${record.date}T${checkOutTime}`);
        let diffMs = end.getTime() - start.getTime();
        if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
        let hours = diffMs / (1000 * 60 * 60);

        const isAuto = !(s as any).isManuallyEdited && ((s as any).autoCheckedOut === true || ((s as any).autoCheckedOut !== false && (checkOutTime === '23:50:00' || checkOutTime === '22:20:00'))) && (checkOutTime === '23:50:00' || checkOutTime === '22:20:00');
        if (isAuto) {
          hours = Math.min(hours, 4.0);
        }
        dailyTotalHours += hours;
      });

      const finalHours = parseFloat(dailyTotalHours.toFixed(2));

      if (record.totalHours !== finalHours || hasOpenSession || hasStaleAutoCheckedOut) {
        record.sessions = updatedSessions;
        record.totalHours = finalHours;

        if (record.id && !record.id.startsWith('new-') && !record.id.startsWith('absent-')) {
          try {
            const recordRef = doc(db, 'attendance', record.id);
            await updateDoc(recordRef, {
              sessions: updatedSessions,
              totalHours: finalHours
            });
            updatesMade = true;
          } catch (err) {
            console.error("Error updating auto-closed attendance record:", err);
          }
        }
      }
    }
  }

  return updatesMade;
};

/**
 * Fetch attendance records with optional date filtering and pagination
 */
export const fetchAttendance = async (
  options?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    userId?: string;
    limitCount?: number;
    startAfterDoc?: QueryDocumentSnapshot<DocumentData>;
    forceRefresh?: boolean;
    skipAutoClose?: boolean;
  }
): Promise<AttendanceRecord[]> => {
  const { date, startDate, endDate, userId, limitCount, startAfterDoc, forceRefresh = false, skipAutoClose = false } = options || {};

  const useCache = !date && !startDate && !endDate && !userId && !limitCount && !startAfterDoc;

  if (!forceRefresh && useCache && cache.attendance && isCacheValid(cache.attendanceTimestamp)) {
    return cache.attendance;
  }

  try {
    const constraints: QueryConstraint[] = [];

    if (userId) {
      constraints.push(where('userId', '==', userId));
      if (date) {
        constraints.push(where('date', '==', date));
      }
    } else {
      if (date) {
        constraints.push(where('date', '==', date));
      }
      if (startDate && endDate) {
        constraints.push(where('date', '>=', startDate), where('date', '<=', endDate));
      } else if (startDate) {
        constraints.push(where('date', '>=', startDate));
      } else if (endDate) {
        constraints.push(where('date', '<=', endDate));
      }
    }
    
    // Always order by date if paginating or limiting
    if (limitCount || startAfterDoc) {
      constraints.push(orderBy('date', 'desc'));
    }
    if (startAfterDoc) {
      constraints.push(startAfter(startAfterDoc));
    }
    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    const attendanceQuery = constraints.length > 0
      ? query(collection(db, 'attendance'), ...constraints)
      : collection(db, 'attendance');

    const snapshot = await getDocs(attendanceQuery);
    let attendanceData: AttendanceRecord[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AttendanceRecord));

    // In-memory date filtering when filtered by userId to prevent composite index requirement
    if (userId) {
      if (startDate && endDate) {
        attendanceData = attendanceData.filter(d => d.date >= startDate && d.date <= endDate);
      } else if (startDate) {
        attendanceData = attendanceData.filter(d => d.date >= startDate);
      } else if (endDate) {
        attendanceData = attendanceData.filter(d => d.date <= endDate);
      }
    }

    // Auto-close any un-closed sessions from previous days or past 11:50 PM
    if (!skipAutoClose) {
      await autoCloseStaleAttendanceSessions(attendanceData);
    }

    if (useCache) {
      cache.attendance = attendanceData;
      cache.attendanceTimestamp = Date.now();
    }

    return attendanceData;
  } catch (error) {
    console.error('Error fetching attendance:', error);
    throw error;
  }
};

/**
 * Fetch leave requests with optional filtering and pagination
 */
export const fetchLeaveRequests = async (
  options?: {
    status?: string;
    userId?: string;
    limitCount?: number;
    startAfterDoc?: QueryDocumentSnapshot<DocumentData>;
    forceRefresh?: boolean;
  }
): Promise<LeaveRequest[]> => {
  const { status, userId, limitCount, startAfterDoc, forceRefresh = false } = options || {};

  const useCache = !status && !userId && !limitCount && !startAfterDoc;

  if (!forceRefresh && useCache && cache.leaveRequests && isCacheValid(cache.leaveRequestsTimestamp)) {
    return cache.leaveRequests;
  }

  try {
    const constraints: QueryConstraint[] = [];

    if (status) {
      constraints.push(where('status', '==', status));
    }
    if (userId) {
      constraints.push(where('userId', '==', userId));
    }
    
    // Required for pagination
    if (limitCount || startAfterDoc) {
      constraints.push(orderBy('createdAt', 'desc'));
    }
    if (startAfterDoc) {
      constraints.push(startAfter(startAfterDoc));
    }
    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    const leaveQuery = constraints.length > 0
      ? query(collection(db, 'leaveRequests'), ...constraints)
      : collection(db, 'leaveRequests');

    const snapshot = await getDocs(leaveQuery);
    const leaveData: LeaveRequest[] = snapshot.docs.map(doc => {
      const data = doc.data() as LeaveRequest;
      if (data.leaveType === 'Earned' as any) data.leaveType = 'Casual' as any;
      return {
        id: doc.id,
        ...data
      };
    });

    if (useCache) {
      cache.leaveRequests = leaveData;
      cache.leaveRequestsTimestamp = Date.now();
    }

    return leaveData;
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for the users collection.
 */
export const subscribeToUsers = (callback: (users: User[]) => void): (() => void) => {
  return onSnapshot(
    collection(db, 'users'),
    (snapshot) => {
      const usersData: User[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));

      cache.users = usersData;
      cache.usersTimestamp = Date.now();
      callback(usersData);
    },
    (error) => console.error('Error in users subscription:', error)
  );
};

/**
 * Subscribe to attendance for a specific date
 */
export const subscribeToAttendanceByDate = (
  date: string,
  callback: (attendance: AttendanceRecord[]) => void
): (() => void) => {
  return onSnapshot(
    query(collection(db, 'attendance'), where('date', '==', date)),
    (snapshot) => {
      const attendanceData: AttendanceRecord[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AttendanceRecord));
      callback(attendanceData);
    },
    (error) => console.error('Error in attendance subscription:', error)
  );
};

/**
 * Subscribe to attendance for a specific user
 */
export const subscribeToAttendanceByUser = (
  userId: string,
  callback: (attendance: AttendanceRecord[]) => void
): (() => void) => {
  return onSnapshot(
    query(collection(db, 'attendance'), where('userId', '==', userId)),
    (snapshot) => {
      const attendanceData: AttendanceRecord[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AttendanceRecord));
      callback(attendanceData);
    },
    (error) => console.error('Error in user attendance subscription:', error)
  );
};

/**
 * Clear all caches completely.
 */
export const clearCache = (): void => {
  cache.users = null;
  cache.usersTimestamp = 0;
  cache.attendance = null;
  cache.attendanceTimestamp = 0;
  cache.leaveRequests = null;
  cache.leaveRequestsTimestamp = 0;
};

/**
 * Invalidate a specific cache bucket.
 */
export const invalidateCache = (cacheType: 'users' | 'attendance' | 'leaveRequests'): void => {
  switch (cacheType) {
    case 'users':
      cache.users = null;
      cache.usersTimestamp = 0;
      break;
    case 'attendance':
      cache.attendance = null;
      cache.attendanceTimestamp = 0;
      break;
    case 'leaveRequests':
      cache.leaveRequests = null;
      cache.leaveRequestsTimestamp = 0;
      break;
  }
};

/**
 * Fetch all research resources
 */
export const fetchResearchResources = async (): Promise<ResearchResource[]> => {
  try {
    const q = query(collection(db, 'research'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ResearchResource));
  } catch (error) {
    console.error('Error fetching research resources:', error);
    throw error;
  }
};

/**
 * Add a new research resource
 */
export const addResearchResource = async (resource: Omit<ResearchResource, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'research'), resource);
    return docRef.id;
  } catch (error) {
    console.error('Error adding research resource:', error);
    throw error;
  }
};

/**
 * Delete a research resource
 */
export const deleteResearchResource = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'research', id));
  } catch (error) {
    console.error('Error deleting research resource:', error);
    throw error;
  }
};
