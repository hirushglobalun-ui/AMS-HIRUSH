"use client";

/**
 * File: app/messages/page.tsx
 * Purpose: Native Next.js messages and announcements route.
 * Roles:
 *  - Employee/Visitor: View announcements and department messages.
 *  - Admin/HR: Broadcast company announcements and target specific departments.
 */

import React from 'react';
import { AuthGuard } from '../../components/layout/AuthGuard';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';
import UserMessages from '../../components/user/Messages';
import AdminManageMessages from '../../components/admin/ManageMessages';
import HRManageMessages from '../../components/hr/ManageMessages';

export default function MessagesPage() {
  const { user } = useAuth();

  const renderContent = () => {
    if (!user) return null;
    if (user.role === Role.ADMIN) {
      return <AdminManageMessages />;
    }
    if (user.role === Role.HR) {
      return <HRManageMessages />;
    }
    return <UserMessages />;
  };

  return <AuthGuard>{renderContent()}</AuthGuard>;
}
