/**
 * @file UserHome.tsx
 * @description React component for rendering UserHome UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, AttendanceRecord, Session, Message, Lead, BiometricSettings } from '../../types';
import { fetchAttendance as fetchAttendanceData, fetchUsers, invalidateCache } from '../../services/dataService';
import { db } from '../../firebase';
import {
    doc,
    updateDoc,
    addDoc,
    collection,
    getDocs,
    query,
    orderBy,
    getDoc,
    serverTimestamp,
    limit,
    onSnapshot,
    where
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { Download, AlertCircle } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useAuth } from '../../contexts/AuthContext';
import { verifyBiometricPresence, getLocalDeviceId } from '../../utils/biometricService';
import { getTodayWFHStatus } from '../../utils/wfhHelper';

import HomeAttendanceWidget from './home/HomeAttendanceWidget';
import HomeCelebrationsWidget from './home/HomeCelebrationsWidget';
import HomeAnnouncementsWidget from './home/HomeAnnouncementsWidget';
import { calculateDistance, calculateTotalHours, getLocalDateString } from './attendance/utils';

const UserHome: React.FC = () => {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
    const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
    const [activeSession, setActiveSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [processingAction, setProcessingAction] = useState<string | null>(null);
    const [announcements, setAnnouncements] = useState<Message[]>([]);
    const [biometricSettings, setBiometricSettings] = useState<BiometricSettings>({
        enabled: true,
        verificationMode: 'location_and_biometric',
        autoApproveFirstDevice: false
    });
    const [birthdays, setBirthdays] = useState<{ user: User, dateStr: string, isToday: boolean }[]>([]);
    const [workAnniversaries, setWorkAnniversaries] = useState<{ user: User, years: number, dateStr: string, isToday: boolean }[]>([]);
    const [wishedUsers, setWishedUsers] = useState<Set<string>>(new Set());
    const [expiringDomains, setExpiringDomains] = useState<Lead[]>([]);

    // Import PWA hook to handle installation universally, including safari fallback
    const { isInstalled, installApp } = usePWAInstall();

    const handleSendWish = async (targetUser: User, type: 'birthday' | 'anniversary', years?: number) => {
        if (!user) return;
        try {
            const title = type === 'birthday' ? `Happy Birthday, ${targetUser.name}! 🎂` : `Happy Work Anniversary, ${targetUser.name}! 🎉`;
            const content = type === 'birthday'
                ? `Wishing you a fantastic birthday filled with joy and success! \n\nBest wishes,\n${user.name}`
                : `Congratulations on completing ${years} year${years !== 1 ? 's' : ''} with us! Here's to many more successful years. \n\nBest regards,\n${user.name}`;

            await addDoc(collection(db, 'messages'), {
                title,
                content,
                recipient: [targetUser.id],
                senderId: user.id,
                senderName: user.name,
                timestamp: serverTimestamp(),
                type: 'wish'
            });

            toast.success(`Wish sent to ${targetUser.name}!`);
            setWishedUsers(prev => new Set(prev).add(targetUser.id + type));
        } catch (error) {
            console.error("Error sending wish:", error);
            toast.error("Failed to send wish.");
        }
    };

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            try {
                const isUserAdminOrHR = user.role === 'Admin' || user.role === 'HR';
                const isUserSales = user.department && user.department.toLowerCase() === 'sales';

                // Fetch Users, Settings, and Leads in parallel
                const leadsPromise = (isUserAdminOrHR || isUserSales)
                    ? getDocs(!isUserAdminOrHR && isUserSales ? query(collection(db, 'leads'), where('assignedTo', '==', user.id)) : collection(db, 'leads'))
                    : Promise.resolve(null);

                const [allUsers, settingsSnap, leadsSnap] = await Promise.all([
                    fetchUsers(),
                    getDoc(doc(db, 'settings', 'general')),
                    leadsPromise
                ]);

                const today = new Date();
                const currentMonth = today.getMonth(); // 0-11
                const currentDay = today.getDate();

                // Helper to check if date is upcoming (within next 3 days)
                const isUpcoming = (dateStr?: string) => {
                    if (!dateStr) return null;
                    const d = new Date(dateStr);
                    const m = d.getMonth();
                    const day = d.getDate();

                    const thisYearOccurrence = new Date(today.getFullYear(), m, day);
                    if (thisYearOccurrence < new Date(today.getFullYear(), currentMonth, currentDay)) {
                        thisYearOccurrence.setFullYear(today.getFullYear() + 1);
                    }

                    const diffTime = thisYearOccurrence.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays >= 0 && diffDays <= 3) {
                        return {
                            dateStr: thisYearOccurrence.toLocaleDateString('default', { month: 'short', day: 'numeric' }),
                            isToday: diffDays === 0
                        };
                    }
                    return null;
                };

                const bdays = allUsers.map(u => {
                    const status = isUpcoming(u.dob);
                    return status ? { user: u, ...status } : null;
                }).filter(Boolean) as any[];

                const workAnnis = allUsers.map(u => {
                    if (!u.joiningDate) return null;
                    const status = isUpcoming(u.joiningDate);
                    if (status) {
                        const joinYear = new Date(u.joiningDate).getFullYear();
                        const years = today.getFullYear() - joinYear;
                        if (years > 0) return { user: u, years, ...status };
                    }
                    return null;
                }).filter(Boolean) as any[];

                setBirthdays(bdays);
                setWorkAnniversaries(workAnnis);

                // Process Expiring Leads
                if (leadsSnap) {
                    const expiring: Lead[] = [];
                    const todayDate = new Date();
                    todayDate.setHours(0, 0, 0, 0);

                    leadsSnap.forEach(d => {
                        const lead = { id: d.id, ...d.data() } as Lead;
                        if (lead.expiryDate) {
                            const expiry = new Date(lead.expiryDate);
                            expiry.setHours(0, 0, 0, 0);
                            const diffTime = expiry.getTime() - todayDate.getTime();
                            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                            if (diffDays >= 0 && diffDays <= 2) {
                                expiring.push(lead);
                            }
                        }
                    });
                    setExpiringDomains(expiring);
                }

                // Process Biometric Settings
                if (settingsSnap.exists() && settingsSnap.data().biometricSettings) {
                    setBiometricSettings(settingsSnap.data().biometricSettings);
                }

            } catch (e) {
                console.error("Error fetching home data:", e);
            }
        };
        fetchData();
    }, [user]);

    // Real-time Announcements Listener (No Cache, Direct from Admin)
    useEffect(() => {
        if (!user) return;
        const msgsRef = collection(db, 'messages');
        const qMsg = query(msgsRef, orderBy('timestamp', 'desc'), limit(10));

        const unsubscribe = onSnapshot(qMsg, (snapshot) => {
            const msgs: Message[] = [];
            snapshot.forEach(d => {
                const m = { id: d.id, ...d.data() } as Message;
                // Filter for 'all' or specific to user
                if (m.recipient === 'all' ||
                    (typeof m.recipient === 'string' && m.recipient === user.role) ||
                    (Array.isArray(m.recipient) && m.recipient.includes(user.id))) {
                    msgs.push(m);
                }
            });
            setAnnouncements(msgs.slice(0, 3));
        }, (error) => {
            console.error("Error listening to announcements:", error);
        });

        return () => unsubscribe();
    }, [user?.id, user?.role]);

    // Initial Load - Fetch attendance for the user
    const loadData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const history = await fetchAttendanceData({ userId: user.id });
            setAttendanceHistory(history);
        } catch (error) {
            console.error("Error loading home attendance data", error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => { loadData(); }, [loadData]);

    // Real-time Attendance Listener for user
    useEffect(() => {
        if (!user?.id) return;
        const attRef = collection(db, 'attendance');
        const qAtt = query(attRef, where('userId', '==', user.id));

        const unsubscribe = onSnapshot(qAtt, (snapshot) => {
            const records: AttendanceRecord[] = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            } as AttendanceRecord));
            setAttendanceHistory(records);
            setLoading(false);
        }, (error) => {
            console.error("Error listening to user attendance:", error);
            loadData();
        });

        return () => unsubscribe();
    }, [user?.id, loadData]);

    // Timer
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const todayStr = getLocalDateString();
        const todayRecords = attendanceHistory.filter(r => r.date === todayStr);
        // Prioritize record with active session
        const recordWithActive = todayRecords.find(r => r.sessions && r.sessions.some(s => !s.checkOut));
        const bestRecord = recordWithActive || (todayRecords.length > 0 ? todayRecords[todayRecords.length - 1] : null);
        
        setTodayRecord(bestRecord || null);
        const currentActiveSession = recordWithActive
            ? recordWithActive.sessions.find(s => !s.checkOut) || null
            : (bestRecord?.sessions?.find(s => !s.checkOut) || null);
        setActiveSession(currentActiveSession);
    }, [attendanceHistory]);

    const isBiometricMandatory = useMemo(() => {
        if (user?.biometricExempt) return false;
        return biometricSettings.enabled && biometricSettings.verificationMode !== 'location_only';
    }, [biometricSettings.enabled, biometricSettings.verificationMode, user?.biometricExempt]);

    const biometricStatus = useMemo(() => {
        if (user?.biometricExempt) return 'exempted' as const;
        const devices = user?.biometricDevices || (user?.biometricDevice ? [user.biometricDevice] : []);
        if (devices.length === 0) return 'not_registered' as const;
        if (devices.some(d => d.status === 'approved')) return 'approved' as const;
        if (devices.some(d => d.status === 'pending_approval')) return 'pending_approval' as const;
        return 'not_registered' as const;
    }, [user?.biometricDevice, user?.biometricDevices, user?.biometricExempt]);

    // Actions
    const validateLocation = async (): Promise<{
        valid: boolean;
        isWFH: boolean;
        wfhStatus?: 'approved' | 'pending';
        coords?: { latitude: number; longitude: number; accuracy?: number };
    }> => {
        if (!user) return { valid: false, isWFH: false };
        try {
            const todayStr = getLocalDateString();
            const settingsRef = doc(db, 'settings', 'general');
            const settingsSnap = await getDoc(settingsRef);
            if (!settingsSnap.exists()) return { valid: true, isWFH: false };
            const data = settingsSnap.data();
            const officeLoc = data.officeLocation;
            if (!officeLoc || !officeLoc.enabled) return { valid: true, isWFH: false };

            // Check if user's department is in the bypass list
            if (officeLoc.bypassDepartments && user.department && officeLoc.bypassDepartments.includes(user.department)) {
                return { valid: true, isWFH: false };
            }

            if (!navigator.geolocation) {
                toast.error("Geolocation is required.");
                return { valid: false, isWFH: false };
            }

            return new Promise((resolve) => {
                toast.loading("Verifying location...", { id: 'loc-check' });
                navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                        const userLat = pos.coords.latitude;
                        const userLng = pos.coords.longitude;
                        const userAccuracy = pos.coords.accuracy;
                        const dist = calculateDistance(userLat, userLng, officeLoc.latitude, officeLoc.longitude);
                        toast.dismiss('loc-check');
                        if (dist <= officeLoc.radius) {
                            resolve({
                                valid: true,
                                isWFH: false,
                                coords: { latitude: userLat, longitude: userLng, accuracy: userAccuracy }
                            });
                        } else {
                            const wfhInfo = await getTodayWFHStatus(user.id, todayStr);
                            if (wfhInfo.hasWFH && wfhInfo.isApproved) {
                                toast.success("Location verified (Work From Home).");
                                resolve({
                                    valid: true,
                                    isWFH: true,
                                    wfhStatus: 'approved',
                                    coords: { latitude: userLat, longitude: userLng, accuracy: userAccuracy }
                                });
                            } else if (wfhInfo.hasWFH && wfhInfo.isPending) {
                                toast.success("Home location captured (WFH pending approval).");
                                resolve({
                                    valid: true,
                                    isWFH: true,
                                    wfhStatus: 'pending',
                                    coords: { latitude: userLat, longitude: userLng, accuracy: userAccuracy }
                                });
                            } else {
                                toast.error(`You are away from office (${Math.round(dist)}m). You must be at the office (or have approved WFH) to check in or out.`, { duration: 6000 });
                                resolve({ valid: false, isWFH: false });
                            }
                        }
                    },
                    (err) => {
                        toast.dismiss('loc-check');
                        toast.error("Location error: " + err.message);
                        resolve({ valid: false, isWFH: false });
                    },
                    { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
                );
            });
        } catch (e) {
            console.error(e);
            return { valid: true, isWFH: false };
        }
    };

    const verifyBiometricForAttendance = async (): Promise<boolean> => {
        // 1. Check live settings to ensure real-time enforcement
        let isBioActive = biometricSettings.enabled && biometricSettings.verificationMode !== 'location_only';
        try {
            const settingsRef = doc(db, 'settings', 'general');
            const settingsSnap = await getDoc(settingsRef);
            if (settingsSnap.exists() && settingsSnap.data().biometricSettings) {
                const liveBio = settingsSnap.data().biometricSettings;
                setBiometricSettings(liveBio);
                isBioActive = liveBio.enabled && liveBio.verificationMode !== 'location_only';
            }
        } catch (e) {
            console.error("Failed to read latest biometric setting:", e);
        }

        if (!isBioActive) return true; // Biometric requirement disabled or in 'Only Location' mode

        // Check if employee is exempted by Admin/HR
        if (user?.biometricExempt) return true;

        // 2. Fetch fresh user data to get real-time approved credentials or live exemption
        let devices = user?.biometricDevices || (user?.biometricDevice ? [user.biometricDevice] : []);
        try {
            if (user?.id) {
                const userDocSnap = await getDoc(doc(db, 'users', user.id));
                if (userDocSnap.exists()) {
                    const freshUser = userDocSnap.data();
                    if (freshUser.biometricExempt) {
                        return true; // Live exemption by Admin/HR
                    }
                    devices = freshUser.biometricDevices || (freshUser.biometricDevice ? [freshUser.biometricDevice] : []);
                }
            }
        } catch (e) {
            console.error("Failed to fetch fresh user device info:", e);
        }

        if (devices.length === 0) {
            toast.error("Phone biometric not registered. Please switch to the Attendance tab and tap 'Register My Thumb'.", { duration: 6000 });
            return false;
        }

        const approvedDevices = devices.filter(d => d.status === 'approved');
        if (approvedDevices.length === 0) {
            toast.error("Your registered device is pending Admin/HR approval. Please contact Admin/HR.", { duration: 6000 });
            return false;
        }

        const currentDeviceId = getLocalDeviceId();
        const matchingDevice = approvedDevices.find(d => d.deviceId === currentDeviceId);
        if (!matchingDevice) {
            toast.error(`Unauthorized Device: Attendance must be marked from your approved phone (${approvedDevices[0].deviceName}).`, { duration: 6000 });
            return false;
        }

        const approvedCredIds = approvedDevices.map(d => d.credentialId);

        toast.loading("Touch your phone fingerprint sensor...", { id: 'bio-check' });
        const bioResult = await verifyBiometricPresence(approvedCredIds);
        toast.dismiss('bio-check');

        if (!bioResult.success) {
            toast.error(bioResult.error || "Biometric verification failed.");
            return false;
        }

        return true;
    };

    const handleAction = async (type: 'checkin' | 'checkout') => {
        if (!user) return;
        setProcessingAction(type);
        try {
            // Validate Location for both check-in and check-out
            const locResult = await validateLocation();
            if (!locResult.valid) return;

            const isBiometricValid = await verifyBiometricForAttendance();
            if (!isBiometricValid) return;

            const nowStr = new Date().toLocaleTimeString('en-GB');
            const todayStr = getLocalDateString();
            const isBioActive = biometricSettings.enabled && biometricSettings.verificationMode !== 'location_only';

            if (type === 'checkin') {
                const newSession: Session = { 
                    id: `s${Date.now()}`, 
                    checkIn: nowStr, 
                    checkOut: null, 
                    biometricVerified: isBioActive,
                    deviceId: getLocalDeviceId() || '',
                    isWFH: locResult.isWFH,
                    ...(locResult.wfhStatus ? { wfhStatus: locResult.wfhStatus } : {}),
                    ...(locResult.coords ? { location: locResult.coords } : {})
                };
                if (todayRecord) {
                    const updates: Partial<AttendanceRecord> = { sessions: [...(todayRecord.sessions || []), newSession] };
                    if (locResult.isWFH) {
                        updates.isWFH = true;
                        if (locResult.wfhStatus) updates.wfhStatus = locResult.wfhStatus;
                    }
                    await updateDoc(doc(db, 'attendance', todayRecord.id), updates);
                    const updated = { ...todayRecord, ...updates };
                    setTodayRecord(updated);
                    setActiveSession(newSession);
                } else {
                    const newRecData = {
                        userId: user.id,
                        date: todayStr,
                        sessions: [newSession],
                        totalHours: 0,
                        isWFH: locResult.isWFH || false,
                        ...(locResult.wfhStatus ? { wfhStatus: locResult.wfhStatus } : {})
                    };
                    const docRef = await addDoc(collection(db, 'attendance'), newRecData);
                    const newRec = { id: docRef.id, ...newRecData };
                    setTodayRecord(newRec);
                    setActiveSession(newSession);
                }
                const currentHour = new Date().getHours();
                let greeting = "Good Morning";
                if (currentHour >= 12 && currentHour < 17) {
                    greeting = "Good Afternoon";
                } else if (currentHour >= 17) {
                    greeting = "Good Evening";
                }
                if (locResult.isWFH && locResult.wfhStatus === 'pending') {
                    toast.success("Checked in from home! (WFH Request is pending HR approval)");
                } else {
                    toast.success(`${greeting}! Checked in successfully.${locResult.isWFH ? ' (WFH)' : ''}`);
                }
            } else {
                if (!todayRecord || !activeSession) {
                    toast.error("You must be checked in to check out.");
                    return;
                }
                const updatedSessions = (todayRecord.sessions || []).map(s => 
                    (s.id === activeSession.id || !s.checkOut) ? { 
                        ...s, 
                        checkOut: nowStr,
                        ...(locResult.coords ? { checkOutLocation: locResult.coords } : {})
                    } : s
                );
                
                const finalTotalHours = calculateTotalHours(todayRecord.date, updatedSessions);

                await updateDoc(doc(db, 'attendance', todayRecord.id), { 
                    sessions: updatedSessions, 
                    totalHours: finalTotalHours 
                });
                const updated = { ...todayRecord, sessions: updatedSessions, totalHours: finalTotalHours };
                setTodayRecord(updated);
                setActiveSession(null);
                toast.success("Checked out successfully!");
            }
            invalidateCache('attendance');
            await loadData();
        } catch (e: any) {
            console.error("Error performing attendance action in UserHome:", e);
            toast.error(e?.message || "Action failed.");
        } finally {
            setProcessingAction(null);
        }
    };

    const getLiveTodayHours = () => {
        const todayStr = getLocalDateString();
        const todayRecords = attendanceHistory.filter(r => r.date === todayStr);
        if (todayRecords.length === 0) return 0;
        let total = 0;
        todayRecords.forEach(rec => {
            total += calculateTotalHours(rec.date, rec.sessions || []);
        });
        return total;
    };

    // Monthly Stats Calculation
    const currentMonthHistory = useMemo(() => {
        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const rawHistory = attendanceHistory.filter(rec => rec.date && typeof rec.date === 'string' && rec.date.startsWith(currentMonthStr));
        
        // Consolidate by date
        const consolidatedMap = new Map<string, AttendanceRecord>();
        rawHistory.forEach(rec => {
            const dateStr = rec.date.trim();
            // In UserHome, totalHours is calculated in the check-out action, but we calculate sessions total for robustness here too
            let sessionTotal = 0;
            if (rec.sessions) {
              rec.sessions.forEach(s => {
                if (s.checkIn && s.checkOut) {
                  const start = new Date(`${dateStr}T${s.checkIn}`);
                  const end = new Date(`${dateStr}T${s.checkOut}`);
                  sessionTotal += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                }
              });
            }
            const recTotalHours = Math.max(rec.totalHours || 0, sessionTotal);

            if (consolidatedMap.has(dateStr)) {
                const existing = consolidatedMap.get(dateStr)!;
                consolidatedMap.set(dateStr, {
                    ...existing,
                    totalHours: (existing.totalHours || 0) + recTotalHours,
                    sessions: [...(existing.sessions || []), ...(rec.sessions || [])]
                });
            } else {
                consolidatedMap.set(dateStr, { ...rec, totalHours: recTotalHours });
            }
        });
        
        return Array.from(consolidatedMap.values());
    }, [attendanceHistory]);

    const totalDaysWorked = currentMonthHistory.length;
    const monthlyTotalHours = currentMonthHistory.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
    const monthlyAvg = totalDaysWorked > 0 ? (monthlyTotalHours / totalDaysWorked).toFixed(1) : '0';
    
    let fullDaysCount = 0;
    let halfDaysCount = 0;
    currentMonthHistory.forEach(rec => {
        const hours = rec.totalHours || 0;
        if (hours >= 7) fullDaysCount++;
        else if (hours >= 4) halfDaysCount++;
    });

    if (!user) return null;

    if (loading) {
        return <div className="text-center py-10">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            {expiringDomains.length > 0 && (
                <div className="p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-2xl border border-red-200/50 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-100 text-red-600 rounded-xl flex-shrink-0">
                            <AlertCircle size={22} className="animate-bounce" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-red-900">Critical: Website Domain Expiry Alert</h4>
                            <p className="text-xs text-red-700/80 font-medium">
                                The following website domain{expiringDomains.length > 1 ? 's are' : ' is'} expiring within 2 days: 
                                <span className="font-bold ml-1">
                                    {expiringDomains.map(d => `${d.projectName} (${d.domainDetail || 'No domain'} - expires ${d.expiryDate})`).join(', ')}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Welcome Back, {user.name}!</h1>
                    {!isInstalled && (
                        <button 
                            onClick={installApp}
                            className="self-start sm:self-auto flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 animate-bounce"
                        >
                            <Download size={14} />
                            Install App
                        </button>
                    )}
                </div>
                <p className="text-slate-500 text-sm font-medium">Here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <HomeAttendanceWidget 
                    currentTime={currentTime}
                    activeSession={activeSession}
                    processingAction={processingAction}
                    handleAction={handleAction}
                    getLiveTodayHours={getLiveTodayHours}
                    monthlyAvg={monthlyAvg}
                    fullDaysCount={fullDaysCount}
                    halfDaysCount={halfDaysCount}
                    isBiometricRequired={isBiometricMandatory}
                    biometricStatus={biometricStatus}
                />

                <div className="lg:col-span-7 space-y-6">
                    <HomeCelebrationsWidget 
                        birthdays={birthdays}
                        workAnniversaries={workAnniversaries}
                        wishedUsers={wishedUsers}
                        handleSendWish={handleSendWish}
                    />
                </div>
            </div>

            <HomeAnnouncementsWidget announcements={announcements} />
        </div>
    );
};

export default UserHome;
