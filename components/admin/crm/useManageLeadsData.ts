/**
 * File: components/admin/crm/useManageLeadsData.ts
 * Purpose: Custom hook managing CRM leads loading, filtering, pagination, exports, and CRUD operations.
 * Author: Hirush Global AMS
 */

import { useState, useEffect, useMemo } from 'react';
import { fetchLeads, addLead, updateLead, deleteLead, fetchAllLeadActivities, fetchCRMCompanies } from '../../../services/crmService';
import { fetchUsers } from '../../../services/dataService';
import { Lead, LeadStatus, LeadCategory } from '../../../types';
import toast from 'react-hot-toast';

export const useManageLeadsData = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [activitiesMap, setActivitiesMap] = useState<Record<string, string>>({});
  const [crmCompanies, setCrmCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
    department: '',
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<LeadCategory | 'ALL'>(LeadCategory.COMPANY);
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadLeads = async () => {
    setLoading(true);
    try {
      const [leadsResult, usersResult, activitiesResult, companiesResult] = await Promise.allSettled([
        fetchLeads(),
        fetchUsers(),
        fetchAllLeadActivities(),
        fetchCRMCompanies(),
      ]);

      if (leadsResult.status === 'fulfilled') {
        setLeads(leadsResult.value.leads || []);
      } else {
        toast.error('Failed to load leads');
      }

      if (companiesResult.status === 'fulfilled') {
        setCrmCompanies(companiesResult.value);
      }

      if (usersResult.status === 'fulfilled') {
        const uMap: Record<string, string> = {};
        usersResult.value.forEach((u: any) => {
          if (u?.id) uMap[u.id] = u.name || 'Unknown User';
        });
        setUsersMap(uMap);
      }

      if (activitiesResult.status === 'fulfilled') {
        const aMap: Record<string, string> = {};
        activitiesResult.value.forEach((a: any) => {
          if (!a?.leadId) return;
          const schedDate = a.scheduledAt ? new Date(a.scheduledAt).toLocaleDateString() : 'N/A';
          const text = `[${schedDate}] ${a.type || 'Activity'}: ${a.title || ''} (${a.completed ? 'Done' : 'Pending'})`;
          aMap[a.leadId] = aMap[a.leadId] ? `${aMap[a.leadId]} | ${text}` : text;
        });
        setActivitiesMap(aMap);
      }
    } catch {
      toast.error('Unexpected error loading leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm, activeCategoryTab]);

  const categoryLeads = useMemo(() => {
    if (activeCategoryTab === 'ALL') return leads;
    return leads.filter((l) => (l.category || LeadCategory.COMPANY) === activeCategoryTab);
  }, [leads, activeCategoryTab]);

  const availableCompanyOptions = useMemo(() => {
    const fromLeads = leads
      .map((l) => (l.clientTypeDetail || '').trim())
      .filter((detail) => detail.length > 0);
    const combined = Array.from(new Set([...crmCompanies, ...fromLeads]));
    return combined.sort((a, b) => a.localeCompare(b));
  }, [leads, crmCompanies]);

  const filteredLeads = useMemo(() => {
    return categoryLeads
      .filter((lead) => {
        const leadCat = lead.category || LeadCategory.COMPANY;
        return (
          (!filters.category || leadCat === filters.category) &&
          (!filters.slNo || lead.slNo.toLowerCase().includes(filters.slNo.toLowerCase())) &&
          (!filters.projectName || lead.projectName.toLowerCase().includes(filters.projectName.toLowerCase())) &&
          (!filters.status || lead.status === filters.status) &&
          (!filters.clientType || lead.clientType === filters.clientType) &&
          (!filters.clientTypeDetail || (lead.clientTypeDetail || '').toLowerCase().includes(filters.clientTypeDetail.toLowerCase())) &&
          (!filters.firstStartDate || lead.firstStartDate.includes(filters.firstStartDate)) &&
          (!filters.commencementDate || (lead.workCommencementDate || '').includes(filters.commencementDate)) &&
          (!filters.pocName || lead.pocName.toLowerCase().includes(filters.pocName.toLowerCase())) &&
          (!filters.pocEmail || lead.pocEmail.toLowerCase().includes(filters.pocEmail.toLowerCase())) &&
          (!filters.pocPhone || lead.pocPhone.toLowerCase().includes(filters.pocPhone.toLowerCase())) &&
          (!filters.clientName || (lead.clientName || '').toLowerCase().includes(filters.clientName.toLowerCase())) &&
          (!filters.domainDetail || (lead.domainDetail || '').toLowerCase().includes(filters.domainDetail.toLowerCase())) &&
          (!filters.expiryDate || (lead.expiryDate || '').includes(filters.expiryDate)) &&
          (!filters.department ||
            (Array.isArray(lead.department)
              ? lead.department.join(', ').toLowerCase().includes(filters.department.toLowerCase())
              : String(lead.department || '').toLowerCase().includes(filters.department.toLowerCase()))) &&
          (!searchTerm ||
            lead.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.slNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.pocName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.clientType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lead.clientTypeDetail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lead.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            leadCat.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      })
      .sort((a, b) => {
        const aNum = parseInt(a.slNo.replace(/\D/g, ''), 10) || 0;
        const bNum = parseInt(b.slNo.replace(/\D/g, ''), 10) || 0;
        return bNum - aNum;
      });
  }, [categoryLeads, filters, searchTerm]);

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: categoryLeads.length,
    pending: categoryLeads.filter((l) => l.status === LeadStatus.PENDING).length,
    ongoing: categoryLeads.filter((l) => l.status === LeadStatus.ONGOING).length,
    completed: categoryLeads.filter((l) => l.status === LeadStatus.COMPLETED).length,
    onHold: categoryLeads.filter((l) => l.status === LeadStatus.ON_HOLD).length,
    proposalSent: categoryLeads.filter((l) => l.status === LeadStatus.PROPOSAL_SENT).length,
    disposed: categoryLeads.filter((l) => l.status === LeadStatus.DISPOSED).length,
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (leadData: Omit<Lead, 'id'>) => {
    try {
      if (selectedLead) {
        await updateLead(selectedLead.id, leadData);
        toast.success('Lead updated successfully');
      } else {
        await addLead(leadData);
        toast.success('Lead added successfully');
      }
      setIsFormOpen(false);
      loadLeads();
    } catch {
      toast.error('Failed to save lead');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await deleteLead(id);
        toast.success('Lead deleted successfully');
        loadLeads();
      } catch {
        toast.error('Failed to delete lead');
      }
    }
  };

  const handleExportLeads = () => {
    if (filteredLeads.length === 0) {
      toast.error('No leads available to export');
      return;
    }
    const headers = ['SL No', 'Category', 'Project Name', 'Status', 'Client Name', 'Client Type', 'POC Name', 'POC Phone'];
    const rows = filteredLeads.map((l) => [l.slNo, l.category || 'Company', l.projectName, l.status, l.clientName, l.clientType, l.pocName, l.pocPhone]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Leads exported successfully');
  };

  return {
    leads,
    usersMap,
    activitiesMap,
    loading,
    searchTerm,
    setSearchTerm,
    filters,
    handleFilterChange,
    isFormOpen,
    setIsFormOpen,
    isDetailOpen,
    setIsDetailOpen,
    isImportOpen,
    setIsImportOpen,
    activeCategoryTab,
    setActiveCategoryTab,
    activeTab,
    setActiveTab,
    selectedLead,
    setSelectedLead,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    paginatedLeads,
    filteredLeads,
    availableCompanyOptions,
    stats,
    loadLeads,
    handleFormSubmit,
    handleDelete,
    handleExportLeads,
  };
};
