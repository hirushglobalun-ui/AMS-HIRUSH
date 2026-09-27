"use client";

/**
 * File: components/layout/AuthGuard.tsx
 * Purpose: Route guard and layout wrapper for authenticated Next.js dashboard pages.
 * Notes:
 *  - Verifies session, first-time setup state, and role permissions.
 *  - Automatically wraps authenticated page content inside native DashboardLayout.
 *  - Provides zero-flicker loading state via SplashScreen.
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';
import SplashScreen from '../common/SplashScreen';
import DashboardLayout from './DashboardLayout';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const { user, loading, isFirstTimeSetup } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isFirstTimeSetup) {
        router.replace('/setup');
      } else if (!user) {
        router.replace('/login');
      }
    }
  }, [user, loading, isFirstTimeSetup, router]);

  if (loading || !user || isFirstTimeSetup) {
    return <SplashScreen />;
  }

  // Check RBAC permissions if route is restricted to specific roles
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-xl p-8 border border-red-200 text-center shadow-sm">
          <h2 className="text-xl font-bold text-red-600 mb-2">Access Restricted</h2>
          <p className="text-slate-600 text-sm">
            Your account ({user.role}) does not have permission to access this module.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

export default AuthGuard;
