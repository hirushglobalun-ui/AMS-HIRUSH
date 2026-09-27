"use client";

/**
 * File: HRDashboard.tsx
 * Purpose: Human Resources dashboard container
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
import ManageHolidays from './ManageHolidays';
import DomainManager from '../shared/DomainManager';
import ManageBiometrics from '../admin/biometrics/ManageBiometrics';
import { LayoutDashboard, CalendarCheck, Briefcase, Users, MessageCircle, User as UserIcon, Calendar, Globe, Fingerprint } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout, { NavItemType } from '../layout/DashboardLayout';

export type HRTab = 'dashboard' | 'attendance' | 'leave' | 'users' | 'biometrics' | 'messages' | 'profile' | 'holidays' | 'domains';

export interface HRDashboardProps {
  initialTab?: HRTab;
}

const HRDashboard: React.FC<HRDashboardProps> = ({ initialTab = 'dashboard' }) => {
  const { user: hrUser } = useAuth();
  const [activeTab, setActiveTab] = useState<HRTab>(initialTab);
  const { notifications, unreadCount, markAsRead, dismissNotification, clearAll } = useNotifications(hrUser!, activeTab);

  if (!hrUser) return null;

  const navItems: NavItemType[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'leave', label: 'Leave Requests', icon: Briefcase },
    { id: 'users', label: 'Team Directory', icon: Users },
    { id: 'biometrics', label: 'Biometric Auth', icon: Fingerprint },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'holidays', label: 'Holidays', icon: Calendar },
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
      case 'holidays':
        return <ManageHolidays />;
      case 'domains':
        return <DomainManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as HRTab)}
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
export default HRDashboard;
