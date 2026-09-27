/**
 * File: UserDashboard.tsx
 * Purpose: Employee dashboard container
 * Author: Refactored system
 * Notes: 
 *  - Removed duplicated layout code.
 *  - Consumes useAuth and DashboardLayout.
 */

import React, { useState } from 'react';
import { Role } from '../../types';
import Attendance from './Attendance';
import Leave from './Leave';
import Profile from './Profile';
import UserHome from './UserHome';
import { ManageLeads } from '../admin/crm/ManageLeads';
import DomainManager from '../shared/DomainManager';
import { Calendar, Briefcase, User as UserIcon, LayoutDashboard, Target, Globe } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout, { NavItemType } from '../layout/DashboardLayout';

type UserTab = 'dashboard' | 'attendance' | 'leave' | 'profile' | 'crm' | 'domains';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<UserTab>('dashboard');
  const { notifications, unreadCount, markAsRead, dismissNotification, clearAll } = useNotifications(user!, activeTab);

  if (!user) return null;

  const isVisitor = user.department === 'Visitor' || user.role === Role.VISITOR;

  const navItems: NavItemType[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'leave', label: 'Leave', icon: Briefcase, hide: isVisitor },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  if (user.department === 'Sales') {
    navItems.splice(navItems.length - 1, 0, { id: 'crm', label: 'CRM Leads', icon: Target });
    navItems.splice(navItems.length - 1, 0, { id: 'domains', label: 'Domain Manager', icon: Globe });
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <UserHome />;
      case 'attendance':
        return <Attendance />;
      case 'leave':
        return <Leave />;
      case 'profile':
        return <Profile />;
      case 'crm':
        return user.department === 'Sales' ? <ManageLeads /> : <UserHome />;
      case 'domains':
        return user.department === 'Sales' ? <DomainManager /> : <UserHome />;
      default:
        return <UserHome />;
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as UserTab)}
      navItems={navItems}
      headerProps={{
        unreadCount,
        notifications,
        onNotificationClick: () => {},
        onMarkAsRead: markAsRead,
        onDismiss: dismissNotification,
        onClearAll: clearAll
      }}
    >
      {renderContent()}
    </DashboardLayout>
  );
};
export default UserDashboard;
