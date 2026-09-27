import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Eye, Edit2, Trash2, Download, UploadCloud, Briefcase, Clock, CheckCircle, PauseCircle, Send, XCircle, LayoutDashboard, Layers } from 'lucide-react';
import { fetchLeads, addLead, updateLead, deleteLead, bulkAddLeads, fetchAllLeadActivities, fetchCRMCompanies } from '../../../services/crmService';
import { fetchUsers } from '../../../services/dataService';
import { Lead, LeadStatus, ClientType, LeadCategory } from '../../../types';
import toast from 'react-hot-toast';
import { LeadFormModal } from './LeadFormModal';
import { LeadDetailView } from './LeadDetailView';
import { GlobalLeadCalendar } from './GlobalLeadCalendar';
import { ImportLeadsModal } from './ImportLeadsModal';
import { Calendar as CalendarIcon, List } from 'lucide-react';

export const ManageLeads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [activitiesMap, setActivitiesMap] = useState<Record<string, string>>({});
  const [crmCompanies, setCrmCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Column Filters State
  const [filters, setFilters] = useState({
    slNo: '',
    projectName: '',
    status: '',
    category: '',
    clientType: '',
    clientTypeDetail: '',
    firstStartDate: '',
    commencementDate: '',
    pocName: '',
    pocEmail: '',
    pocPhone: '',
    clientName: '',
    domainDetail: '',
    expiryDate: '',
    department: ''
  });
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<LeadCategory | 'ALL'>(LeadCategory.COMPANY);
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list');
  
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm, activeCategoryTab]);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const [leadsResult, usersResult, activitiesResult, companiesResult] = await Promise.allSettled([
        fetchLeads(),
        fetchUsers(),
        fetchAllLeadActivities(),
        fetchCRMCompanies()
      ]);
      
      if (leadsResult.status === 'rejected') {
        console.error('Failed to load leads:', leadsResult.reason);
        toast.error('Failed to load leads: ' + (leadsResult.reason?.message || 'Unknown error'));
        setLeads([]);
        return;
      }

      const fetchedLeads = leadsResult.value.leads || [];
      const fetchedUsers = usersResult.status === 'fulfilled' ? usersResult.value : [];
      const fetchedActivities = activitiesResult.status === 'fulfilled' ? activitiesResult.value : [];
      if (companiesResult.status === 'fulfilled') {
        setCrmCompanies(companiesResult.value);
      }

      if (usersResult.status === 'rejected') {
        console.warn('Failed to load users for lead mapping:', usersResult.reason);
      }
      if (activitiesResult.status === 'rejected') {
        console.warn('Failed to load lead activities:', activitiesResult.reason);
      }

      const uMap: Record<string, string> = {};
      fetchedUsers.forEach((u: any) => {
        if (u && u.id) uMap[u.id] = u.name || 'Unknown User';
      });
      setUsersMap(uMap);
      
      const aMap: Record<string, string> = {};
      fetchedActivities.forEach((a: any) => {
        if (!a || !a.leadId) return;
        const schedDate = a.scheduledAt ? new Date(a.scheduledAt).toLocaleDateString() : 'N/A';
        const text = `[${schedDate}] ${a.type || 'Activity'}: ${a.title || ''} - ${a.description || ''} (${a.completed ? 'Completed' : 'Pending'})`;
        if (aMap[a.leadId]) {
          aMap[a.leadId] += ' | ' + text;
        } else {
          aMap[a.leadId] = text;
        }
      });
      setActivitiesMap(aMap);

      setLeads(fetchedLeads);
    } catch (error: any) {
      console.error('Unexpected error loading leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setSelectedLead(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsFormOpen(true);
  };

  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await deleteLead(id);
        toast.success('Lead deleted successfully');
        loadLeads();
      } catch (error) {
        toast.error('Failed to delete lead');
      }
    }
  };

  const handleFormSubmit = async (data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (selectedLead) {
        await updateLead(selectedLead.id, data);
        toast.success('Lead updated successfully');
      } else {
        await addLead(data);
        toast.success('Lead added successfully');
      }
      loadLeads();
    } catch (error) {
      toast.error('Failed to save lead');
      throw error;
    }
  };

  const handleExportLeads = async () => {
    if (leads.length === 0) {
      toast.error('No leads to export');
      return;
    }

    const loadingToast = toast.loading('Preparing export...');

    try {
      const [users, allActivities] = await Promise.all([
        fetchUsers(),
        fetchAllLeadActivities()
      ]);
      
      const userMap = new Map();
      users.forEach((u: any) => userMap.set(u.id, u.name));

      const headers = ['SL No', 'Category', 'Project Name', 'Client Type', 'Client Detail / Reference', 'Status', 'First Start Date', 'Commencement Date', 'Expiry Date', 'POC Name', 'POC Email', 'POC Phone', 'Client Name', 'Domain Detail', 'Assigned To', 'Logs'];
      
      const csvRows = (activeCategoryTab === 'ALL' ? leads : categoryLeads).map(lead => {
        const assignedName = lead.assignedTo ? (userMap.get(lead.assignedTo) || 'Unknown') : 'Unassigned';
        
        const leadLogs = allActivities
          .filter(a => a.leadId === lead.id)
          .map(a => `[${new Date(a.scheduledAt).toLocaleDateString()}] ${a.type}: ${a.title} - ${a.description} (${a.completed ? 'Completed' : 'Pending'})`)
          .join(' | ');

        return [
          lead.slNo,
          `"${lead.category || LeadCategory.COMPANY}"`,
          `"${lead.projectName.replace(/"/g, '""')}"`,
          `"${lead.clientType}"`,
          `"${(lead.clientTypeDetail || '').replace(/"/g, '""')}"`,
          lead.status,
          lead.firstStartDate,
          lead.workCommencementDate || '',
          lead.expiryDate || '',
          `"${lead.pocName.replace(/"/g, '""')}"`,
          lead.pocEmail,
          lead.pocPhone,
          `"${(lead.clientName || '').replace(/"/g, '""')}"`,
          `"${(lead.domainDetail || '').replace(/"/g, '""')}"`,
          `"${assignedName}"`,
          `"${leadLogs.replace(/"/g, '""')}"`
        ].join(',');
      });

      const csvContent = [headers.join(','), ...csvRows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.dismiss(loadingToast);
      toast.success('Leads exported successfully');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Error preparing export');
      console.error(error);
    }
  };

  const handleSyncAllToSheets = async () => {
    if (leads.length === 0) {
      toast.error('No leads to sync');
      return;
    }
    
    // Reverse leads to insert oldest first so that slNo orders correctly in the sheet
    const sortedLeads = [...leads].sort((a, b) => {
      const aNum = parseInt(a.slNo.replace(/\D/g, ''), 10) || 0;
      const bNum = parseInt(b.slNo.replace(/\D/g, ''), 10) || 0;
      return aNum - bNum;
    });

    const loadingToast = toast.loading(`Syncing ${sortedLeads.length} leads to Google Sheets... This may take a minute.`);
    
    try {
      const users = await fetchUsers();
      const allActivities = await fetchAllLeadActivities();
      
      const userMap = new Map();
      users.forEach((u: any) => userMap.set(u.id, u.name));

      for (const lead of sortedLeads) {
        const assignedName = lead.assignedTo ? (userMap.get(lead.assignedTo) || 'Unknown') : 'Unassigned';
        const leadLogs = allActivities
          .filter(a => a.leadId === lead.id)
          .map(a => `[${new Date(a.scheduledAt).toLocaleDateString()}] ${a.type}: ${a.title} - ${a.description} (${a.completed ? 'Completed' : 'Pending'})`)
          .join(' | ');

        const payload = {
          ...lead,
          category: lead.category || LeadCategory.COMPANY,
          assignedTo: assignedName, // Replace ID with Name
          log: leadLogs // Add logs column
        };

        await fetch('https://script.google.com/macros/s/AKfycbw-gqHjGYlWbaWTXmycrys0vATSqzvzpka5rm_-QXlITXlK6IG-iGRrn3y2hNHLvMLL/exec', {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload)
        });
        // Small delay to prevent hitting Google Apps Script rate limits
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      toast.dismiss(loadingToast);
      toast.success('Successfully synced all leads to Google Sheets!');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Error syncing some leads to Google Sheets');
      console.error(error);
    }
  };

  const availableCompanyOptions = useMemo(() => {
    const set = new Set<string>(crmCompanies);
    leads.forEach(l => {
      if (l.clientTypeDetail?.trim()) {
        set.add(l.clientTypeDetail.trim());
      }
    });
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [crmCompanies, leads]);

  const categoryLeads = leads.filter(lead => {
    if (activeCategoryTab === 'ALL') return true;
    const cat = lead.category || LeadCategory.COMPANY;
    return cat === activeCategoryTab;
  });

  const filteredLeads = categoryLeads.filter(lead => {
    const leadCategory = lead.category || LeadCategory.COMPANY;
    return (
      (!filters.category || leadCategory === filters.category) &&
      (!filters.slNo || lead.slNo.toLowerCase().includes(filters.slNo.toLowerCase())) &&
      (!filters.projectName || lead.projectName.toLowerCase().includes(filters.projectName.toLowerCase())) &&
      (!filters.status || lead.status === filters.status) &&
      (!filters.clientType || lead.clientType === filters.clientType) &&
      (!filters.clientTypeDetail || (lead.clientTypeDetail || '').toLowerCase() === filters.clientTypeDetail.toLowerCase() || (lead.clientTypeDetail || '').toLowerCase().includes(filters.clientTypeDetail.toLowerCase())) &&
      (!filters.firstStartDate || lead.firstStartDate.includes(filters.firstStartDate)) &&
      (!filters.commencementDate || (lead.workCommencementDate || '').includes(filters.commencementDate)) &&
      (!filters.pocName || lead.pocName.toLowerCase().includes(filters.pocName.toLowerCase())) &&
      (!filters.pocEmail || lead.pocEmail.toLowerCase().includes(filters.pocEmail.toLowerCase())) &&
      (!filters.pocPhone || lead.pocPhone.toLowerCase().includes(filters.pocPhone.toLowerCase())) &&
      (!filters.clientName || (lead.clientName || '').toLowerCase().includes(filters.clientName.toLowerCase())) &&
      (!filters.domainDetail || (lead.domainDetail || '').toLowerCase().includes(filters.domainDetail.toLowerCase())) &&
      (!filters.expiryDate || (lead.expiryDate || '').includes(filters.expiryDate)) &&
      (!filters.department || (lead.department && Array.isArray(lead.department) ? lead.department.join(', ').toLowerCase().includes(filters.department.toLowerCase()) : (lead.department || '').toString().toLowerCase().includes(filters.department.toLowerCase()))) &&
      (!searchTerm || 
        lead.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.slNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.pocName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.clientType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.clientTypeDetail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        leadCategory.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }).sort((a, b) => {
    const aNum = parseInt(a.slNo.replace(/\D/g, ''), 10) || 0;
    const bNum = parseInt(b.slNo.replace(/\D/g, ''), 10) || 0;
    return bNum - aNum; // Sort descending (newest/last added first)
  });

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Calculate Stats
  const stats = {
    total: categoryLeads.length,
    pending: categoryLeads.filter(l => l.status === LeadStatus.PENDING).length,
    ongoing: categoryLeads.filter(l => l.status === LeadStatus.ONGOING).length,
    completed: categoryLeads.filter(l => l.status === LeadStatus.COMPLETED).length,
    onHold: categoryLeads.filter(l => l.status === LeadStatus.ON_HOLD).length,
    proposalSent: categoryLeads.filter(l => l.status === LeadStatus.PROPOSAL_SENT).length,
    disposed: categoryLeads.filter(l => l.status === LeadStatus.DISPOSED).length,
  };

  // Auto-generate SL No for new leads (e.g., LEAD-001)
  const autoSlNo = `LEAD-${String(leads.length + 1).padStart(3, '0')}`;

  if (isDetailOpen && selectedLead) {
    return (
      <LeadDetailView 
        lead={selectedLead} 
        onBack={() => {
          setIsDetailOpen(false);
          setSelectedLead(null);
        }} 
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Lead Management</h2>
        
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Global search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportLeads}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200 font-bold active:scale-95 text-xs sm:text-sm"
              title="Export Leads to CSV"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
            <button
              onClick={() => setIsImportOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-2.5 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-colors shadow-md shadow-sky-200 font-bold active:scale-95 text-xs sm:text-sm"
              title="Import Leads from CSV"
            >
              <UploadCloud size={16} />
              <span>Import</span>
            </button>
            <button
              onClick={handleAddClick}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 sm:px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 font-bold active:scale-95 text-xs sm:text-sm"
            >
              <Plus size={16} />
              <span>Add Lead</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Category Switcher Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 gap-3 pb-1">
        <button
          onClick={() => setActiveCategoryTab('ALL')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
            activeCategoryTab === 'ALL'
              ? 'bg-slate-800 text-white shadow-lg shadow-slate-300'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <LayoutDashboard size={18} />
          <span>All Leads</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
            activeCategoryTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {leads.length}
          </span>
        </button>

        <button
          onClick={() => setActiveCategoryTab(LeadCategory.COMPANY)}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
            activeCategoryTab === LeadCategory.COMPANY
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Briefcase size={18} />
          <span>Company Leads</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
            activeCategoryTab === LeadCategory.COMPANY ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {leads.filter(l => (l.category || LeadCategory.COMPANY) === LeadCategory.COMPANY).length}
          </span>
        </button>

        <button
          onClick={() => setActiveCategoryTab(LeadCategory.RAW_SCRAPED)}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
            activeCategoryTab === LeadCategory.RAW_SCRAPED
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-200'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers size={18} />
          <span>Raw / Scraped Leads</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
            activeCategoryTab === LeadCategory.RAW_SCRAPED ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {leads.filter(l => l.category === LeadCategory.RAW_SCRAPED).length}
          </span>
        </button>
      </div>

      {/* Stats Cards */}
      {activeTab === 'list' && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setFilters({...filters, status: ''})}>
            <LayoutDashboard size={20} className="text-slate-500 mb-2" />
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Leads</span>
            <span className="text-xl font-bold text-slate-800">{stats.total}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-amber-100 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-amber-50/50 transition-colors" onClick={() => setFilters({...filters, status: LeadStatus.PENDING})}>
            <Clock size={20} className="text-amber-500 mb-2" />
            <span className="text-xs font-semibold text-amber-600 uppercase">Pending</span>
            <span className="text-xl font-bold text-amber-700">{stats.pending}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-50/50 transition-colors" onClick={() => setFilters({...filters, status: LeadStatus.ONGOING})}>
            <Briefcase size={20} className="text-blue-500 mb-2" />
            <span className="text-xs font-semibold text-blue-600 uppercase">Ongoing</span>
            <span className="text-xl font-bold text-blue-700">{stats.ongoing}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-green-50/50 transition-colors" onClick={() => setFilters({...filters, status: LeadStatus.COMPLETED})}>
            <CheckCircle size={20} className="text-green-500 mb-2" />
            <span className="text-xs font-semibold text-green-600 uppercase">Completed</span>
            <span className="text-xl font-bold text-green-700">{stats.completed}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-orange-50/50 transition-colors" onClick={() => setFilters({...filters, status: LeadStatus.ON_HOLD})}>
            <PauseCircle size={20} className="text-orange-500 mb-2" />
            <span className="text-xs font-semibold text-orange-600 uppercase">On Hold</span>
            <span className="text-xl font-bold text-orange-700">{stats.onHold}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-100 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-purple-50/50 transition-colors" onClick={() => setFilters({...filters, status: LeadStatus.PROPOSAL_SENT})}>
            <Send size={20} className="text-purple-500 mb-2" />
            <span className="text-xs font-semibold text-purple-600 uppercase">Proposal Sent</span>
            <span className="text-xl font-bold text-purple-700">{stats.proposalSent}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => setFilters({...filters, status: LeadStatus.DISPOSED})}>
            <XCircle size={20} className="text-slate-500 mb-2" />
            <span className="text-xs font-semibold text-slate-600 uppercase">Disposed</span>
            <span className="text-xl font-bold text-slate-700">{stats.disposed}</span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex bg-slate-100 p-1.5 rounded-xl w-full sm:w-fit">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'list' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <List size={18} /> List View
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'calendar' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarIcon size={18} /> Global Calendar
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="bg-surface rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1200px] border border-indigo-200 shadow-md rounded-lg">
            <thead>
              <tr className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-md">
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-center sticky left-0 bg-red-600 z-20 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.3)] border-r border-red-500">Actions</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20 text-center">S.No</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">SL No</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">Category</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">Project Name</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">Status</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">Client Name</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">Client Type</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">Company / Ref Name</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">POC Name</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">POC Email</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">POC Phone</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">Start Date</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">Commencement</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">Expiry</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">Domain Detail</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">Assigned To</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">Activity</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-white/20">Department</th>
              </tr>
              {/* Filter Row */}
              <tr className="bg-red-50/50 border-b-2 border-red-300">
                <th className="px-2 py-2 sticky left-0 bg-red-50 z-20 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.1)] border-r border-red-200"></th>
                <th className="px-2 py-2 border-r border-red-200"></th>
                <th className="px-2 py-2 border-r border-red-200"><input type="text" name="slNo" value={filters.slNo} onChange={handleFilterChange} placeholder="Filter..." className="w-full text-xs p-1.5 border border-red-200 rounded focus:border-red-500 outline-none text-slate-700" /></th>
                <th className="px-2 py-2 border-r border-red-200">
                  <select name="category" value={filters.category} onChange={handleFilterChange} className="w-full text-xs p-1.5 border border-red-200 rounded bg-white text-slate-700 outline-none focus:border-red-500">
                    <option value="">All</option>
                    {Object.values(LeadCategory).map(cat => <option key={cat} value={cat}>{cat} Lead</option>)}
                  </select>
                </th>
                <th className="px-2 py-2 border-r border-red-200"><input type="text" name="projectName" value={filters.projectName} onChange={handleFilterChange} placeholder="Filter..." className="w-full text-xs p-1.5 border border-red-200 rounded focus:border-red-500 outline-none text-slate-700" /></th>
                <th className="px-2 py-2 border-r border-red-200">
                  <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full text-xs p-1.5 border border-red-200 rounded bg-white text-slate-700 outline-none focus:border-red-500">
                    <option value="">All</option>
                    {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </th>
                <th className="px-2 py-2 border-r border-red-200"><input type="text" name="clientName" value={filters.clientName} onChange={handleFilterChange} placeholder="Filter..." className="w-full text-xs p-1.5 border border-red-200 rounded focus:border-red-500 outline-none text-slate-700" /></th>
                <th className="px-2 py-2 border-r border-red-200">
                  <select name="clientType" value={filters.clientType} onChange={handleFilterChange} className="w-full text-xs p-1.5 border border-red-200 rounded bg-white text-slate-700 outline-none focus:border-red-500">
                    <option value="">All</option>
                    {Object.values(ClientType).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </th>
                <th className="px-2 py-2 border-r border-red-200">
                  <select 
                    name="clientTypeDetail" 
                    value={filters.clientTypeDetail} 
                    onChange={handleFilterChange} 
                    className="w-full text-xs p-1.5 border border-red-200 rounded bg-white text-slate-700 outline-none focus:border-red-500"
                  >
                    <option value="">All Companies / Refs</option>
                    {availableCompanyOptions.map(comp => (
                      <option key={comp} value={comp}>{comp}</option>
                    ))}
                  </select>
                </th>
                <th className="px-2 py-2 border-r border-red-200"><input type="text" name="pocName" value={filters.pocName} onChange={handleFilterChange} placeholder="Filter..." className="w-full text-xs p-1.5 border border-red-200 rounded focus:border-red-500 outline-none text-slate-700" /></th>
                <th className="px-2 py-2 border-r border-red-200"><input type="text" name="pocEmail" value={filters.pocEmail} onChange={handleFilterChange} placeholder="Filter..." className="w-full text-xs p-1.5 border border-red-200 rounded focus:border-red-500 outline-none text-slate-700" /></th>
                <th className="px-2 py-2 border-r border-red-200"><input type="text" name="pocPhone" value={filters.pocPhone} onChange={handleFilterChange} placeholder="Filter..." className="w-full text-xs p-1.5 border border-red-200 rounded focus:border-red-500 outline-none text-slate-700" /></th>
                <th className="px-2 py-2 border-r border-red-200"><input type="date" name="firstStartDate" value={filters.firstStartDate} onChange={handleFilterChange} className="w-full text-xs p-1.5 border border-red-200 rounded focus:border-red-500 outline-none text-slate-700" /></th>
                <th className="px-2 py-2 border-r border-red-200"><input type="date" name="commencementDate" value={filters.commencementDate} onChange={handleFilterChange} className="w-full text-xs p-1.5 border border-red-200 rounded focus:border-red-500 outline-none text-slate-700" /></th>
                <th className="px-2 py-2 border-r border-red-200"><input type="date" name="expiryDate" value={filters.expiryDate} onChange={handleFilterChange} className="w-full text-xs p-1.5 border border-red-200 rounded focus:border-red-500 outline-none text-slate-700" /></th>
                <th className="px-2 py-2 border-r border-red-200"><input type="text" name="domainDetail" value={filters.domainDetail} onChange={handleFilterChange} placeholder="Filter..." className="w-full text-xs p-1.5 border border-red-200 rounded focus:border-red-500 outline-none text-slate-700" /></th>
                <th className="px-2 py-2 border-r border-red-200"></th>
                <th className="px-2 py-2 border-r border-red-200"></th>
                <th className="px-2 py-2 border-r border-red-200"><input type="text" name="department" value={filters.department} onChange={handleFilterChange} placeholder="Filter..." className="w-full text-xs p-1.5 border border-red-200 rounded focus:border-red-500 outline-none text-slate-700" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={18} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-3">
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      Loading leads...
                    </div>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={18} className="px-6 py-8 text-center text-slate-500">
                    No leads found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead, index) => (
                  <tr 
                    key={lead.id} 
                    className="hover:bg-red-50/80 transition-all cursor-pointer group even:bg-slate-50/70 odd:bg-white border-b border-slate-100"
                    onClick={() => handleViewDetails(lead)}
                  >
                    <td className="px-4 py-3 text-center sticky left-0 bg-white group-even:bg-slate-50 group-hover:bg-red-50 transition-colors z-10 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.05)] border-r border-slate-100">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleViewDetails(lead); }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditClick(lead); }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(lead.id); }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-500 border-r border-slate-100 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="px-4 py-3 text-sm font-extrabold text-slate-700 border-r border-slate-100">{lead.slNo}</td>
                    <td className="px-4 py-3 border-r border-slate-100">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                        (lead.category || LeadCategory.COMPANY) === LeadCategory.RAW_SCRAPED
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {lead.category || LeadCategory.COMPANY} Lead
                      </span>
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100">
                      <div className="text-sm font-bold text-red-700 group-hover:text-red-900 transition-colors">{lead.projectName}</div>
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100">
                      <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-extrabold text-white shadow-md
                        ${lead.status === LeadStatus.COMPLETED ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-200' :
                          lead.status === LeadStatus.ONGOING ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-200' :
                          lead.status === LeadStatus.PENDING ? 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-amber-200' :
                          lead.status === LeadStatus.ON_HOLD ? 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-orange-200' :
                          lead.status === LeadStatus.PROPOSAL_SENT ? 'bg-gradient-to-r from-purple-500 to-purple-600 shadow-purple-200' :
                          'bg-gradient-to-r from-slate-500 to-slate-600 shadow-slate-200'}`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700 border-r border-slate-100">{lead.clientName || '-'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700 border-r border-slate-100">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {lead.clientType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 border-r border-slate-100">
                      {lead.clientTypeDetail ? (
                        <span className="font-semibold text-indigo-700 bg-indigo-50/70 border border-indigo-100 px-2.5 py-1 rounded-md text-xs inline-block max-w-[180px] truncate" title={lead.clientTypeDetail}>
                          {lead.clientTypeDetail}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal text-xs">-</span>
                      )}
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
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
              >
                Previous
              </button>
              <div className="flex items-center justify-center px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-bold text-indigo-700 shadow-sm">
                Page {currentPage} of {totalPages === 0 ? 1 : totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        <GlobalLeadCalendar leads={leads} onEventClick={handleViewDetails} />
      )}

      {/* Modals */}
      <LeadFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedLead}
        autoGeneratedSlNo={autoSlNo}
        defaultCategory={activeCategoryTab === 'ALL' ? LeadCategory.COMPANY : activeCategoryTab}
      />
      <ImportLeadsModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={loadLeads}
        bulkAddLeads={bulkAddLeads}
        defaultCategory={activeCategoryTab === 'ALL' ? LeadCategory.COMPANY : activeCategoryTab}
      />
    </div>
  );
};

export default ManageLeads;
