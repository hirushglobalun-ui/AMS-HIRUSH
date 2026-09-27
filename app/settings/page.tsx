"use client";

/**
 * File: app/settings/page.tsx
 * Purpose: Native Next.js system location & geofence settings route.
 * Roles: Restricted to Admin role only.
 */

import React from 'react';
import { AuthGuard } from '../../components/layout/AuthGuard';
import { Role } from '../../types';
import AdminSettings from '../../components/admin/AdminSettings';

export default function SettingsPage() {
  return (
    <AuthGuard allowedRoles={[Role.ADMIN]}>
      <AdminSettings />
    </AuthGuard>
  );
}
