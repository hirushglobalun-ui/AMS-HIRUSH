/**
 * @file AttendanceTable.tsx
 * @description React component for rendering AttendanceTable UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React, { Fragment } from 'react';
import { Users, FileText, Edit, ChevronDown, Calendar, Fingerprint } from 'lucide-react';
import Card from '../../common/Card';
import { Holiday } from '../../../types';

interface AttendanceTableProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filterDate: string;
    setFilterDate: (date: string) => void;
    filteredAttendance: any[];
    loading: boolean;
    holidays: Holiday[];
    expandedRecordId: string | null;
    handleToggleDetails: (id: string) => void;
    handleEditClick: (record: any, e: React.MouseEvent) => void;
    setSelectedDetailRecord: (record: any) => void;
    hasMore: boolean;
    handleLoadMore: () => void;
    formatHoursToHHMMSS: (hours: number) => string;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({
    searchTerm,
    setSearchTerm,
    filterDate,
    setFilterDate,
    filteredAttendance,
    loading,
    holidays,
    expandedRecordId,
    handleToggleDetails,
    handleEditClick,
    setSelectedDetailRecord,
    hasMore,
    handleLoadMore,
    formatHoursToHHMMSS
}) => {
    const isSunday = new Date(filterDate + 'T00:00:00').getDay() === 0;
    const holiday = holidays.find(h => h.date === filterDate);
    const hasNoRecords = filteredAttendance.length === 0 || (isSunday && filteredAttendance.filter(a => a.isPresent).length === 0) || !!holiday;

    return (
        <Card className="!p-0 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-3 sm:gap-4 justify-between">
                <div className="flex-1 max-w-full md:max-w-sm relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Users size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
                    <span className="text-xs sm:text-sm font-medium text-slate-500 flex-shrink-0">Date:</span>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={e => setFilterDate(e.target.value)}
                        className="flex-1 md:flex-initial px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
                        <tr>
                            <th className="px-6 py-4">Employee</th>
                            <th className="px-6 py-4 text-center">Check In</th>
                            <th className="px-6 py-4 text-center">Check Out</th>
                            <th className="px-6 py-4 text-center">Hours</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center p-8 text-slate-500">Loading data...</td></tr>
                        ) : !hasNoRecords ? (
                            filteredAttendance
                                .filter(record => {
                                    if ((record.isSunday || record.holiday) && !record.isPresent) return false;
                                    return true;
                                })
                                .map(record => {
                                    const isPresent = record.isPresent;
                                    const firstCheckIn = isPresent && record.sessions[0]?.checkIn ? record.sessions[0].checkIn : '--:--';
                                    const lastCompletedSession = isPresent ? [...record.sessions].reverse().find(s => s.checkOut) : null;
                                    const lastCheckOut = lastCompletedSession?.checkOut || '--:--';
                                    const hasActiveSession = isPresent && record.sessions.some((s: any) => !s.checkOut);
                                    const isAutoCheckedOut = isPresent && !hasActiveSession && record.sessions.some((s: any) => 
                                        !s.isManuallyEdited && (s.autoCheckedOut === true || (s.autoCheckedOut !== false && (s.checkOut === '23:50:00' || s.checkOut === '22:20:00'))) && (s.checkOut === '23:50:00' || s.checkOut === '22:20:00')
                                    );
                                    const isExpanded = expandedRecordId === record.id;

                                    return (
                                        <Fragment key={record.id}>
                                            <tr
                                                className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${isExpanded ? 'bg-slate-50' : ''}`}
                                                onClick={() => handleToggleDetails(record.id)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white shadow-sm ${isPresent ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                                            {record.userName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className={`font-semibold ${isPresent ? 'text-slate-800' : 'text-slate-400'}`}>{record.userName}</p>
                                                            <p className="text-xs text-slate-500">{record.department}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`font-medium ${isPresent ? 'text-slate-700' : 'text-slate-300'}`}>{firstCheckIn}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`font-medium ${isPresent ? 'text-slate-700' : 'text-slate-300'}`}>{lastCheckOut}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`font-bold ${isPresent ? 'text-slate-700' : 'text-slate-300'}`}>{formatHoursToHHMMSS(record.totalHours)}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {record.isWFH ? (
                                                        hasActiveSession ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-100">
                                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                                WFH (Active)
                                                            </span>
                                                        ) : record.totalHours >= 7 ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
                                                                WFH (Full Day{record.totalHours > 7 ? ' + OT' : ''})
                                                            </span>
                                                        ) : record.totalHours >= 4 ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-700 rounded-full text-xs font-semibold border border-sky-100">
                                                                WFH (Half Day)
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-semibold border border-red-100">
                                                                WFH (&lt; 4 hrs)
                                                            </span>
                                                        )
                                                    ) : isPresent ? (
                                                        hasActiveSession ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-100">
                                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                                Active
                                                            </span>
                                                        ) : isAutoCheckedOut ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-semibold border border-orange-100" title="Auto Checked-Out by System">
                                                                Half Day (Auto Checkout)
                                                            </span>
                                                        ) : record.totalHours >= 7 ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-100">
                                                                Full Day {record.totalHours > 7 ? '+ OT' : ''}
                                                            </span>
                                                        ) : record.totalHours >= 4 ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-semibold border border-orange-100">
                                                                Half Day
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-semibold border border-red-100">
                                                                Absent (&lt; 4 hrs)
                                                            </span>
                                                        )
                                                    ) : record.approvedLeave ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-100" title={`Reason: ${record.approvedLeave.reason || 'None'}`}>
                                                            On Leave ({record.approvedLeave.leaveType}{record.approvedLeave.duration === 'Half Day' ? ' - HD' : ''})
                                                        </span>
                                                    ) : (
                                                        record.joiningDate && record.joiningDate > filterDate ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-xs font-semibold border border-slate-100">
                                                                Not Joined
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-semibold border border-red-100">
                                                                Absent
                                                            </span>
                                                        )
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedDetailRecord(record);
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                                                            title="View Details"
                                                        >
                                                            <FileText size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleEditClick(record, e)}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                                                            title="Edit"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <div className={`transition-transform duration-200 text-slate-400 ${isExpanded ? 'rotate-180' : ''}`}>
                                                            <ChevronDown size={16} />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-slate-50/50">
                                                    <td colSpan={6} className="px-6 py-4">
                                                        <div className="ml-14 pl-6 border-l-2 border-slate-200 py-2">
                                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Session Details</h4>
                                                            {isPresent ? (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                    {record.sessions.map((session: any, index: number) => (
                                                                        <div key={session.id || index} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex items-center justify-between">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className="text-xs font-bold text-slate-400">Session {index + 1}</span>
                                                                                {session.biometricVerified && (
                                                                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200" title="Verified via Phone Fingerprint">
                                                                                        <Fingerprint size={11} /> Verified
                                                                                    </span>
                                                                                )}
                                                                                {!session.isManuallyEdited && (session.autoCheckedOut === true || (session.autoCheckedOut !== false && (session.checkOut === '23:50:00' || session.checkOut === '22:20:00'))) && (session.checkOut === '23:50:00' || session.checkOut === '22:20:00') && (
                                                                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" title="Auto Checked-Out by System">
                                                                                        Auto Checked-Out
                                                                                    </span>
                                                                                )}
                                                                                {session.isManuallyEdited && (
                                                                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200" title="Manually Edited">
                                                                                        Edited
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="text-sm">
                                                                                <span className="font-medium text-green-600">{session.checkIn}</span>
                                                                                <span className="text-slate-300 mx-2">→</span>
                                                                                <span className={`font-medium ${session.checkOut ? 'text-slate-600' : 'text-green-600 animate-pulse'}`}>
                                                                                    {session.checkOut || 'Active'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-red-500">No attendance records found for this date.</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })
                        ) : (
                            <tr>
                                <td colSpan={6} className="text-center p-12">
                                    {(() => {
                                        if (holiday) {
                                            return (
                                                <div className="flex flex-col items-center justify-center text-green-600">
                                                    <Calendar size={48} className="mb-2 opacity-20" />
                                                    <span className="text-xl font-bold italic">{holiday.name} ({holiday.type} Holiday)</span>
                                                    <p className="text-sm text-slate-400 mt-1">{holiday.description || 'No attendance records found for this date.'}</p>
                                                </div>
                                            );
                                        }

                                        if (isSunday) {
                                            return (
                                                <div className="flex flex-col items-center justify-center text-blue-600">
                                                    <Calendar size={48} className="mb-2 opacity-20" />
                                                    <span className="text-xl font-bold italic">Weekly Holiday (Sunday)</span>
                                                    <p className="text-sm text-slate-400 mt-1">No attendance records found for this date.</p>
                                                </div>
                                            );
                                        }

                                        return "No records found for this date.";
                                    })()}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {hasMore && !searchTerm && (
                <div className="p-4 text-center border-t border-slate-100 bg-slate-50/50">
                    <button onClick={handleLoadMore} disabled={loading} className="px-6 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-all shadow-sm disabled:opacity-50">
                        {loading ? 'Loading...' : 'Load More Records'}
                    </button>
                </div>
            )}
        </Card>
    );
};

export default AttendanceTable;
