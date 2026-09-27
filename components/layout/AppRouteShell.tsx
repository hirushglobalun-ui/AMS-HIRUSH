"use client";

/**
 * File: components/layout/AppRouteShell.tsx
 * Purpose: Route-aware wrapper for Next.js App Router pages.
 * Notes:
 *  - Handles authentication and role-based view rendering.
 *  - Passes the target tab corresponding to the route to the active role dashboard.
 *  - Keeps file sizes under 200 lines and adheres to strict DRY principles.
 */

import React from 'react';
import { Role } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import SplashScreen from '../common/SplashScreen';
import Login from '../Login';
import FirstTimeSetup from '../setup/FirstTimeSetup';
import AdminDashboard, { AdminTab } from '../admin/AdminDashboard';
import HRDashboard, { HRTab } from '../hr/HRDashboard';
import UserDashboard, { UserTab } from '../user/UserDashboard';

interface AppRouteShellProps {
  adminTab?: AdminTab;
  hrTab?: HRTab;
  userTab?: UserTab;
}

export const AppRouteShell: React.FC<AppRouteShellProps> = ({
  adminTab = 'dashboard',
  hrTab = 'dashboard',
  userTab = 'dashboard',
}) => {
  const { user, loading, error, isFirstTimeSetup, refreshSession } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto p-8 bg-surface rounded-lg shadow-lg text-center border border-red-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-red-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-red-700 mb-2">Application Error</h2>
          <p className="text-foreground-light">{error}</p>
        </div>
      </div>
    );
  }

  if (isFirstTimeSetup) {
    return <FirstTimeSetup onSetupComplete={() => refreshSession()} />;
  }

  if (!user) {
    return <Login />;
  }

  switch (user.role) {
    case Role.EMPLOYEE:
    case Role.INTERN:
    case Role.VISITOR:
      return <UserDashboard initialTab={userTab} />;
    case Role.ADMIN:
      return <AdminDashboard initialTab={adminTab} />;
    case Role.HR:
      return <HRDashboard initialTab={hrTab} />;
    default:
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-red-500 text-xl font-semibold">Error: Invalid user role.</p>
        </div>
      );
  }
};
