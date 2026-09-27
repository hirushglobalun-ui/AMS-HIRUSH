"use client";

/**
 * File: app/users/page.tsx
 * Purpose: Native Next.js user and employee directory management route.
 * Roles: Restricted to Admin and HR roles only.
 */

import React from 'react';
import { AuthGuard } from '../../components/layout/AuthGuard';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';
import AdminManageUsers from '../../components/admin/ManageUsers';
import HRManageUsers from '../../components/hr/ManageUsers';

export default function UsersPage() {
  const { user } = useAuth();

  const renderContent = () => {
    if (!user) return null;
    if (user.role === Role.ADMIN) {
      return <AdminManageUsers />;
    }
    return <HRManageUsers />;
  };

  return (
    <AuthGuard allowedRoles={[Role.ADMIN, Role.HR]}>
      {renderContent()}
    </AuthGuard>
  );
}
