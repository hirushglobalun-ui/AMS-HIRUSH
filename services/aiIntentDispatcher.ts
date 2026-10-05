/**
 * File: services/aiIntentDispatcher.ts
 * Purpose: Enterprise AI Intent Dispatcher & Orchestrator for Hirush Global AMS.
 * Implements: Query Normalization -> Intent Routing -> Entity/Date Parsing -> RBAC -> Fast Cache ->
 * Firestore Query -> Deterministic Answering -> AI Fallback & Response Validation.
 * Author: Hirush Global AMS
 */

import { User } from '../types';
import { normalizeQuery } from './aiQueryNormalizer';
import { AIIntent, isDeterministicIntent } from './aiIntentRegistry';
import { extractEntities, ExtractedEntities } from './aiEntityExtractor';
import { checkPermission, sanitizeDataForRole } from './aiSecurityRbac';
import { getFromCache, setInCache, CacheTTL } from './aiCacheService';
import { generateDeterministicAnswer, ActionButton } from './aiDeterministicEngine';
import { validateAiResponse } from './aiResponseValidator';
import { recordAiAudit } from './aiAuditService';
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

export interface DispatchResult {
  answer: string;
  queryType: string;
  hasRealAi: boolean;
  rawContext?: any;
  dateQueried?: string;
  source?: 'verified_db' | 'ai_analysis' | 'general';
  suggestedActions?: ActionButton[];
  metrics?: Record<string, any>;
  latencyMs?: number;
  intent?: AIIntent;
}

// Conversation state memory for follow-up questions (e.g. "What about Friday?", "Who were they?")
interface ConversationContext {
  lastIntent?: AIIntent;
  lastCategory?: string;
  lastDate?: string;
  lastDepartment?: string;
  lastData?: any;
}

let activeConversationContext: ConversationContext = {};

export function resetConversationContext() {
  activeConversationContext = {};
}

/**
 * Main AI Copilot Dispatcher Pipeline.
 */
