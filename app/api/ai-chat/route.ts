import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface ChatRequestPayload {
  prompt: string;
  chatHistory?: { role: 'user' | 'model'; parts: { text: string }[] }[];
  userContext?: {
    name?: string;
    role?: string;
    department?: string;
  };
  queryType?: string;
  databaseContext?: any;
  customApiKey?: string;
}

// In-memory sliding rate limiter per user/IP
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

function checkRateLimit(identifier: string, role: string = 'Employee'): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes

  let maxRequests = 30; // Employee: 30 requests / 10 min
  if (role === 'Admin') maxRequests = 120;
  else if (role === 'HR') maxRequests = 100;
  else if (role === 'Manager') maxRequests = 60;

  const record = rateLimitMap.get(identifier);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (record.count >= maxRequests) {
    return true;
  }

  record.count++;
  return false;
}

export async function POST(req: Request) {
  try {
    const body: ChatRequestPayload = await req.json();
    const { prompt, chatHistory = [], userContext, queryType, databaseContext, customApiKey } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Rate Limiting check
    const clientKey = userContext?.name || req.headers.get('x-forwarded-for') || 'default_client';
    if (checkRateLimit(clientKey, userContext?.role)) {
      return NextResponse.json(
        { error: 'AI request limit reached for this session. Please wait a few minutes before submitting more AI queries.' },
        { status: 429 }
      );
    }

    let apiKey =
      customApiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      '';

    // If key not in env, attempt loading from Firestore settings/general
    if (!apiKey || apiKey === 'dummy_api_key_for_build') {
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
        if (settingsSnap.exists() && settingsSnap.data()?.geminiApiKey) {
          apiKey = settingsSnap.data().geminiApiKey;
        }
      } catch (err) {
        console.warn('Could not read settings/general for geminiApiKey:', err);
      }
    }

    // Build rich system instruction with AMS domain expertise
    const systemInstruction = `
You are the "Hirush Global AMS AI Copilot", an elite enterprise intelligent assistant for Hirush Global LLP.
You analyze and answer questions about company Attendance, CRM B2B Leads, Team Directory, Leave Requests, Custom Domains & SSL Health, and Company Holidays.

CRITICAL INSTRUCTIONS:
1. Always base your response strictly on the REAL LIVE DATABASE CONTEXT provided below. Never make up names, numbers, or dates.
2. If asked "who was present on Friday" or any specific date, list the exact employees who checked in, their department, check-in time, total hours, and whether they were verified by biometrics or WFH.
3. If the user asks in Malayalam or Manglish (e.g., "Aaraayirunnu vellikizhaacha vannathu?", "Enthokke leads undu?"), respond helpfully in Malayalam (or Malayalam written in English script/Manglish, with clean English tables/metrics) matching their tone.
4. Format all responses cleanly using GitHub-flavored Markdown:
   - Use clean Markdown tables when listing items (with columns like Employee, Department, Check-In, Status).
   - Use status badges like [Present] [WFH] [Approved] [Ongoing].
5. Keep your tone executive, courteous, accurate, and concise.
6. If the user asks about an individual staff member (e.g., Sayed, Vikram, Priya, etc.), check under 'employeeProfile' or search within 'teamDirectory', 'presentStaffToday', and 'allLeaveRequests'. Provide their full details (Name, ID, Department, Role, Position, Email, Phone, and Attendance/Leave status) directly from the database context.

CURRENT USER CONTEXT:
- Name: ${userContext?.name || 'Staff User'}
- Role: ${userContext?.role || 'Employee'}
- Department: ${userContext?.department || 'General'}
`;

    const contextString = databaseContext
      ? `\n=== LIVE DATABASE CONTEXT FROM FIRESTORE ===\nQuery Category: ${queryType || 'General'}\nData: ${JSON.stringify(
          databaseContext,
          null,
          2
        )}\n=== END DATABASE CONTEXT ===\n`
      : `\n(No specific database records were queried for this prompt)\n`;

    // If an API key is available, call Google Gemini
    if (apiKey && apiKey !== 'dummy_api_key_for_build') {
      try {
        const ai = new GoogleGenAI({ apiKey });

        // Prepare content with context
        const userPromptWithContext = `${contextString}\nUser Question: ${prompt}`;

        // Prioritize gemini-2.5-flash, then fallback across resilient active models
        const modelNames = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
        let lastError = null;

        for (const model of modelNames) {
          try {
            const response = await ai.models.generateContent({
              model,
              contents: [
                ...chatHistory,
                { role: 'user', parts: [{ text: userPromptWithContext }] },
              ],
              config: {
                systemInstruction,
                temperature: 0.2, // Low temperature for high factual accuracy
              },
            });

            if (response.text) {
              return NextResponse.json({
                text: response.text,
                modelUsed: model,
                hasRealAi: true,
              });
            }
          } catch (modelErr: any) {
            console.warn(`Gemini model ${model} attempt failed:`, modelErr?.message || modelErr);
            lastError = modelErr;
          }
        }

        console.error('All Gemini model attempts exhausted:', lastError);
      } catch (geminiInitErr: any) {
        console.error('Failed to initialize or call Gemini API:', geminiInitErr);
      }
    }

    // Direct Intelligent Rule-Based Summarizer fallback (guarantees 100% accurate database answers)
    const fallbackAnswer = generateRuleBasedSummary(prompt, queryType, databaseContext, userContext);
    return NextResponse.json({
      text: fallbackAnswer,
      hasRealAi: false,
      notice: apiKey ? 'AI served via Database Analytics Engine' : 'AI API key not set; served live database summary',
    });
  } catch (error: any) {
    console.error('API /api/ai-chat error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error processing AI query' },
      { status: 500 }
    );
  }
}

