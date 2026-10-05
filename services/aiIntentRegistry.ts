/**
 * File: services/aiIntentRegistry.ts
 * Purpose: Structured intent registry and classifier for Hirush Global AMS AI Copilot.
 * Author: Hirush Global AMS
 */

export enum AIIntent {
  // Attendance Intents
  ATTENDANCE_TODAY = 'ATTENDANCE_TODAY',
  ATTENDANCE_DATE = 'ATTENDANCE_DATE',
  ATTENDANCE_EMPLOYEE = 'ATTENDANCE_EMPLOYEE',
  ATTENDANCE_ABSENT = 'ATTENDANCE_ABSENT',
  ATTENDANCE_WFH = 'ATTENDANCE_WFH',
  ATTENDANCE_LATE = 'ATTENDANCE_LATE',
  ATTENDANCE_SUMMARY = 'ATTENDANCE_SUMMARY',

  // Leave Intents
  LEAVE_PENDING = 'LEAVE_PENDING',
  LEAVE_TODAY = 'LEAVE_TODAY',
  LEAVE_UPCOMING = 'LEAVE_UPCOMING',
  LEAVE_EMPLOYEE = 'LEAVE_EMPLOYEE',
  LEAVE_SUMMARY = 'LEAVE_SUMMARY',

  // Employee & Directory Intents
  EMPLOYEE_SEARCH = 'EMPLOYEE_SEARCH',
  EMPLOYEE_COUNT = 'EMPLOYEE_COUNT',
  EMPLOYEE_DEPARTMENT = 'EMPLOYEE_DEPARTMENT',
  EMPLOYEE_ROLE = 'EMPLOYEE_ROLE',
  EMPLOYEE_CONTACT = 'EMPLOYEE_CONTACT',

  // CRM & Leads Intents
  CRM_ACTIVE = 'CRM_ACTIVE',
  CRM_PIPELINE = 'CRM_PIPELINE',
  CRM_LEADS = 'CRM_LEADS',
  CRM_CLIENT = 'CRM_CLIENT',
  CRM_SUMMARY = 'CRM_SUMMARY',

  // Domain & SSL Intents
  DOMAIN_HEALTH = 'DOMAIN_HEALTH',
  DOMAIN_EXPIRY = 'DOMAIN_EXPIRY',
  SSL_STATUS = 'SSL_STATUS',
  DNS_STATUS = 'DNS_STATUS',

  // Holiday Intents
  HOLIDAY_NEXT = 'HOLIDAY_NEXT',
  HOLIDAY_MONTH = 'HOLIDAY_MONTH',
  HOLIDAY_LIST = 'HOLIDAY_LIST',

  // Executive Overview
  EXECUTIVE_SUMMARY = 'EXECUTIVE_SUMMARY',

  // Complex Analytical Intents (Eligible for Gemini AI reasoning)
  ANALYTICS_ATTENDANCE = 'ANALYTICS_ATTENDANCE',
  ANALYTICS_LEAVE = 'ANALYTICS_LEAVE',
  ANALYTICS_DEPARTMENT = 'ANALYTICS_DEPARTMENT',
  ANALYTICS_TRENDS = 'ANALYTICS_TRENDS',

  // General Conversational or Open AI
  GENERAL_AI = 'GENERAL_AI',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Returns true if the intent can be answered deterministically from live database records
 * without needing an external generative AI API call.
 */
export function isDeterministicIntent(intent: AIIntent): boolean {
  switch (intent) {
    case AIIntent.ATTENDANCE_TODAY:
    case AIIntent.ATTENDANCE_DATE:
    case AIIntent.ATTENDANCE_EMPLOYEE:
    case AIIntent.ATTENDANCE_ABSENT:
    case AIIntent.ATTENDANCE_WFH:
    case AIIntent.ATTENDANCE_LATE:
    case AIIntent.ATTENDANCE_SUMMARY:
    case AIIntent.LEAVE_PENDING:
    case AIIntent.LEAVE_TODAY:
    case AIIntent.LEAVE_UPCOMING:
    case AIIntent.LEAVE_EMPLOYEE:
    case AIIntent.LEAVE_SUMMARY:
    case AIIntent.EMPLOYEE_SEARCH:
    case AIIntent.EMPLOYEE_COUNT:
    case AIIntent.EMPLOYEE_DEPARTMENT:
    case AIIntent.EMPLOYEE_ROLE:
    case AIIntent.EMPLOYEE_CONTACT:
    case AIIntent.CRM_ACTIVE:
    case AIIntent.CRM_PIPELINE:
    case AIIntent.CRM_LEADS:
    case AIIntent.CRM_CLIENT:
    case AIIntent.CRM_SUMMARY:
    case AIIntent.DOMAIN_HEALTH:
    case AIIntent.DOMAIN_EXPIRY:
    case AIIntent.SSL_STATUS:
    case AIIntent.DNS_STATUS:
    case AIIntent.HOLIDAY_NEXT:
    case AIIntent.HOLIDAY_MONTH:
    case AIIntent.HOLIDAY_LIST:
    case AIIntent.EXECUTIVE_SUMMARY:
      return true;

    case AIIntent.ANALYTICS_ATTENDANCE:
    case AIIntent.ANALYTICS_LEAVE:
    case AIIntent.ANALYTICS_DEPARTMENT:
    case AIIntent.ANALYTICS_TRENDS:
    case AIIntent.GENERAL_AI:
    case AIIntent.UNKNOWN:
    default:
      return false;
  }
}
