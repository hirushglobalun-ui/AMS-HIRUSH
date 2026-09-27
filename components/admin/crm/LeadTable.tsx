/**
 * File: components/admin/crm/LeadTable.tsx
 * Purpose: Interactive data table for CRM leads with column filtering, quick actions, and pagination.
 * Author: Hirush Global AMS
 */

import React from 'react';
import { Eye, Edit2, Trash2 } from 'lucide-react';
import { Lead, LeadStatus, ClientType, LeadCategory } from '../../../types';

interface LeadTableProps {
  loading: boolean;
  filteredLeads: Lead[];
  paginatedLeads: Lead[];
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  filters: any;
  onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  availableCompanyOptions: string[];
  usersMap: Record<string, string>;
  activitiesMap: Record<string, string>;
  onViewDetails: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
}

export const LeadTable: React.FC<LeadTableProps> = ({
  loading,
  filteredLeads,
  paginatedLeads,
  currentPage,
  totalPages,
  itemsPerPage,
  filters,
  onFilterChange,
  availableCompanyOptions,
  usersMap,
  activitiesMap,
  onViewDetails,
  onEdit,
  onDelete,
  onPageChange,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1700px]">
          <thead>
            <tr className="bg-red-600 text-white text-left select-none">
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider sticky left-0 bg-red-600 z-20 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.3)] text-center border-r border-white/20">Actions</th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20 text-center">Row</th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">SL No</th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">Category</th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">Project Name</th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">Status</th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">Client Name</th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">Client Type</th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">Company / Reference Detail</th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">POC Name</th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">POC Email</th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">POC Phone</th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">First Start Date</th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">Work Commenced</th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">Expiry Date</th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">Domain Detail</th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">Assigned To</th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">Activity</th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">Department</th>
            </tr>
            <tr className="bg-red-50/50 border-b-2 border-red-300">
              <th className="px-2 py-2 sticky left-0 bg-red-50 z-20 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.1)] border-r border-red-200" />
              <th className="px-2 py-2 border-r border-red-200" />
              <th className="px-2 py-2 border-r border-red-200"><input type="text" name="slNo" value={filters.slNo} onChange={onFilterChange} placeholder="Filter..." className="w-full text-xs p-1.5 border border-red-200 rounded focus:border-red-500 outline-none text-slate-700" /></th>
              <th className="px-2 py-2 border-r border-red-200">
                <select name="category" value={filters.category} onChange={onFilterChange} className="w-full text-xs p-1.5 border border-red-200 rounded bg-white text-slate-700 outline-none focus:border-red-500">
                  <option value="">All</option>
                  {Object.values(LeadCategory).map((cat) => <option key={cat} value={cat}>{cat} Lead</option>)}
                </select>
              </th>
              <th className="px-2 py-2 border-r border-red-200"><input type="text" name="projectName" value={filters.projectName} onChange={onFilterChange} placeholder="Filter..." className="w-full text-xs p-1.5 border border-red-200 rounded focus:border-red-500 outline-none text-slate-700" /></th>
              <th className="px-2 py-2 border-r border-red-200">
                <select name="status" value={filters.status} onChange={onFilterChange} className="w-full text-xs p-1.5 border border-red-200 rounded bg-white text-slate-700 outline-none focus:border-red-500">
                  <option value="">All</option>
                  {Object.values(LeadStatus).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </th>
              <th className="px-2 py-2 border-r border-red-200"><input type="text" name="clientName" value={filters.clientName} onChange={onFilterChange} placeholder="Filter..." className="w-full text-xs p-1.5 border border-red-200 rounded focus:border-red-500 outline-none text-slate-700" /></th>
              <th className="px-2 py-2 border-r border-red-200">
                <select name="clientType" value={filters.clientType} onChange={onFilterChange} className="w-full text-xs p-1.5 border border-red-200 rounded bg-white text-slate-700 outline-none focus:border-red-500">
                  <option value="">All</option>
                  {Object.values(ClientType).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </th>
              <th className="px-2 py-2 border-r border-red-200">
                <select name="clientTypeDetail" value={filters.clientTypeDetail} onChange={onFilterChange} className="w-full text-xs p-1.5 border border-red-200 rounded bg-white text-slate-700 outline-none focus:border-red-500">
                  <option value="">All Companies / Refs</option>
                  {availableCompanyOptions.map((comp) => <option key={comp} value={comp}>{comp}</option>)}
                </select>
              </th>
              <th className="px-2 py-2 border-r border-red-200"><input type="text" name="pocName" value={filters.pocName} onChange={onFilterChange} placeholder="Filter..." className="w-full text-xs p-1.5 border border-red-200 rounded focus:border-red-500 outline-none text-slate-700" /></th>
              <th className="px-2 py-2 border-r border-red-200"><input type="text" name="pocEmail" value={filters.pocEmail} onChange={onFilterChange} placeholder="Filter..." className="w-full text-xs p-1.5 border border-red-200 rounded focus:border-red-500 outline-none text-slate-700" /></th>
              <th className="px-2 py-2 border-r border-red-200"><input type="text" name="pocPhone" value={filters.pocPhone} onChange={onFilterChange} placeholder="Filter..." className="w-full text-xs p-1.5 border border-red-200 rounded focus:border-red-500 outline-none text-slate-700" /></th>
              <th className="px-2 py-2 border-r border-red-200"><input type="date" name="firstStartDate" value={filters.firstStartDate} onChange={onFilterChange} className="w-full text-xs p-1.5 border border-red-200 rounded focus:border-red-500 outline-none text-slate-700" /></th>
              <th className="px-2 py-2 border-r border-red-200"><input type="date" name="commencementDate" value={filters.commencementDate} onChange={onFilterChange} className="w-full text-xs p-1.5 border border-red-200 rounded focus:border-red-500 outline-none text-slate-700" /></th>
              <th className="px-2 py-2 border-r border-red-200"><input type="date" name="expiryDate" value={filters.expiryDate} onChange={onFilterChange} className="w-full text-xs p-1.5 border border-red-200 rounded focus:border-red-500 outline-none text-slate-700" /></th>
              <th className="px-2 py-2 border-r border-red-200"><input type="text" name="domainDetail" value={filters.domainDetail} onChange={onFilterChange} placeholder="Filter..." className="w-full text-xs p-1.5 border border-red-200 rounded focus:border-red-500 outline-none text-slate-700" /></th>
              <th className="px-2 py-2 border-r border-red-200" />
              <th className="px-2 py-2 border-r border-red-200" />
              <th className="px-2 py-2 border-r border-red-200"><input type="text" name="department" value={filters.department} onChange={onFilterChange} placeholder="Filter..." className="w-full text-xs p-1.5 border border-red-200 rounded focus:border-red-500 outline-none text-slate-700" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={19} className="px-6 py-8 text-center text-slate-500">
                  <div className="flex justify-center items-center gap-3">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    Loading leads...
                  </div>
                </td>
              </tr>
            ) : filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={19} className="px-6 py-8 text-center text-slate-500">No leads found matching your filters.</td>
              </tr>
            ) : (
              paginatedLeads.map((lead, index) => (
                <tr
                  key={lead.id}
                  className="hover:bg-red-50/80 transition-all cursor-pointer group even:bg-slate-50/70 odd:bg-white border-b border-slate-100"
                  onClick={() => onViewDetails(lead)}
                >
                  <td className="px-4 py-3 text-center sticky left-0 bg-white group-even:bg-slate-50 group-hover:bg-red-50 transition-colors z-10 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.05)] border-r border-slate-100">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); onViewDetails(lead); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="View Details"><Eye size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); onEdit(lead); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit"><Edit2 size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); onDelete(lead.id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-500 border-r border-slate-100 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="px-4 py-3 text-sm font-extrabold text-slate-700 border-r border-slate-100">{lead.slNo}</td>
                  <td className="px-4 py-3 border-r border-slate-100">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${(lead.category || LeadCategory.COMPANY) === LeadCategory.RAW_SCRAPED ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                      {lead.category || LeadCategory.COMPANY} Lead
                    </span>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100">
                    <div className="text-sm font-bold text-red-700 group-hover:text-red-900 transition-colors">{lead.projectName}</div>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100">
                    <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-extrabold text-white shadow-md ${
                      lead.status === LeadStatus.COMPLETED ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-200' :
                      lead.status === LeadStatus.ONGOING ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-200' :
                      lead.status === LeadStatus.PENDING ? 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-amber-200' :
                      lead.status === LeadStatus.ON_HOLD ? 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-orange-200' :
                      lead.status === LeadStatus.PROPOSAL_SENT ? 'bg-gradient-to-r from-purple-500 to-purple-600 shadow-purple-200' :
                      'bg-gradient-to-r from-slate-500 to-slate-600 shadow-slate-200'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-700 border-r border-slate-100">{lead.clientName || '-'}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-700 border-r border-slate-100"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">{lead.clientType}</span></td>
                  <td className="px-4 py-3 text-sm text-slate-700 border-r border-slate-100">
                    {lead.clientTypeDetail ? <span className="font-semibold text-indigo-700 bg-indigo-50/70 border border-indigo-100 px-2.5 py-1 rounded-md text-xs inline-block max-w-[180px] truncate" title={lead.clientTypeDetail}>{lead.clientTypeDetail}</span> : <span className="text-slate-400 font-normal text-xs">-</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 border-r border-slate-100">{lead.pocName}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 border-r border-slate-100">{lead.pocEmail}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 border-r border-slate-100">{lead.pocPhone}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700 border-r border-slate-100">{lead.firstStartDate}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700 border-r border-slate-100">{lead.workCommencementDate || '-'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700 border-r border-slate-100">{lead.expiryDate || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 border-r border-slate-100">{lead.domainDetail || '-'}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-700 border-r border-slate-100">{usersMap[lead.assignedTo || ''] || 'Unassigned'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 border-r border-slate-100 max-w-xs truncate" title={activitiesMap[lead.id] || 'No activity'}>{activitiesMap[lead.id] || 'No activity'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 border-r border-slate-100">{lead.department ? (Array.isArray(lead.department) ? lead.department.join(', ') : lead.department) : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between bg-slate-50 gap-4">
        <div className="text-sm text-slate-500">
          Showing <span className="font-bold text-slate-700">{filteredLeads.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, filteredLeads.length)}</span> of <span className="font-bold text-slate-700">{filteredLeads.length}</span> leads
        </div>
        <div className="flex gap-2">
          <button onClick={() => onPageChange(Math.max(currentPage - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm">Previous</button>
          <div className="flex items-center justify-center px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-bold text-indigo-700 shadow-sm">Page {currentPage} of {totalPages === 0 ? 1 : totalPages}</div>
          <button onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm">Next</button>
        </div>
      </div>
    </div>
  );
};
