"use client";

/**
 * File: app/crm/page.tsx
 * Purpose: Native Next.js CRM Lead Management and Activity Calendar route.
 * Roles: Restricted to Admin, HR, and Sales personnel.
 */

import React from 'react';
import { AuthGuard } from '../../components/layout/AuthGuard';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';
import ManageLeads from '../../components/admin/crm/ManageLeads';

export default function CRMPage() {
  const { user } = useAuth();

  const isPermitted = user && (
    user.role === Role.ADMIN ||
    user.role === Role.HR ||
    user.department === 'Sales'
  );

  return (
    <AuthGuard>
      {isPermitted ? (
        <ManageLeads />
      ) : (
        <div className="bg-white rounded-xl p-8 border border-red-200 text-center shadow-sm">
          <h2 className="text-xl font-bold text-red-600 mb-2">Access Restricted</h2>
          <p className="text-slate-600 text-sm">CRM Leads are only accessible to Admin, HR, and Sales teams.</p>
        </div>
      )}
    </AuthGuard>
  );
}
