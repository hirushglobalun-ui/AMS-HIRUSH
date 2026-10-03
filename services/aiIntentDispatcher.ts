/**
 * File: services/aiIntentDispatcher.ts
 * Purpose: Smart intent dispatcher that connects user prompts to live Firestore queries,
 * and passes the verified database context to Gemini / API engine.
 */

import { extractDateFromQuery } from '../utils/aiDateParser';
import {
  queryAttendance,
  queryLeads,
  queryLeaveRequests,
  queryDomains,
  queryTeam,
  queryHolidays,
  queryExecutiveSnapshot,
  queryUserDetail,
  getAllUsersCached,
} from './aiDataQueryService';
import { User } from '../types';

export interface DispatchResult {
  answer: string;
  queryType: string;
  hasRealAi: boolean;
  rawContext?: any;
  dateQueried?: string;
}

export async function dispatchAiQuery(
  prompt: string,
  user: User,
  chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = [],
  customApiKey?: string
): Promise<DispatchResult> {
  const lower = prompt.toLowerCase().trim();

  // Auto-resolve stored API key from localStorage if not explicitly passed
  const resolvedApiKey =
    customApiKey ||
    (typeof window !== 'undefined' ? localStorage.getItem('hirush_gemini_api_key') || undefined : undefined);

  let queryType = 'general';
  let databaseContext: any = null;
  let dateQueried: string | undefined = undefined;

  // 0. Check if query matches a specific staff member/name (e.g. Sayed, Vikram, Priya)
  let matchedUser: User | undefined = undefined;
  try {
    const allUsers = await getAllUsersCached();
    const cleanLower = lower.replace(/[^a-z0-9]/g, '');
    matchedUser = allUsers.find(u => {
      const fullName = (u.name || '').toLowerCase();
      const cleanName = fullName.replace(/[^a-z0-9]/g, '');
      const parts = fullName.split(/\s+/).filter(Boolean);
      const empId = (u.employeeId || '').toLowerCase();
      const emailPrefix = (u.email || '').split('@')[0].toLowerCase();
      const cleanEmailPrefix = emailPrefix.replace(/[^a-z0-9]/g, '');

      return (
        // Exact or substring match in prompt
        (fullName.length >= 3 && lower.includes(fullName)) ||
        // Collapsed alphanumeric match (e.g. "sayedp" matching "Sayed P" or "Sayed BP")
        (cleanName.length >= 3 && (cleanLower.includes(cleanName) || cleanName.includes(cleanLower))) ||
        // First name or part match (min 3 chars)
        parts.some(p => p.length >= 3 && (lower.includes(p) || cleanLower.includes(p))) ||
        // Email username prefix match
        (cleanEmailPrefix.length >= 3 && cleanLower.includes(cleanEmailPrefix)) ||
        // Employee ID match
        (empId && (lower.includes(empId) || cleanLower.includes(empId)))
      );
    });
  } catch (uErr) {
    console.warn('Could not inspect cached users:', uErr);
  }

  // 1. Attendance Intent (Check-in, Present, Absent, Friday, Yesterday, etc.)
  const isAttendanceQuery =
    lower.includes('present') ||
    lower.includes('attendance') ||
    lower.includes('absent') ||
    lower.includes('checkin') ||
    lower.includes('check in') ||
    lower.includes('check-in') ||
    lower.includes('checked in') ||
    lower.includes('wfh') ||
    lower.includes('work from home') ||
    lower.includes('punch') ||
    lower.includes('worked') ||
    lower.includes('working') ||
    lower.includes('who came') ||
    lower.includes('who is in') ||
    lower.includes('in office') ||
    lower.includes('vannu') ||
    lower.includes('vannatha') ||
    lower.includes('aara vannathu') ||
    lower.includes('aaraayirunnu') ||
    lower.includes('friday') ||
    lower.includes('velli') ||
    lower.includes('vellikizhaacha') ||
    lower.includes('yesterday') ||
    lower.includes('innale') ||
    lower.includes('innu');

  // 2. Leads / CRM Intent
  const isLeadsQuery =
    lower.includes('lead') ||
    lower.includes('crm') ||
    lower.includes('project') ||
    lower.includes('client') ||
    lower.includes('pipeline') ||
    lower.includes('ongoing') ||
    lower.includes('proposal') ||
    lower.includes('disposed') ||
    lower.includes('sales') ||
    lower.includes('deal');

  // 3. Leave Requests Intent
  const isLeavesQuery =
    lower.includes('leave') ||
    lower.includes('vacation') ||
    lower.includes('sick') ||
    lower.includes('casual') ||
    lower.includes('avathi') ||
    lower.includes('pending approval') ||
    lower.includes('permission');

  // 4. Domains & Hosting Intent
  const isDomainsQuery =
    lower.includes('domain') ||
    lower.includes('ssl') ||
    lower.includes('dns') ||
    lower.includes('expiry') ||
    lower.includes('expire') ||
    lower.includes('hosting') ||
    lower.includes('website');

  // 5. Team / Employees Directory Intent
  const isTeamQuery =
    lower.includes('team') ||
    lower.includes('employee') ||
    lower.includes('staff') ||
    lower.includes('developer') ||
    lower.includes('department') ||
    lower.includes('how many people') ||
    lower.includes('intern') ||
    lower.includes('directory') ||
    lower.includes('members');

  // 6. Holidays Calendar Intent
  const isHolidaysQuery =
    lower.includes('holiday') ||
    lower.includes('calendar') ||
    lower.includes('off day');

  try {
    if (matchedUser && !isAttendanceQuery && !isLeadsQuery && !isDomainsQuery) {
      queryType = 'user_profile';
      databaseContext = await queryUserDetail(matchedUser);
    } else if (isAttendanceQuery) {
      queryType = 'attendance';
      const parsed = extractDateFromQuery(prompt);
      const targetDate = parsed.date || new Date().toISOString().split('T')[0];
      dateQueried = targetDate;
      const attData = await queryAttendance(targetDate);
      databaseContext = matchedUser
        ? { ...attData, targetEmployee: await queryUserDetail(matchedUser) }
        : attData;
    } else if (isLeadsQuery) {
      queryType = 'leads';
      let statusFilter: string | undefined = undefined;
      if (lower.includes('ongoing')) statusFilter = 'Ongoing';
      else if (lower.includes('pending')) statusFilter = 'Pending';
      else if (lower.includes('proposal')) statusFilter = 'Proposal Sent';
      else if (lower.includes('completed')) statusFilter = 'Completed';
      else if (lower.includes('on hold')) statusFilter = 'On Hold';
      databaseContext = await queryLeads(statusFilter);
    } else if (isLeavesQuery) {
      queryType = 'leaves';
      let statusFilter: string | undefined = undefined;
      if (lower.includes('pending')) statusFilter = 'Pending';
      else if (lower.includes('approved')) statusFilter = 'Approved';
      else if (lower.includes('rejected')) statusFilter = 'Rejected';
      databaseContext = await queryLeaveRequests(statusFilter);
    } else if (isDomainsQuery) {
      queryType = 'domains';
      databaseContext = await queryDomains();
    } else if (isTeamQuery) {
      queryType = 'team';
      let deptFilter: string | undefined = undefined;
      const depts = ['Development', 'Management', 'HR', 'Sales', 'SEO', 'Product', 'Media'];
      for (const d of depts) {
        if (lower.includes(d.toLowerCase())) {
          deptFilter = d;
          break;
        }
      }
      databaseContext = await queryTeam(deptFilter);
    } else if (isHolidaysQuery) {
      queryType = 'holidays';
      databaseContext = await queryHolidays();
    } else {
      // General executive snapshot
      queryType = 'general_snapshot';
      databaseContext = await queryExecutiveSnapshot();
    }
  } catch (dbErr) {
    console.error('Error fetching live database records for AI prompt:', dbErr);
  }

  // Call the server API endpoint
  try {
    const res = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        chatHistory,
        userContext: {
          name: user.name,
          role: user.role,
          department: user.department,
        },
        queryType,
        databaseContext,
        customApiKey: resolvedApiKey,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Server error communicating with AI agent');
    }

    return {
      answer: data.text,
      queryType,
      hasRealAi: Boolean(data.hasRealAi),
      rawContext: databaseContext,
      dateQueried,
    };
  } catch (err: any) {
    console.error('AI chat endpoint call failed:', err);
    // Ultimate local fallback
    return {
      answer: `⚠️ Could not reach AI service: ${err.message}. Please check your connection.`,
      queryType,
      hasRealAi: false,
      rawContext: databaseContext,
      dateQueried,
    };
  }
}
