"use client";

/**
 * @file Header.tsx
 * @description React component for rendering Header UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React, { useState } from 'react';
import { User } from '../../types';
import Button from './Button';
import { LogOut, Menu, Bell, X, Download } from 'lucide-react';
import { Notification } from '../../hooks/useNotifications';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onLogout: () => void;
  isDashboard?: boolean;
  onMenuClick?: () => void;
  unreadCount?: number;
  notifications?: Notification[];
  onNotificationClick?: () => void;
  onMarkAsRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onClearAll?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onLogout,
  isDashboard,
  onMenuClick,
  unreadCount = 0,
  notifications = [],
  onNotificationClick,
  onMarkAsRead,
  onDismiss,
  onClearAll
}) => {
  const { user } = useAuth();
  const [showNotificationPreview, setShowNotificationPreview] = useState(false);
  const { isInstallable, installApp } = usePWAInstall();

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    if (typeof timestamp.toDate === 'function') {
      const date = timestamp.toDate();
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    }
    return 'Recently';
  };

  if (!user) return null;

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-100 px-4 sm:px-8 py-3 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors focus:ring-2 focus:ring-primary/20"
            aria-label="Open Menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              H
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-800 tracking-tight text-base sm:text-lg leading-tight">
                Hirush <span className="text-primary font-medium">Global</span>
              </span>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase leading-tight">
                AMS Portal
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          {/* PWA Install Button */}
          {isInstallable && (
            <button
              onClick={installApp}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all font-semibold text-xs animate-bounce-subtle shadow-sm border border-indigo-100/50"
              title="Install App"
            >
              <Download size={16} />
              <span className="hidden lg:inline">Install App</span>
            </button>
          )}

          {/* Notification Bell */}
          {isDashboard && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotificationPreview(prev => !prev);
                }}
                className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Preview Dropdown */}
              {showNotificationPreview && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotificationPreview(false)}
                  ></div>
                  <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 max-h-[500px] overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {notifications.length > 0 && onClearAll && (
                          <button
                            onClick={() => {
                              onClearAll();
                            }}
                            className="text-xs text-slate-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                          >
                            Clear all
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotificationPreview(false)}
                          className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell size={32} className="text-slate-300 mx-auto mb-2" />
                          <p className="text-slate-500 text-sm">No notifications</p>
                        </div>
                      ) : (
                        <div className="p-2">
                          {notifications.slice(0, 8).map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                if (onMarkAsRead && !notif.read) onMarkAsRead(notif.id);
                              }}
                              className={`group relative p-3 rounded-xl mb-2 transition-all cursor-pointer ${
                                !notif.read ? 'bg-indigo-50/60 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                {!notif.read && (
                                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-1.5 flex-shrink-0"></div>
                                )}
                                <div className="flex-1 min-w-0 pr-5">
                                  <p className="font-semibold text-sm text-slate-800 truncate">
                                    {notif.title}
                                  </p>
                                  <p className="text-[11px] text-slate-500 mb-1">
                                    {notif.senderName}
                                  </p>
                                  <p className="text-xs text-slate-600 line-clamp-2">
                                    {notif.content}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-1">
                                    {formatTimestamp(notif.timestamp)}
                                  </p>
                                </div>

                                {onDismiss && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDismiss(notif.id);
                                    }}
                                    className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    title="Dismiss notification"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setShowNotificationPreview(false);
                            if (onNotificationClick) onNotificationClick();
                          }}
                          className="w-full text-center text-sm font-semibold text-primary hover:text-primary-dark"
                        >
                          View all notifications
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="text-right hidden sm:block">
            <p className="font-bold text-slate-700 text-sm md:text-sm leading-tight">{user.name}</p>
            <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">{user.role}</p>
          </div>
          <div className="relative group cursor-pointer">
            <img
              src={user.profilePhoto}
              alt="Profile"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-md object-cover group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute inset-0 rounded-full ring-2 ring-indigo-100 ring-offset-2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <Button onClick={onLogout} variant="secondary" className="!p-2 !bg-white hover:!bg-red-50 !text-red-500 !border-red-100 shadow-sm transition-all hover:shadow-md">
            <LogOut size={18} />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;