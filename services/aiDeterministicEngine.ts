/**
 * File: services/aiDeterministicEngine.ts
 * Purpose: High-speed, zero-hallucination deterministic answering engine for Hirush AI Copilot.
 * Directly formats live Firestore data into executive Markdown, KPI cards, and actionable interactive pills.
 * Author: Hirush Global AMS
 */

import { AIIntent } from './aiIntentRegistry';
import { ExtractedEntities } from './aiEntityExtractor';
import { User, Role } from '../types';

export interface ActionButton {
  label: string;
  query: string;
  icon?: string;
  route?: string;
}

export interface DeterministicResponse {
  answer: string;
  source: 'verified_db' | 'general';
  suggestedActions: ActionButton[];
  metrics?: Record<string, any>;
  title?: string;
}

/**
 * Generates an authoritative, factual, formatted Markdown response directly from the database context.
 */
export function generateDeterministicAnswer(
  intent: AIIntent,
  entities: ExtractedEntities,
  databaseContext: any,
  user: User
): DeterministicResponse {
  const { dateInfo, department, matchedUser, metricType } = entities;
  const targetDate = dateInfo.date || new Date().toISOString().split('T')[0];

  // 1. ATTENDANCE INTENTS
  if (
    intent === AIIntent.ATTENDANCE_TODAY ||
    intent === AIIntent.ATTENDANCE_DATE ||
    intent === AIIntent.ATTENDANCE_ABSENT ||
    intent === AIIntent.ATTENDANCE_WFH ||
    intent === AIIntent.ATTENDANCE_LATE ||
    intent === AIIntent.ATTENDANCE_SUMMARY
  ) {
    if (!databaseContext || !databaseContext.presentUsers) {
      return {
        answer: `### 📋 Attendance Records (${dateInfo.label || targetDate})\n\nNo attendance check-ins are recorded for **${targetDate}**.`,
        source: 'verified_db',
        suggestedActions: [
          { label: 'Check Today', query: 'Who is present today?' },
          { label: 'Check Yesterday', query: 'Who was present yesterday?' },
          { label: 'Open Attendance', query: '', route: '/attendance' },
        ],
      };
    }

    const { totalPresent, totalAbsent, totalWFH, presentUsers, absentUsers } = databaseContext;
    const totalStaff = totalPresent + totalAbsent;
    const attendancePercentage = totalStaff > 0 ? Math.round((totalPresent / totalStaff) * 100) : 0;

    // Filter by department if requested
    const filteredPresent = department
      ? presentUsers.filter((u: any) => u.department?.toLowerCase() === department.toLowerCase())
      : presentUsers;

    const filteredAbsent = department
      ? absentUsers.filter((u: any) => u.department?.toLowerCase() === department.toLowerCase())
      : absentUsers;

    // Filter late check-ins (e.g. after 09:30 AM)
    const lateUsers = presentUsers.filter((u: any) => {
      if (!u.checkIn) return false;
      const [h, m] = u.checkIn.split(':').map(Number);
      return h > 9 || (h === 9 && m > 30);
    });

    // 1a. If user specifically asked who is absent
    if (intent === AIIntent.ATTENDANCE_ABSENT || metricType === 'absent') {
      let out = `### ❌ Absent Staff on **${dateInfo.label || targetDate}**\n\n`;
      out += `• **Total Absent:** \`${filteredAbsent.length}\`\n`;
      out += `• **Present Today:** \`${filteredPresent.length}\`\n\n`;

      if (filteredAbsent.length === 0) {
        out += `🎉 **Full Attendance!** No team members are recorded absent on this day.\n`;
      } else {
        out += `| Employee | Department | Role |\n`;
        out += `| :--- | :--- | :--- |\n`;
        filteredAbsent.forEach((u: any) => {
          out += `| **${u.name}** (\`${u.employeeId}\`) | ${u.department} | ${u.role} |\n`;
        });
      }

      return {
        answer: out,
        source: 'verified_db',
        suggestedActions: [
          { label: 'Show Present Staff', query: `Who is present on ${targetDate}?` },
          { label: 'Show WFH Staff', query: `Who is working from home on ${targetDate}?` },
          { label: 'Open Attendance Page', query: '', route: '/attendance' },
        ],
        metrics: { totalAbsent: filteredAbsent.length, totalPresent: filteredPresent.length },
      };
    }

    // 1b. If user specifically asked for WFH
    if (intent === AIIntent.ATTENDANCE_WFH || metricType === 'wfh') {
      const wfhUsers = filteredPresent.filter((u: any) => u.isWFH);
      let out = `### 🏠 Work From Home (WFH) on **${dateInfo.label || targetDate}**\n\n`;
      out += `• **Total WFH:** \`${wfhUsers.length}\`\n`;
      out += `• **In-Office:** \`${filteredPresent.length - wfhUsers.length}\`\n\n`;

      if (wfhUsers.length === 0) {
        out += `*No employees are recorded as working from home on this date.*\n`;
      } else {
        out += `| Employee | Department | Check-In | Hours |\n`;
        out += `| :--- | :--- | :--- | :--- |\n`;
        wfhUsers.forEach((u: any) => {
          out += `| **${u.name}** (\`${u.employeeId}\`) | ${u.department} | ${u.checkIn} | ${u.totalHours} hrs |\n`;
        });
      }

      return {
        answer: out,
        source: 'verified_db',
        suggestedActions: [
          { label: 'View All Present', query: `Who was present on ${targetDate}?` },
          { label: 'View Absentees', query: `Who is absent on ${targetDate}?` },
        ],
        metrics: { totalWFH: wfhUsers.length },
      };
    }

    // 1c. If user specifically asked for Late check-ins
    if (intent === AIIntent.ATTENDANCE_LATE || metricType === 'late') {
      let out = `### ⏰ Late Check-Ins on **${dateInfo.label || targetDate}** (After 09:30 AM)\n\n`;
      out += `• **Late Check-Ins:** \`${lateUsers.length}\`\n`;
      out += `• **On-Time Staff:** \`${filteredPresent.length - lateUsers.length}\`\n\n`;

      if (lateUsers.length === 0) {
        out += `⭐ **Excellent Punctuality!** All check-ins occurred before 09:30 AM.\n`;
      } else {
        out += `| Employee | Department | Check-In Time |\n`;
        out += `| :--- | :--- | :--- |\n`;
        lateUsers.forEach((u: any) => {
          out += `| **${u.name}** (\`${u.employeeId}\`) | ${u.department} | \`${u.checkIn}\` |\n`;
        });
      }

      return {
        answer: out,
        source: 'verified_db',
        suggestedActions: [
          { label: 'View All Present', query: `Who was present on ${targetDate}?` },
          { label: 'View Absentees', query: `Who was absent on ${targetDate}?` },
        ],
        metrics: { lateCount: lateUsers.length },
      };
    }

    const presentCount = department ? filteredPresent.length : (totalPresent ?? filteredPresent.length);
    const absentCount = department ? filteredAbsent.length : (totalAbsent ?? filteredAbsent.length);

    // 1d. Standard / Summary Attendance
    let out = `### 📋 Attendance Report for **${dateInfo.label || targetDate}**${department ? ` (${department} Dept)` : ''}\n\n`;
    out += `• **Present:** \`${presentCount}\`\n`;
    out += `• **Absent:** \`${absentCount}\`\n`;
    out += `• **Work From Home:** \`${filteredPresent.filter((u: any) => u.isWFH).length}\`\n`;
    out += `• **Attendance Rate:** \`${attendancePercentage}%\`\n\n`;

    if (filteredPresent.length === 0) {
      out += `*No attendance check-ins recorded for this date.*\n`;
    } else {
      out += `#### Present Team Members:\n`;
      out += `| Employee | Department | Check-In | Hours | Mode |\n`;
      out += `| :--- | :--- | :--- | :--- | :--- |\n`;
      filteredPresent.forEach((u: any) => {
        const mode = u.isWFH ? '🏠 WFH' : u.biometricVerified ? '👆 Biometric' : '📍 Location';
        out += `| **${u.name}** (\`${u.employeeId}\`) | ${u.department} | ${u.checkIn} | ${u.totalHours} hrs | ${mode} |\n`;
      });
    }

    return {
      answer: out,
      source: 'verified_db',
      suggestedActions: [
        { label: 'Show Absent Employees', query: `Who is absent on ${targetDate}?` },
        { label: 'Show WFH Staff', query: `Who is working from home on ${targetDate}?` },
        { label: 'Compare Yesterday', query: 'Who was present yesterday?' },
        { label: 'Open Attendance Page', query: '', route: '/attendance' },
      ],
      metrics: {
        present: presentCount,
        absent: absentCount,
        percentage: attendancePercentage,
      },
    };
  }

  // 2. SPECIFIC EMPLOYEE DOSSIER
  if (intent === AIIntent.ATTENDANCE_EMPLOYEE || intent === AIIntent.EMPLOYEE_SEARCH || matchedUser) {
    if (databaseContext && databaseContext.employeeProfile) {
      const { employeeProfile, todayStatus, leaveHistory } = databaseContext;
      let out = `### 👤 Staff Dossier: **${employeeProfile.name}** (\`${employeeProfile.employeeId}\`)\n\n`;
      out += `• **Department:** ${employeeProfile.department}\n`;
      out += `• **Role / Designation:** ${employeeProfile.position} (${employeeProfile.role})\n`;
      out += `• **Email:** \`${employeeProfile.email}\`\n`;
      if (employeeProfile.phone) out += `• **Phone:** ${employeeProfile.phone}\n`;
      out += `• **Today's Status:** ${todayStatus}\n\n`;

      if (leaveHistory && leaveHistory.length > 0) {
        out += `#### Recent Leave History:\n`;
        out += `| Leave Type | Dates | Reason | Status |\n`;
        out += `| :--- | :--- | :--- | :--- |\n`;
        leaveHistory.slice(0, 5).forEach((lv: any) => {
          out += `| **${lv.leaveType}** | ${lv.startDate} to ${lv.endDate} | ${lv.reason} | \`${lv.status}\` |\n`;
        });
      } else {
        out += `*No leave requests on file for ${employeeProfile.name}.*\n`;
      }

      return {
        answer: out,
        source: 'verified_db',
        suggestedActions: [
          { label: 'View Team Directory', query: 'Show all employees' },
          { label: 'Today\'s Attendance', query: 'Who is present today?' },
        ],
      };
    }
  }

  // 3. LEAVE REQUESTS INTENTS
  if (
    intent === AIIntent.LEAVE_PENDING ||
    intent === AIIntent.LEAVE_TODAY ||
    intent === AIIntent.LEAVE_UPCOMING ||
    intent === AIIntent.LEAVE_SUMMARY
  ) {
    const { totalCount = 0, pendingCount = 0, approvedCount = 0, leaves = [] } = databaseContext || {};
    let out = `### 🏖️ Leave Management Overview\n\n`;
    out += `• **Pending Approvals:** \`${pendingCount}\`\n`;
    out += `• **Approved Leaves:** \`${approvedCount}\`\n`;
    out += `• **Total Records:** \`${totalCount}\`\n\n`;

    if (leaves.length === 0) {
      out += `*No leave requests found matching this criteria.*\n`;
    } else {
      out += `| Staff Member | Department | Type | Dates | Status |\n`;
      out += `| :--- | :--- | :--- | :--- | :--- |\n`;
      leaves.slice(0, 10).forEach((lv: any) => {
        out += `| **${lv.userName}** | ${lv.userDepartment} | ${lv.leaveType} | ${lv.startDate} to ${lv.endDate} | \`${lv.status}\` |\n`;
      });
      if (leaves.length > 10) {
        out += `\n*...and ${leaves.length - 10} more records in database.*`;
      }
    }

    return {
      answer: out,
      source: 'verified_db',
      suggestedActions: [
        { label: 'Show Pending Leaves', query: 'Show pending leave requests' },
        { label: 'Approved Leaves', query: 'Show approved leaves' },
        { label: 'Open Leave Management', query: '', route: '/leave' },
      ],
      metrics: { pendingCount, approvedCount },
    };
  }

  // 4. CRM & LEADS INTENTS
  if (
    intent === AIIntent.CRM_ACTIVE ||
    intent === AIIntent.CRM_PIPELINE ||
    intent === AIIntent.CRM_LEADS ||
    intent === AIIntent.CRM_CLIENT ||
    intent === AIIntent.CRM_SUMMARY
  ) {
    const { totalCount = 0, statusBreakdown = {}, leads = [] } = databaseContext || {};
    let out = `### 💼 CRM B2B Leads Overview (${totalCount} Leads)\n\n`;
    out += `**Status Breakdown:**\n`;
    for (const [st, count] of Object.entries(statusBreakdown)) {
      out += `• **${st}:** \`${count}\`\n`;
    }

    out += `\n#### Active Deals & Pipeline:\n`;
    out += `| Project | Client | Contact | Status |\n`;
    out += `| :--- | :--- | :--- | :--- |\n`;
    leads.slice(0, 8).forEach((l: any) => {
      out += `| **${l.projectName}** | ${l.clientName} | ${l.pocName || 'N/A'} | \`${l.status}\` |\n`;
    });

    return {
      answer: out,
      source: 'verified_db',
      suggestedActions: [
        { label: 'Ongoing Deals', query: 'Show ongoing CRM leads' },
        { label: 'Proposals Sent', query: 'Show proposals sent' },
        { label: 'Open CRM Dashboard', query: '', route: '/crm' },
      ],
      metrics: statusBreakdown,
    };
  }

  // 5. DOMAIN & SSL HEALTH INTENTS
  if (
    intent === AIIntent.DOMAIN_HEALTH ||
    intent === AIIntent.DOMAIN_EXPIRY ||
    intent === AIIntent.SSL_STATUS ||
    intent === AIIntent.DNS_STATUS
  ) {
    const { totalCount = 0, expiringCount = 0, dnsIssueCount = 0, sslIssueCount = 0, domains = [] } =
      databaseContext || {};

    let out = `### 🌐 Domains & SSL Security Health Report\n\n`;
    out += `• **Total Monitored:** \`${totalCount}\`\n`;
    out += `• **Expiring within 30 Days:** \`${expiringCount}\`\n`;
    out += `• **SSL Certificate Issues:** \`${sslIssueCount}\`\n`;
    out += `• **DNS Configuration Issues:** \`${dnsIssueCount}\`\n\n`;

    out += `| Domain | Expiry | SSL Days Left | Health Status |\n`;
    out += `| :--- | :--- | :--- | :--- |\n`;
    domains.slice(0, 8).forEach((d: any) => {
      const isIssue = d.dnsStatus === 'Issue Detected' || d.sslStatus === 'Issue Detected';
      const badge = isIssue ? '🔴 Action Required' : d.daysUntilExpiry <= 30 ? '🟡 Expiring Soon' : '🟢 Healthy';
      out += `| **${d.domainDetail}** | ${d.expiryDate || 'N/A'} | ${d.sslDaysLeft ?? 'N/A'} | ${badge} |\n`;
    });

    return {
      answer: out,
      source: 'verified_db',
      suggestedActions: [
        { label: 'Expiring in 30 Days', query: 'Which domains are expiring?' },
        { label: 'SSL Issues', query: 'Show SSL issues on domains' },
        { label: 'Open Domain Monitor', query: '', route: '/domains' },
      ],
      metrics: { expiringCount, sslIssueCount, dnsIssueCount },
    };
  }

  // 6. TEAM DIRECTORY INTENTS
  if (
    intent === AIIntent.EMPLOYEE_COUNT ||
    intent === AIIntent.EMPLOYEE_DEPARTMENT ||
    intent === AIIntent.EMPLOYEE_ROLE ||
    intent === AIIntent.EMPLOYEE_CONTACT
  ) {
    const { totalMembers = 0, departmentCounts = {}, members = [] } = databaseContext || {};
    let out = `### 👥 Hirush Team Directory (${totalMembers} Active Staff)\n\n`;
    out += `**Department Distribution:**\n`;
    for (const [dept, count] of Object.entries(departmentCounts)) {
      out += `• **${dept}:** \`${count}\`\n`;
    }

    out += `\n| Name | Employee ID | Department | Role | Status |\n`;
    out += `| :--- | :--- | :--- | :--- | :--- |\n`;
    members.slice(0, 10).forEach((m: any) => {
      out += `| **${m.name}** | \`${m.employeeId}\` | ${m.department} | ${m.role} | \`${m.status}\` |\n`;
    });

    return {
      answer: out,
      source: 'verified_db',
      suggestedActions: [
        { label: 'Show Developers', query: 'How many developers in team?' },
        { label: 'Show HR Team', query: 'Show HR department' },
        { label: 'Today\'s Attendance', query: 'Who is present today?' },
      ],
      metrics: departmentCounts,
    };
  }

  // 7. HOLIDAYS CALENDAR
  if (intent === AIIntent.HOLIDAY_NEXT || intent === AIIntent.HOLIDAY_LIST || intent === AIIntent.HOLIDAY_MONTH) {
    const holidays = Array.isArray(databaseContext) ? databaseContext : [];
    const today = new Date().toISOString().split('T')[0];
    const upcoming = holidays.filter((h: any) => h.date >= today);
    const nextHoliday = upcoming[0];

    let out = `### 📅 Company Holidays Calendar\n\n`;
    if (nextHoliday) {
      out += `🎯 **Next Upcoming Holiday:** **${nextHoliday.name}** on **${nextHoliday.date}** (\`${nextHoliday.type || 'Company'}\`)\n\n`;
    }

    out += `#### Scheduled Holidays:\n`;
    out += `| Date | Holiday Name | Type |\n`;
    out += `| :--- | :--- | :--- |\n`;
    (upcoming.length > 0 ? upcoming : holidays).slice(0, 8).forEach((h: any) => {
      out += `| ${h.date} | **${h.name}** | \`${h.type || 'Company'}\` |\n`;
    });

    return {
      answer: out,
      source: 'verified_db',
      suggestedActions: [
        { label: 'Today\'s Attendance', query: 'Who is present today?' },
        { label: 'Pending Leaves', query: 'Show pending leaves' },
        { label: 'Open Holidays Calendar', query: '', route: '/holidays' },
      ],
    };
  }

  // 8. EXECUTIVE SUMMARY SNAPSHOT
  if (intent === AIIntent.EXECUTIVE_SUMMARY || databaseContext?.totalEmployees !== undefined) {
    const d = databaseContext || {};
    const attendancePct = d.totalEmployees > 0 ? Math.round(((d.presentToday ?? 0) / d.totalEmployees) * 100) : 0;

    let out = `### 📊 Hirush Global Enterprise Snapshot\n\n`;
    out += `**Attendance Overview:**\n`;
    out += `• **Present Staff Today:** \`${d.presentToday ?? 0}\`\n`;
    out += `• **Total Active Employees:** \`${d.totalEmployees ?? 0}\`\n`;
    out += `• **Attendance Rate:** \`${attendancePct}%\`\n\n`;

    out += `**Operations & Pipeline:**\n`;
    out += `• **Ongoing CRM Leads:** \`${d.ongoingLeads ?? 0}\`\n`;
    out += `• **Pending Leave Requests:** \`${d.pendingLeaves ?? 0}\`\n`;
    out += `• **Domains Expiring Soon (<30d):** \`${d.expiringDomains ?? 0}\`\n\n`;

    return {
      answer: out,
      source: 'verified_db',
      suggestedActions: [
        { label: 'Who is Present Today?', query: 'Who is present today?' },
        { label: 'Show Ongoing Leads', query: 'Show ongoing CRM leads' },
        { label: 'Review Pending Leaves', query: 'Show pending leave requests' },
        { label: 'Check Domain Health', query: 'Check domain health' },
      ],
      metrics: {
        present: d.presentToday,
        total: d.totalEmployees,
        attendanceRate: attendancePct,
        ongoingLeads: d.ongoingLeads,
        pendingLeaves: d.pendingLeaves,
      },
    };
  }

  // 9. UNKNOWN OR GENERAL FALLBACK
  return {
    answer: `### 🤖 Hirush AMS Intelligence Assistant\n\nI couldn't find a direct database match for that question.\n\nYou can ask me directly in **English** or **Malayalam**:\n- *"Who is present today?"* / *"Innu aara vannathu?"*\n- *"Who was absent yesterday?"*\n- *"Show pending leave requests"*\n- *"Show ongoing CRM leads"*\n- *"Check domain health & SSL"*\n- *"How many developers in team?"*`,
    source: 'general',
    suggestedActions: [
      { label: '👥 Today\'s Attendance', query: 'Who is present today?' },
      { label: '❌ Who is Absent?', query: 'Who is absent today?' },
      { label: '📝 Pending Leaves', query: 'Show pending leave requests' },
      { label: '💼 Active CRM Leads', query: 'Show ongoing CRM leads' },
      { label: '🌐 Domain Health', query: 'Check domain health' },
      { label: '📈 Executive Summary', query: 'Give me today\'s executive summary' },
    ],
  };
}
