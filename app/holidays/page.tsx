"use client";

/**
 * File: app/holidays/page.tsx
 * Purpose: Native Next.js company holiday calendar route.
 * Roles:
 *  - Employee/Visitor: View upcoming holidays.
 *  - Admin/HR: Manage, add, and remove holiday entries.
 */

import React from 'react';
import { AuthGuard } from '../../components/layout/AuthGuard';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';
import UserHolidays from '../../components/user/Holidays';
import AdminManageHolidays from '../../components/admin/ManageHolidays';
import HRManageHolidays from '../../components/hr/ManageHolidays';

export default function HolidaysPage() {
  const { user } = useAuth();

  const renderContent = () => {
    if (!user) return null;
    if (user.role === Role.ADMIN) {
      return <AdminManageHolidays />;
    }
    if (user.role === Role.HR) {
      return <HRManageHolidays />;
    }
    return <UserHolidays />;
  };

  return <AuthGuard>{renderContent()}</AuthGuard>;
}
