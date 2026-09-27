"use client";

/**
 * File: app/page.tsx
 * Purpose: Root entry point for Hirush Global AMS.
 * Notes: Seamlessly redirects to /dashboard if logged in, /login if unauthenticated, or /setup on first run.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import SplashScreen from '../components/common/SplashScreen';

export default function RootPage() {
  const { user, loading, isFirstTimeSetup } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isFirstTimeSetup) {
        router.replace('/setup');
      } else if (!user) {
        router.replace('/login');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, isFirstTimeSetup, router]);

  return <SplashScreen />;
}
