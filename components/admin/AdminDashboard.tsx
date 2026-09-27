"use client";

/**
 * File: AdminDashboard.tsx
 * Purpose: Administrator dashboard container
 * Author: Refactored system
 * Notes: 
 *  - Removed duplicated layout code.
 *  - Consumes useAuth and DashboardLayout.
 */

import React, { useState } from 'react';
import Dashboard from './Dashboard';
import ManageAttendance from '../shared/ManageAttendance';
import ManageLeave from '../shared/ManageLeave';
import ManageUsers from './ManageUsers';
import ManageMessages from './ManageMessages';
import Profile from './Profile';
import AdminSettings from './AdminSettings';
import ManageHolidays from './ManageHolidays';
import ManageLeads from './crm/ManageLeads';
import DomainManager from '../shared/DomainManager';
import ManageBiometrics from './biometrics/ManageBiometrics';
import { LayoutDashboard, CalendarCheck, Briefcase, Users, MessageCircle, User as UserIcon, Settings, Calendar, Target, Globe, Fingerprint, MapPin } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout, { NavItemType } from '../layout/DashboardLayout';

export type AdminTab = 'dashboard' | 'attendance' | 'leave' | 'users' | 'biometrics' | 'messages' | 'profile' | 'settings' | 'holidays' | 'leads' | 'domains';

export interface AdminDashboardProps {
  initialTab?: AdminTab;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ initialTab = 'dashboard' }) => {
  const { user: admin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const { notifications, unreadCount, markAsRead, dismissNotification, clearAll } = useNotifications(admin!, activeTab);

  if (!admin) return null;

  const navItems: NavItemType[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'leave', label: 'Leave Requests', icon: Briefcase },
    { id: 'users', label: 'Team', icon: Users },
    { id: 'biometrics', label: 'Biometric Auth', icon: Fingerprint },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'settings', label: 'Location', icon: MapPin },
    { id: 'holidays', label: 'Holidays', icon: Calendar },
    { id: 'leads', label: 'CRM Leads', icon: Target },
    { id: 'domains', label: 'Domain Manager', icon: Globe },
    { id: 'profile', label: 'My Profile', icon: UserIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'attendance':
        return <ManageAttendance />;
      case 'leave':
        return <ManageLeave />;
      case 'users':
        return <ManageUsers />;
      case 'biometrics':
        return <ManageBiometrics />;
      case 'messages':
        return <ManageMessages />;
      case 'profile':
        return <Profile />;
      case 'settings':
        return <AdminSettings />;
      case 'holidays':
        return <ManageHolidays />;
      case 'leads':
        return <ManageLeads />;
      case 'domains':
        return <DomainManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as AdminTab)}
      navItems={navItems}
      headerProps={{
        unreadCount,
        notifications,
        onNotificationClick: () => setActiveTab('messages'),
        onMarkAsRead: markAsRead,
        onDismiss: dismissNotification,
        onClearAll: clearAll
      }}
    >
      {renderContent()}
    </DashboardLayout>
  );
};
export default AdminDashboard;
