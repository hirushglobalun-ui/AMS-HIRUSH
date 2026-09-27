/**
 * @file Dashboard.tsx
 * @description React component for rendering Dashboard UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */


import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import { Role, LeaveStatus, LeaveType, AttendanceRecord, User, Lead, Message } from '../../types';
import { Users, UserCheck, UserX, Briefcase, Clock, Activity, PieChart as PieChartIcon, AlertCircle, Home } from 'lucide-react';
import { query, where, getCountFromServer, collection, getDocs, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { fetchUsers, fetchAttendance, fetchLeaveRequests } from '../../services/dataService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import HomeAnnouncementsWidget from '../user/home/HomeAnnouncementsWidget';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        presentToday: 0,
        absentToday: 0,
        pendingLeaves: 0,
    });
    const [presentUsers, setPresentUsers] = useState<User[]>([]);
    const [absentUsers, setAbsentUsers] = useState<User[]>([]);
    const [activeSessionUsers, setActiveSessionUsers] = useState<Set<string>>(new Set());
    const [userAttendanceInfo, setUserAttendanceInfo] = useState<Record<string, { isWFH: boolean; wfhStatus?: 'approved' | 'pending' }>>({});
    const [userTodayLeave, setUserTodayLeave] = useState<Record<string, { leaveType: string; status: LeaveStatus }>>({});
    const [loading, setLoading] = useState(true);
    const [attendanceTrends, setAttendanceTrends] = useState<any[]>([]);
    const [leaveStats, setLeaveStats] = useState<any[]>([]);
    const [expiringDomains, setExpiringDomains] = useState<Lead[]>([]);
    const [announcements, setAnnouncements] = useState<Message[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const todayStr = new Date().toISOString().split('T')[0];
                const leavesQuery = query(collection(db, 'leaveRequests'), where('status', '==', LeaveStatus.PENDING));

                // Prepare dates for the last 7 days
                const last7Days = Array.from({ length: 7 }, (_, idx) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - idx));
                    return {
                        dateStr: d.toISOString().split('T')[0],
                        shortDate: d.toLocaleDateString('en-US', { weekday: 'short' })
                    };
                });

                const startDate = last7Days[0].dateStr;
                const endDate = last7Days[6].dateStr; // today

                // Fetch ALL dashboard data in parallel (Consolidated into 1 range query instead of 8 queries)
                const [
                    allUsers,
                    leavesSnapshot,
                    recentAttendance,
                    allLeaves,
                    leadsSnap
                ] = await Promise.all([
                    fetchUsers(),
                    getCountFromServer(leavesQuery),
                    fetchAttendance({ startDate, endDate }),
                    fetchLeaveRequests(),
                    getDocs(collection(db, 'leads'))
                ]);

                const todayAttendance = recentAttendance.filter(r => r.date === todayStr);

                const employees = allUsers.filter(u => u.status === 'Active' && u.role !== Role.ADMIN && u.role !== Role.HR);
                const pendingLeaves = leavesSnapshot.data().count;

                // Map today's leaves for all users
                const todayLeaveMap: Record<string, { leaveType: string; status: LeaveStatus }> = {};
                allLeaves.forEach(req => {
                    if (req.startDate && req.endDate && todayStr >= req.startDate && todayStr <= req.endDate) {
                        todayLeaveMap[req.userId] = {
                            leaveType: req.leaveType,
                            status: req.status
                        };
                    }
                });
                setUserTodayLeave(todayLeaveMap);

                // Get user IDs who are present and track active sessions and WFH details
                const presentUserIds = new Set<string>();
                const activeUsers = new Set<string>();
                const attInfoMap: Record<string, { isWFH: boolean; wfhStatus?: 'approved' | 'pending' }> = {};

                todayAttendance.forEach(record => {
                    presentUserIds.add(record.userId);
                    const hasActiveSession = record.sessions.some(session => !session.checkOut);
                    if (hasActiveSession) {
                        activeUsers.add(record.userId);
                    }

                    const isWFH = !!record.isWFH || record.sessions.some(s => s.isWFH);
                    let wfhStatus = record.wfhStatus || record.sessions.find(s => s.isWFH)?.wfhStatus;

                    const wfhReq = todayLeaveMap[record.userId];
                    if (wfhReq && wfhReq.leaveType === 'WFH') {
                        wfhStatus = wfhReq.status === LeaveStatus.APPROVED ? 'approved' : 'pending';
                    }

                    attInfoMap[record.userId] = {
                        isWFH: isWFH || (wfhReq?.leaveType === 'WFH'),
                        wfhStatus: wfhStatus || (isWFH ? 'approved' : undefined)
                    };
                });

                setActiveSessionUsers(activeUsers);
                setUserAttendanceInfo(attInfoMap);

                // Separate present and absent users
                const present: User[] = [];
                const absent: User[] = [];
                employees.forEach(user => {
                    if (presentUserIds.has(user.id)) {
                        present.push(user);
                    } else {
                        const hasJoined = !user.joiningDate || user.joiningDate <= todayStr;
                        if (hasJoined) {
                            absent.push(user);
                        }
                    }
                });

                const totalJoinedEmployees = employees.filter(u => !u.joiningDate || u.joiningDate <= todayStr).length;

                // 1. Leave Stats (All Time)
                let approvedLeavesCount = 0;
                let rejectedLeavesCount = 0;
                let pendingLeavesCount = 0;

                allLeaves.forEach(req => {
                    if (req.status === LeaveStatus.APPROVED) approvedLeavesCount++;
                    else if (req.status === LeaveStatus.REJECTED) rejectedLeavesCount++;
                    else if (req.status === LeaveStatus.PENDING) pendingLeavesCount++;
                });

                setLeaveStats([
                    { name: 'Approved', value: approvedLeavesCount, color: '#10b981' },
                    { name: 'Rejected', value: rejectedLeavesCount, color: '#ef4444' },
                    { name: 'Pending', value: pendingLeavesCount, color: '#f59e0b' }
                ].filter(s => s.value > 0));

                // 2. Attendance Trends (Last 7 Days)
                const trends = last7Days.map((item) => {
                    const dayAttendance = recentAttendance.filter(a => a.date === item.dateStr);
                    const dayPresent = new Set(dayAttendance.map(a => a.userId)).size;
                    const dayAbsent = Math.max(0, totalJoinedEmployees - dayPresent);
                    return {
                        name: item.shortDate,
                        Present: dayPresent,
                        Absent: dayAbsent
                    };
                });
                setAttendanceTrends(trends);

                setPresentUsers(present);
                setAbsentUsers(absent);
                setStats({
                    totalEmployees: totalJoinedEmployees,
                    presentToday: present.length,
                    absentToday: absent.length,
                    pendingLeaves
                });

                // Fetch Expiring Leads
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

            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            }
            setLoading(false);
        };
        fetchStats();
    }, []);

    useEffect(() => {
        const msgsRef = collection(db, 'messages');
        const qMsg = query(msgsRef, orderBy('timestamp', 'desc'), limit(50));

        const unsubscribe = onSnapshot(qMsg, (snapshot) => {
            const msgs: Message[] = [];
            snapshot.forEach(d => {
                const m = { id: d.id, ...d.data() } as Message;
                if (m.recipient === 'all' || m.recipient === 'Admin') {
                    msgs.push(m);
                }
            });
            setAnnouncements(msgs);
        }, (error) => {
            console.error("Error listening to announcements:", error);
        });

        return () => unsubscribe();
    }, []);

    const renderValue = (value: number) => loading ? '...' : value;

    return (
        <div className="space-y-4 sm:space-y-6">
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

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Admin Dashboard</h1>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                <StatCard title="Total Employees" value={renderValue(stats.totalEmployees)} icon={<Users size={24} className="text-blue-500" />} iconBg="bg-blue-100" />
                <StatCard title="Present Today" value={renderValue(stats.presentToday)} icon={<UserCheck size={24} className="text-green-500" />} iconBg="bg-green-100" />
                <StatCard title="Absent Today" value={renderValue(stats.absentToday)} icon={<UserX size={24} className="text-red-500" />} iconBg="bg-red-100" />
                <StatCard title="Pending Leaves" value={renderValue(stats.pendingLeaves)} icon={<Briefcase size={24} className="text-yellow-500" />} iconBg="bg-yellow-100" />
            </div>

            {/* Attendance Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Present Today */}
                <Card>
                    <div className="flex items-center mb-4">
                        <div className="p-3 rounded-full bg-green-100 mr-3">
                            <UserCheck size={24} className="text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Present Today</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{stats.presentToday} employee{stats.presentToday !== 1 ? 's' : ''} checked in</p>
                        </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {loading ? (
                            <p className="text-center text-slate-500 dark:text-slate-400 py-4">Loading...</p>
                        ) : presentUsers.length > 0 ? (
                            <div className="space-y-2">
                                {presentUsers.map(user => {
                                    const isActive = activeSessionUsers.has(user.id);
                                    const attInfo = userAttendanceInfo[user.id];
                                    const isWFH = attInfo?.isWFH;
                                    const wfhStatus = attInfo?.wfhStatus;

                                    const rowClass = isWFH
                                        ? (wfhStatus === 'pending'
                                            ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                                            : 'bg-blue-50/80 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800')
                                        : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800';

                                    const avatarClass = isWFH
                                        ? (wfhStatus === 'pending'
                                            ? 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200'
                                            : 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200')
                                        : 'bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-200';

                                    return (
                                        <div key={user.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-lg border ${rowClass}`}>
                                            <div className="flex items-center min-w-0">
                                                {user.profilePhoto ? (
                                                    <img src={user.profilePhoto} alt={user.name} className="w-10 h-10 rounded-full mr-3 object-cover flex-shrink-0" />
                                                ) : (
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${avatarClass}`}>
                                                        <span className="font-semibold">{user.name.charAt(0).toUpperCase()}</span>
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{user.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.employeeId} • {user.department || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
                                                {isActive ? (
                                                    isWFH ? (
                                                        wfhStatus === 'pending' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-full text-xs font-bold border border-amber-300 dark:border-amber-700 animate-pulse">
                                                                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                                                                <Home size={12} />
                                                                WFH (Pending)
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-full text-xs font-bold border border-blue-300 dark:border-blue-700">
                                                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                                                <Home size={12} />
                                                                WFH Active
                                                            </span>
                                                        )
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 rounded-full text-xs font-bold border border-green-300 dark:border-green-700">
                                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                            Active Now
                                                        </span>
                                                    )
                                                ) : (
                                                    isWFH ? (
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                            wfhStatus === 'pending'
                                                                ? 'bg-amber-100/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                                                : 'bg-blue-100/70 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                                                        }`}>
                                                            <Clock size={12} />
                                                            Checked Out {wfhStatus === 'pending' ? '(WFH Pending)' : '(WFH)'}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                                                            <Clock size={12} />
                                                            Checked Out
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-center text-slate-500 dark:text-slate-400 py-8">No employees present yet today</p>
                        )}
                    </div>
                </Card>

                {/* Absent Today */}
                <Card>
                    <div className="flex items-center mb-4">
                        <div className="p-3 rounded-full bg-red-100 mr-3">
                            <UserX size={24} className="text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Absent Today</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{stats.absentToday} employee{stats.absentToday !== 1 ? 's' : ''} not checked in</p>
                        </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {loading ? (
                            <p className="text-center text-slate-500 dark:text-slate-400 py-4">Loading...</p>
                        ) : absentUsers.length > 0 ? (
                            <div className="space-y-2">
                                {absentUsers.map(user => {
                                    const todayLeave = userTodayLeave[user.id];
                                    const isWFHLeave = todayLeave?.leaveType === 'WFH';

                                    return (
                                        <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                                            <div className="flex items-center min-w-0">
                                                {user.profilePhoto ? (
                                                    <img src={user.profilePhoto} alt={user.name} className="w-10 h-10 rounded-full mr-3 object-cover flex-shrink-0" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-red-200 dark:bg-red-800 flex items-center justify-center mr-3 flex-shrink-0">
                                                        <span className="text-red-700 dark:text-red-200 font-semibold">{user.name.charAt(0).toUpperCase()}</span>
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{user.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.employeeId} • {user.department || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="self-start sm:self-auto flex-shrink-0">
                                                {isWFHLeave ? (
                                                todayLeave.status === LeaveStatus.APPROVED ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold border border-blue-200 dark:border-blue-800">
                                                        <Home size={12} /> WFH (Not Checked In)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-full text-xs font-semibold border border-amber-200 dark:border-amber-800">
                                                        <Home size={12} /> WFH Pending (Not Checked In)
                                                    </span>
                                                )
                                            ) : todayLeave ? (
                                                <span className="text-xs font-semibold px-2.5 py-1 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-800">
                                                    On Leave ({todayLeave.leaveType})
                                                </span>
                                            ) : (
                                                <span className="text-xs font-medium text-red-600 dark:text-red-400 px-2.5 py-1 bg-red-100 dark:bg-red-950/60 rounded-full">
                                                    Absent
                                                </span>
                                            )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-center text-slate-500 dark:text-slate-400 py-8">All employees are present!</p>
                        )}
                    </div>
                </Card>
            </div>

            {/* CRM Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6">
                {/* Attendance Trends Chart */}
                <Card className="flex flex-col">
                    <div className="flex items-center mb-6">
                        <div className="p-3 rounded-full bg-indigo-100 mr-3">
                            <Activity size={24} className="text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Attendance Trends</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Last 7 Days</p>
                        </div>
                    </div>
                    <div className="flex-grow w-full h-[300px]">
                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center bg-slate-50/50 rounded-xl animate-pulse">
                                <span className="text-slate-400 font-medium">Loading trends...</span>
                            </div>
                        ) : attendanceTrends.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={attendanceTrends}
                                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <RechartsTooltip 
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="Present" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} barSize={32} />
                                    <Bar dataKey="Absent" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">No trend data available</div>
                        )}
                    </div>
                </Card>

                {/* Leave Approval Rate Chart */}
                <Card className="flex flex-col">
                    <div className="flex items-center mb-6">
                        <div className="p-3 rounded-full bg-purple-100 mr-3">
                            <PieChartIcon size={24} className="text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Leave Requests Status</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">All-time distribution</p>
                        </div>
                    </div>
                    <div className="flex-grow w-full h-[300px]">
                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center bg-slate-50/50 rounded-xl animate-pulse">
                                <span className="text-slate-400 font-medium">Loading distribution...</span>
                            </div>
                        ) : leaveStats.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={leaveStats}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {leaveStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">No leave data available</div>
                        )}
                    </div>
                </Card>
            </div>
            <HomeAnnouncementsWidget announcements={announcements} />
        </div>
    );
};

interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    iconBg: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, iconBg }) => (
    <Card className="flex items-center p-3 sm:p-4">
        <div className={`p-2 sm:p-3 md:p-4 rounded-full mr-3 sm:mr-4 ${iconBg}`}>
            {icon}
        </div>
        <div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        </div>
    </Card>
);

export default Dashboard;
