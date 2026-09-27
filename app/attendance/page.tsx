"use client";

/**
 * File: app/attendance/page.tsx
 * Purpose: Native Next.js attendance route.
 * Roles:
 *  - Employee/Visitor: GPS Geofence validation, WebAuthn biometrics, WFH request, daily punch.
 *  - Admin/HR: Full enterprise attendance logs, adjustments, filters, and reports.
 */

import React from 'react';
import { AuthGuard } from '../../components/layout/AuthGuard';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';
import UserAttendance from '../../components/user/Attendance';
import ManageAttendance from '../../components/shared/ManageAttendance';

export default function AttendancePage() {
  const { user } = useAuth();

  const renderContent = () => {
    if (!user) return null;
    if (user.role === Role.ADMIN || user.role === Role.HR) {
      return <ManageAttendance />;
    }
    return <UserAttendance />;
  };

  return <AuthGuard>{renderContent()}</AuthGuard>;
}
