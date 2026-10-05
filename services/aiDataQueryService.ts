/**
 * File: services/aiDataQueryService.ts
 * Purpose: Direct, secure client-side Firestore query engine for the Hirush AI Copilot.
 * Queries live data across attendance, leads, users, leave requests, domains, and holidays.
 */

import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { User, AttendanceRecord, Lead, LeaveRequest, CustomDomain, Holiday, Role } from '../types';

export interface AttendanceQueryResult {
  date: string;
  totalPresent: number;
  totalAbsent: number;
  totalWFH: number;
  presentUsers: {
    userId: string;
    name: string;
    employeeId: string;
    department: string;
    role: string;
    checkIn: string;
    checkOut: string | null;
    totalHours: number;
    isWFH: boolean;
    biometricVerified: boolean;
  }[];
  absentUsers: {
    userId: string;
    name: string;
    employeeId: string;
    department: string;
    role: string;
  }[];
}

export interface LeadsQueryResult {
  totalCount: number;
  statusBreakdown: Record<string, number>;
  leads: {
    id: string;
    projectName: string;
    clientName: string;
    clientType?: string;
    pocName?: string;
    pocPhone?: string;
    status: string;
    domainDetail?: string;
    remark?: string;
    firstStartDate?: string;
    expiryDate?: string;
  }[];
}

export interface LeaveQueryResult {
  totalCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  leaves: {
    id: string;
    userName: string;
    userDepartment: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    duration?: string;
    reason: string;
    status: string;
  }[];
}

export interface DomainsQueryResult {
  totalCount: number;
  expiringCount: number;
  dnsIssueCount: number;
  sslIssueCount: number;
  domains: {
    id: string;
    projectName: string;
    domainDetail: string;
    expiryDate: string;
    daysUntilExpiry: number;
    dnsStatus?: string;
    sslStatus?: string;
    sslDaysLeft?: number;
    pocName?: string;
    healthError?: string;
  }[];
}

export interface TeamQueryResult {
  totalMembers: number;
  departmentCounts: Record<string, number>;
  roleCounts: Record<string, number>;
  members: {
    id: string;
    name: string;
    employeeId: string;
    department: string;
    role: string;
    position?: string;
    email: string;
    phone: string;
    status: string;
  }[];
}

/**
 * Cache users in memory for quick lookups during session
 */
let cachedUsers: User[] | null = null;
let lastUserFetchTime = 0;

export async function getAllUsersCached(): Promise<User[]> {
  const now = Date.now();
  if (cachedUsers && now - lastUserFetchTime < 60000) {
    return cachedUsers;
  }
  try {
    const snap = await getDocs(collection(db, 'users'));
    cachedUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    lastUserFetchTime = now;
    return cachedUsers;
  } catch (err) {
    console.error('Failed to fetch cached users for AI engine:', err);
    return cachedUsers || [];
  }
}

/**
 * Query live attendance records for a specific date or date range
 */
export async function queryAttendance(targetDate: string): Promise<AttendanceQueryResult> {
  const allUsers = await getAllUsersCached();
  // Filter active staff (excluding visitors)
  const activeStaff = allUsers.filter(u => u.status === 'Active' && u.role !== Role.VISITOR);

  const attRef = collection(db, 'attendance');
  const q = query(attRef, where('date', '==', targetDate));
  const snap = await getDocs(q);

  const presentMap = new Map<string, any>();

  snap.forEach(doc => {
    const data = doc.data() as AttendanceRecord;
    const firstSession = data.sessions && data.sessions[0];
    const lastSession = data.sessions && data.sessions[data.sessions.length - 1];

    presentMap.set(data.userId, {
      checkIn: firstSession?.checkIn || '09:00',
      checkOut: lastSession?.checkOut || null,
      totalHours: Number(data.totalHours || 0),
      isWFH: Boolean(data.isWFH || firstSession?.isWFH),
      biometricVerified: Boolean(firstSession?.biometricVerified),
    });
  });

  const presentUsers: AttendanceQueryResult['presentUsers'] = [];
  const absentUsers: AttendanceQueryResult['absentUsers'] = [];

  activeStaff.forEach(user => {
    const att = presentMap.get(user.id);
    if (att) {
      presentUsers.push({
        userId: user.id,
        name: user.name,
        employeeId: user.employeeId || 'N/A',
        department: user.department || 'General',
        role: user.role,
        checkIn: att.checkIn,
        checkOut: att.checkOut,
        totalHours: att.totalHours,
        isWFH: att.isWFH,
        biometricVerified: att.biometricVerified,
      });
    } else {
      absentUsers.push({
        userId: user.id,
        name: user.name,
        employeeId: user.employeeId || 'N/A',
        department: user.department || 'General',
        role: user.role,
      });
    }
  });

  return {
    date: targetDate,
    totalPresent: presentUsers.length,
    totalAbsent: absentUsers.length,
    totalWFH: presentUsers.filter(u => u.isWFH).length,
    presentUsers,
    absentUsers,
  };
}

