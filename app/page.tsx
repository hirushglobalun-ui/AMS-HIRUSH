"use client";

/**
 * File: app/page.tsx
 * Purpose: Primary entry point for Hirush Global AMS in Next.js App Router.
 * Notes:
 *  - Replicates exact routing and role distribution from App.tsx.
 *  - Preserves splash screen, first-time setup, login, and role dashboard rendering.
 *  - Zero layout shift, identical UI and business logic.
 */

import React from 'react';
import { Role } from '../types';
import UserDashboard from '../components/user/UserDashboard';
import AdminDashboard from '../components/admin/AdminDashboard';
import HRDashboard from '../components/hr/HRDashboard';
import FirstTimeSetup from '../components/setup/FirstTimeSetup';
import Login from '../components/Login';
import SplashScreen from '../components/common/SplashScreen';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
  const { user, loading, error, isFirstTimeSetup, refreshSession } = useAuth();

  const handleSetupComplete = () => {
    refreshSession();
  };

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
          <p className="text-xs text-slate-400 mt-6">Please resolve the issue and refresh the page.</p>
        </div>
      </div>
    );
  }

  if (isFirstTimeSetup) {
    return <FirstTimeSetup onSetupComplete={handleSetupComplete} />;
  }

  if (!user) {
    return <Login />;
  }

  // Dashboard routing based on roles
  switch (user.role) {
    case Role.EMPLOYEE:
    case Role.INTERN:
    case Role.VISITOR:
      return <UserDashboard />;
    case Role.ADMIN:
      return <AdminDashboard />;
    case Role.HR:
      return <HRDashboard />;
    default:
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-red-500 text-xl font-semibold">Error: Invalid user role.</p>
        </div>
      );
  }
}
