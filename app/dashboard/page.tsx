"use client";

/**
 * File: app/dashboard/page.tsx
 * Purpose: Native Next.js dashboard route rendering role-specific overview panels.
 * Roles: Admin (Full KPIs), HR (HR KPIs), Employee/Intern/Visitor (Personal Home)
 */

import React from 'react';
import { AuthGuard } from '../../components/layout/AuthGuard';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';
import UserHome from '../../components/user/UserHome';
import AdminDashboardContent from '../../components/admin/Dashboard';
import HRDashboardContent from '../../components/hr/Dashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  const renderDashboard = () => {
    if (!user) return null;

    if (user.role === Role.ADMIN) {
      return <AdminDashboardContent />;
    }
    if (user.role === Role.HR) {
      return <HRDashboardContent />;
    }
    return <UserHome />;
  };

  return <AuthGuard>{renderDashboard()}</AuthGuard>;
}
