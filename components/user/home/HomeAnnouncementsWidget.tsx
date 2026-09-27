/**
 * @file HomeAnnouncementsWidget.tsx
 * @description React component for rendering HomeAnnouncementsWidget UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React, { useState, useMemo, useEffect } from 'react';
import Card from '../../common/Card';
import Modal from '../../common/Modal';
import { AlertCircle, Calendar, ShieldAlert } from 'lucide-react';
import { Message } from '../../../types';
import { db } from '../../../firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { collection, getDocs } from 'firebase/firestore';

interface HomeAnnouncementsWidgetProps {
  announcements: Message[];
}

const getMonthYearString = (timestamp: any): string => {
  if (!timestamp) return 'Unknown';
  const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const getMonthYearKey = (timestamp: any): string => {
  if (!timestamp) return 'unknown';
  const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const HomeAnnouncementsWidget: React.FC<HomeAnnouncementsWidgetProps> = ({ announcements }) => {
  const { user } = useAuth();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Message | null>(null);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('current');
  const [domainAlerts, setDomainAlerts] = useState<{
    id: string;
    projectName: string;
    domainDetail: string;
    isExpiringSoon: boolean;
    daysRemaining?: number;
  }[]>([]);

  useEffect(() => {
    if (!user) return;
    
    // Only fetch alerts for Admin, HR, or Sales employees
    const isAuthorized = user.role === 'Admin' || user.role === 'HR' || (user.department && user.department.toLowerCase() === 'sales');
    if (!isAuthorized) return;

    const fetchAlerts = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const alerts: typeof domainAlerts = [];

        // 1. Fetch leads
        const leadsRef = collection(db, 'leads');
        const leadsSnap = await getDocs(leadsRef);

        leadsSnap.forEach(d => {
          const lead = d.data();
          if (lead.domainDetail && lead.domainDetail.trim() !== '') {
            let isExpiringSoon = false;
            let daysRemaining = 9999;
            if (lead.expiryDate) {
              const expiry = new Date(lead.expiryDate);
              expiry.setHours(0, 0, 0, 0);
              const diffTime = expiry.getTime() - today.getTime();
              daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));
              if (daysRemaining === 21 || daysRemaining === 2 || daysRemaining <= 0) {
                isExpiringSoon = true;
              }
            }

            if (isExpiringSoon) {
              alerts.push({
                id: d.id,
                projectName: lead.projectName || 'Lead Project',
                domainDetail: lead.domainDetail,
                isExpiringSoon,
                daysRemaining
              });
            }
          }
        });

        // 2. Fetch custom domains
        const customRef = collection(db, 'domains');
        const customSnap = await getDocs(customRef);
        customSnap.forEach(d => {
          const dom = d.data();
          let isExpiringSoon = false;
          let daysRemaining = 9999;
          if (dom.expiryDate) {
            const expiry = new Date(dom.expiryDate);
            expiry.setHours(0, 0, 0, 0);
            const diffTime = expiry.getTime() - today.getTime();
            daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));
            if (daysRemaining === 21 || daysRemaining === 2 || daysRemaining <= 0) {
              isExpiringSoon = true;
            }
          }

          if (isExpiringSoon) {
            alerts.push({
              id: d.id,
              projectName: dom.projectName || 'Custom Project',
              domainDetail: dom.domainDetail,
              isExpiringSoon,
              daysRemaining
            });
          }
        });

        setDomainAlerts(alerts);
      } catch (err) {
        console.error("Error fetching domain alerts for announcements:", err);
      }
    };

    fetchAlerts();
  }, [user]);

  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const currentMonthLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, []);

  // Get all unique month-year strings from announcements
  const monthOptions = useMemo(() => {
    const optionsMap = new Map<string, string>();
    announcements.forEach(msg => {
      if (msg.timestamp) {
        const key = getMonthYearKey(msg.timestamp);
        const label = getMonthYearString(msg.timestamp);
        optionsMap.set(key, label);
      }
    });
    return Array.from(optionsMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [announcements]);

  const filteredAnnouncements = useMemo(() => {
    if (selectedMonthFilter === 'all') {
      return announcements;
    }
    if (selectedMonthFilter === 'current') {
      return announcements.filter(msg => {
        if (!msg.timestamp) return false;
        return getMonthYearKey(msg.timestamp) === currentMonthKey;
      });
    }
    return announcements.filter(msg => {
      if (!msg.timestamp) return false;
      return getMonthYearKey(msg.timestamp) === selectedMonthFilter;
    });
  }, [announcements, selectedMonthFilter, currentMonthKey]);

  return (
    <>
      <Card className="bg-white/70">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-indigo-600" />
            <h3 className="font-bold text-slate-700">Announcements</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Filter:</span>
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg p-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white"
            >
              <option value="current">Current Month ({currentMonthLabel})</option>
              <option value="all">Show All</option>
              {monthOptions
                .filter(opt => opt[0] !== currentMonthKey)
                .map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))
              }
            </select>
          </div>
        </div>

        {/* Domain and Website Health Alerts for Admin, HR, and Sales */}
        {domainAlerts.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
             <div className="flex items-center gap-2 text-red-700 font-extrabold text-sm">
                <ShieldAlert size={16} className="text-red-600 animate-pulse" />
                <span className="text-red-800">🚨 Client Domain Expiry Alerts</span>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                 {domainAlerts.map(alert => (
                    <div key={alert.id} className="p-3 bg-white rounded-lg border border-red-100 flex flex-col justify-between text-xs space-y-2 shadow-sm">
                        <div>
                            <div className="font-extrabold text-slate-800 line-clamp-1">{alert.projectName}</div>
                            <div className="text-slate-500 font-semibold select-all truncate text-indigo-600 mt-0.5">{alert.domainDetail}</div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-50">
                            <span className="px-2 py-0.5 rounded bg-red-600 text-white font-extrabold text-[9px] uppercase tracking-wider animate-pulse">
                                {alert.daysRemaining === 0 
                                  ? 'Expires Today!' 
                                  : alert.daysRemaining === 2 
                                    ? '2 Days Left' 
                                    : '3 Weeks Left'}
                            </span>
                        </div>
                    </div>
                 ))}
             </div>
          </div>
        )}

        {filteredAnnouncements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredAnnouncements.map((msg, idx) => (
              <div
                key={msg.id}
                onClick={() => setSelectedAnnouncement(msg)}
                className={`p-4 rounded-xl border shadow-sm cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${idx === 0 ? 'bg-indigo-50/50 border-indigo-100/50 hover:bg-indigo-100/50' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
              >
                <div className="flex justify-between items-start gap-4">
                  <p className={`text-xs font-bold mb-1 line-clamp-1 ${idx === 0 ? 'text-indigo-900' : 'text-slate-700'}`}>{msg.title}</p>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap bg-white/50 px-2 py-0.5 rounded-full border border-slate-100">
                    {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleDateString() : 'Just now'}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed line-clamp-2 ${idx === 0 ? 'text-indigo-700' : 'text-slate-500'}`}>{msg.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">No announcements for this month.</p>
            {selectedMonthFilter !== 'all' && (
              <button 
                onClick={() => setSelectedMonthFilter('all')} 
                className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Show all announcements
              </button>
            )}
          </div>
        )}
      </Card>

      {selectedAnnouncement && (
        <Modal
          isOpen={!!selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
          title={selectedAnnouncement.title}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-400 border-b border-slate-100 pb-2">
              <Calendar size={14} />
              <span>
                {selectedAnnouncement.timestamp?.toDate
                  ? selectedAnnouncement.timestamp.toDate().toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })
                  : 'Just Now'}
              </span>
              {selectedAnnouncement.senderName && (
                <>
                  <span>•</span>
                  <span>Posted by {selectedAnnouncement.senderName}</span>
                </>
              )}
            </div>

            <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed whitespace-pre-line">
              {selectedAnnouncement.content}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-50">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default HomeAnnouncementsWidget;
