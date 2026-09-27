/**
 * File: components/user/UserHome.tsx
 * Purpose: Top-level User Home dashboard with live check-in widget, celebrations, and announcements.
 * Module: components/user
 * Author: Hirush Global AMS
 */

"use client";

import React from 'react';
import { Download, AlertCircle } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useAuth } from '../../contexts/AuthContext';
import HomeAttendanceWidget from './home/HomeAttendanceWidget';
import HomeCelebrationsWidget from './home/HomeCelebrationsWidget';
import HomeAnnouncementsWidget from './home/HomeAnnouncementsWidget';
import { useUserHomeData } from './home/useUserHomeData';

const UserHome: React.FC = () => {
  const { user } = useAuth();
  const { isInstalled, installApp } = usePWAInstall();

  const {
    currentTime,
    activeSession,
    processingAction,
    announcements,
    birthdays,
    workAnniversaries,
    wishedUsers,
    expiringDomains,
    loading,
    monthlyAvg,
    fullDaysCount,
    halfDaysCount,
    isBiometricMandatory,
    biometricStatus,
    handleAction,
    handleSendWish,
    getLiveTodayHours,
  } = useUserHomeData(user);

  if (!user) return null;
  if (loading) return <div className="text-center py-10 font-medium text-slate-500">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      {expiringDomains.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-2xl border border-red-200/50 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 text-red-600 rounded-xl flex-shrink-0">
              <AlertCircle size={22} className="animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-900">Critical: Website Domain Expiry Alert</h4>
              <p className="text-xs text-red-700/80 font-medium">
                The following website domain{expiringDomains.length > 1 ? 's are' : ' is'} expiring within 2 days:{' '}
                <span className="font-bold ml-1">
                  {expiringDomains.map((d) => `${d.projectName} (${d.domainDetail || 'No domain'} - expires ${d.expiryDate})`).join(', ')}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Welcome Back, {user.name}!
          </h1>
          {!isInstalled && (
            <button
              onClick={installApp}
              className="self-start sm:self-auto flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 animate-bounce"
            >
              <Download size={14} />
              Install App
            </button>
          )}
        </div>
        <p className="text-slate-500 text-sm font-medium">Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <HomeAttendanceWidget
          currentTime={currentTime}
          activeSession={activeSession}
          processingAction={processingAction}
          handleAction={handleAction}
          getLiveTodayHours={getLiveTodayHours}
          monthlyAvg={monthlyAvg}
          fullDaysCount={fullDaysCount}
          halfDaysCount={halfDaysCount}
          isBiometricRequired={isBiometricMandatory}
          biometricStatus={biometricStatus}
        />

        <div className="lg:col-span-7 space-y-6">
          <HomeCelebrationsWidget
            birthdays={birthdays}
            workAnniversaries={workAnniversaries}
            wishedUsers={wishedUsers}
            handleSendWish={handleSendWish}
          />
        </div>
      </div>

      <HomeAnnouncementsWidget announcements={announcements} />
    </div>
  );
};

export default UserHome;