export async function dispatchAiQuery(
  prompt: string,
  user: User,
  chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = [],
  customApiKey?: string
): Promise<DispatchResult> {
  const startTime = Date.now();

  // 1. Query Normalization (handles typos, Manglish, Malayalam, casing, punctuation)
  const normalized = normalizeQuery(prompt);
  const normText = normalized.normalized;

  // 2. Fetch Cached Users for Entity Extraction
  let allUsers: User[] = [];
  try {
    allUsers = await getAllUsersCached();
  } catch (err) {
    console.warn('Could not retrieve cached users:', err);
  }

  // 3. Entity Extraction (dates, names, departments, roles, filters)
  const entities = extractEntities(normText, allUsers);

  // 4. Intent Detection with Follow-Up Intelligence
  let intent = detectIntent(normText, entities);

  // Handle follow-ups: e.g. "What about Friday?" or "What about yesterday?"
  if (
    intent === AIIntent.UNKNOWN &&
    activeConversationContext.lastIntent &&
    (normText.includes('what about') || normText.includes('and friday') || normText.includes('how about'))
  ) {
    intent = activeConversationContext.lastIntent;
  }

  // Handle "Who were they?" follow-up
  if (
    (normText.includes('who were they') || normText.includes('who are they') || normText.includes('names')) &&
    activeConversationContext.lastData
  ) {
    intent = activeConversationContext.lastIntent || AIIntent.ATTENDANCE_ABSENT;
  }

  // 5. RBAC Permission Check (Intercept unauthorized queries early)
  const permission = checkPermission(user, intent, prompt);
  if (!permission.allowed) {
    const latency = Date.now() - startTime;
    recordAiAudit({
      userId: user.id,
      userName: user.name,
      role: user.role,
      intent,
      query: prompt,
      isDeterministic: true,
      cacheHit: false,
      latencyMs: latency,
      success: false,
      error: 'Permission Denied',
    });

    return {
      answer: permission.reason || '🔒 You do not have permission to view this data.',
      queryType: 'permission_denied',
      hasRealAi: false,
      source: 'verified_db',
      latencyMs: latency,
      suggestedActions: [
        { label: 'Check Today\'s Attendance', query: 'Who is present today?' },
        { label: 'Upcoming Holidays', query: 'When is the next holiday?' },
      ],
    };
  }

  // 6. Data Scope & Cache Key Resolution
  const dateKey = entities.dateInfo.date || new Date().toISOString().split('T')[0];
  const cacheKey = resolveCacheKey(intent, entities, dateKey);

  // 7. Check Fast Cache Layer
  let databaseContext: any = null;
  let cacheHit = false;

  if (cacheKey) {
    const cachedData = getFromCache<any>(cacheKey);
    if (cachedData) {
      databaseContext = cachedData;
      cacheHit = true;
    }
  }

  // 8. Fetch from Live Firestore if Cache Miss
  if (!databaseContext) {
    databaseContext = await fetchFirestoreData(intent, entities, dateKey, allUsers);
    if (cacheKey && databaseContext) {
      const ttl = resolveCacheTTL(intent);
      setInCache(cacheKey, databaseContext, ttl);
    }
  }

  // 9. Sanitize Data for Role (strip PII / private data)
  const sanitizedContext = sanitizeDataForRole(databaseContext, user.role);

  // Update conversation memory
  activeConversationContext = {
    lastIntent: intent,
    lastCategory: intent.toLowerCase(),
    lastDate: dateKey,
    lastDepartment: entities.department,
    lastData: sanitizedContext,
  };

  // 10. Check if Question Can Be Answered Deterministically
  const isAnalyticalQuery =
    normText.includes('why') ||
    normText.includes('compare') ||
    normText.includes('pattern') ||
    normText.includes('trend') ||
    normText.includes('recommend') ||
    normText.includes('briefing') ||
    normText.includes('strategic') ||
    normText.includes('summarize situation');

  // 10. Generative Gemini AI with Real Live Database Context
  // Sends user question and live Firestore records to Gemini for dynamic, multilingual reasoning
  try {
    const apiKey =
      customApiKey ||
      (typeof window !== 'undefined' ? localStorage.getItem('hirush_gemini_api_key') || undefined : undefined);

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
        queryType: intent,
        databaseContext: sanitizedContext,
        customApiKey: apiKey,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      const rawAiAnswer = json.text || '';

      if (rawAiAnswer) {
        // Validate factual numbers against verified database context
        const validated = validateAiResponse(rawAiAnswer, sanitizedContext);
        const latency = Date.now() - startTime;

        recordAiAudit({
          userId: user.id,
          userName: user.name,
          role: user.role,
          intent,
          query: prompt,
          isDeterministic: false,
          modelUsed: json.modelUsed || 'gemini-2.5-flash',
          cacheHit,
          latencyMs: latency,
          success: true,
        });

        return {
          answer: validated.text,
          queryType: intent,
          hasRealAi: json.hasRealAi !== false,
          source: json.hasRealAi ? 'ai_analysis' : 'verified_db',
          suggestedActions: [
            { label: 'Today\'s Attendance', query: 'Who is present today?' },
            { label: 'Active CRM Leads', query: 'Show ongoing CRM leads' },
            { label: 'Executive Snapshot', query: 'Give me today\'s executive summary' },
          ],
          dateQueried: dateKey,
          latencyMs: latency,
          intent,
        };
      }
    }
  } catch (apiErr: any) {
    console.warn('Gemini API call failed, falling back to deterministic answer:', apiErr);
  }

  // 11. Fallback directly to deterministic response engine
  const fallbackRes = generateDeterministicAnswer(intent, entities, sanitizedContext, user);
  const latency = Date.now() - startTime;

  recordAiAudit({
    userId: user.id,
    userName: user.name,
    role: user.role,
    intent,
    query: prompt,
    isDeterministic: true,
    cacheHit,
    latencyMs: latency,
    success: true,
  });

  return {
    answer: fallbackRes.answer,
    queryType: intent,
    hasRealAi: false,
    source: 'verified_db',
    suggestedActions: fallbackRes.suggestedActions,
    metrics: fallbackRes.metrics,
    dateQueried: dateKey,
    latencyMs: latency,
    intent,
  };
}

