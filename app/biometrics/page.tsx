"use client";

/**
 * File: app/biometrics/page.tsx
 * Purpose: Native Next.js WebAuthn biometric device administration route.
 * Roles: Restricted to Admin and HR roles only.
 */

import React from 'react';
import { AuthGuard } from '../../components/layout/AuthGuard';
import { Role } from '../../types';
import ManageBiometrics from '../../components/admin/biometrics/ManageBiometrics';

export default function BiometricsPage() {
  return (
    <AuthGuard allowedRoles={[Role.ADMIN, Role.HR]}>
      <ManageBiometrics />
    </AuthGuard>
  );
}