/**
 * Query CRM leads by status, client name, or general keyword
 */
export async function queryLeads(filterStatus?: string, keyword?: string): Promise<LeadsQueryResult> {
  const leadsRef = collection(db, 'leads');
  let snap;

  if (filterStatus && filterStatus.toLowerCase() !== 'all') {
    const q = query(leadsRef, where('status', '==', filterStatus));
    snap = await getDocs(q);
  } else {
    snap = await getDocs(leadsRef);
  }

  const statusBreakdown: Record<string, number> = {};
  let list: Lead[] = [];

  snap.forEach(doc => {
    const data = { id: doc.id, ...doc.data() } as Lead;
    statusBreakdown[data.status] = (statusBreakdown[data.status] || 0) + 1;
    list.push(data);
  });

  if (keyword) {
    const lower = keyword.toLowerCase();
    list = list.filter(
      l =>
        l.projectName?.toLowerCase().includes(lower) ||
        l.clientName?.toLowerCase().includes(lower) ||
        l.pocName?.toLowerCase().includes(lower) ||
        l.remark?.toLowerCase().includes(lower)
    );
  }

  const leads = list.map(l => ({
    id: l.id,
    projectName: l.projectName || 'Untitled Lead',
    clientName: l.clientName || 'N/A',
    clientType: l.clientType,
    pocName: l.pocName,
    pocPhone: l.pocPhone,
    status: l.status,
    domainDetail: l.domainDetail,
    remark: l.remark,
    firstStartDate: l.firstStartDate,
    expiryDate: l.expiryDate,
  }));

  return {
    totalCount: list.length,
    statusBreakdown,
    leads,
  };
}

/**
 * Query Leave Requests (Pending, Approved, Rejected)
 */
export async function queryLeaveRequests(statusFilter?: string): Promise<LeaveQueryResult> {
  const users = await getAllUsersCached();
  const userMap = new Map(users.map(u => [u.id, u]));

  const leaveRef = collection(db, 'leaveRequests');
  let snap;

  if (statusFilter && statusFilter.toLowerCase() !== 'all') {
    const q = query(leaveRef, where('status', '==', statusFilter));
    snap = await getDocs(q);
  } else {
    snap = await getDocs(leaveRef);
  }

  let pendingCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;

  const leaves: LeaveQueryResult['leaves'] = [];

  snap.forEach(doc => {
    const d = { id: doc.id, ...doc.data() } as LeaveRequest;
    if (d.status === 'Pending') pendingCount++;
    if (d.status === 'Approved') approvedCount++;
    if (d.status === 'Rejected') rejectedCount++;

    const userInfo = userMap.get(d.userId);
    leaves.push({
      id: d.id,
      userName: userInfo?.name || 'Staff Member',
      userDepartment: userInfo?.department || 'General',
      leaveType: d.leaveType,
      startDate: d.startDate,
      endDate: d.endDate,
      duration: d.duration || 'Full Day',
      reason: d.reason || 'Not specified',
      status: d.status,
    });
  });

  return {
    totalCount: leaves.length,
    pendingCount,
    approvedCount,
    rejectedCount,
    leaves,
  };
}

/**
 * Query custom domains and SSL/DNS health
 */
export async function queryDomains(): Promise<DomainsQueryResult> {
  const domRef = collection(db, 'domains');
  const snap = await getDocs(domRef);

  let expiringCount = 0;
  let dnsIssueCount = 0;
  let sslIssueCount = 0;
  const now = new Date();

  const domains: DomainsQueryResult['domains'] = [];

  snap.forEach(doc => {
    const d = { id: doc.id, ...doc.data() } as CustomDomain;
    let daysUntilExpiry = 999;

    if (d.expiryDate) {
      const exp = new Date(d.expiryDate);
      daysUntilExpiry = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
      if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
        expiringCount++;
      }
    }

    if (d.dnsStatus === 'Issue Detected') dnsIssueCount++;
    if (d.sslStatus === 'Issue Detected') sslIssueCount++;

    domains.push({
      id: d.id,
      projectName: d.projectName || 'Domain Record',
      domainDetail: d.domainDetail,
      expiryDate: d.expiryDate,
      daysUntilExpiry,
      dnsStatus: d.dnsStatus,
      sslStatus: d.sslStatus,
      sslDaysLeft: d.sslDaysLeft,
      pocName: d.pocName,
      healthError: d.healthError,
    });
  });

  return {
    totalCount: domains.length,
    expiringCount,
    dnsIssueCount,
    sslIssueCount,
    domains,
  };
}

