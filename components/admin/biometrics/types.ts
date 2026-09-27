/**
 * File: components/admin/biometrics/types.ts
 * Purpose: TypeScript types and interfaces for the Biometric Authentication Hub.
 * Author: Hirush Global AMS
 */

export type BiometricStatusFilter = 'all' | 'pending' | 'approved' | 'exempted' | 'not_registered';

export interface BiometricStats {
  total: number;
  approved: number;
  pending: number;
  notRegistered: number;
  exempted: number;
}