/**
 * Maps normalized prompt and extracted entities to a structured AIIntent.
 */
function detectIntent(text: string, entities: ExtractedEntities): AIIntent {
  // 1. Executive Snapshot
  if (
    text.includes('executive summary') ||
    text.includes('executive snapshot') ||
    text.includes('overall status') ||
    text.includes('how is the company doing') ||
    text.includes('company doing today') ||
    text.includes('daily briefing')
  ) {
    return AIIntent.EXECUTIVE_SUMMARY;
  }

  // 2. Specific Employee Match
  if (entities.matchedUser) {
    if (text.includes('present') || text.includes('came') || text.includes('checkin') || text.includes('worked')) {
      return AIIntent.ATTENDANCE_EMPLOYEE;
    }
    if (text.includes('leave') || text.includes('vacation')) {
      return AIIntent.LEAVE_EMPLOYEE;
    }
    return AIIntent.EMPLOYEE_SEARCH;
  }

  // 3. Attendance Intents
  const isAtt =
    text.includes('present') ||
    text.includes('attendance') ||
    text.includes('absent') ||
    text.includes('checkin') ||
    text.includes('check in') ||
    text.includes('punch') ||
    text.includes('who came') ||
    text.includes('who is in') ||
    text.includes('in office') ||
    text.includes('worked') ||
    text.includes('wfh') ||
    text.includes('work from home') ||
    text.includes('late');

  if (isAtt) {
    if (entities.metricType === 'absent' || text.includes('absent')) return AIIntent.ATTENDANCE_ABSENT;
    if (entities.metricType === 'wfh' || text.includes('wfh') || text.includes('work from home')) return AIIntent.ATTENDANCE_WFH;
    if (entities.metricType === 'late' || text.includes('late')) return AIIntent.ATTENDANCE_LATE;
    if (entities.dateInfo.label === 'Today') return AIIntent.ATTENDANCE_TODAY;
    return AIIntent.ATTENDANCE_DATE;
  }

  // 4. Leave Intents
  const isLeave =
    text.includes('leave') ||
    text.includes('vacation') ||
    text.includes('sick') ||
    text.includes('casual') ||
    text.includes('avathi');

  if (isLeave) {
    if (text.includes('pending')) return AIIntent.LEAVE_PENDING;
    if (text.includes('today')) return AIIntent.LEAVE_TODAY;
    if (text.includes('upcoming') || text.includes('next')) return AIIntent.LEAVE_UPCOMING;
    return AIIntent.LEAVE_SUMMARY;
  }

  // 5. CRM / Leads Intents
  const isCrm =
    text.includes('lead') ||
    text.includes('crm') ||
    text.includes('project') ||
    text.includes('client') ||
    text.includes('pipeline') ||
    text.includes('sales') ||
    text.includes('deal');

  if (isCrm) {
    if (text.includes('active') || text.includes('ongoing')) return AIIntent.CRM_ACTIVE;
    if (text.includes('pipeline')) return AIIntent.CRM_PIPELINE;
    if (text.includes('client')) return AIIntent.CRM_CLIENT;
    return AIIntent.CRM_LEADS;
  }

  // 6. Domain & SSL Intents
  const isDomain =
    text.includes('domain') ||
    text.includes('ssl') ||
    text.includes('dns') ||
    text.includes('expiry') ||
    text.includes('expire') ||
    text.includes('hosting');

  if (isDomain) {
    if (text.includes('ssl')) return AIIntent.SSL_STATUS;
    if (text.includes('dns')) return AIIntent.DNS_STATUS;
    if (text.includes('expire') || text.includes('expiry')) return AIIntent.DOMAIN_EXPIRY;
    return AIIntent.DOMAIN_HEALTH;
  }

  // 7. Team & Employee Directory Intents
  const isTeam =
    text.includes('team') ||
    text.includes('employee') ||
    text.includes('staff') ||
    text.includes('developer') ||
    text.includes('department') ||
    text.includes('how many people');

  if (isTeam) {
    if (entities.department) return AIIntent.EMPLOYEE_DEPARTMENT;
    if (entities.metricType === 'count') return AIIntent.EMPLOYEE_COUNT;
    return AIIntent.EMPLOYEE_SEARCH;
  }

  // 8. Holidays Intents
  if (text.includes('holiday') || text.includes('calendar') || text.includes('off day')) {
    if (text.includes('next') || text.includes('upcoming')) return AIIntent.HOLIDAY_NEXT;
    return AIIntent.HOLIDAY_LIST;
  }

  return AIIntent.UNKNOWN;
}

