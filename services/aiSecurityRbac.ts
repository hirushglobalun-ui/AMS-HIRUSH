/**
 * File: services/aiSecurityRbac.ts
 * Purpose: Role-Based Access Control (RBAC) and Data Scope Resolver for Hirush AI Copilot.
 * Ensures unauthorized data is intercepted BEFORE querying and NEVER enters the AI context.
 * Author: Hirush Global AMS
 */

import { User, Role } from '../types';
import { AIIntent } from './aiIntentRegistry';

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  scope: 'all' | 'department' | 'self';
}

// Sensitive keywords that non-admin/HR users cannot inquire about
const SENSITIVE_FINANCIAL_KEYWORDS = [
  'salary',
  'salaries',
  'pay',
  'payroll',
  'wage',
  'wages',
  'compensation',
  'bank',
  'account number',
  'ifsc',
  'aadhar',
  'pan card',
  'pan number',
  'password',
  'passwords',
  'credentials',
  'admin settings',
  'api key',
  'secret',
];

/**
 * Checks if the user is authorized to perform the requested intent.
 * Evaluates role, intent, and prompt content before any database operation.
 */
export function checkPermission(user: User, intent: AIIntent, rawPrompt: string): PermissionCheckResult {
  const lower = rawPrompt.toLowerCase();
  const role = user.role;

  // 1. Intercept attempts to query private financial / PII / credentials
  const containsSensitive = SENSITIVE_FINANCIAL_KEYWORDS.some(k => lower.includes(k));
  if (containsSensitive && role !== Role.ADMIN && role !== Role.HR) {
    return {
      allowed: false,
      reason: `🔒 **Access Restricted**: As an **${role}**, you do not have permission to view private compensation, financial documents, or system credentials.`,
      scope: 'self',
    };
  }

  // 2. Admin has unrestricted access to all organizational AMS intelligence
  if (role === Role.ADMIN) {
    return { allowed: true, scope: 'all' };
  }

  // 3. HR has full access to employees, attendance, leaves, holidays, team
  if (role === Role.HR) {
    if (intent === AIIntent.DOMAIN_HEALTH || intent === AIIntent.DOMAIN_EXPIRY) {
      // Allowed basic view
      return { allowed: true, scope: 'all' };
    }
    return { allowed: true, scope: 'all' };
  }

  // 4. Employee & Intern Restrictions
  if (role === Role.EMPLOYEE || role === Role.INTERN || role === Role.VISITOR) {
    // Cannot inspect CRM financial deals or modify admin configurations
    if (
      intent === AIIntent.CRM_PIPELINE ||
      intent === AIIntent.CRM_CLIENT ||
      intent === AIIntent.EXECUTIVE_SUMMARY
    ) {
      if (lower.includes('revenue') || lower.includes('deal value') || lower.includes('profit')) {
        return {
          allowed: false,
          reason: `🔒 **Access Restricted**: Financial deal values and executive revenue projections are restricted to Management and Administrators.`,
          scope: 'self',
        };
      }
    }

    // General operational attendance, holidays, team contacts, own leaves are permitted
    return {
      allowed: true,
      scope: 'department',
    };
  }

  return { allowed: true, scope: 'all' };
}

/**
 * Sanitizes any data payload before passing to the AI or UI.
 * Strips PII such as bank accounts, tax IDs, and document uploads.
 */
export function sanitizeDataForRole(data: any, role: Role): any {
  if (!data || typeof data !== 'object') return data;

  const clone = JSON.parse(JSON.stringify(data));

  const sanitizeUserObject = (u: any) => {
    if (!u) return;
    delete u.password;
    delete u.bankName;
    delete u.accountNumber;
    delete u.ifscCode;
    delete u.accountHolderName;
    delete u.accountType;
    delete u.aadharNumber;
    delete u.panNumber;
    delete u.aadharDocument;
    delete u.panDocument;
    delete u.bankDocument;
    delete u.otherDocument;
    delete u.emergencyPhone;

    // Non-admin/HR cannot view personal phone numbers of others if restricted
    if (role !== Role.ADMIN && role !== Role.HR) {
      delete u.phone;
    }
  };

  if (Array.isArray(clone)) {
    clone.forEach(item => sanitizeUserObject(item));
  } else if (clone.employeeProfile) {
    sanitizeUserObject(clone.employeeProfile);
  } else if (clone.members) {
    clone.members.forEach((m: any) => sanitizeUserObject(m));
  } else if (clone.teamDirectory) {
    clone.teamDirectory.forEach((m: any) => sanitizeUserObject(m));
  } else {
    sanitizeUserObject(clone);
  }

  return clone;
}
