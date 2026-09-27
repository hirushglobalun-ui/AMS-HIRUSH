import React, { useState, useEffect, useMemo } from 'react';
import Card from '../common/Card';
import Modal from '../common/Modal';
import FormInput from '../common/FormInput';
import { db } from '../../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Lead, CustomDomain } from '../../types';
import { Globe, Calendar, User, Phone, Mail, FileText, Search, Plus, Edit, Trash2, AlertTriangle, ExternalLink, RefreshCw, ShieldCheck, ShieldAlert, Clock, Send, CheckCircle, XCircle, MessageSquare, Play, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface ConsolidatedDomain {
    id: string;
    projectName: string;
    domainDetail: string;
    expiryDate: string;
    pocName: string;
    pocEmail: string;
    pocPhone: string;
    remark: string;
    isCRM: boolean;
    daysRemaining: number;
    dnsStatus?: 'Healthy' | 'Issue Detected' | 'Pending';
    sslStatus?: 'Healthy' | 'Issue Detected' | 'Pending';
    sslDaysLeft?: number;
    healthError?: string;
    lastChecked?: string;
}

const DomainManager: React.FC = () => {
    const { user } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [customDomains, setCustomDomains] = useState<CustomDomain[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'warning' | 'active' | 'expired' | 'health-issue'>('all');
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDomain, setEditingDomain] = useState<CustomDomain | null>(null);
    const [formData, setFormData] = useState({
        projectName: '',
        domainDetail: '',
        expiryDate: '',
        pocName: '',
        pocEmail: '',
        pocPhone: '',
        remark: ''
    });

    const testEmailAlert = async (domain: ConsolidatedDomain) => {
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

        const emailJSConfigured = !!(publicKey && serviceId && templateId);
        if (!emailJSConfigured) {
            toast.error("EmailJS credentials are not configured in your .env file!");
            return;
        }

        const toastId = toast.loading(`Sending test email for ${domain.projectName}...`);

        try {
            const emailjs = await import('@emailjs/browser');
            emailjs.init(publicKey);

            const alertReason = 'This is a test notification generated manually from the Domain Manager dashboard.';

            await emailjs.send(
                serviceId,
                templateId,
                {
                    project_name: domain.projectName,
                    domain_url: domain.domainDetail,
                    expiry_date: domain.expiryDate || 'N/A',
                    dns_status: 'N/A',
                    ssl_status: 'N/A',
                    error_details: 'N/A',
                    alert_reason: alertReason,
                    to_email: 'hirushglobalun@gmail.com'
                }
            );

            toast.success(`Test email sent successfully for ${domain.projectName}! Check your inbox.`, { id: toastId });
        } catch (err: any) {
            console.error('Failed to send test EmailJS message:', err);
            toast.error(`Failed to send email: ${err?.text || err?.message || 'Unknown error'}`, { id: toastId });
        }
    };

    const sendWhatsAppAlert = (domain: ConsolidatedDomain) => {
        const phone = domain.pocPhone ? domain.pocPhone.replace(/\D/g, '') : '';
        const message = encodeURIComponent(
            `🚨 *Domain Alert for ${domain.projectName}*\n\n` +
            `• Domain: ${domain.domainDetail}\n` +
            `• Expiry Date: ${domain.expiryDate || 'N/A'}\n` +
            `• Days Remaining: ${domain.daysRemaining} days\n` +
            `• DNS Status: ${domain.dnsStatus || 'Healthy'}\n` +
            `• SSL Status: ${domain.sslStatus || 'Healthy'}\n` +
            (domain.healthError ? `• Issue: ${domain.healthError}\n` : '') +
            `\nPlease review or renew your domain settings as soon as possible.`
        );
        const url = phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`;
        window.open(url, '_blank');
        toast.success(`WhatsApp alert window opened for ${domain.projectName}`);
    };

    const runSingleHealthCheck = async (domain: ConsolidatedDomain) => {
        const toastId = toast.loading(`Auditing health for ${domain.domainDetail}...`);
        try {
            const cleanUrl = domain.domainDetail.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
            let dnsStatus: 'Healthy' | 'Issue Detected' = 'Healthy';
            let sslStatus: 'Healthy' | 'Issue Detected' = 'Healthy';
            let healthError = '';

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 6000);
                await fetch(`https://${cleanUrl}`, {
                    method: 'HEAD',
                    mode: 'no-cors',
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
            } catch (err: any) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 4000);
                    await fetch(`http://${cleanUrl}`, {
                        method: 'HEAD',
                        mode: 'no-cors',
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);
                    sslStatus = 'Issue Detected';
                    healthError = 'SSL Certificate Error or HTTPS Unreachable';
                } catch (httpErr: any) {
                    dnsStatus = 'Issue Detected';
                    sslStatus = 'Issue Detected';
                    healthError = 'DNS Resolution or Network Unreachable';
                }
            }

            const todayStr = new Date().toISOString().split('T')[0];
            
            // Generate detailed, distinct alert messages for each issue
            const reasons: string[] = [];
            let isExpiringSoon = false;
            if (domain.expiryDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const expiry = new Date(domain.expiryDate);
                expiry.setHours(0, 0, 0, 0);
                const diffTime = expiry.getTime() - today.getTime();
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 0) {
                    isExpiringSoon = true;
                    reasons.push(`🚨 DOMAIN EXPIRED: Expired on ${domain.expiryDate} (${Math.abs(diffDays)} days ago)`);
                } else if (diffDays <= 14) {
                    isExpiringSoon = true;
                    reasons.push(`⏰ DOMAIN EXPIRING SOON: Expires in ${diffDays} day(s) (${domain.expiryDate})`);
                }
            }

            if (dnsStatus === 'Issue Detected') {
                reasons.push(`🌐 DNS RESOLUTION ISSUE: Domain DNS resolution failed or unreachable`);
            }
            if (sslStatus === 'Issue Detected') {
                reasons.push(`🔒 SSL CERTIFICATE ISSUE: ${healthError || 'SSL Certificate Error or HTTPS Unreachable'}`);
            }

            const hasIssue = dnsStatus === 'Issue Detected' || sslStatus === 'Issue Detected';
            const alertReason = reasons.length > 0 ? reasons.join(' | ') : 'No Issues Detected';

            let sentEmail = false;
            if (isExpiringSoon || hasIssue) {
                const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
                const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
                const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
                if (publicKey && serviceId && templateId) {
                    try {
                        const emailjs = await import('@emailjs/browser');
                        emailjs.init(publicKey);
                        await emailjs.send(
                            serviceId,
                            templateId,
                            {
                                project_name: domain.projectName,
                                domain_url: domain.domainDetail,
                                expiry_date: domain.expiryDate || 'N/A',
                                dns_status: dnsStatus,
                                ssl_status: sslStatus,
                                error_details: healthError || 'None',
                                alert_reason: alertReason,
                                to_email: 'hirushglobalun@gmail.com'
                            }
                        );
                        sentEmail = true;
                        toast.success(`Alert email sent to hirushglobalun@gmail.com!`);
                    } catch (emailErr) {
                        console.error("Single check email error:", emailErr);
                    }
                }
            }

            const docRef = doc(db, domain.isCRM ? 'leads' : 'domains', domain.id);
            await updateDoc(docRef, {
                dnsStatus,
                sslStatus,
                healthError,
                lastChecked: todayStr,
                ...(sentEmail ? { lastEmailed: todayStr } : {})
            });

            if (dnsStatus === 'Healthy' && sslStatus === 'Healthy') {
                toast.success(`Health check passed for ${domain.projectName}!`, { id: toastId });
            } else {
                toast.error(`Issues detected for ${domain.projectName}: ${healthError}`, { id: toastId });
            }

            await loadDataSilent();
        } catch (error: any) {
            console.error('Health check error:', error);
            toast.error(`Audit error for ${domain.projectName}`, { id: toastId });
        }
    };

    const loadDataSilent = async () => {
        try {
            const leadsRef = collection(db, 'leads');
            const leadsSnap = await getDocs(leadsRef);
            const leadList: Lead[] = [];
            leadsSnap.forEach(d => {
                const lead = { id: d.id, ...d.data() } as Lead;
                if (lead.domainDetail && lead.domainDetail.trim() !== '') {
                    leadList.push(lead);
                }
            });
            setLeads(leadList);

            const customRef = collection(db, 'domains');
            const customSnap = await getDocs(customRef);
            const customList: CustomDomain[] = [];
            customSnap.forEach(d => {
                customList.push({ id: d.id, ...d.data() } as CustomDomain);
            });
            setCustomDomains(customList);
            return { leadList, customList };
        } catch (error) {
            console.error("Error reloading domains silently:", error);
            return { leadList: [], customList: [] };
        }
    };

    const runBrowserAudits = async (allLeads: Lead[], allCustom: CustomDomain[]) => {
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

        const emailJSConfigured = !!(publicKey && serviceId && templateId);
        if (emailJSConfigured) {
            import('@emailjs/browser').then((emailjs) => {
                emailjs.init(publicKey);
            });
        } else {
            console.warn("EmailJS is not fully configured in your .env file. Email notifications will be skipped.");
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

        const itemsToCheck: { id: string; type: 'lead' | 'domain'; data: any }[] = [];
        
        allLeads.forEach(l => {
            if (l.lastChecked !== todayStr || l.dnsStatus === 'Issue Detected' || l.sslStatus === 'Issue Detected') {
                itemsToCheck.push({ id: l.id, type: 'lead', data: l });
            }
        });
        allCustom.forEach(c => {
            if (c.lastChecked !== todayStr || c.dnsStatus === 'Issue Detected' || c.sslStatus === 'Issue Detected') {
                itemsToCheck.push({ id: c.id, type: 'domain', data: c });
            }
        });

        if (itemsToCheck.length === 0) return;

        console.log(`Running diagnostics for ${itemsToCheck.length} domains...`);

        for (const item of itemsToCheck) {
            const { id, type, data } = item;

            // 1. Audit DNS & SSL reachability
            const cleanUrl = (data.domainDetail || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
            let dnsStatus: 'Healthy' | 'Issue Detected' = 'Healthy';
            let sslStatus: 'Healthy' | 'Issue Detected' = 'Healthy';
            let healthError = '';

            if (cleanUrl) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 6000);
                    await fetch(`https://${cleanUrl}`, {
                        method: 'HEAD',
                        mode: 'no-cors',
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);
                } catch (err: any) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 4000);
                        await fetch(`http://${cleanUrl}`, {
                            method: 'HEAD',
                            mode: 'no-cors',
                            signal: controller.signal
                        });
                        clearTimeout(timeoutId);
                        sslStatus = 'Issue Detected';
                        healthError = 'SSL Certificate Error or HTTPS Unreachable';
                    } catch (httpErr: any) {
                        dnsStatus = 'Issue Detected';
                        sslStatus = 'Issue Detected';
                        healthError = 'DNS Resolution or Network Unreachable';
                    }
                }
            }

            // 2. Check Expiry timeline & generate detailed alert messages
            const reasons: string[] = [];
            let isExpiringSoon = false;
            let diffDays = 9999;

            if (data.expiryDate) {
                const expiry = new Date(data.expiryDate);
                expiry.setHours(0, 0, 0, 0);
                const diffTime = expiry.getTime() - today.getTime();
                diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 0) {
                    isExpiringSoon = true;
                    reasons.push(`🚨 DOMAIN EXPIRED: Expired on ${data.expiryDate} (${Math.abs(diffDays)} days ago)`);
                } else if (diffDays <= 14) {
                    isExpiringSoon = true;
                    reasons.push(`⏰ DOMAIN EXPIRING SOON: Expires in ${diffDays} day(s) (${data.expiryDate})`);
                }
            }

            if (dnsStatus === 'Issue Detected') {
                reasons.push(`🌐 DNS RESOLUTION ISSUE: Domain DNS resolution failed or unreachable`);
            }
            if (sslStatus === 'Issue Detected') {
                reasons.push(`🔒 SSL CERTIFICATE ISSUE: ${healthError || 'SSL Certificate Error or HTTPS Unreachable'}`);
            }

            const hasIssue = dnsStatus === 'Issue Detected' || sslStatus === 'Issue Detected';
            const alertReason = reasons.length > 0 ? reasons.join(' | ') : 'No Issues Detected';

            const shouldSendEmail = (isExpiringSoon || hasIssue);
            let sentEmail = false;

            if (shouldSendEmail && data.lastEmailed !== todayStr) {
                if (emailJSConfigured) {
                    try {
                        const emailjs = await import('@emailjs/browser');
                        await emailjs.send(
                            serviceId,
                            templateId,
                            {
                                project_name: data.projectName,
                                domain_url: data.domainDetail,
                                expiry_date: data.expiryDate || 'N/A',
                                dns_status: dnsStatus,
                                ssl_status: sslStatus,
                                error_details: healthError || 'None',
                                alert_reason: alertReason,
                                to_email: 'hirushglobalun@gmail.com'
                            }
                        );
                        console.log(`Emailed alert for project: ${data.projectName}`);
                        sentEmail = true;
                    } catch (err) {
                        console.error('Failed to send EmailJS message:', err);
                    }
                }
            }

            // Write updated check results back to Firestore
            try {
                const docRef = doc(db, type === 'lead' ? 'leads' : 'domains', id);
                await updateDoc(docRef, {
                    dnsStatus,
                    sslStatus,
                    healthError,
                    lastChecked: todayStr,
                    ...(sentEmail ? { lastEmailed: todayStr } : {})
                });
            } catch (err) {
                console.error(`Failed to update Firestore status for ${data.projectName}:`, err);
            }
        }

        // Reload silent once all checking finishes to update UI
        await loadDataSilent();
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const { leadList, customList } = await loadDataSilent();
            // Trigger health check diagnostics in background
            runBrowserAudits(leadList, customList);
        } catch (error) {
            console.error("Error loading domains data:", error);
            toast.error("Failed to load domains");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Merge and calculate remaining days
    const consolidatedList = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const list: ConsolidatedDomain[] = [];

        // Add CRM Lead domains
        leads.forEach(l => {
            const expDate = l.expiryDate || '';
            let daysRemaining = 9999;
            if (expDate) {
                const expiry = new Date(expDate);
                expiry.setHours(0, 0, 0, 0);
                const diffTime = expiry.getTime() - today.getTime();
                daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));
            }

            list.push({
                id: l.id,
                projectName: l.projectName,
                domainDetail: l.domainDetail,
                expiryDate: expDate,
                pocName: l.pocName || '',
                pocEmail: l.pocEmail || '',
                pocPhone: l.pocPhone || '',
                remark: l.remark || '',
                isCRM: true,
                daysRemaining,
                dnsStatus: l.dnsStatus || 'Pending',
                sslStatus: l.sslStatus || 'Pending',
                sslDaysLeft: l.sslDaysLeft || 0,
                healthError: l.healthError || '',
                lastChecked: l.lastChecked || ''
            });
        });

        // Add Custom Manually created domains
        customDomains.forEach(c => {
            const expDate = c.expiryDate || '';
            let daysRemaining = 9999;
            if (expDate) {
                const expiry = new Date(expDate);
                expiry.setHours(0, 0, 0, 0);
                const diffTime = expiry.getTime() - today.getTime();
                daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));
            }

            list.push({
                id: c.id,
                projectName: c.projectName,
                domainDetail: c.domainDetail,
                expiryDate: expDate,
                pocName: c.pocName || '',
                pocEmail: c.pocEmail || '',
                pocPhone: c.pocPhone || '',
                remark: c.remark || '',
                isCRM: false,
                daysRemaining,
                dnsStatus: c.dnsStatus || 'Pending',
                sslStatus: c.sslStatus || 'Pending',
                sslDaysLeft: c.sslDaysLeft || 0,
                healthError: c.healthError || '',
                lastChecked: c.lastChecked || ''
            });
        });

        // Sort by days remaining ascending (soonest expiry at top)
        return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
    }, [leads, customDomains]);

    // Apply Search and Filters
    const filteredList = useMemo(() => {
        return consolidatedList.filter(item => {
            // Search query matches project name or domain
            const matchesSearch = 
                item.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.domainDetail.toLowerCase().includes(searchQuery.toLowerCase());
            
            // Status filters
            let matchesStatus = true;
            if (statusFilter === 'expired') {
                matchesStatus = item.daysRemaining < 0;
            } else if (statusFilter === 'critical') {
                matchesStatus = item.daysRemaining >= 0 && item.daysRemaining <= 2;
            } else if (statusFilter === 'warning') {
                matchesStatus = item.daysRemaining > 2 && item.daysRemaining <= 7;
            } else if (statusFilter === 'active') {
                matchesStatus = item.daysRemaining > 7;
            } else if (statusFilter === 'health-issue') {
                matchesStatus = item.dnsStatus === 'Issue Detected' || item.sslStatus === 'Issue Detected';
            }

            return matchesSearch && matchesStatus;
        });
    }, [consolidatedList, searchQuery, statusFilter]);

    // Handle inputs changes in Form
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Open Add Modal
    const openAddModal = () => {
        setEditingDomain(null);
        setFormData({
            projectName: '',
            domainDetail: '',
            expiryDate: '',
            pocName: '',
            pocEmail: '',
            pocPhone: '',
            remark: ''
        });
        setIsModalOpen(true);
    };

    // Open Edit Modal (Custom domains only)
    const openEditModal = (domain: ConsolidatedDomain) => {
        if (domain.isCRM) {
            toast.error("CRM synced domains can only be edited inside CRM Leads.");
            return;
        }
        const original = customDomains.find(c => c.id === domain.id);
        if (!original) return;

        setEditingDomain(original);
        setFormData({
            projectName: original.projectName,
            domainDetail: original.domainDetail,
            expiryDate: original.expiryDate,
            pocName: original.pocName || '',
            pocEmail: original.pocEmail || '',
            pocPhone: original.pocPhone || '',
            remark: original.remark || ''
        });
        setIsModalOpen(true);
    };

    // Handle Add/Edit submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.projectName || !formData.domainDetail || !formData.expiryDate) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            if (editingDomain) {
                // Update
                const docRef = doc(db, 'domains', editingDomain.id);
                await updateDoc(docRef, {
                    ...formData,
                    updatedAt: serverTimestamp()
                });
                toast.success("Domain updated successfully");
            } else {
                // Add new
                const domainsRef = collection(db, 'domains');
                await addDoc(domainsRef, {
                    ...formData,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                toast.success("Domain added successfully");
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error("Error saving domain:", error);
            toast.error("Failed to save domain details");
        }
    };

    // Delete custom domain
    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            const docRef = doc(db, 'domains', id);
            await deleteDoc(docRef);
            toast.success("Domain deleted successfully");
            loadData();
        } catch (error) {
            console.error("Error deleting domain:", error);
            toast.error("Failed to delete domain");
        }
    };

    const getRemainingDaysBadge = (days: number) => {
        if (days >= 9000) {
            return (
                <span className="px-3 py-1 bg-slate-100 text-slate-500 border border-slate-200 text-xs font-bold rounded-full">
                    No Expiry Set
                </span>
            );
        } else if (days < 0) {
            return (
                <span className="px-3 py-1 bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-full flex items-center gap-1 shadow-sm">
                    <AlertTriangle size={12} />
                    Expired ({Math.abs(days)}d ago)
                </span>
            );
        } else if (days <= 2) {
            return (
                <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-md animate-pulse">
                    <AlertTriangle size={12} />
                    Expires in {days} day{days !== 1 ? 's' : ''}
                </span>
            );
        } else if (days <= 7) {
            return (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold rounded-full flex items-center gap-1 shadow-sm">
                    <AlertTriangle size={12} />
                    {days} days left
                </span>
            );
        } else {
            return (
                <span className="px-3 py-1 bg-green-100 text-green-700 border border-green-200 text-xs font-bold rounded-full">
                    {days} days remaining
                </span>
            );
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Globe className="text-indigo-600 animate-spin-slow" size={28} />
                        Domain & Hosting Health Monitor
                    </h1>
                    <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                        <Clock size={14} className="text-indigo-600" />
                        <span>Automated Daily Email Audits: <strong className="text-slate-700">6:30 PM IST</strong> &bull; Recipient: <strong className="text-indigo-600">hirushglobalun@gmail.com</strong></span>
                    </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={loadData}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-all active:scale-95 flex items-center gap-2 text-xs font-bold"
                        title="Run Full Audit & Refresh"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        <span>Run Audits</span>
                    </button>
                    <button
                        onClick={openAddModal}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-md shadow-indigo-100 text-sm"
                    >
                        <Plus size={18} />
                        Add Domain
                    </button>
                </div>
            </div>

            {/* Health Overview Summary Cards */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Total Domains</span>
                        <Globe size={18} className="text-indigo-500" />
                    </div>
                    <span className="text-2xl font-bold text-slate-800">{consolidatedList.length}</span>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-emerald-600 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Healthy</span>
                        <ShieldCheck size={18} className="text-emerald-500" />
                    </div>
                    <span className="text-2xl font-bold text-emerald-700">
                        {consolidatedList.filter(i => (i.dnsStatus || 'Healthy') === 'Healthy' && (i.sslStatus || 'Healthy') === 'Healthy' && i.daysRemaining > 7).length}
                    </span>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-amber-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-amber-600 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Expiring Soon</span>
                        <Clock size={18} className="text-amber-500" />
                    </div>
                    <span className="text-2xl font-bold text-amber-700">
                        {consolidatedList.filter(i => i.daysRemaining >= 0 && i.daysRemaining <= 14).length}
                    </span>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-red-600 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Health Issues</span>
                        <ShieldAlert size={18} className="text-red-500" />
                    </div>
                    <span className="text-2xl font-bold text-red-700">
                        {consolidatedList.filter(i => i.dnsStatus === 'Issue Detected' || i.sslStatus === 'Issue Detected' || i.daysRemaining < 0).length}
                    </span>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by project name or domain URL..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none text-sm text-slate-700 transition-all shadow-sm"
                    />
                </div>
                <div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/70 backdrop-blur-sm focus:border-indigo-500 outline-none text-sm text-slate-700 transition-all shadow-sm"
                    >
                        <option value="all">All Domains</option>
                        <option value="critical">Critical Expiry (0 - 2 Days)</option>
                        <option value="warning">Warning Expiry (3 - 7 Days)</option>
                        <option value="active">Active Expiry (&gt; 7 Days)</option>
                        <option value="expired">Expired Domains</option>
                        <option value="health-issue">DNS/SSL Issues</option>
                    </select>
                </div>
                <div className="bg-slate-100 rounded-xl p-1 flex gap-1">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`flex-1 text-xs py-2 rounded-lg font-bold transition-all ${statusFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Total ({consolidatedList.length})
                    </button>
                    <button
                        onClick={() => setStatusFilter('health-issue')}
                        className={`flex-1 text-xs py-2 rounded-lg font-bold transition-all ${statusFilter === 'health-issue' ? 'bg-red-600 text-white shadow-sm' : 'text-red-600 hover:bg-red-50'}`}
                    >
                        Health Issues ({consolidatedList.filter(i => i.dnsStatus === 'Issue Detected' || i.sslStatus === 'Issue Detected').length})
                    </button>
                </div>
            </div>

            {/* Domains List */}
            {loading ? (
                <div className="text-center py-20 bg-white/50 backdrop-blur-sm border border-slate-100 rounded-2xl">
                    <Globe size={40} className="text-indigo-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Syncing domains database...</p>
                </div>
            ) : filteredList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredList.map(domain => (
                        <Card key={domain.id} className={`bg-white/80 hover:shadow-xl transition-all duration-300 border flex flex-col justify-between ${domain.daysRemaining <= 2 ? 'border-red-200 ring-2 ring-red-500/10 bg-red-50/10' : 'border-slate-100'}`}>
                            <div>
                                {/* Header section */}
                                <div className="flex justify-between items-start gap-4 mb-4">
                                    <div>
                                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider mb-1.5 ${domain.isCRM ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                            {domain.isCRM ? 'CRM Synced' : 'Manually Entered'}
                                        </span>
                                        <h3 className="font-extrabold text-slate-800 text-base line-clamp-1">{domain.projectName}</h3>
                                    </div>
                                    {getRemainingDaysBadge(domain.daysRemaining)}
                                </div>

                                {/* Spacing */}
                                <div className="h-2"></div>

                                {/* Details list */}
                                <div className="space-y-3 text-xs mb-6">
                                    <div className="flex items-center gap-2.5 text-slate-600 bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                                        <Globe size={14} className="text-indigo-500 flex-shrink-0" />
                                        <span className="font-semibold select-all truncate text-indigo-600">{domain.domainDetail}</span>
                                        <a
                                            href={`http://${domain.domainDetail}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-slate-400 hover:text-indigo-600 transition-colors ml-auto flex-shrink-0"
                                            title="Visit Website"
                                        >
                                            <ExternalLink size={12} />
                                        </a>
                                    </div>

                                    <div className="flex items-center gap-2.5 text-slate-600">
                                        <Calendar size={14} className="text-slate-400 flex-shrink-0" />
                                        <span>Expiry: <strong className="text-slate-700">{domain.expiryDate}</strong></span>
                                    </div>

                                    {domain.pocName && (
                                        <div className="flex items-center gap-2.5 text-slate-600 border-t border-dashed border-slate-100 pt-2.5">
                                            <User size={14} className="text-slate-400 flex-shrink-0" />
                                            <span className="truncate">POC: <strong className="text-slate-700">{domain.pocName}</strong></span>
                                        </div>
                                    )}

                                    {domain.pocEmail && (
                                        <div className="flex items-center gap-2.5 text-slate-600">
                                            <Mail size={14} className="text-slate-400 flex-shrink-0" />
                                            <a href={`mailto:${domain.pocEmail}`} className="hover:text-indigo-600 transition-colors truncate">{domain.pocEmail}</a>
                                        </div>
                                    )}

                                    {domain.pocPhone && (
                                        <div className="flex items-center gap-2.5 text-slate-600">
                                            <Phone size={14} className="text-slate-400 flex-shrink-0" />
                                            <span>{domain.pocPhone}</span>
                                        </div>
                                    )}

                                    {/* DNS & SSL Health Checks Indicators */}
                                    <div className="border-t border-slate-100 pt-2.5 space-y-1.5">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="font-bold text-slate-500">DNS Resolution:</span>
                                            <span className={`px-2 py-0.5 rounded font-extrabold flex items-center gap-1 ${
                                                domain.dnsStatus === 'Issue Detected' 
                                                    ? 'bg-red-50 text-red-700 border border-red-200' 
                                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            }`}>
                                                {domain.dnsStatus === 'Issue Detected' ? <XCircle size={10} /> : <CheckCircle size={10} />}
                                                {domain.dnsStatus || 'Healthy'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="font-bold text-slate-500">SSL Certificate:</span>
                                            <span className={`px-2 py-0.5 rounded font-extrabold flex items-center gap-1 ${
                                                domain.sslStatus === 'Issue Detected' 
                                                    ? 'bg-red-50 text-red-700 border border-red-200' 
                                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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
                                        <div className="bg-slate-50/50 p-2.5 rounded-lg text-slate-500 italic mt-2 border border-slate-100/50">
                                            <p className="line-clamp-2">"{domain.remark}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions footer */}
                            <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                                <span className="text-[10px] text-slate-400 font-medium flex flex-col gap-0.5">
                                    <span>ID: {domain.id.substring(0, 8)}...</span>
                                    {domain.lastChecked && (
                                        <span className="text-[9px] text-slate-500">Checked: {domain.lastChecked}</span>
                                    )}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => runSingleHealthCheck(domain)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                        title="Run Audit Check Now"
                                    >
                                        <Zap size={14} />
                                    </button>
                                    <button
                                        onClick={() => sendWhatsAppAlert(domain)}
                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                        title="Send WhatsApp Alert"
                                    >
                                        <MessageSquare size={14} />
                                    </button>
                                    <button
                                        onClick={() => testEmailAlert(domain)}
                                        className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all"
                                        title="Send Email Alert"
                                    >
                                        <Send size={14} />
                                    </button>
                                    {!domain.isCRM ? (
                                        <>
                                            <button
                                                onClick={() => openEditModal(domain)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                title="Edit Details"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(domain.id, domain.projectName)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete Domain"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </>
                                    ) : (
                                        <span className="text-[10px] text-slate-400 italic bg-slate-50 px-2.5 py-1 rounded border border-slate-100">
                                            Managed in CRM
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <Globe size={48} className="text-slate-300 mx-auto mb-4" />
                    <h3 className="font-bold text-slate-600">No domains found</h3>
                    <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or add a new manual domain entry.</p>
                    <button
                        onClick={openAddModal}
                        className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-all active:scale-95 shadow-md shadow-indigo-100"
                    >
                        Add Manual Domain
                    </button>
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingDomain ? `Edit Domain: ${editingDomain.projectName}` : "Add New Custom Domain"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormInput
                        label="Project Name *"
                        name="projectName"
                        value={formData.projectName}
                        onChange={handleInputChange}
                        placeholder="e.g. Acme Website Hosting"
                        required
                    />

                    <FormInput
                        label="Domain URL / IP *"
                        name="domainDetail"
                        value={formData.domainDetail}
                        onChange={handleInputChange}
                        placeholder="e.g. www.acme.com"
                        required
                    />

                    <FormInput
                        label="Expiry Date *"
                        name="expiryDate"
                        type="date"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        required
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
                        <FormInput
                            label="POC Name"
                            name="pocName"
                            value={formData.pocName}
                            onChange={handleInputChange}
                            placeholder="John Doe"
                        />
                        <FormInput
                            label="POC Phone"
                            name="pocPhone"
                            value={formData.pocPhone}
                            onChange={handleInputChange}
                            placeholder="+91 9988776655"
                        />
                    </div>

                    <FormInput
                        label="POC Email"
                        name="pocEmail"
                        type="email"
                        value={formData.pocEmail}
                        onChange={handleInputChange}
                        placeholder="john@company.com"
                    />

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Remarks</label>
                        <textarea
                            name="remark"
                            rows={3}
                            value={formData.remark}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-indigo-500 transition-all outline-none font-medium text-slate-700 text-sm resize-none"
                            placeholder="Add server hosting details, panel URLs or notes..."
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-50 pt-4 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all active:scale-95 shadow-md shadow-indigo-100"
                        >
                            {editingDomain ? "Save Changes" : "Create Domain"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default DomainManager;