/**
 * Query Team members and department distribution
 */
export async function queryTeam(departmentFilter?: string, roleFilter?: string): Promise<TeamQueryResult> {
  const users = await getAllUsersCached();
  let filtered = users;

  if (departmentFilter) {
    filtered = filtered.filter(u => u.department?.toLowerCase() === departmentFilter.toLowerCase());
  }
  if (roleFilter) {
    filtered = filtered.filter(u => u.role?.toLowerCase() === roleFilter.toLowerCase());
  }

  const departmentCounts: Record<string, number> = {};
  const roleCounts: Record<string, number> = {};

  filtered.forEach(u => {
    departmentCounts[u.department || 'General'] = (departmentCounts[u.department || 'General'] || 0) + 1;
    roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
  });

  const members = filtered.map(u => ({
    id: u.id,
    name: u.name,
    employeeId: u.employeeId || 'N/A',
    department: u.department || 'General',
    role: u.role,
    position: u.position,
    email: u.email,
    phone: u.phone,
    status: u.status,
  }));

  return {
    totalMembers: filtered.length,
    departmentCounts,
    roleCounts,
    members,
  };
}

/**
 * Query holidays calendar
 */
export async function queryHolidays(): Promise<Holiday[]> {
  const holRef = collection(db, 'holidays');
  const snap = await getDocs(holRef);
  const list: Holiday[] = [];
  snap.forEach(doc => {
    list.push({ id: doc.id, ...doc.data() } as Holiday);
  });
  return list.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Query detailed records for a specific employee (profile, leaves, attendance)
 */
export async function queryUserDetail(targetUser: User) {
  const leavesResult = await queryLeaveRequests();
  const userLeaves = leavesResult.leaves.filter(
    l => l.userName.toLowerCase().includes(targetUser.name.toLowerCase()) || 
         targetUser.name.toLowerCase().includes(l.userName.toLowerCase())
  );

  const today = new Date().toISOString().split('T')[0];
  const attToday = await queryAttendance(today);
  const userTodayAtt = attToday.presentUsers.find(u => u.userId === targetUser.id);

  return {
    employeeProfile: {
      id: targetUser.id,
      name: targetUser.name,
      employeeId: targetUser.employeeId || 'N/A',
      department: targetUser.department,
      role: targetUser.role,
      position: targetUser.position || 'Team Member',
      email: targetUser.email,
      phone: targetUser.phone,
      status: targetUser.status,
      joiningDate: targetUser.joiningDate,
    },
    todayStatus: userTodayAtt
      ? `Present (Check-in: ${userTodayAtt.checkIn}, ${userTodayAtt.totalHours} hrs)`
      : 'Not Checked In Today',
    leaveHistory: userLeaves,
  };
}

/**
 * Get comprehensive executive database snapshot with full entity records
 */
export async function queryExecutiveSnapshot() {
  const users = await getAllUsersCached();
  const today = new Date().toISOString().split('T')[0];
  const att = await queryAttendance(today);
  const leads = await queryLeads();
  const leaves = await queryLeaveRequests();
  const domains = await queryDomains();

  const activeStaff = users
    .filter(u => u.role !== Role.VISITOR)
    .map(u => ({
      name: u.name,
      employeeId: u.employeeId || 'N/A',
      department: u.department || 'General',
      role: u.role,
      position: u.position || 'Staff',
      email: u.email,
      phone: u.phone,
      status: u.status,
    }));

  return {
    today,
    totalEmployees: activeStaff.length,
    presentToday: att.totalPresent,
    pendingLeaves: leaves.pendingCount,
    ongoingLeads: leads.statusBreakdown['Ongoing'] || 0,
    expiringDomains: domains.expiringCount,
    
    // Rich entity records so Gemini has full context for any query
    teamDirectory: activeStaff,
    presentStaffToday: att.presentUsers.map(u => ({
      name: u.name,
      department: u.department,
      checkIn: u.checkIn,
      totalHours: u.totalHours,
      isWFH: u.isWFH,
    })),
    activeLeads: leads.leads.slice(0, 15),
    allLeaveRequests: leaves.leaves.slice(0, 15),
    domainsSummary: domains.domains.slice(0, 10),
  };
}
