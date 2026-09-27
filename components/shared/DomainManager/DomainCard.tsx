/**
 * File: components/shared/DomainManager/DomainCard.tsx
 * Purpose: Single domain presentation card with status badges, health indicators, and action triggers.
 * Author: Hirush Global AMS
 */

import React from 'react';
import Card from '../../common/Card';
import { Globe, Calendar, User, Phone, Mail, Edit, Trash2, ExternalLink, ShieldCheck, ShieldAlert, AlertTriangle, Send, CheckCircle, XCircle, MessageSquare, Zap } from 'lucide-react';
import { ConsolidatedDomain } from './types';

interface DomainCardProps {
  domain: ConsolidatedDomain;
  onAudit: (domain: ConsolidatedDomain) => void;
  onWhatsApp: (domain: ConsolidatedDomain) => void;
  onEmail: (domain: ConsolidatedDomain) => void;
  onEdit: (domain: ConsolidatedDomain) => void;
  onDelete: (id: string, name: string) => void;
}

export const DomainCard: React.FC<DomainCardProps> = ({
  domain,
  onAudit,
  onWhatsApp,
  onEmail,
  onEdit,
  onDelete,
}) => {
  const getBadge = (days: number) => {
    if (days >= 9000) {
      return (
        <span className="px-3 py-1 bg-slate-100 text-slate-500 border border-slate-200 text-xs font-bold rounded-full">
          No Expiry Set
        </span>
      );
    }
    if (days < 0) {
      return (
        <span className="px-3 py-1 bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-full flex items-center gap-1 shadow-sm">
          <AlertTriangle size={12} />
          Expired ({Math.abs(days)}d ago)
        </span>
      );
    }
    if (days <= 2) {
      return (
        <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-md animate-pulse">
          <AlertTriangle size={12} />
          Expires in {days} day{days !== 1 ? 's' : ''}
        </span>
      );
    }
    if (days <= 7) {
      return (
        <span className="px-3 py-1 bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold rounded-full flex items-center gap-1 shadow-sm">
          <AlertTriangle size={12} />
          {days} days left
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-green-100 text-green-700 border border-green-200 text-xs font-bold rounded-full">
        {days} days remaining
      </span>
    );
  };

  return (
    <Card className={`bg-white/80 dark:bg-slate-800/80 hover:shadow-xl transition-all duration-300 border flex flex-col justify-between ${
      domain.daysRemaining <= 2 ? 'border-red-200 ring-2 ring-red-500/10 bg-red-50/10' : 'border-slate-100 dark:border-slate-700'
    }`}>
      <div>
        <div className="flex justify-between items-start gap-4 mb-4">
          <div>
            <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider mb-1.5 ${
              domain.isCRM ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
            }`}>
              {domain.isCRM ? 'CRM Synced' : 'Manually Entered'}
            </span>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base line-clamp-1">{domain.projectName}</h3>
          </div>
          {getBadge(domain.daysRemaining)}
        </div>

        <div className="space-y-3 text-xs mb-6">
          <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100/50 dark:border-slate-700">
            <Globe size={14} className="text-indigo-500 flex-shrink-0" />
            <span className="font-semibold select-all truncate text-indigo-600 dark:text-indigo-400">{domain.domainDetail}</span>
            <a href={`http://${domain.domainDetail}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600 transition-colors ml-auto flex-shrink-0" title="Visit Website">
              <ExternalLink size={12} />
            </a>
          </div>

          <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
            <Calendar size={14} className="text-slate-400 flex-shrink-0" />
            <span>Expiry: <strong className="text-slate-700 dark:text-slate-200">{domain.expiryDate}</strong></span>
          </div>

          {domain.pocName && (
            <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 border-t border-dashed border-slate-100 dark:border-slate-700 pt-2.5">
              <User size={14} className="text-slate-400 flex-shrink-0" />
              <span className="truncate">POC: <strong className="text-slate-700 dark:text-slate-200">{domain.pocName}</strong></span>
            </div>
          )}

          {domain.pocEmail && (
            <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
              <Mail size={14} className="text-slate-400 flex-shrink-0" />
              <a href={`mailto:${domain.pocEmail}`} className="hover:text-indigo-600 transition-colors truncate">{domain.pocEmail}</a>
            </div>
          )}

          {domain.pocPhone && (
            <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
              <Phone size={14} className="text-slate-400 flex-shrink-0" />
              <span>{domain.pocPhone}</span>
            </div>
          )}

          <div className="border-t border-slate-100 dark:border-slate-700 pt-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-500">DNS Resolution:</span>
              <span className={`px-2 py-0.5 rounded font-extrabold flex items-center gap-1 ${
                domain.dnsStatus === 'Issue Detected' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {domain.dnsStatus === 'Issue Detected' ? <XCircle size={10} /> : <CheckCircle size={10} />}
                {domain.dnsStatus || 'Healthy'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-500">SSL Certificate:</span>
              <span className={`px-2 py-0.5 rounded font-extrabold flex items-center gap-1 ${
                domain.sslStatus === 'Issue Detected' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {domain.sslStatus === 'Issue Detected' ? <ShieldAlert size={10} /> : <ShieldCheck size={10} />}
                {domain.sslStatus || 'Healthy'}
              </span>
            </div>
            {domain.healthError && (
              <div className="text-[10px] text-red-600 bg-red-50 p-1.5 rounded border border-red-100 mt-1">
                🚨 {domain.healthError}
              </div>
            )}
          </div>

          {domain.remark && (
            <div className="bg-slate-50/50 dark:bg-slate-900/50 p-2.5 rounded-lg text-slate-500 italic mt-2 border border-slate-100/50 dark:border-slate-700">
              <p className="line-clamp-2">"{domain.remark}"</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-4 mt-auto">
        <span className="text-[10px] text-slate-400 font-medium flex flex-col gap-0.5">
          <span>ID: {domain.id.substring(0, 8)}...</span>
          {domain.lastChecked && <span className="text-[9px] text-slate-500">Checked: {domain.lastChecked}</span>}
        </span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => onAudit(domain)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Run Audit Check Now">
            <Zap size={14} />
          </button>
          <button onClick={() => onWhatsApp(domain)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Send WhatsApp Alert">
            <MessageSquare size={14} />
          </button>
          <button onClick={() => onEmail(domain)} className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all" title="Send Email Alert">
            <Send size={14} />
          </button>
          {!domain.isCRM ? (
            <>
              <button onClick={() => onEdit(domain)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit Details">
                <Edit size={14} />
              </button>
              <button onClick={() => onDelete(domain.id, domain.projectName)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete Domain">
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <span className="text-[10px] text-slate-400 italic bg-slate-50 dark:bg-slate-700 px-2.5 py-1 rounded border border-slate-100 dark:border-slate-600">
              Managed in CRM
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};
