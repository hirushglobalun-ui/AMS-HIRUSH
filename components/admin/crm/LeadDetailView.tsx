import React, { useState, useEffect } from 'react';
import { Building, Phone, Mail, User, Briefcase, Calendar as CalendarIcon, Info, Globe, HardDriveDownload, ArrowLeft, Clock, Activity, LayoutDashboard, Target, Users, UserCheck, TrendingUp, Share2 } from 'lucide-react';
import { db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Lead, ClientType } from '../../../types';
import { LeadActivityManager } from './LeadActivityManager';

interface LeadDetailViewProps {
  lead: Lead;
  onBack: () => void;
}

export const LeadDetailView: React.FC<LeadDetailViewProps> = ({ lead, onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'activities'>('overview');
  const [assignedUser, setAssignedUser] = useState<any>(null);

  useEffect(() => {
    const fetchAssignedUser = async () => {
      if (lead.assignedTo) {
        try {
          const userDoc = await getDoc(doc(db, 'users', lead.assignedTo));
          if (userDoc.exists()) {
            setAssignedUser(userDoc.data());
          }
        } catch (error) {
          console.error('Failed to fetch assigned user', error);
        }
      } else {
        setAssignedUser(null);
      }
    };
    fetchAssignedUser();
  }, [lead.assignedTo]);

  if (!lead) return null;

  const DetailItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
      <div className="p-2.5 bg-white text-indigo-500 rounded-lg shadow-sm border border-slate-100">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-sm font-semibold text-slate-900">{value || '-'}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Profile */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-start gap-5">
            <button 
              onClick={onBack}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1.5">
                <h2 className="text-2xl font-bold text-slate-900">{lead.projectName}</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider
                  ${(lead.category || 'Company') === 'Raw / Scraped' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}
                >
                  {lead.category || 'Company'} Lead
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider
                  ${lead.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' :
                    lead.status === 'Ongoing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    lead.status === 'On Hold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-slate-100 text-slate-700 border-slate-200'}`}
                >
                  {lead.status}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <span className="text-indigo-600 font-bold">{lead.slNo}</span> • <Building size={14}/> {lead.clientType}{lead.clientTypeDetail ? ` (${lead.clientTypeDetail})` : ''}
              </p>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                activeTab === 'overview' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutDashboard size={18} /> Overview
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                activeTab === 'activities' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Activity size={18} /> Activities
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-300">
          
          {/* Left Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                <Briefcase size={20} className="text-indigo-600"/>
                Project Overview
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailItem icon={CalendarIcon} label="First Start Date" value={lead.firstStartDate} />
                <DetailItem icon={Clock} label="Commencement Date" value={lead.workCommencementDate || 'Not specified'} />
                <DetailItem icon={Globe} label="Domain Detail" value={lead.domainDetail || 'No domain'} />
                <DetailItem icon={HardDriveDownload} label="Expiry Date" value={lead.expiryDate || 'Not specified'} />
                <div className="sm:col-span-2">
                  <DetailItem icon={Users} label="Assigned To (Sales)" value={assignedUser ? assignedUser.name : 'Unassigned'} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                <User size={20} className="text-indigo-600"/>
                Point of Contact
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailItem icon={User} label="Name" value={lead.pocName} />
                <DetailItem icon={Mail} label="Email" value={lead.pocEmail} />
                <div className="sm:col-span-2">
                  <DetailItem icon={Phone} label="Phone" value={lead.pocPhone} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                <Building size={20} className="text-indigo-600"/>
                Client Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailItem icon={User} label="Client Name" value={lead.clientName} />
                <DetailItem icon={Info} label="Client Type" value={lead.clientType} />
                {lead.clientTypeDetail && (
                  <div className="sm:col-span-2">
                    <DetailItem 
                      icon={
                        lead.clientType === ClientType.B2B ? Building :
                        lead.clientType === ClientType.FRIEND ? UserCheck :
                        lead.clientType === ClientType.SALES ? TrendingUp :
                        lead.clientType === ClientType.REFERRAL ? Share2 : Info
                      } 
                      label={
                        lead.clientType === ClientType.B2B ? 'Company Name' :
                        lead.clientType === ClientType.FRIEND ? 'Friend Name' :
                        lead.clientType === ClientType.SALES ? 'Sales Representative / Person' :
                        lead.clientType === ClientType.REFERRAL ? 'Referrer Name (Reference)' : 'Reference / Source Details'
                      } 
                      value={lead.clientTypeDetail} 
                    />
                  </div>
                )}
                <DetailItem icon={Mail} label="Client Email" value={lead.clientEmail} />
                <div className="sm:col-span-2">
                  <DetailItem icon={Phone} label="Client Phone" value={lead.clientPhone} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                <Target size={20} className="text-indigo-600"/>
                Departments
              </h3>
              <div className="flex flex-wrap gap-2">
                {lead.department && lead.department.length > 0 ? (
                  lead.department.map(dept => (
                    <span key={dept} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold border border-slate-200">
                      {dept}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl border border-slate-100 w-full text-center">
                    No departments specified
                  </p>
                )}
              </div>
            </div>

            {lead.remark && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Info size={20} className="text-indigo-600"/>
                  Remarks
                </h3>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {lead.remark}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-4 duration-300">
          <LeadActivityManager leadId={lead.id} lead={lead} />
        </div>
      )}
    </div>
  );
};

export default LeadDetailView;
