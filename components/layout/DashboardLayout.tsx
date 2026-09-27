/**
 * File: DashboardLayout.tsx
 * Purpose: Centralized layout wrapper for all dashboards to eliminate UI code duplication.
 * Author: Refactored system
 * Notes: Preserves exact original UI behavior and responsiveness while ensuring DRY principles.
 */

import React, { useState } from 'react';
import { User } from '../../types';
import Header from '../common/Header';
import { X, Download } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useAuth } from '../../contexts/AuthContext';

export interface NavItemType {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  hide?: boolean;
}

interface DashboardLayoutProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  navItems: NavItemType[];
  children: React.ReactNode;
  headerProps: {
    unreadCount: number;
    notifications: any[];
    onNotificationClick: () => void;
    onMarkAsRead?: (id: string) => void;
    onDismiss?: (id: string) => void;
    onClearAll?: () => void;
  };
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ activeTab, onTabChange, navItems, children, headerProps }) => {
  const { user, logout } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { isInstalled, installApp } = usePWAInstall();

  if (!user) return null;

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const NavItem = ({ item }: { item: NavItemType }) => {
    if (item.hide) return null;
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        onClick={() => {
          onTabChange(item.id);
          setIsDrawerOpen(false);
        }}
        className={`flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all duration-200 w-full text-left mb-1 group ${isActive
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
          : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
          }`}
      >
        <div className="flex items-center space-x-3">
          <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600 transition-colors'} />
          <span>{item.label}</span>
        </div>
        {item.badge && item.badge > 0 && (
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${isActive ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'}`}>
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  const NavigationMenu = () => (
    <nav className="space-y-1">
      <div className="px-4 mb-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Menu</p>
      </div>
      {navItems.map((item) => (
        <NavItem key={item.id} item={item} />
      ))}
      {!isInstalled && (
        <button
          onClick={() => {
            installApp();
            setIsDrawerOpen(false);
          }}
          className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 w-full text-left mb-1 group text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
        >
          <Download size={20} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
          <span>Install App</span>
        </button>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed h-full z-30 transition-all duration-300">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <img src="/assets/company-logo.png" alt="Hirush Global Logo" className="h-8 w-auto rounded-lg" />
          <h2 className="font-bold text-xl tracking-tight text-slate-900">Hirush Global</h2>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
          <NavigationMenu />
        </div>

        <div className="p-4 bg-slate-50 m-2 rounded-xl mb-4 border border-slate-100">
          <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Logged in as</p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold ring-2 ring-white">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen relative min-w-0">
        <Header
          onLogout={handleLogout}
          isDashboard
          onMenuClick={() => setIsDrawerOpen(true)}
          unreadCount={headerProps.unreadCount}
          notifications={headerProps.notifications}
          onNotificationClick={headerProps.onNotificationClick}
          onMarkAsRead={headerProps.onMarkAsRead}
          onDismiss={headerProps.onDismiss}
          onClearAll={headerProps.onClearAll}
        />

        {/* Mobile Drawer */}
        <div
          className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${isDrawerOpen ? 'bg-black/50 backdrop-blur-sm visible' : 'invisible opacity-0'}`}
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 flex items-center justify-between border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <img src="/assets/company-logo.png" alt="Hirush Global Logo" className="h-8 w-auto rounded-lg" />
                <h2 className="font-bold text-lg text-slate-900">Hirush Global</h2>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
              <NavigationMenu />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                  {user.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold truncate text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 p-3.5 sm:p-5 md:p-8 bg-slate-50 overflow-x-hidden">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