/**
 * Intelligent deterministic synthesizer when Gemini key is not yet configured or pending.
 * Guarantees the user always receives 100% accurate, rich database answers immediately.
 */
function generateRuleBasedSummary(prompt: string, queryType?: string, data?: any, userContext?: any): string {
  const lowerPrompt = prompt.toLowerCase().trim();

  // Greetings & conversational intents
  if (
    lowerPrompt === 'hi' ||
    lowerPrompt === 'hello' ||
    lowerPrompt === 'hey' ||
    lowerPrompt.includes('namaskaram') ||
    lowerPrompt.includes('who are you') ||
    lowerPrompt.includes('what can you do')
  ) {
    return `### 👋 Hello ${userContext?.name?.split(' ')[0] || 'there'}!\n\nI am the **Hirush Global AMS AI Copilot**, connected directly to your live **Firebase Cloud Firestore** database.\n\nI can answer questions in **English** and **Malayalam** (Manglish), such as:\n- 📅 *"Who was present on Friday?"* (or any specific date)\n- 💼 *"Show all ongoing leads in CRM"*\n- 🏖️ *"Are there any pending leave requests?"*\n- 🌐 *"Check custom domain health and SSL status"*\n- 👥 *"How many employees in Development or Sales?"*\n\nTry asking any question above!`;
  }

  if (!data) {
    return `### 🤖 Hirush AMS Intelligence Assistant\n\nI received your query: "*${prompt}*".\n\nTo enable generative reasoning, please configure your **Google Gemini API Key** in AI Settings or add \`GEMINI_API_KEY\` to your \`.env\` file.\n\nYou can ask me:\n- *"Who was present on Friday?"*\n- *"Show ongoing CRM leads"*\n- *"Any pending leave requests?"*\n- *"Check domain health"*`;
  }

  // Specific User Profile query (e.g. Sayed, Vikram, Priya)
  if (queryType === 'user_profile' && data.employeeProfile) {
    const { employeeProfile, todayStatus, leaveHistory } = data;
    let out = `### 👤 Staff Dossier: **${employeeProfile.name}** (\`${employeeProfile.employeeId}\`)\n\n`;
    out += `• **Department:** ${employeeProfile.department}\n`;
    out += `• **Designation:** ${employeeProfile.position} (${employeeProfile.role})\n`;
    out += `• **Email:** \`${employeeProfile.email}\`\n`;
    out += `• **Today's Status:** ${todayStatus}\n\n`;

    if (leaveHistory && leaveHistory.length > 0) {
      out += `#### Leave & Absence Records on File:\n`;
      out += `| Leave Type | Dates | Reason | Status |\n`;
      out += `| :--- | :--- | :--- | :--- |\n`;
      leaveHistory.forEach((lv: any) => {
        out += `| **${lv.leaveType}** | ${lv.startDate} to ${lv.endDate} | ${lv.reason} | \`${lv.status}\` |\n`;
      });
    } else {
      out += `*No leave requests on file for ${employeeProfile.name}.*\n`;
    }
    return out;
  }

  // Attendance query
  if (queryType === 'attendance' && data.presentUsers) {
    const { date, totalPresent, totalAbsent, totalWFH, presentUsers } = data;
    let out = `### 📋 Attendance Report for **${date}**\n\n`;
    out += `• **Total Present:** \`${totalPresent}\`\n`;
    out += `• **Work From Home (WFH):** \`${totalWFH}\`\n`;
    out += `• **Absent / Off:** \`${totalAbsent}\`\n\n`;

    if (presentUsers.length === 0) {
      out += `*No attendance check-ins were recorded in the database for ${date}.*\n`;
    } else {
      out += `#### Present Team Members:\n`;
      out += `| Employee | Department | Check-In | Hours | Mode |\n`;
      out += `| :--- | :--- | :--- | :--- | :--- |\n`;
      presentUsers.forEach((u: any) => {
        const mode = u.isWFH ? '🏠 WFH' : u.biometricVerified ? '👆 Biometric' : '📍 Location';
        out += `| **${u.name}** (\`${u.employeeId}\`) | ${u.department} | ${u.checkIn} | ${u.totalHours} hrs | ${mode} |\n`;
      });
    }

    return out;
  }

  // Leads query
  if (queryType === 'leads' && data.leads) {
    const { totalCount, statusBreakdown, leads } = data;
    let out = `### 💼 CRM Leads Overview (${totalCount} Total)\n\n`;
    out += `**Status Breakdown:**\n`;
    for (const [status, count] of Object.entries(statusBreakdown || {})) {
      out += `• **${status}:** ${count}\n`;
    }
    out += `\n#### Leads Summary:\n`;
    out += `| Project | Client | POC | Status |\n`;
    out += `| :--- | :--- | :--- | :--- |\n`;
    leads.slice(0, 10).forEach((l: any) => {
      out += `| **${l.projectName}** | ${l.clientName} | ${l.pocName || 'N/A'} | \`${l.status}\` |\n`;
    });
    if (leads.length > 10) {
      out += `\n*...and ${leads.length - 10} more leads in database.*`;
    }
    return out;
  }

  // Leaves query
  if (queryType === 'leaves' && data.leaves) {
    const { totalCount, pendingCount, approvedCount, leaves } = data;
    let out = `### 🏖️ Leave Requests Overview\n\n`;
    out += `• **Pending Approvals:** \`${pendingCount}\`\n`;
    out += `• **Approved:** \`${approvedCount}\`\n`;
    out += `• **Total Records:** \`${totalCount}\`\n\n`;

    if (leaves.length === 0) {
      out += `*No leave requests found matching this filter.*`;
    } else {
      out += `| Staff Name | Department | Type | Dates | Status |\n`;
      out += `| :--- | :--- | :--- | :--- | :--- |\n`;
      leaves.slice(0, 10).forEach((lv: any) => {
        out += `| **${lv.userName}** | ${lv.userDepartment} | ${lv.leaveType} | ${lv.startDate} to ${lv.endDate} | \`${lv.status}\` |\n`;
      });
    }
    return out;
  }

  // Domains query
  if (queryType === 'domains' && data.domains) {
    const { totalCount, expiringCount, dnsIssueCount, sslIssueCount, domains } = data;
    let out = `### 🌐 Domains & SSL Health Report\n\n`;
    out += `• **Total Domains Monitored:** \`${totalCount}\`\n`;
    out += `• **Expiring within 30 days:** \`${expiringCount}\`\n`;
    out += `• **DNS Issues:** \`${dnsIssueCount}\`\n`;
    out += `• **SSL Issues:** \`${sslIssueCount}\`\n\n`;

    out += `| Project | Domain | Expiry | SSL Days Left | Status |\n`;
    out += `| :--- | :--- | :--- | :--- | :--- |\n`;
    domains.slice(0, 8).forEach((d: any) => {
      const isIssue = d.dnsStatus === 'Issue Detected' || d.sslStatus === 'Issue Detected';
      const badge = isIssue ? '⚠️ Action Required' : '✅ Healthy';
      out += `| **${d.projectName}** | ${d.domainDetail} | ${d.expiryDate || 'N/A'} | ${d.sslDaysLeft ?? 'N/A'} | ${badge} |\n`;
    });
    return out;
  }

  // Team query
  if (queryType === 'team' && data.members) {
    const { totalMembers, departmentCounts, members } = data;
    let out = `### 👥 Team Directory (${totalMembers} Active Staff)\n\n`;
    out += `**Department Breakdown:**\n`;
    for (const [dept, count] of Object.entries(departmentCounts || {})) {
      out += `• **${dept}:** ${count}\n`;
    }
    out += `\n| Name | ID | Department | Role | Position |\n`;
    out += `| :--- | :--- | :--- | :--- | :--- |\n`;
    members.slice(0, 10).forEach((m: any) => {
      out += `| **${m.name}** | \`${m.employeeId}\` | ${m.department} | ${m.role} | ${m.position || '-'} |\n`;
    });
    return out;
  }

  // Holidays query
  if (queryType === 'holidays' && Array.isArray(data)) {
    let out = `### 📅 Company & National Holidays Calendar\n\n`;
    out += `| Date | Holiday Name | Type |\n`;
    out += `| :--- | :--- | :--- |\n`;
    data.slice(0, 10).forEach((h: any) => {
      out += `| ${h.date} | **${h.name}** | \`${h.type || 'Company'}\` |\n`;
    });
    return out;
  }

  // General executive snapshot
  if (queryType === 'general_snapshot' || data.totalEmployees !== undefined) {
    const attendancePct = data.totalEmployees > 0 ? Math.round(((data.presentToday ?? 0) / data.totalEmployees) * 100) : 0;
    let out = `### 📊 Hirush Global Enterprise Live Snapshot\n\n`;
    out += `Here is the current executive status across the enterprise:\n\n`;
    out += `• **Present Staff Today:** \`${data.presentToday ?? 0}\`\n`;
    out += `• **Total Active Staff:** \`${data.totalEmployees ?? 0}\`\n`;
    out += `• **Attendance Rate:** \`${attendancePct}%\`\n`;
    out += `• **Active CRM Leads:** \`${data.ongoingLeads ?? 0}\`\n`;
    out += `• **Pending Leave Requests:** \`${data.pendingLeaves ?? 0}\`\n`;
    out += `• **Domains Expiring Soon:** \`${data.expiringDomains ?? 0}\`\n\n`;
    out += `#### 💡 Quick Inquiries You Can Ask:\n`;
    out += `- *"Who was present on Friday?"* (or any date)\n`;
    out += `- *"Show all ongoing leads"*\n`;
    out += `- *"List pending leave requests"*\n`;
    out += `- *"Check domain health & SSL"*\n`;
    out += `- *"How many members in Development department?"*\n`;
    return out;
  }

  return `### 📋 Database Inquiry\n\nI reviewed the database records for your query "*${prompt}*".\n\nTry asking a specific query like *"Who was present on Friday?"*, *"Show ongoing CRM leads"*, or *"Any pending leaves?"*.`;
}
