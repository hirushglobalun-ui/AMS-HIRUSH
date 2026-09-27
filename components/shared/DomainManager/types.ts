/**
 * File: components/shared/DomainManager/types.ts
 * Purpose: TypeScript type definitions for the Domain and Hosting Health Monitor.
 * Author: Hirush Global AMS
 */

export interface ConsolidatedDomain {
  id: string;
  projectName: string;
  domainDetail: string;
  expiryDate: string;
  pocName: string;
  pocEmail: string;
  pocPhone: string;
  remark: string;
  isCRM: boolean;
  daysRemaining: number;
  dnsStatus?: 'Healthy' | 'Issue Detected' | 'Pending';
  sslStatus?: 'Healthy' | 'Issue Detected' | 'Pending';
  sslDaysLeft?: number;
  healthError?: string;
  lastChecked?: string;
}

export interface DomainFormData {
  projectName: string;
  domainDetail: string;
  expiryDate: string;
  pocName: string;
  pocEmail: string;
  pocPhone: string;
  remark: string;
}export type DomainStatusFilter = 'all' | 'critical' | 'warning' | 'active' | 'expired' | 'health-issue';
