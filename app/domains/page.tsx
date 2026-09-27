"use client";

/**
 * File: app/domains/page.tsx
 * Purpose: Native Next.js Domain & Hosting Health Monitor route.
 * Roles: Restricted to Admin, HR, and Sales teams.
 */

import React from 'react';
import { AuthGuard } from '../../components/layout/AuthGuard';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';
import DomainManager from '../../components/shared/DomainManager';

export default function DomainsPage() {
  const { user } = useAuth();

  const isPermitted = user && (
    user.role === Role.ADMIN ||
    user.role === Role.HR ||
    user.department === 'Sales'
  );

  return (
    <AuthGuard>
      {isPermitted ? (
        <DomainManager />
      ) : (
        <div className="bg-white rounded-xl p-8 border border-red-200 text-center shadow-sm">
          <h2 className="text-xl font-bold text-red-600 mb-2">Access Restricted</h2>
          <p className="text-slate-600 text-sm">Domain monitoring is only accessible to authorized personnel.</p>
        </div>
      )}
    </AuthGuard>
  );
}
