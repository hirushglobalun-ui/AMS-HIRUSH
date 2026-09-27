"use client";

/**
 * File: app/profile/page.tsx
 * Purpose: Native Next.js user profile and digital ID badge route.
 * Roles: All authenticated employees, interns, visitors, HR, and Admins.
 */

import React from 'react';
import { AuthGuard } from '../../components/layout/AuthGuard';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';
import UserProfile from '../../components/user/Profile';
import AdminProfile from '../../components/admin/Profile';
import HRProfile from '../../components/hr/Profile';

export default function ProfilePage() {
  const { user } = useAuth();

  const renderContent = () => {
    if (!user) return null;
    if (user.role === Role.ADMIN) {
      return <AdminProfile />;
    }
    if (user.role === Role.HR) {
      return <HRProfile />;
    }
    return <UserProfile />;
  };

  return <AuthGuard>{renderContent()}</AuthGuard>;
}