/**
 * Resolves cache key based on intent and query parameters.
 */
function resolveCacheKey(intent: AIIntent, entities: ExtractedEntities, dateKey: string): string | null {
  if (
    intent === AIIntent.ATTENDANCE_TODAY ||
    intent === AIIntent.ATTENDANCE_DATE ||
    intent === AIIntent.ATTENDANCE_ABSENT ||
    intent === AIIntent.ATTENDANCE_WFH ||
    intent === AIIntent.ATTENDANCE_LATE
  ) {
    return `attendance:${dateKey}`;
  }
  if (intent === AIIntent.LEAVE_PENDING) return 'leaves:pending';
  if (intent === AIIntent.LEAVE_TODAY || intent === AIIntent.LEAVE_SUMMARY) return 'leaves:all';
  if (intent === AIIntent.CRM_ACTIVE || intent === AIIntent.CRM_LEADS) return `crm:${entities.statusFilter || 'all'}`;
  if (intent === AIIntent.DOMAIN_HEALTH || intent === AIIntent.DOMAIN_EXPIRY) return 'domains:all';
  if (intent === AIIntent.HOLIDAY_NEXT || intent === AIIntent.HOLIDAY_LIST) return 'holidays:all';
  if (intent === AIIntent.EXECUTIVE_SUMMARY) return `executive:${dateKey}`;
  if (intent === AIIntent.EMPLOYEE_COUNT || intent === AIIntent.EMPLOYEE_DEPARTMENT) {
    return `team:${entities.department || 'all'}`;
  }
  return null;
}

/**
 * Resolves TTL for specific category.
 */
function resolveCacheTTL(intent: AIIntent): number {
  if (intent.startsWith('ATTENDANCE')) return CacheTTL.ATTENDANCE;
  if (intent.startsWith('LEAVE')) return CacheTTL.LEAVES;
  if (intent.startsWith('CRM')) return CacheTTL.CRM;
  if (intent.startsWith('DOMAIN')) return CacheTTL.DOMAINS;
  if (intent.startsWith('HOLIDAY')) return CacheTTL.HOLIDAYS;
  if (intent.startsWith('EMPLOYEE')) return CacheTTL.USERS;
  return CacheTTL.EXECUTIVE;
}

/**
 * Performs target Firestore read.
 */
async function fetchFirestoreData(
  intent: AIIntent,
  entities: ExtractedEntities,
  dateKey: string,
  allUsers: User[]
): Promise<any> {
  if (entities.matchedUser) {
    return await queryUserDetail(entities.matchedUser);
  }

  if (intent.startsWith('ATTENDANCE')) {
    return await queryAttendance(dateKey);
  }

  if (intent.startsWith('LEAVE')) {
    return await queryLeaveRequests(entities.statusFilter);
  }

  if (intent.startsWith('CRM')) {
    return await queryLeads(entities.statusFilter);
  }

  if (intent.startsWith('DOMAIN')) {
    return await queryDomains();
  }

  if (intent.startsWith('EMPLOYEE')) {
    return await queryTeam(entities.department, entities.role);
  }

  if (intent.startsWith('HOLIDAY')) {
    return await queryHolidays();
  }

  if (intent === AIIntent.EXECUTIVE_SUMMARY) {
    return await queryExecutiveSnapshot();
  }

  // Default fallback snapshot
  return await queryExecutiveSnapshot();
}
