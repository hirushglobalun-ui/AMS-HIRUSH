/**
 * File: tests/aiCopilot.test.ts
 * Purpose: Automated unit tests for Hirush Enterprise AI Copilot.
 * Tests: Query Normalizer, Date Parser, Intent System, RBAC Security, Fast Cache, Deterministic Engine, and Validator.
 * Author: Hirush Global AMS
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { normalizeQuery } from '../services/aiQueryNormalizer';
import { extractDateFromQuery } from '../utils/aiDateParser';
import { AIIntent, isDeterministicIntent } from '../services/aiIntentRegistry';
import { checkPermission, sanitizeDataForRole } from '../services/aiSecurityRbac';
import { getFromCache, setInCache, invalidateAiCache } from '../services/aiCacheService';
import { generateDeterministicAnswer } from '../services/aiDeterministicEngine';
import { validateAiResponse } from '../services/aiResponseValidator';
import { extractEntities } from '../services/aiEntityExtractor';
import { Role, User, UserStatus } from '../types';

describe('Hirush AI Copilot — Query Normalizer', () => {
  test('normalizes casing and enterprise typos correctly', () => {
    const res = normalizeQuery('Who is attendence of employes?');
    assert.strictEqual(res.normalized, 'who is attendance of employees');
  });

  test('converts Manglish terms to standard semantic English', () => {
    const res = normalizeQuery('innu aara vannathu');
    assert.ok(res.normalized.includes('today'));
    assert.ok(res.normalized.includes('who is present'));
  });

  test('handles Malayalam Unicode script', () => {
    const res = normalizeQuery('ഇന്ന് ആരാണ് വന്നത്');
    assert.ok(res.normalized.includes('who is present today'));
    assert.strictEqual(res.detectedLanguage, 'ml');
  });

  test('correctly maps Malayalam employee query "ആരാണ് അനന്യ ശർമ്മ?" to Ananya Sharma', () => {
    const mockUsers: User[] = [
      { id: 'u1', name: 'Vikramaditya Singhania', employeeId: 'EMP001', role: Role.EMPLOYEE, email: 'vikram@hirush.com', department: 'Management', status: UserStatus.ACTIVE, phone: '1234567890', profilePhoto: '' },
      { id: 'u2', name: 'Ananya Sharma', employeeId: 'EMP003', role: Role.EMPLOYEE, email: 'ananya@hirush.com', department: 'Development', status: UserStatus.ACTIVE, phone: '0987654321', profilePhoto: '' },
    ];
    const norm = normalizeQuery('ആരാണ് അനന്യ ശർമ്മ?');
    assert.ok(norm.normalized.toLowerCase().includes('ananya sharma'));

    const entities = extractEntities(norm.normalized, mockUsers);
    assert.strictEqual(entities.matchedUser?.employeeId, 'EMP003');
    assert.strictEqual(entities.matchedUser?.name, 'Ananya Sharma');
  });
});

describe('Hirush AI Copilot — Smart Date Engine', () => {
  const refDate = new Date('2026-10-05T10:00:00Z'); // Monday

  test('parses "today" and "innu"', () => {
    const res1 = extractDateFromQuery('Who is present today?', refDate);
    const res2 = extractDateFromQuery('innu aara vannu?', refDate);
    assert.strictEqual(res1.date, '2026-10-05');
    assert.strictEqual(res2.date, '2026-10-05');
  });

  test('parses "yesterday" and "innale"', () => {
    const res = extractDateFromQuery('Who was absent yesterday?', refDate);
    assert.strictEqual(res.date, '2026-10-04');
    assert.strictEqual(res.label, 'Yesterday');
  });

  test('parses "tomorrow" and "nale"', () => {
    const res = extractDateFromQuery('Who is on leave tomorrow?', refDate);
    assert.strictEqual(res.date, '2026-10-06');
    assert.strictEqual(res.label, 'Tomorrow');
  });

  test('parses day of week like Friday (previous Friday)', () => {
    const res = extractDateFromQuery('Who was present on Friday?', refDate);
    assert.strictEqual(res.date, '2026-10-02');
  });

  test('parses ranges like "past 7 days"', () => {
    const res = extractDateFromQuery('Show attendance for past 7 days', refDate);
    assert.strictEqual(res.isRange, true);
    assert.strictEqual(res.startDate, '2026-09-28');
    assert.strictEqual(res.endDate, '2026-10-05');
  });
});

describe('Hirush AI Copilot — Intent System & Determinism', () => {
  test('identifies factual intents as deterministic', () => {
    assert.strictEqual(isDeterministicIntent(AIIntent.ATTENDANCE_TODAY), true);
    assert.strictEqual(isDeterministicIntent(AIIntent.LEAVE_PENDING), true);
    assert.strictEqual(isDeterministicIntent(AIIntent.CRM_ACTIVE), true);
    assert.strictEqual(isDeterministicIntent(AIIntent.DOMAIN_EXPIRY), true);
    assert.strictEqual(isDeterministicIntent(AIIntent.EMPLOYEE_COUNT), true);
  });

  test('identifies analytical intents as non-deterministic (Gemini candidate)', () => {
    assert.strictEqual(isDeterministicIntent(AIIntent.ANALYTICS_ATTENDANCE), false);
    assert.strictEqual(isDeterministicIntent(AIIntent.ANALYTICS_TRENDS), false);
    assert.strictEqual(isDeterministicIntent(AIIntent.GENERAL_AI), false);
  });
});

describe('Hirush AI Copilot — RBAC Security & Data Sanitization', () => {
  const employeeUser: User = {
    id: 'emp-1',
    employeeId: 'HG001',
    name: 'Sayed P',
    email: 'sayed@hirush.com',
    role: Role.EMPLOYEE,
    department: 'Development',
    status: UserStatus.ACTIVE,
    phone: '9876543210',
    profilePhoto: '',
  };

  const adminUser: User = {
    id: 'admin-1',
    employeeId: 'ADM001',
    name: 'Admin User',
    email: 'admin@hirush.com',
    role: Role.ADMIN,
    department: 'Management',
    status: UserStatus.ACTIVE,
    phone: '9876543211',
    profilePhoto: '',
  };

  test('blocks employee from inquiring about private salaries or credentials', () => {
    const res = checkPermission(employeeUser, AIIntent.EMPLOYEE_SEARCH, 'What is the salary of Vikram?');
    assert.strictEqual(res.allowed, false);
    assert.ok(res.reason?.includes('Access Restricted'));
  });

  test('allows admin full query scope', () => {
    const res = checkPermission(adminUser, AIIntent.EXECUTIVE_SUMMARY, 'Show executive revenue and pipeline');
    assert.strictEqual(res.allowed, true);
    assert.strictEqual(res.scope, 'all');
  });

  test('sanitizes bank accounts and personal tax IDs', () => {
    const rawData = {
      name: 'Vikram',
      bankName: 'HDFC Bank',
      accountNumber: '1234567890',
      aadharNumber: '999988887777',
      department: 'Development',
    };
    const sanitized = sanitizeDataForRole(rawData, Role.EMPLOYEE);
    assert.strictEqual(sanitized.name, 'Vikram');
    assert.strictEqual(sanitized.department, 'Development');
    assert.strictEqual(sanitized.bankName, undefined);
    assert.strictEqual(sanitized.accountNumber, undefined);
    assert.strictEqual(sanitized.aadharNumber, undefined);
  });
});

describe('Hirush AI Copilot — Fast Cache Engine', () => {
  test('stores, retrieves, and invalidates cache entries', () => {
    setInCache('attendance:2026-10-05', { present: 18 }, 5000);
    const cached = getFromCache<any>('attendance:2026-10-05');
    assert.deepStrictEqual(cached, { present: 18 });

    invalidateAiCache('attendance');
    const afterInvalidate = getFromCache('attendance:2026-10-05');
    assert.strictEqual(afterInvalidate, null);
  });
});

describe('Hirush AI Copilot — Deterministic Answering Engine', () => {
  const dummyUser: User = {
    id: 'emp-1',
    employeeId: 'HG001',
    name: 'Sayed P',
    email: 'sayed@hirush.com',
    role: Role.EMPLOYEE,
    department: 'Development',
    status: UserStatus.ACTIVE,
    phone: '9876543210',
    profilePhoto: '',
  };

  test('formats attendance summary with metrics and action buttons', () => {
    const dbContext = {
      date: '2026-10-05',
      totalPresent: 18,
      totalAbsent: 4,
      totalWFH: 2,
      presentUsers: [
        { name: 'Vikram', employeeId: 'HG002', department: 'Development', checkIn: '09:15', totalHours: 8, isWFH: false, biometricVerified: true },
      ],
      absentUsers: [
        { name: 'Priya', employeeId: 'HG003', department: 'HR', role: 'HR' },
      ],
    };

    const res = generateDeterministicAnswer(
      AIIntent.ATTENDANCE_TODAY,
      { dateInfo: { date: '2026-10-05', label: 'Today' } },
      dbContext,
      dummyUser
    );

    assert.strictEqual(res.source, 'verified_db');
    assert.ok(res.answer.includes('18'));
    assert.ok(res.suggestedActions.length > 0);
    assert.strictEqual(res.metrics?.present, 18);
  });
});

describe('Hirush AI Copilot — Response Validator', () => {
  test('flags and corrects discrepancy if generative AI invents attendance numbers', () => {
    const dbContext = { totalPresent: 18, totalAbsent: 4 };
    const hallucinatedText = 'There are 25 employees present in office today.';

    const res = validateAiResponse(hallucinatedText, dbContext);
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.correctionsApplied, true);
    assert.ok(res.text.includes('Verified Data Alignment'));
    assert.ok(res.text.includes('18 present'));
  });

  test('passes valid response without modification', () => {
    const dbContext = { totalPresent: 18, totalAbsent: 4 };
    const correctText = 'Overall attendance is steady, 18 employees are present today.';

    const res = validateAiResponse(correctText, dbContext);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.correctionsApplied, false);
  });
});
