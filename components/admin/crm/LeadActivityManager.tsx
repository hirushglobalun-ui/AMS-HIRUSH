import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Calendar as CalendarIcon, CheckCircle, Circle, Trash2, Edit2, ChevronLeft, ChevronRight, List, Phone, Mail, FileText, Users, Check } from 'lucide-react';
import { LeadActivity, ActivityType, Lead } from '../../../types';
import { fetchLeadActivities, addLeadActivity, updateLeadActivity, deleteLeadActivity } from '../../../services/crmService';
import toast from 'react-hot-toast';

interface LeadActivityManagerProps {
  leadId: string;
  lead: Lead;
}

export const LeadActivityManager: React.FC<LeadActivityManagerProps> = ({ leadId, lead }) => {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingActivity, setEditingActivity] = useState<LeadActivity | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<LeadActivity | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: ActivityType.TASK,
    description: '',
    scheduledAt: new Date().toISOString().slice(0, 16), // YYYY-MM-DDThh:mm format
  });

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLeadActivities(leadId);
      setActivities(data);
    } catch {
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingActivity) {
        await updateLeadActivity(editingActivity.id, {
          title: formData.title,
          type: formData.type,
          description: formData.description,
          scheduledAt: formData.scheduledAt,
        });
        toast.success('Activity updated successfully');
      } else {
        await addLeadActivity({
          leadId,
          title: formData.title,
          type: formData.type,
          description: formData.description,
          scheduledAt: formData.scheduledAt,
          completed: false,
        });
        toast.success('Activity added successfully');
      }
      setIsAdding(false);
      setEditingActivity(null);
      setFormData({
        title: '',
        type: ActivityType.TASK,
        description: '',
        scheduledAt: new Date().toISOString().slice(0, 16),
      });
      loadActivities();
    } catch (error) {
      toast.error(editingActivity ? 'Failed to update activity' : 'Failed to add activity');
    }
  };

  const handleEdit = (activity: LeadActivity) => {
    setEditingActivity(activity);
    setFormData({
      title: activity.title,
      type: activity.type,
      description: activity.description || '',
      scheduledAt: activity.scheduledAt,
    });
    setIsAdding(true);
  };

  const handleToggleComplete = async (activity: LeadActivity) => {
    try {
      await updateLeadActivity(activity.id, { completed: !activity.completed });
      setActivities(activities.map(a => a.id === activity.id ? { ...a, completed: !a.completed } : a));
    } catch (error) {
      toast.error('Failed to update activity');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        await deleteLeadActivity(id);
        toast.success('Activity deleted');
        setActivities(activities.filter(a => a.id !== id));
      } catch (error) {
        toast.error('Failed to delete activity');
      }
    }
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.CALL: return <Phone size={16} className="text-blue-500" />;
      case ActivityType.MEETING: return <Users size={16} className="text-purple-500" />;
      case ActivityType.EMAIL: return <Mail size={16} className="text-orange-500" />;
      case ActivityType.NOTE: return <FileText size={16} className="text-amber-500" />;
      default: return <CheckCircle size={16} className="text-emerald-500" />;
    }
  };

  // Calendar logic
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

  const renderCalendar = () => {
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => <div key={`blank-${i}`} className="p-2 border border-slate-100 bg-slate-50/50 min-h-[100px]"></div>);
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateString = `${currentYear}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const dayActivities = activities.filter(a => a.scheduledAt.startsWith(dateString));
      const isExpiryDate = lead.expiryDate === dateString;
      
      const isToday = new Date().toISOString().split('T')[0] === dateString;

      return (
        <div 
          key={day} 
          className={`p-2 border border-slate-100 min-h-[100px] transition-colors ${isToday ? 'bg-indigo-50/30' : 'bg-white'}`}
        >
          <div className="flex justify-between items-start mb-1 sm:mb-2">
            <span className={`text-[10px] sm:text-sm font-medium w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-600'}`}>
              {day}
            </span>
          </div>
          <div className="space-y-1">
            {isExpiryDate && (
              <div className="text-[9px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded truncate flex items-center gap-1 border bg-red-50 text-red-700 border-red-200 font-bold shadow-sm" title={`Domain Expiry: ${lead.domainDetail || 'Domain'}`}>
                <FileText size={10} className="text-red-500 hidden sm:inline" />
                Expiry
              </div>
            )}
            {dayActivities.slice(0, isExpiryDate ? 2 : 3).map(activity => {
              let bgClass = 'bg-slate-100 text-slate-800 border-slate-300';
              let iconColor = '';
              switch (activity.type) {
                case ActivityType.CALL: bgClass = 'bg-blue-100 text-blue-800 border-blue-300'; iconColor = 'text-blue-600'; break;
                case ActivityType.MEETING: bgClass = 'bg-purple-100 text-purple-800 border-purple-300'; iconColor = 'text-purple-600'; break;
                case ActivityType.EMAIL: bgClass = 'bg-orange-100 text-orange-800 border-orange-300'; iconColor = 'text-orange-600'; break;
                case ActivityType.NOTE: bgClass = 'bg-amber-100 text-amber-800 border-amber-300'; iconColor = 'text-amber-600'; break;
                default: bgClass = 'bg-emerald-100 text-emerald-800 border-emerald-300'; iconColor = 'text-emerald-600'; break;
              }

              return (
              <div 
                key={activity.id} 
                onClick={(e) => { e.stopPropagation(); setSelectedActivity(activity); }}
                className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-1 rounded truncate flex items-center gap-1.5 border-2 font-bold shadow-sm transition-all hover:scale-105 cursor-pointer
                ${bgClass} ${activity.completed ? 'opacity-60 line-through grayscale-[30%]' : 'opacity-100'}`}
                title={activity.title}
              >
                <div className={`hidden sm:block ${iconColor} ${activity.completed ? 'opacity-50' : ''}`}>
                  {getActivityIcon(activity.type)}
                </div>
                {activity.title}
              </div>
            )})}
            {dayActivities.length > (isExpiryDate ? 2 : 3) && (
              <div className="text-[9px] sm:text-xs text-indigo-600 font-medium px-1">+{dayActivities.length - (isExpiryDate ? 2 : 3)}</div>
            )}
          </div>
        </div>
      );
    });

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50 min-w-[500px]">
          <h3 className="font-bold text-slate-800 text-base sm:text-lg">{currentMonthName} {currentYear}</h3>
          <div className="flex gap-2">
            <button onClick={() => changeMonth(-1)} className="p-1.5 sm:p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"><ChevronLeft size={20} /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 hover:bg-slate-200 rounded-lg text-slate-700 font-medium text-sm transition-colors">Today</button>
            <button onClick={() => changeMonth(1)} className="p-1.5 sm:p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"><ChevronRight size={20} /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 text-center border-b border-slate-100 bg-slate-50 min-w-[500px]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-2 sm:py-3 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 min-w-[500px]">
          {blanks}
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${view === 'list' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <List size={16} /> Timeline
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${view === 'calendar' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <CalendarIcon size={16} /> Calendar
          </button>
        </div>
        
        {view === 'list' && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
          >
            {isAdding ? <Check size={16} /> : <Plus size={16} />}
            {isAdding ? 'Cancel' : 'Add Activity'}
          </button>
        )}
      </div>

      {isAdding && createPortal(
        <div 
          onClick={() => { setIsAdding(false); setEditingActivity(null); }}
          className="fixed inset-0 bg-transparent z-50 flex items-center justify-center p-4"
        >
          <form 
            onSubmit={handleSubmit} 
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg animate-in zoom-in-95 duration-200"
          >
            <h3 className="text-lg font-bold text-slate-800 mb-4">{editingActivity ? 'Edit Activity' : 'New Activity'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Activity Type</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as ActivityType})}
                  className="w-full px-4 py-2.5 rounded-xl border-slate-200 bg-slate-50 focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium text-slate-700 border"
                  required
                >
                  {Object.values(ActivityType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={e => setFormData({...formData, scheduledAt: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border-slate-200 bg-slate-50 focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium text-slate-700 border"
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Initial Discovery Call"
                className="w-full px-4 py-2.5 rounded-xl border-slate-200 bg-slate-50 focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium text-slate-700 border"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Add any notes, agenda items, or details..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border-slate-200 bg-slate-50 focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium text-slate-700 border resize-none"
              ></textarea>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => {
                  setIsAdding(false);
                  setEditingActivity(null);
                  setFormData({
                    title: '',
                    type: ActivityType.TASK,
                    description: '',
                    scheduledAt: new Date().toISOString().slice(0, 16),
                  });
                }} 
                className="px-5 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">
                {editingActivity ? 'Update Activity' : 'Save Activity'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {selectedActivity && createPortal(
        <div 
          onClick={() => setSelectedActivity(null)}
          className="fixed inset-0 bg-transparent z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
                  ${selectedActivity.type === ActivityType.CALL ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    selectedActivity.type === ActivityType.MEETING ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    selectedActivity.type === ActivityType.EMAIL ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    selectedActivity.type === ActivityType.NOTE ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'}`}
                >
                  {selectedActivity.type}
                </span>
                {selectedActivity.completed && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-slate-100 text-slate-600 border-slate-200">
                    Completed
                  </span>
                )}
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{selectedActivity.title}</h3>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-4">
              <CalendarIcon size={16} /> 
              {new Date(selectedActivity.scheduledAt).toLocaleString()}
            </div>
            {selectedActivity.description && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 mb-6 whitespace-pre-wrap">
                {selectedActivity.description}
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button 
                onClick={() => setSelectedActivity(null)} 
                className="px-5 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {loading ? (
        <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : view === 'calendar' ? (
        renderCalendar()
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {activities.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <CalendarIcon size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-700">No activities scheduled.</p>
              <p className="text-sm">Click "Add Activity" to schedule tasks, calls, or meetings.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activities.map(activity => (
                <div key={activity.id} className={`p-4 hover:bg-slate-50 transition-colors flex items-start gap-4 ${activity.completed ? 'opacity-60' : ''}`}>
                  <button 
                    onClick={() => handleToggleComplete(activity)}
                    className="mt-1 flex-shrink-0 focus:outline-none"
                  >
                    {activity.completed ? (
                      <CheckCircle size={24} className="text-indigo-500" />
                    ) : (
                      <Circle size={24} className="text-slate-300 hover:text-indigo-400 transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
                          ${activity.type === ActivityType.CALL ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            activity.type === ActivityType.MEETING ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            activity.type === ActivityType.EMAIL ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            activity.type === ActivityType.NOTE ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'}`}
                        >
                          {activity.type}
                        </span>
                        <h4 className={`text-base font-bold truncate ${activity.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{activity.title}</h4>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(activity)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(activity.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mb-2">
                      <span className="flex items-center gap-1"><CalendarIcon size={14} /> {new Date(activity.scheduledAt).toLocaleString()}</span>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-slate-600 line-clamp-2">{activity.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
