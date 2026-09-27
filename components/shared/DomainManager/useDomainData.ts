/**
 * File: components/shared/DomainManager/useDomainData.ts
 * Purpose: Custom hook managing state, Firestore sync, and health audits for DomainManager.
 * Author: Hirush Global AMS
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Lead, CustomDomain } from '../../../types';
import { toast } from 'react-hot-toast';
import { ConsolidatedDomain, DomainFormData, DomainStatusFilter } from './types';
import { calculateDaysRemaining, auditDomainReachability } from './domainUtils';

export const useDomainData = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customDomains, setCustomDomains] = useState<CustomDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DomainStatusFilter>('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const leadsQuery = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
      const leadsSnap = await getDocs(leadsQuery);
      const leadList: Lead[] = [];
      leadsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.domainDetail && data.domainDetail.trim() !== '') {
          leadList.push({ id: docSnap.id, ...data } as Lead);
        }
      });
      setLeads(leadList);

      const customQuery = query(collection(db, 'domains'), orderBy('createdAt', 'desc'));
      const customSnap = await getDocs(customQuery);
      const customList: CustomDomain[] = [];
      customSnap.forEach((docSnap) => {
        customList.push({ id: docSnap.id, ...docSnap.data() } as CustomDomain);
      });
      setCustomDomains(customList);
    } catch (error) {
      console.error('Error fetching domains:', error);
      toast.error('Failed to load domains');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const consolidatedList: ConsolidatedDomain[] = useMemo(() => {
    const list: ConsolidatedDomain[] = [];

    leads.forEach((l) => {
      list.push({
        id: l.id,
        projectName: l.projectName || 'Unnamed Lead Project',
        domainDetail: l.domainDetail || '',
        expiryDate: l.expiryDate || '',
        pocName: l.pocName || l.clientName || '',
        pocEmail: l.pocEmail || l.clientEmail || '',
        pocPhone: l.pocPhone || l.clientPhone || '',
        remark: l.remark || '',
        isCRM: true,
        daysRemaining: calculateDaysRemaining(l.expiryDate),
        dnsStatus: l.dnsStatus || 'Healthy',
        sslStatus: l.sslStatus || 'Healthy',
        sslDaysLeft: l.sslDaysLeft,
        healthError: l.healthError,
        lastChecked: l.lastChecked,
      });
    });

    customDomains.forEach((c) => {
      list.push({
        id: c.id,
        projectName: c.projectName,
        domainDetail: c.domainDetail,
        expiryDate: c.expiryDate,
        pocName: c.pocName || '',
        pocEmail: c.pocEmail || '',
        pocPhone: c.pocPhone || '',
        remark: c.remark || '',
        isCRM: false,
        daysRemaining: calculateDaysRemaining(c.expiryDate),
        dnsStatus: c.dnsStatus || 'Healthy',
        sslStatus: c.sslStatus || 'Healthy',
        sslDaysLeft: c.sslDaysLeft,
        healthError: c.healthError,
        lastChecked: c.lastChecked,
      });
    });

    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [leads, customDomains]);

  const filteredList = useMemo(() => {
    return consolidatedList.filter((item) => {
      const matchesSearch =
        item.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.domainDetail.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'critical') return item.daysRemaining >= 0 && item.daysRemaining <= 2;
      if (statusFilter === 'warning') return item.daysRemaining >= 3 && item.daysRemaining <= 7;
      if (statusFilter === 'active') return item.daysRemaining > 7 && item.daysRemaining < 9000;
      if (statusFilter === 'expired') return item.daysRemaining < 0;
      if (statusFilter === 'health-issue') {
        return item.dnsStatus === 'Issue Detected' || item.sslStatus === 'Issue Detected';
      }
      return true;
    });
  }, [consolidatedList, searchQuery, statusFilter]);

  const runAudit = async (domain: ConsolidatedDomain) => {
    const toastId = toast.loading(`Auditing health for ${domain.domainDetail}...`);
    try {
      const { dnsStatus, sslStatus, healthError } = await auditDomainReachability(domain.domainDetail);
      const todayStr = new Date().toISOString().split('T')[0];
      const docRef = doc(db, domain.isCRM ? 'leads' : 'domains', domain.id);
      await updateDoc(docRef, { dnsStatus, sslStatus, healthError, lastChecked: todayStr });
      toast.success(`Audit completed: ${dnsStatus === 'Healthy' && sslStatus === 'Healthy' ? 'Healthy' : 'Issues found'}`, { id: toastId });
      loadData();
    } catch {
      toast.error('Audit failed', { id: toastId });
    }
  };

  const saveDomain = async (formData: DomainFormData, editingId?: string) => {
    if (!formData.projectName || !formData.domainDetail || !formData.expiryDate) {
      toast.error('Please fill in all required fields');
      return false;
    }
    try {
      if (editingId) {
        await updateDoc(doc(db, 'domains', editingId), { ...formData, updatedAt: serverTimestamp() });
        toast.success('Domain updated successfully');
      } else {
        await addDoc(collection(db, 'domains'), { ...formData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        toast.success('Domain added successfully');
      }
      loadData();
      return true;
    } catch (error) {
      console.error('Error saving domain:', error);
      toast.error('Failed to save domain details');
      return false;
    }
  };

  const deleteDomain = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'domains', id));
      toast.success('Domain deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting domain:', error);
      toast.error('Failed to delete domain');
    }
  };

  return {
    loading,
    leads,
    customDomains,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    consolidatedList,
    filteredList,
    loadData,
    runAudit,
    saveDomain,
    deleteDomain,
  };
};
