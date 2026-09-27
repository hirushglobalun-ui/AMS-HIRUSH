import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, FileText, Phone, Users, Mail, CheckCircle, ExternalLink, Briefcase, User, Building } from 'lucide-react';
import { Lead, LeadActivity, ActivityType } from '../../../types';
import { fetchAllLeadActivities } from '../../../services/crmService';
import toast from 'react-hot-toast';
import { db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface GlobalLeadCalendarProps {
  leads: Lead[];
  onEventClick: (lead: Lead) => void;
}

export const GlobalLeadCalendar: React.FC<GlobalLeadCalendarProps> = ({ leads, onEventClick }) => {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<{ activity: LeadActivity | null, lead: Lead, isExpiry?: boolean } | null>(null);
  const [assignedUser, setAssignedUser] = useState<any>(null);

  useEffect(() => {
    loadAllActivities();
  }, [leads]);

  useEffect(() => {
    const fetchAssignedUser = async () => {
      if (selectedEvent?.lead.assignedTo) {
        try {
          const userDoc = await getDoc(doc(db, 'users', selectedEvent.lead.assignedTo));
          if (userDoc.exists()) {
            setAssignedUser(userDoc.data());
          } else {
            setAssignedUser(null);
          }
        } catch (error) {
          console.error('Failed to fetch assigned user', error);
        }
      } else {
        setAssignedUser(null);
      }
    };
    fetchAssignedUser();
  }, [selectedEvent]);

  const loadAllActivities = async () => {
    setLoading(true);
    try {
      const data = await fetchAllLeadActivities();
      setActivities(data);
    } catch (error) {
      toast.error('Failed to load global activities');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.CALL: return <Phone size={14} className="text-blue-500" />;
      case ActivityType.MEETING: return <Users size={14} className="text-purple-500" />;
      case ActivityType.EMAIL: return <Mail size={14} className="text-orange-500" />;
      case ActivityType.NOTE: return <FileText size={14} className="text-amber-500" />;
      default: return <CheckCircle size={14} className="text-emerald-500" />;
    }
  };

  const { daysInMonth, firstDayOfMonth, currentMonthName, currentYear } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const currentMonthName = currentDate.toLocaleString('default', { month: 'long' });
    return { daysInMonth, firstDayOfMonth, currentMonthName, currentYear: year };
  }, [currentDate]);

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 flex justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading Calendar...</p>
        </div>
      </div>
    );
  }

  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => <div key={`blank-${i}`} className="p-2 border border-slate-100 bg-slate-50/50 min-h-[120px]"></div>);
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateString = `${currentYear}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Find activities for this day
    const dayActivities = activities.filter(a => a.scheduledAt.startsWith(dateString));
    
    // Find leads whose expiry date is this day
    const expiringLeads = leads.filter(l => l.expiryDate === dateString);
    
    const isToday = new Date().toISOString().split('T')[0] === dateString;

    return (
      <div key={day} className={`p-2 border border-slate-100 min-h-[120px] transition-colors ${isToday ? 'bg-indigo-50/30' : 'bg-white'}`}>
        <div className="flex justify-between items-start mb-2">
          <span className={`text-[10px] sm:text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-600'}`}>
            {day}
          </span>
        </div>
        <div className="space-y-1.5 h-full overflow-y-auto max-h-[150px] scrollbar-thin">
          
          {/* Expiry Events */}
          {expiringLeads.map(lead => (
            <div 
              key={`expiry-${lead.id}`} 
              onClick={(e) => { e.stopPropagation(); setSelectedEvent({ activity: null, lead, isExpiry: true }); }}
              className="text-[10px] sm:text-xs px-1.5 py-1 rounded truncate flex items-center gap-1.5 border-2 bg-red-50 text-red-700 border-red-200 font-bold shadow-sm cursor-pointer hover:scale-105 transition-all"
              title={`Domain Expiry: ${lead.projectName}`}
            >
              <FileText size={12} className="text-red-500 hidden sm:inline flex-shrink-0" />
              <span className="truncate">{lead.projectName} Expiry</span>
            </div>
          ))}

          {/* Regular Activities */}
          {dayActivities.map(activity => {
            let bgClass = 'bg-slate-100 text-slate-800 border-slate-300';
            let iconColor = '';
            switch (activity.type) {
              case ActivityType.CALL: bgClass = 'bg-blue-100 text-blue-800 border-blue-300'; iconColor = 'text-blue-600'; break;
              case ActivityType.MEETING: bgClass = 'bg-purple-100 text-purple-800 border-purple-300'; iconColor = 'text-purple-600'; break;
              case ActivityType.EMAIL: bgClass = 'bg-orange-100 text-orange-800 border-orange-300'; iconColor = 'text-orange-600'; break;
              case ActivityType.NOTE: bgClass = 'bg-amber-100 text-amber-800 border-amber-300'; iconColor = 'text-amber-600'; break;
              default: bgClass = 'bg-emerald-100 text-emerald-800 border-emerald-300'; iconColor = 'text-emerald-600'; break;
            }

            // Find the associated lead to make it clickable
            const associatedLead = leads.find(l => l.id === activity.leadId);
            
            // Hide activities for leads that have been deleted
            if (!associatedLead) return null;

            return (
            <div 
              key={activity.id} 
              onClick={(e) => { e.stopPropagation(); if (associatedLead) setSelectedEvent({ activity, lead: associatedLead }); }}
              className={`text-[10px] sm:text-xs px-1.5 py-1 rounded flex flex-col gap-0.5 border-2 font-bold shadow-sm transition-all hover:scale-105 cursor-pointer
              ${bgClass} ${activity.completed ? 'opacity-60 line-through grayscale-[30%]' : 'opacity-100'}`}
              title={`${activity.title} (${associatedLead?.projectName})`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <div className={`hidden sm:block ${iconColor} ${activity.completed ? 'opacity-50' : ''}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <span className="truncate">{activity.title}</span>
              </div>
              <span className={`text-[9px] truncate opacity-80 ${activity.completed ? 'opacity-40' : ''}`}>
                {associatedLead?.projectName || 'Unknown Lead'}
              </span>
            </div>
          )})}
        </div>
      </div>
    );
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto animate-in slide-in-from-bottom-4 duration-300">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 min-w-[700px]">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <CalendarIcon size={20} className="text-indigo-600" />
          {currentMonthName} {currentYear}
        </h3>
        <div className="flex gap-2">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
            <span className="text-sm font-bold">&larr; Prev</span>
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 hover:bg-slate-200 rounded-lg text-slate-700 font-bold text-sm transition-colors">
            Today
          </button>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
            <span className="text-sm font-bold">Next &rarr;</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center border-b border-slate-100 bg-slate-50 min-w-[700px]">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 min-w-[700px]">
        {blanks}
        {days}
      </div>

      {selectedEvent && createPortal(
        <div 
          onClick={() => setSelectedEvent(null)}
          className="fixed inset-0 bg-transparent z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-0 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className={`p-6 border-b ${selectedEvent.isExpiry ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {selectedEvent.isExpiry ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-red-100 text-red-700 border-red-200 flex items-center gap-1">
                      <FileText size={12} /> Domain Expiry
                    </span>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1
                      ${selectedEvent.activity?.type === ActivityType.CALL ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        selectedEvent.activity?.type === ActivityType.MEETING ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        selectedEvent.activity?.type === ActivityType.EMAIL ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        selectedEvent.activity?.type === ActivityType.NOTE ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        'bg-emerald-100 text-emerald-700 border-emerald-200'}`}
                    >
                      {selectedEvent.activity ? getActivityIcon(selectedEvent.activity.type) : null}
                      {selectedEvent.activity?.type}
                    </span>
                  )}
                  {selectedEvent.activity?.completed && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-slate-200 text-slate-700 border-slate-300">
                      Completed
                    </span>
                  )}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                {selectedEvent.isExpiry ? `${selectedEvent.lead.projectName} Expiry` : selectedEvent.activity?.title}
              </h3>
              {selectedEvent.activity && (
                <div className="flex items-center gap-2 text-sm font-bold text-slate-600 mt-2">
                  <CalendarIcon size={16} /> 
                  {new Date(selectedEvent.activity.scheduledAt).toLocaleString()}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Task Description */}
              {selectedEvent.activity?.description && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Task Notes</h4>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap">
                    {selectedEvent.activity.description}
                  </div>
                </div>
              )}

              {/* Lead Details Summary */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Associated Lead Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                    <Briefcase className="text-indigo-500 mt-0.5" size={18} />
                    <div>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Project</p>
                      <p className="font-bold text-indigo-900">{selectedEvent.lead.projectName}</p>
                      <p className="text-xs text-indigo-600 font-medium">{selectedEvent.lead.slNo}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                    <Building className="text-emerald-500 mt-0.5" size={18} />
                    <div>
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Client</p>
                      <p className="font-bold text-emerald-900">
                        {selectedEvent.lead.clientType}
                        {selectedEvent.lead.clientTypeDetail ? ` (${selectedEvent.lead.clientTypeDetail})` : ''}
                      </p>
                      <p className="text-xs text-emerald-600 font-medium">{selectedEvent.lead.domainDetail || 'No domain'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
                    <User className="text-amber-500 mt-0.5" size={18} />
                    <div>
                      <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Point of Contact</p>
                      <p className="font-bold text-amber-900">{selectedEvent.lead.pocName}</p>
                      <p className="text-xs text-amber-600 font-medium">{selectedEvent.lead.pocEmail}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                    <Users className="text-blue-500 mt-0.5" size={18} />
                    <div>
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Assigned To (Sales)</p>
                      <p className="font-bold text-blue-900">{assignedUser ? assignedUser.name : 'Unassigned'}</p>
                      <p className="text-xs text-blue-600 font-medium">{assignedUser ? assignedUser.email : 'No user assigned'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
              <button 
                onClick={() => setSelectedEvent(null)} 
                className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  onEventClick(selectedEvent.lead);
                  setSelectedEvent(null);
                }} 
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
              >
                <ExternalLink size={18} />
                View Full Lead Details
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default GlobalLeadCalendar;
