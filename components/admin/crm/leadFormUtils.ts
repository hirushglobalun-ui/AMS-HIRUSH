/**
 * File: components/admin/crm/leadFormUtils.ts
 * Purpose: Configuration mappings and metadata helpers for the LeadFormModal.
 * Author: Hirush Global AMS
 */

import { Building2, UserCheck, TrendingUp, Share2, Info } from 'lucide-react';
import { ClientType } from '../../../types';

export const getClientTypeConfig = (type: ClientType) => {
  switch (type) {
    case ClientType.B2B:
      return {
        label: 'Company Name',
        placeholder: 'e.g. Acme Technologies Inc.',
        hint: 'Specify which company this B2B client belongs to',
        icon: Building2,
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    case ClientType.FRIEND:
      return {
        label: 'Friend Name',
        placeholder: 'e.g. John Doe (Friend)',
        hint: 'Specify the friend who referred or connected this lead',
        icon: UserCheck,
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case ClientType.SALES:
      return {
        label: 'Sales Representative / Person',
        placeholder: 'e.g. Select from sales team or type name',
        hint: 'Specify the sales member or representative',
        icon: TrendingUp,
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      };
    case ClientType.REFERRAL:
      return {
        label: 'Referrer Name (Reference)',
        placeholder: 'e.g. Referred by Jane Smith',
        hint: 'Specify who gave the reference for this client',
        icon: Share2,
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    case ClientType.OTHER:
    default:
      return {
        label: 'Reference / Source Details',
        placeholder: 'e.g. Exhibition, Walk-in, Social campaign',
        hint: 'Specify additional details or reference origin',
        icon: Info,
        badgeColor: 'bg-slate-50 text-slate-700 border-slate-200',
      };
  }
};
