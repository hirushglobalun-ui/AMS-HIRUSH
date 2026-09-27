"use client";

/**
 * File: app/login/page.tsx
 * Purpose: Dedicated login page route for Hirush Global AMS.
 */

import React from 'react';
import Login from '../../components/Login';
import SplashScreen from '../../components/common/SplashScreen';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <SplashScreen />;
  }

  if (user) {
    router.replace('/');
    return <SplashScreen />;
  }

  return <Login />;
}
