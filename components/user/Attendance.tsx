/**
 * @file Attendance.tsx
 * @description React component for rendering Attendance UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AttendanceRecord, Session, Holiday, LeaveRequest, LeaveStatus, LeaveType, BiometricSettings, BiometricDevice } from '../../types';
import { toast } from 'react-hot-toast';
import { db } from '../../firebase';
import { doc, updateDoc, addDoc, collection, getDoc, getDocs, query, orderBy } from 'firebase/firestore';

import { fetchAttendance as fetchAttendanceData, invalidateCache, fetchLeaveRequests } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { registerDeviceBiometrics, verifyBiometricPresence, getLocalDeviceId } from '../../utils/biometricService';
import { getTodayWFHStatus } from '../../utils/wfhHelper';

import { calculateTotalHours, calculateDistance, getLocalDateString, getActualLeaveDaysDeducted, getLeaveDays } from './attendance/utils';
import AttendanceCheckIn from './attendance/AttendanceCheckIn';
import LeaveQuotaTracker from './attendance/LeaveQuotaTracker';
import AttendanceTimeline from './attendance/AttendanceTimeline';
import AttendanceDetailModal from './attendance/AttendanceDetailModal';

const Attendance: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const [processingAction, setProcessingAction] = useState<'checkin' | 'checkout' | null>(null);
  const [biometricSettings, setBiometricSettings] = useState<BiometricSettings>({ enabled: true, autoApproveFirstDevice: false });
  const [registeringBiometric, setRegisteringBiometric] = useState(false);

  // Calendar & Stats State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [selectedDay, setSelectedDay] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const leaves = await fetchLeaveRequests({ userId: user.id });
        setLeaveRequests(leaves);

        // Fetch holidays
        const holidaysSnapshot = await getDocs(collection(db, 'holidays'));
        const hData = holidaysSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Holiday));
        setHolidays(hData);

        // Fetch Biometric Settings
        const settingsRef = doc(db, 'settings', 'general');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists() && settingsSnap.data().biometricSettings) {
          setBiometricSettings(settingsSnap.data().biometricSettings);
        }
      } catch (error) {
        console.error("Error fetching data in Attendance:", error);
      }
    };
    fetchData();
  }, [user?.id]);

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

  const todayWFH = useMemo(() => {
    const todayStr = getLocalDateString();
    const todayReq = leaveRequests.find(r => 
      r.leaveType === LeaveType.WFH &&
      r.startDate && r.endDate &&
      todayStr >= r.startDate && todayStr <= r.endDate &&
      (r.status === LeaveStatus.APPROVED || r.status === LeaveStatus.PENDING)
    );
    if (!todayReq) return null;
    return {
      status: todayReq.status === LeaveStatus.APPROVED ? ('approved' as const) : ('pending' as const),
      request: todayReq
    };
  }, [leaveRequests]);

  const calendarData = useMemo(() => {
    const data: any = {};
    const todayStr = getLocalDateString();

    attendanceHistory.forEach(record => {
      if (!record.date || typeof record.date !== 'string') return;
      const dateKey = record.date.trim();
      // For today, force calculation to include the active session. For other days, prioritize stored totalHours.
      const recTotalHours = (dateKey === todayStr) 
        ? calculateTotalHours(record.date, record.sessions) 
        : (record.totalHours || calculateTotalHours(record.date, record.sessions));
      
      if (data[dateKey] && data[dateKey].status === 'present') {
        data[dateKey].hours = (data[dateKey].hours || 0) + recTotalHours;
        data[dateKey].isWFH = data[dateKey].isWFH || !!record.isWFH;
      } else {
        data[dateKey] = { status: 'present', hours: recTotalHours, isWFH: !!record.isWFH };
      }
    });

    leaveRequests.filter(req => req.status === LeaveStatus.APPROVED).forEach(req => {
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);
      const d = new Date(start);
      while (d <= end) {
        const dateStr = getLocalDateString(d);
        
        // Check if there is already active work/attendance logged on this day
        const hasAttendance = data[dateStr] && data[dateStr].status === 'present' && (data[dateStr].hours > 0);
        
        if (!hasAttendance) {
          data[dateStr] = { 
            status: req.leaveType === 'WFH' ? 'present' : 'leave', 
            leaveType: req.leaveType,
            isWFH: req.leaveType === 'WFH',
            duration: req.duration || 'Full Day',
            halfDayType: req.halfDayType || null,
            hours: data[dateStr]?.hours // Keep hours if they worked anyway
          };
        } else {
          // If they worked on leave, keep present status but record the leave details for the UI details modal
          data[dateStr].leaveType = req.leaveType;
          data[dateStr].onLeaveButWorked = true;
          data[dateStr].leaveDuration = req.duration || 'Full Day';
          data[dateStr].leaveHalfDayType = req.halfDayType || null;
        }
        d.setDate(d.getDate() + 1);
      }
    });

    // 3. Process unexcused absences (Absent without applying for leave -> Casual Leave Auto)
    if (user?.joiningDate) {
      const start = new Date(user.joiningDate);
      const today = new Date();
      today.setHours(0,0,0,0);
      const end = new Date(today);
      end.setDate(end.getDate() - 1); // Yesterday

      if (start <= end) {
        const d = new Date(start);
        while (d <= end) {
          const dateStr = getLocalDateString(d);
          const dayOfWeek = d.getDay();
          const isWeekend = dayOfWeek === 0;
          const isHoliday = holidays.some(h => h.date === dateStr);

          if (!isWeekend && !isHoliday) {
            const hasWorked = data[dateStr] && data[dateStr].status === 'present' && (data[dateStr].hours > 0);
            
            // Check if covered by an approved or pending leave request
            const hasAppliedLeave = leaveRequests.some(req => {
              if (req.status === LeaveStatus.REJECTED) return false;
              return dateStr >= req.startDate && dateStr <= req.endDate;
            });

            if (!hasWorked && !hasAppliedLeave) {
              data[dateStr] = {
                status: 'leave',
                leaveType: 'Unpaid (Auto)',
                isWFH: false,
                duration: 'Full Day',
                halfDayType: null,
                hours: 0
              };
            }
          }
          d.setDate(d.getDate() + 1);
        }
      }
    }

    return data;
  }, [attendanceHistory, leaveRequests, holidays, user?.joiningDate]);

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const stats = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let presentDays = 0, absentDays = 0, leaveDays = 0, totalHours = 0, otHours = 0, fullDays = 0, halfDays = 0, workingDaysCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0;
      const isHoliday = holidays.find(h => h.date === dateStr);

      if (!isWeekend && !isHoliday) {
        workingDaysCount++;
        const statusData = calendarData[dateStr];
        if (statusData?.status === 'present') {
          const dailyHours = statusData.hours || 0;
          totalHours += dailyHours;
          presentDays += 1; // Absolute count of days worked

          if (dailyHours >= 7) {
            fullDays += 1;
            if (dailyHours > 7) otHours += (dailyHours - 7);
          } else if (dailyHours >= 4) {
            halfDays += 1;
          }
        } else if (statusData?.status === 'leave') {
          leaveDays++;
        } else if (date < today) {
          const isBeforeJoining = user?.joiningDate && dateStr < user.joiningDate;
          if (!isBeforeJoining) {
            absentDays++;
          }
        }
      } else if (isHoliday) {
        const statusData = calendarData[dateStr];
        if (statusData?.status === 'present') {
          const dailyHours = statusData.hours || 0;
          totalHours += dailyHours;
          presentDays += 1;
          // Even on holiday, if they work, count it
        } else if (statusData?.status === 'leave') {
          // Leave on holiday? Skip
        }
      }
    }
    return { presentDays, absentDays, leaveDays, totalHours, otHours, fullDays, halfDays, workingDaysCount };
  }, [calendarData, currentDate, user?.joiningDate, holidays]);

  const leaveQuotaStats = useMemo(() => {
    const totalQuota = 2.5;
    
    const now = new Date();
    const currentMonthStr = now.toISOString().substring(0, 7); // YYYY-MM
    
    // Strictly filter by current month
    const monthLeaves = leaveRequests.filter(l => l.startDate && typeof l.startDate === 'string' && l.startDate.startsWith(currentMonthStr));
    const monthAttendance = attendanceHistory.filter(a => a.date && typeof a.date === 'string' && a.date.startsWith(currentMonthStr));

    const approvedLeaves = monthLeaves.filter(l => l.status === LeaveStatus.APPROVED && l.leaveType !== 'WFH' && l.leaveType !== 'Unpaid');
    const approvedDaysDeducted = approvedLeaves.reduce((sum, l) => sum + getActualLeaveDaysDeducted(l, monthAttendance, holidays), 0);
    
    // Count unapplied absent days to treat as Unpaid Leave (for current month only)
    let unappliedAbsentDays = 0;
    if (user?.joiningDate) {
      const joining = new Date(user.joiningDate);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const start = joining > startOfMonth ? joining : startOfMonth;
      const today = new Date();
      today.setHours(0,0,0,0);
      const end = new Date(today);
      end.setDate(end.getDate() - 1); // Yesterday

      if (start <= end) {
        const d = new Date(start);
        while (d <= end) {
          const dateStr = getLocalDateString(d);
          const dayOfWeek = d.getDay();
          const isWeekend = dayOfWeek === 0;
          const isHoliday = holidays.some(h => h.date === dateStr);

          if (!isWeekend && !isHoliday) {
            const hasWorked = monthAttendance.some(a => a.date === dateStr && a.totalHours > 0);
            const hasAppliedLeave = monthLeaves.some(l => 
              (l.status === LeaveStatus.APPROVED || l.status === LeaveStatus.PENDING) && 
              dateStr >= l.startDate && dateStr <= l.endDate
            );

            if (!hasWorked && !hasAppliedLeave) {
              unappliedAbsentDays++;
            }
          }
          d.setDate(d.getDate() + 1);
        }
      }
    }

    const approvedDays = approvedDaysDeducted;
    
    const pendingLeaves = monthLeaves.filter(l => l.status === LeaveStatus.PENDING && l.leaveType !== 'WFH' && l.leaveType !== 'Unpaid');
    const pendingDays = pendingLeaves.reduce((sum, l) => sum + getLeaveDays(l), 0);
    
    const monthlyBalance = Math.max(0, parseFloat((totalQuota - approvedDays).toFixed(1)));
    
    const usedPercentage = Math.min(100, Math.round((approvedDays / totalQuota) * 100));
    const pendingPercentage = Math.min(100 - usedPercentage, Math.round((pendingDays / totalQuota) * 100));
    const balancePercentage = Math.max(0, 100 - usedPercentage - pendingPercentage);
    
    return {
      totalQuota,
      approvedDays,
      pendingDays,
      monthlyBalance,
      usedPercentage,
      pendingPercentage,
      balancePercentage,
    };
  }, [leaveRequests, attendanceHistory, user?.joiningDate, holidays]);

  const getTodayDateString = () => getLocalDateString();

  const loadAttendance = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Use optimized fetch with user filter
      const history = await fetchAttendanceData({ userId: user.id });
      setAttendanceHistory(history);

      // Fetch holidays
      const holidaysRef = collection(db, 'holidays');
      const q = query(holidaysRef, orderBy('date', 'asc'));
      const snapshot = await getDocs(q);
      const holidaysData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Holiday));
      setHolidays(holidaysData);

    } catch (error) {

      console.error("Error fetching attendance: ", error);
      toast.error("Could not fetch attendance history.");
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const findTodayRecord = useCallback(() => {
    const todayStr = getTodayDateString();
    
    // Find ALL records for today to find an active session anywhere
    const todayRecords = attendanceHistory.filter(rec => rec.date === todayStr);
    
    // Priority 1: Record with an active session
    const recordWithActive = todayRecords.find(rec => rec.sessions.some(s => !s.checkOut));
    
    // Priority 2: Most recent record
    const bestRecord = recordWithActive || (todayRecords.length > 0 ? todayRecords[todayRecords.length - 1] : null);
    
    setTodayRecord(bestRecord);
    const currentActiveSession = bestRecord?.sessions.find(s => s.checkOut === null) || null;
    setActiveSession(currentActiveSession);
  }, [attendanceHistory]);

  useEffect(() => {
    findTodayRecord();
  }, [attendanceHistory, findTodayRecord]);

  // Auto-close stale sessions from previous days AND today if past 11:50 PM
  useEffect(() => {
    const checkAndFix = async () => {
      if (attendanceHistory.length === 0) return;

      const todayStr = getTodayDateString();
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const isPast1150PM = currentHour > 23 || (currentHour === 23 && currentMinute >= 50); // 23:50 is 11:50 PM

      const staleRecords = attendanceHistory.filter(rec => {
        // Condition 1: Record is from a previous day AND has open sessions
        const isPreviousDayStale = rec.date !== todayStr && rec.sessions.some(s => !s.checkOut);

        // Condition 2: Record is from TODAY, it is past 11:50 PM, AND has open sessions
        const isTodayStale = rec.date === todayStr && isPast1150PM && rec.sessions.some(s => !s.checkOut);

        return isPreviousDayStale || isTodayStale;
      });

      if (staleRecords.length === 0) return;

      let updatesMade = false;
      for (const record of staleRecords) {
        let dailyTotalHours = 0;
        const updatedSessions = record.sessions.map(s => {
          if (!s.checkOut) {
            // Stale session found (forgot to checkout)
            // Rule: Auto-checkout at 11:50 PM (23:50:00)
            // Hours: Actual time from Check-In to 11:50 PM, capped at 4 hours max.

            const checkInDate = new Date(`${record.date}T${s.checkIn}`);
            const autoCheckOutDate = new Date(`${record.date}T23:50:00`);

            let diffMs = autoCheckOutDate.getTime() - checkInDate.getTime();
            if (diffMs < 0) diffMs = 0; // Safety if check-in was after 11:50 PM

            const actualHours = diffMs / (1000 * 60 * 60);
            const creditedHours = Math.min(actualHours, 4);

            dailyTotalHours += creditedHours;
            return { ...s, checkOut: '23:50:00', autoCheckedOut: true };
          } else {
            // Existing completed session
            const start = new Date(`${record.date}T${s.checkIn}`);
            const end = new Date(`${record.date}T${s.checkOut}`);
            let diffMs = end.getTime() - start.getTime();
            if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
            let hours = diffMs / (1000 * 60 * 60);

            const isAuto = !(s as any).isManuallyEdited && ((s as any).autoCheckedOut === true || ((s as any).autoCheckedOut !== false && (s.checkOut === '23:50:00' || s.checkOut === '22:20:00'))) && (s.checkOut === '23:50:00' || s.checkOut === '22:20:00');
            if (isAuto) {
              hours = Math.min(hours, 4.0);
            }
            dailyTotalHours += hours;
            return s;
          }
        });

        try {
          const recordRef = doc(db, 'attendance', record.id);
          await updateDoc(recordRef, {
            sessions: updatedSessions,
            totalHours: parseFloat(dailyTotalHours.toFixed(2))
          });
          updatesMade = true;
        } catch (err) {
          console.error("Error auto-closing session:", err);
        }
      }

      if (updatesMade) {
        toast('Open sessions were auto-closed (Max: 4 hours).', { icon: 'ℹ️' });
        // Reload to show correct data
        loadAttendance();
      }
    };

    checkAndFix();
  }, [attendanceHistory, loadAttendance]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const validateLocation = async (): Promise<{
    valid: boolean;
    isWFH: boolean;
    wfhStatus?: 'approved' | 'pending';
    coords?: { latitude: number; longitude: number; accuracy?: number };
  }> => {
    try {
      const todayStr = getTodayDateString();
      const settingsRef = doc(db, 'settings', 'general');
      const settingsSnap = await getDoc(settingsRef);

      if (!settingsSnap.exists()) return { valid: true, isWFH: false };

      const data = settingsSnap.data();
      const officeLoc = data.officeLocation;

      if (!officeLoc || !officeLoc.enabled) return { valid: true, isWFH: false };

      // Check if user's department is in the bypass list
      if (user && officeLoc.bypassDepartments && user.department && officeLoc.bypassDepartments.includes(user.department)) {
        return { valid: true, isWFH: false };
      }

      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          toast.error("Geolocation is required for attendance.");
          resolve({ valid: false, isWFH: false });
          return;
        }

        toast.loading("Verifying location...", { id: 'loc-check' });

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            const userAccuracy = position.coords.accuracy;
            const dist = calculateDistance(
              userLat,
              userLng,
              officeLoc.latitude,
              officeLoc.longitude
            );

            toast.dismiss('loc-check');

            if (dist <= officeLoc.radius) {
              resolve({
                valid: true,
                isWFH: false,
                coords: { latitude: userLat, longitude: userLng, accuracy: userAccuracy }
              });
            } else {
              // Outside office: Check if user has applied for WFH today
              if (!user?.id) {
                toast.error("User identity missing.");
                resolve({ valid: false, isWFH: false });
                return;
              }

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
          (error) => {
            toast.dismiss('loc-check');
            console.error("Location error:", error);
            let msg = "Could not get your location.";
            if (error.code === 1) msg = "Location permission denied.";
            else if (error.code === 2) msg = "Location unavailable.";
            else if (error.code === 3) msg = "Location request timed out.";

            toast.error(msg);
            resolve({ valid: false, isWFH: false });
          },
          { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
        );
      });
    } catch (error) {
      console.error("Error validating location:", error);
      return { valid: true, isWFH: false }; // Fail safe
    }
  };

  const handleRegisterSlot = async (slotIndex: number, slotLabel: string) => {
    if (!user) return;
    setRegisteringBiometric(true);
    try {
      const existingDevices = user.biometricDevices || (user.biometricDevice ? [user.biometricDevice] : []);

      toast.loading(`Touch your phone's sensor to register ${slotLabel}...`, { id: 'bio-reg' });
      const res = await registerDeviceBiometrics(user, biometricSettings.autoApproveFirstDevice, slotLabel, slotIndex);
      toast.dismiss('bio-reg');

      if (!res.success || !res.device) {
        toast.error(res.error || "Failed to register fingerprint.");
        return;
      }

      // Filter out any previous registration for this slotIndex
      const filtered = existingDevices.filter(d => 
        (d.slotIndex ? d.slotIndex !== slotIndex : d.slotLabel !== slotLabel)
      );

      const updatedDevices = [...filtered, res.device].sort((a, b) => (a.slotIndex || 1) - (b.slotIndex || 1));
      const cleanDevices: BiometricDevice[] = JSON.parse(JSON.stringify(updatedDevices));

      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { 
        biometricDevice: cleanDevices[0],
        biometricDevices: cleanDevices
      });
      updateUser({ 
        ...user, 
        biometricDevice: cleanDevices[0],
        biometricDevices: cleanDevices
      });

      if (biometricSettings.autoApproveFirstDevice && existingDevices.length === 0) {
        toast.success(`${slotLabel} registered and approved! You can now mark attendance.`);
      } else {
        toast.success(`${slotLabel} registered! Waiting for Admin/HR approval.`);
      }
    } catch (err: any) {
      console.error("Error registering biometric:", err);
      toast.error(err.message || "Failed to register device.");
    } finally {
      setRegisteringBiometric(false);
    }
  };

  const handleRegisterBiometric = (slotType: 'primary' | 'backup' = 'primary') => {
    if (slotType === 'primary') {
      handleRegisterSlot(1, 'Finger 1 (Thumb)');
    } else {
      handleRegisterSlot(2, 'Finger 2 (Index Finger)');
    }
  };

  const verifyBiometricForAttendance = async (): Promise<boolean> => {
    const isBioActive = biometricSettings.enabled && biometricSettings.verificationMode !== 'location_only';
    if (!isBioActive) return true; // Biometric requirement disabled or in 'Only Location' mode

    // Check if employee is exempted by Admin/HR
    if (user?.biometricExempt) return true;
    try {
      if (user?.id) {
        const uSnap = await getDoc(doc(db, 'users', user.id));
        if (uSnap.exists() && uSnap.data().biometricExempt) {
          return true; // Fresh exemption detected
        }
      }
    } catch (e) {
      console.warn("Failed checking user exemption:", e);
    }

    const devices = user?.biometricDevices || (user?.biometricDevice ? [user.biometricDevice] : []);
    if (devices.length === 0) {
      toast.error("Phone biometric not registered. Please tap 'Register My Thumb' above.", { duration: 5000 });
      return false;
    }

    const approvedDevices = devices.filter(d => d.status === 'approved');
    if (approvedDevices.length === 0) {
      toast.error("Your registered device is pending Admin/HR approval. Please contact Admin/HR.", { duration: 5000 });
      return false;
    }

    const currentDeviceId = getLocalDeviceId();
    const matchingDevice = approvedDevices.find(d => d.deviceId === currentDeviceId);
    if (!matchingDevice) {
      toast.error(`Unauthorized Device: Attendance must be marked from your approved phone (${approvedDevices[0].deviceName}).`, { duration: 6000 });
      return false;
    }

    const approvedCredIds = approvedDevices.map(d => d.credentialId);

    toast.loading("Touch your fingerprint sensor...", { id: 'bio-check' });
    const bioResult = await verifyBiometricPresence(approvedCredIds);
    toast.dismiss('bio-check');

    if (!bioResult.success) {
      toast.error(bioResult.error || "Biometric verification failed.");
      return false;
    }

    return true;
  };

  const handleCheckIn = async () => {
    if (!user) return;
    if (activeSession || processingAction) {
      if (activeSession) toast.error("You already have an active session.");
      return;
    }

    setProcessingAction('checkin');

    try {
      // Validate Location
      const locResult = await validateLocation();
      if (!locResult.valid) return;

      // Validate Biometric & Device Binding
      const isBiometricValid = await verifyBiometricForAttendance();
      if (!isBiometricValid) return;

      const now = new Date();
      const nowStr = now.toLocaleTimeString('en-GB');
      const todayStr = getTodayDateString();

      const isBioActive = biometricSettings.enabled && biometricSettings.verificationMode !== 'location_only';

      const newSession: Session = {
        id: `s${Date.now()}`,
        checkIn: nowStr,
        checkOut: null,
        biometricVerified: isBioActive,
        deviceId: getLocalDeviceId(),
        isWFH: locResult.isWFH,
        ...(locResult.wfhStatus ? { wfhStatus: locResult.wfhStatus } : {}),
        ...(locResult.coords ? { location: locResult.coords } : {})
      };

      if (todayRecord) {
        const updatedSessions = [...todayRecord.sessions, newSession];
        const recordRef = doc(db, 'attendance', todayRecord.id);
        const updates: Partial<AttendanceRecord> = { sessions: updatedSessions };
        if (locResult.isWFH) {
          updates.isWFH = true;
          if (locResult.wfhStatus) updates.wfhStatus = locResult.wfhStatus;
        }
        await updateDoc(recordRef, updates);
        setTodayRecord(prev => prev ? { ...prev, ...updates } : prev);
      } else {
        const newRecordData = {
          userId: user.id,
          date: todayStr,
          sessions: [newSession],
          totalHours: 0,
          isWFH: locResult.isWFH || false,
          ...(locResult.wfhStatus ? { wfhStatus: locResult.wfhStatus } : {})
        };
        const docRef = await addDoc(collection(db, 'attendance'), newRecordData);
        setTodayRecord({ id: docRef.id, ...newRecordData });
      }
      invalidateCache('attendance');
      // Invalidate cache and reload
      if (locResult.isWFH && locResult.wfhStatus === 'pending') {
        toast.success("Checked in from home! (WFH Request is pending HR approval)");
      } else {
        const currentHour = new Date().getHours();
        let greeting = "Good Morning";
        if (currentHour >= 12 && currentHour < 17) {
          greeting = "Good Afternoon";
        } else if (currentHour >= 17) {
          greeting = "Good Evening";
        }
        toast.success(`${greeting}! Checked in successfully.${locResult.isWFH ? ' (WFH)' : ''}`);
      }
    } catch (error) {
      console.error("Error checking in: ", error);
      toast.error("Failed to check in.");
    } finally {
      setProcessingAction(null);
    }
  };

  const handleCheckOut = async () => {
    if ((!activeSession || !todayRecord) || processingAction) {
      if (!activeSession || !todayRecord) toast.error("You must be checked in to check out.");
      return;
    }

    setProcessingAction('checkout');

    try {
      // Validate Location
      const locResult = await validateLocation();
      if (!locResult.valid) return;

      // Validate Biometric & Device Binding
      const isBiometricValid = await verifyBiometricForAttendance();
      if (!isBiometricValid) return;

      const now = new Date();
      const nowStr = now.toLocaleTimeString('en-GB');

      const updatedSessions = todayRecord.sessions.map(s =>
        s.id === activeSession.id ? { 
          ...s, 
          checkOut: nowStr,
          ...(locResult.coords ? { checkOutLocation: locResult.coords } : {})
        } : s
      );

      const totalHours = calculateTotalHours(todayRecord.date, updatedSessions);

      const recordRef = doc(db, 'attendance', todayRecord.id);
      await updateDoc(recordRef, {
        sessions: updatedSessions,
        totalHours: totalHours
      });
      // Invalidate cache and reload
      invalidateCache('attendance');
      await loadAttendance(); // Re-fetch to get latest state
      toast.success("Checked out successfully!");
    } catch (error) {
      console.error("Error checking out: ", error);
      toast.error("Failed to check out.");
    } finally {
      setProcessingAction(null);
    }
  };

  if (loading) return <div>Loading attendance...</div>;

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden sm:overflow-x-visible">
      <AttendanceCheckIn 
        currentTime={currentTime}
        holidays={holidays}
        activeSession={activeSession}
        processingAction={processingAction}
        todayRecord={todayRecord}
        handleCheckIn={handleCheckIn}
        handleCheckOut={handleCheckOut}
        biometricStatus={biometricStatus}
        isBiometricMandatory={isBiometricMandatory}
        biometricDeviceName={user?.biometricDevice?.deviceName}
        biometricDevices={user?.biometricDevices || (user?.biometricDevice ? [user.biometricDevice] : [])}
        onRegisterSlot={handleRegisterSlot}
        registeringBiometric={registeringBiometric}
        wfhStatus={todayWFH?.status || (todayRecord?.isWFH ? (todayRecord.wfhStatus || 'approved') : null)}
      />
      <LeaveQuotaTracker leaveQuotaStats={leaveQuotaStats} />
      <AttendanceTimeline 
        stats={stats}
        currentDate={currentDate}
        handlePrevMonth={handlePrevMonth}
        handleNextMonth={handleNextMonth}
        holidays={holidays}
        calendarData={calendarData}
        attendanceHistory={attendanceHistory}
        user={user}
        setSelectedDay={setSelectedDay}
      />
      <AttendanceDetailModal 
        selectedDay={selectedDay}
        onClose={() => setSelectedDay(null)}
      />
    </div>
  );
};

export default Attendance;