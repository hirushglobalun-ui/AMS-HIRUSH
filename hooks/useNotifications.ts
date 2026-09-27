"use client";

/**
 * @file useNotifications.ts
 * @description Provides logic, persistence, and dismissal utilities for notifications.
 * @module hooks
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';
import { User, Role } from '../types';
import { toast } from 'react-hot-toast';

export interface Notification {
    id: string;
    type: 'message' | 'announcement';
    title: string;
    content: string;
    senderName: string;
    senderId?: string;
    timestamp: any;
    read: boolean;
    conversationId?: string;
}

export const useNotifications = (user: User, activeTab: string) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const lastMessageTimeRef = useRef<{ [key: string]: number }>({});
    const hasToastedRef = useRef(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Helpers to manage dismissed and read notifications in localStorage
    const getDismissedSet = useCallback((): Set<string> => {
        try {
            const raw = localStorage.getItem(`hirush_dismissed_notifs_${user.id}`);
            return raw ? new Set(JSON.parse(raw)) : new Set();
        } catch {
            return new Set();
        }
    }, [user.id]);

    const getReadSet = useCallback((): Set<string> => {
        try {
            const raw = localStorage.getItem(`hirush_read_notifs_${user.id}`);
            return raw ? new Set(JSON.parse(raw)) : new Set();
        } catch {
            return new Set();
        }
    }, [user.id]);

    // Initialize notification sound
    useEffect(() => {
        audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS56+OdTgwOUKXh8LZjHAU5jtbyzHksBSR3yPDckUALFF2z6OqoVRQLRp/g8r5sIQUrgc7y2Ik2CBhkuevjnU4MDlCl4fC2YxwFOY7W8sx5LAUkd8jw3JFAC');
    }, []);

    const playNotificationSound = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log('Audio play failed:', e));
        }
    };

    // Main notification fetcher and message listener (NO activeTab dependency to prevent spam loops)
    useEffect(() => {
        if (!user) return;

        const unsubscribers: (() => void)[] = [];
        const dismissedSet = getDismissedSet();
        const readSet = getReadSet();

        const checkDomainExpiries = async () => {
            const isUserAdminOrHR = user.role === Role.ADMIN || user.role === Role.HR;
            const isUserSales = user.department && user.department.toLowerCase() === 'sales';
            
            if (!isUserAdminOrHR && !isUserSales) return;

            try {
                const leadsRef = collection(db, 'leads');
                const domainsRef = collection(db, 'domains');
                
                let qLeads = query(leadsRef);
                if (!isUserAdminOrHR && isUserSales) {
                    qLeads = query(leadsRef, where('assignedTo', '==', user.id));
                }

                const [leadsSnap, customSnap] = await Promise.all([
                    getDocs(qLeads),
                    getDocs(domainsRef)
                ]);

                const allItems: { id: string; isCRM: boolean; data: any }[] = [];
                leadsSnap.forEach(d => {
                    const data = d.data();
                    if (data.domainDetail && data.domainDetail.trim() !== '') {
                        const status = (data.status || '').toLowerCase();
                        // Ignore disposed, lost, or archived leads
                        if (status === 'disposed' || status === 'lost' || status === 'archived' || status === 'junk') return;
                        allItems.push({ id: d.id, isCRM: true, data });
                    }
                });
                customSnap.forEach(d => {
                    const data = d.data();
                    const status = (data.status || '').toLowerCase();
                    // Ignore inactive or archived custom domains
                    if (status === 'inactive' || status === 'archived') return;
                    allItems.push({ id: d.id, isCRM: false, data });
                });

                const alertNotifications: Notification[] = [];
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                for (const item of allItems) {
                    const alertId = `domain_alert_${item.id}`;

                    // If user previously dismissed this alert, DO NOT recreate it!
                    if (dismissedSet.has(alertId)) continue;

                    const d = item.data;
                    const projectName = d.projectName || d.domainDetail || 'Website';
                    const domainUrl = d.domainDetail || 'N/A';
                    let isExpiringSoon = false;
                    let daysRemaining = 9999;
                    const issuesList: string[] = [];

                    if (d.expiryDate) {
                        const expiry = new Date(d.expiryDate);
                        expiry.setHours(0, 0, 0, 0);
                        const diffTime = expiry.getTime() - today.getTime();
                        daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));

                        // If expired > 30 days ago, do not flag as an active notification
                        if (daysRemaining < -30) {
                            continue;
                        } else if (daysRemaining <= 0) {
                            isExpiringSoon = true;
                            issuesList.push(`Domain Expired on ${d.expiryDate} (${Math.abs(daysRemaining)} days ago)`);
                        } else if (daysRemaining <= 14) {
                            isExpiringSoon = true;
                            issuesList.push(`Domain Expiring Soon: ${daysRemaining} day(s) left (${d.expiryDate})`);
                        }
                    }

                    if (d.dnsStatus === 'Issue Detected') {
                        issuesList.push(`DNS Resolution Issue: ${d.healthError || 'Unreachable'}`);
                    }
                    if (d.sslStatus === 'Issue Detected' && d.dnsStatus !== 'Issue Detected') {
                        issuesList.push(`SSL Certificate Issue: ${d.healthError || 'Invalid Certificate'}`);
                    }

                    const hasHealthIssue = d.dnsStatus === 'Issue Detected' || d.sslStatus === 'Issue Detected';

                    if (isExpiringSoon || hasHealthIssue) {
                        const alertTitle = isExpiringSoon && hasHealthIssue
                            ? `🚨 Critical Domain Alert: ${projectName}`
                            : isExpiringSoon
                            ? `⏰ Domain Expiring Soon: ${projectName}`
                            : `🌐 Domain Health Issue: ${projectName}`;

                        const alertReason = issuesList.join(' | ');

                        alertNotifications.push({
                            id: alertId,
                            type: 'message',
                            title: alertTitle,
                            content: `Project "${projectName}" (${domainUrl}) has alert status: ${alertReason}`,
                            senderName: 'Domain System Alert',
                            timestamp: { toDate: () => new Date() },
                            read: readSet.has(alertId)
                        });
                    }
                }

                if (alertNotifications.length > 0) {
                    setNotifications(prev => {
                        const otherNotifications = prev.filter(n => !n.id.startsWith('domain_alert_'));
                        const merged = [...alertNotifications, ...otherNotifications];
                        const unread = merged.filter(n => !n.read).length;
                        setUnreadCount(unread);
                        return merged;
                    });
                    
                    // Only show popup toast once per session
                    if (!hasToastedRef.current) {
                        hasToastedRef.current = true;
                        const unreadAlerts = alertNotifications.filter(n => !n.read);
                        if (unreadAlerts.length > 0) {
                            toast(`${unreadAlerts[0].title}`, {
                                icon: '🚨',
                                duration: 5000,
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("Error checking domain expiries:", error);
            }
        };

        checkDomainExpiries();

        const handleNewMessage = (data: any, type: 'message', docId: string | undefined, isHistory: boolean) => {
            if (data.senderId === user.id) return;

            const notificationId = data.conversationId || data.department || `dm_${data.participants?.sort().join('_')}` || docId || `msg_${Date.now()}`;
            const time = data.createdAt?.seconds || data.timestamp?.seconds || 0;
            const fullId = `${notificationId}_${time}`;

            if (dismissedSet.has(fullId)) return;

            // If history or older message, just update the ref and return
            if (isHistory) {
                if (time > (lastMessageTimeRef.current[notificationId] || 0)) {
                    lastMessageTimeRef.current[notificationId] = time;
                }
                return;
            }

            // If new message and newer than what we've seen
            if (!lastMessageTimeRef.current[notificationId] || time > lastMessageTimeRef.current[notificationId]) {
                lastMessageTimeRef.current[notificationId] = time;

                const notification: Notification = {
                    id: fullId,
                    type,
                    title: data.title || 'New message',
                    content: data.content,
                    senderName: data.senderName || 'Unknown',
                    senderId: data.senderId,
                    timestamp: data.createdAt || data.timestamp,
                    read: readSet.has(fullId),
                    conversationId: notificationId
                };

                setNotifications(prev => {
                    const exists = prev.some(n => n.id === notification.id);
                    if (exists) return prev;
                    const updated = [notification, ...prev];
                    setUnreadCount(updated.filter(n => !n.read).length);
                    return updated;
                });

                // Play sound
                playNotificationSound();

                // Show toast
                toast(`${data.senderName}: ${data.title}`, {
                    icon: '📧',
                    duration: 4000,
                });
            }
        };

        // Listen for Messages (Announcements)
        const messagesQuery = query(
            collection(db, 'messages'),
            orderBy('timestamp', 'desc'),
            limit(50)
        );

        let initialMessages = true;
        unsubscribers.push(onSnapshot(messagesQuery, (snapshot) => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    const msg: any = { id: change.doc.id, ...data };

                    const userDept = user.department ? user.department.trim() : '';
                    const userRole = user.role;

                    if (
                        msg.recipient === 'all' ||
                        (typeof msg.recipient === 'string' && msg.recipient === userDept) ||
                        (typeof msg.recipient === 'string' && msg.recipient === userRole) ||
                        (Array.isArray(msg.recipient) && msg.recipient.includes(user.id))
                    ) {
                        handleNewMessage(msg, 'message', change.doc.id, initialMessages);
                    }
                }
            });
            initialMessages = false;
        }));

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [user.id, user.department, user.role, getDismissedSet, getReadSet]);

    // Handle messages tab active: mark chat messages as read
    useEffect(() => {
        if (activeTab === 'messages') {
            setNotifications(prev => {
                const readSet = getReadSet();
                const updated = prev.map(n => {
                    readSet.add(n.id);
                    return { ...n, read: true };
                });
                try {
                    localStorage.setItem(`hirush_read_notifs_${user.id}`, JSON.stringify(Array.from(readSet)));
                } catch (e) {
                    console.error("Failed to save read notifications:", e);
                }
                setUnreadCount(0);
                return updated;
            });
        }
    }, [activeTab, user.id, getReadSet]);

    const markAsRead = useCallback((notificationId: string) => {
        const readSet = getReadSet();
        readSet.add(notificationId);
        try {
            localStorage.setItem(`hirush_read_notifs_${user.id}`, JSON.stringify(Array.from(readSet)));
        } catch (e) {
            console.error("Failed to save read notifications:", e);
        }

        setNotifications(prev => {
            const updated = prev.map(n => n.id === notificationId ? { ...n, read: true } : n);
            setUnreadCount(updated.filter(n => !n.read).length);
            return updated;
        });
    }, [user.id, getReadSet]);

    const dismissNotification = useCallback((notificationId: string) => {
        const dismissedSet = getDismissedSet();
        dismissedSet.add(notificationId);
        try {
            localStorage.setItem(`hirush_dismissed_notifs_${user.id}`, JSON.stringify(Array.from(dismissedSet)));
        } catch (e) {
            console.error("Failed to save dismissed notifications:", e);
        }

        setNotifications(prev => {
            const filtered = prev.filter(n => n.id !== notificationId);
            setUnreadCount(filtered.filter(n => !n.read).length);
            return filtered;
        });
    }, [user.id, getDismissedSet]);

    const markAllAsRead = useCallback(() => {
        const readSet = getReadSet();
        notifications.forEach(n => readSet.add(n.id));
        try {
            localStorage.setItem(`hirush_read_notifs_${user.id}`, JSON.stringify(Array.from(readSet)));
        } catch (e) {
            console.error("Failed to save read notifications:", e);
        }

        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    }, [user.id, notifications, getReadSet]);

    const clearAll = useCallback(() => {
        const dismissedSet = getDismissedSet();
        notifications.forEach(n => dismissedSet.add(n.id));
        try {
            localStorage.setItem(`hirush_dismissed_notifs_${user.id}`, JSON.stringify(Array.from(dismissedSet)));
        } catch (e) {
            console.error("Failed to save dismissed notifications:", e);
        }

        setNotifications([]);
        setUnreadCount(0);
    }, [user.id, notifications, getDismissedSet]);

    return {
        notifications,
        unreadCount,
        markAsRead,
        dismissNotification,
        markAllAsRead,
        clearAll
    };
};
