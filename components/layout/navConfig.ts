/**
 * File: components/layout/navConfig.ts
 * Purpose: Centralized navigation item builder based on user role and department.
 * Author: Hirush Global AMS
 */

import { Role, User } from '../../types';
import {
  LayoutDashboard,
  CalendarCheck,
  Briefcase,
  Users,
  MessageCircle,
  User as UserIcon,
  Settings,
  Calendar,
  Target,
  Globe,
  Fingerprint,
  MapPin,
} from 'lucide-react';
import { NavItemType } from './DashboardLayout';

export const getNavItemsForUser = (user: User): NavItemType[] => {
  if (user.role === Role.ADMIN) {
    return [
      { id: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'attendance', href: '/attendance', label: 'Attendance', icon: CalendarCheck },
      { id: 'leave', href: '/leave', label: 'Leave Requests', icon: Briefcase },
      { id: 'users', href: '/users', label: 'Team', icon: Users },
      { id: 'biometrics', href: '/biometrics', label: 'Biometric Auth', icon: Fingerprint },
      { id: 'messages', href: '/messages', label: 'Messages', icon: MessageCircle },
      { id: 'settings', href: '/settings', label: 'Location', icon: MapPin },
      { id: 'holidays', href: '/holidays', label: 'Holidays', icon: Calendar },
      { id: 'leads', href: '/crm', label: 'CRM Leads', icon: Target },
      { id: 'domains', href: '/domains', label: 'Domain Manager', icon: Globe },
      { id: 'profile', href: '/profile', label: 'My Profile', icon: UserIcon },
    ];
  }

  if (user.role === Role.HR) {
    return [
      { id: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'attendance', href: '/attendance', label: 'Attendance', icon: CalendarCheck },
      { id: 'leave', href: '/leave', label: 'Leave Requests', icon: Briefcase },
      { id: 'users', href: '/users', label: 'Team Directory', icon: Users },
      { id: 'biometrics', href: '/biometrics', label: 'Biometric Auth', icon: Fingerprint },
      { id: 'messages', href: '/messages', label: 'Messages', icon: MessageCircle },
      { id: 'holidays', href: '/holidays', label: 'Holidays', icon: Calendar },
      { id: 'domains', href: '/domains', label: 'Domain Manager', icon: Globe },
      { id: 'profile', href: '/profile', label: 'My Profile', icon: UserIcon },
    ];
  }

  // Employee, Intern, Visitor, Sales
  const isVisitor = user.department === 'Visitor' || user.role === Role.VISITOR;
  const items: NavItemType[] = [
    { id: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', href: '/attendance', label: 'Attendance', icon: Calendar },
    { id: 'leave', href: '/leave', label: 'Leave', icon: Briefcase, hide: isVisitor },
    { id: 'profile', href: '/profile', label: 'Profile', icon: UserIcon },
  ];

  if (user.department === 'Sales') {
    items.splice(items.length - 1, 0, { id: 'crm', href: '/crm', label: 'CRM Leads', icon: Target });
    items.splice(items.length - 1, 0, { id: 'domains', href: '/domains', label: 'Domain Manager', icon: Globe });
  }

  return items;
};
