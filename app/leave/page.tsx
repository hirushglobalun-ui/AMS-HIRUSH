"use client";

/**
 * File: app/leave/page.tsx
 * Purpose: Native Next.js leave management route.
 * Roles:
 *  - Employee/Intern/Sales: Apply for leave, track monthly quota & balance.
 *  - Admin/HR: Review, approve, or reject employee leave requests with remarks.
 */

import React from 'react';
import { AuthGuard } from '../../components/layout/AuthGuard';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';
import UserLeave from '../../components/user/Leave';
import ManageLeave from '../../components/shared/ManageLeave';

export default function LeavePage() {
  const { user } = useAuth();

  const renderContent = () => {
    if (!user) return null;
    if (user.role === Role.ADMIN || user.role === Role.HR) {
      return <ManageLeave />;
    }
    return <UserLeave />;
  };

  return (
    <AuthGuard allowedRoles={[Role.ADMIN, Role.HR, Role.EMPLOYEE, Role.INTERN]}>
      {renderContent()}
    </AuthGuard>
  );
}
