"use client";

/**
 * File: app/setup/page.tsx
 * Purpose: Dedicated first-time setup route for creating initial admin.
 */

import React from 'react';
import FirstTimeSetup from '../../components/setup/FirstTimeSetup';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const { refreshSession } = useAuth();
  const router = useRouter();

  const handleSetupComplete = async () => {
    await refreshSession();
    router.replace('/');
  };

  return <FirstTimeSetup onSetupComplete={handleSetupComplete} />;
}
