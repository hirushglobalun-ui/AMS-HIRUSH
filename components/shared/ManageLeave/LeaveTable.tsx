/**
 * @file LeaveTable.tsx
 * @description React component for rendering LeaveTable UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React, { useState } from "react";
import {
    Search,
    Filter,
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    Check,
    X,
    FileText,
    ChevronDown,
} from "lucide-react";
import Card from "../../common/Card";
import { LeaveStatus } from "../../../types";
import {
    formatApplyDate,
    getLeaveDays,
} from "./utils";

interface LeaveTableProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filterStatus: string;
    setFilterStatus: (
        status: LeaveStatus | "all"
    ) => void;
    paginatedRequests: any[];
    loading: boolean;
    hasMore: boolean;
    handleLoadMore: () => void;
    setSelectedRequest: (req: any) => void;
    setStatusAction: (
        action: {
            id: string;
            status: LeaveStatus;
            employeeName: string;
        } | null
    ) => void;
    setStatusReasonText: (text: string) => void;
}

const LeaveTable: React.FC<LeaveTableProps> = ({
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    paginatedRequests,
    loading,
    hasMore,
    handleLoadMore,
    setSelectedRequest,
    setStatusAction,
    setStatusReasonText,
}) => {
    const [statusDropdownOpen, setStatusDropdownOpen] =
        useState(false);

    const statusOptions = [
        {
            value: "all",
            label: "All Statuses",
        },
        {
            value: LeaveStatus.PENDING,
            label: "Pending",
        },
        {
            value: LeaveStatus.APPROVED,
            label: "Approved",
        },
        {
            value: LeaveStatus.REJECTED,
            label: "Rejected",
        },
    ];

    const selectedStatusLabel =
        statusOptions.find(
            (status) =>
                status.value === filterStatus
        )?.label || "All Statuses";

    return (
        <Card className="!p-0 overflow-visible">
            {/* =====================================================
                FILTER SECTION
            ====================================================== */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-3 sm:gap-4 justify-between">
                {/* Search */}
                <div className="flex-1 max-w-full md:max-w-sm relative group min-w-0">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search
                            size={18}
                            className="text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                        />
                    </div>

                    <input
                        type="text"
                        placeholder="Search by employee or type..."
                        value={searchTerm}
                        onChange={(e) =>
                            setSearchTerm(
                                e.target.value
                            )
                        }
                        className="block w-full min-w-0 max-w-full box-border pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-3 w-full md:w-auto min-w-0">
                    <div className="relative w-full md:w-[180px] min-w-0">
                        {/* Filter Icon */}
                        <Filter
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"
                        />

                        {/* Dropdown Button */}
                        <button
                            type="button"
                            onClick={() =>
                                setStatusDropdownOpen(
                                    (prev) => !prev
                                )
                            }
                            className="w-full min-w-0 h-[44px] pl-10 pr-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 flex items-center justify-between text-left outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                        >
                            <span className="truncate">
                                {selectedStatusLabel}
                            </span>

                            <ChevronDown
                                size={18}
                                className={`shrink-0 ml-2 text-slate-400 transition-transform duration-200 ${statusDropdownOpen
                                        ? "rotate-180"
                                        : ""
                                    }`}
                            />
                        </button>

                        {/* Custom Dropdown */}
                        {statusDropdownOpen && (
                            <>
                                {/* Mobile backdrop */}
                                <button
                                    type="button"
                                    aria-label="Close status dropdown"
                                    onClick={() =>
                                        setStatusDropdownOpen(
                                            false
                                        )
                                    }
                                    className="fixed inset-0 z-[90] cursor-default md:hidden"
                                />

                                <div className="absolute left-0 right-0 top-full mt-1 z-[100] w-full min-w-0 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-xl">
                                    {statusOptions.map(
                                        (status) => (
                                            <button
                                                key={
                                                    status.value
                                                }
                                                type="button"
                                                onClick={() => {
                                                    setFilterStatus(
                                                        status.value as
                                                        | LeaveStatus
                                                        | "all"
                                                    );

                                                    setStatusDropdownOpen(
                                                        false
                                                    );
                                                }}
                                                className={`w-full min-w-0 px-4 py-3 text-left text-sm transition-colors ${filterStatus ===
                                                        status.value
                                                        ? "bg-indigo-50 text-indigo-600 font-semibold"
                                                        : "text-slate-700 hover:bg-slate-50"
                                                    }`}
                                            >
                                                {
                                                    status.label
                                                }
                                            </button>
                                        )
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* =====================================================
                TABLE
            ====================================================== */}
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
                        <tr>
                            <th className="px-6 py-4">
                                Employee
                            </th>

                            <th className="px-6 py-4">
                                Applied On
                            </th>

                            <th className="px-6 py-4">
                                Leave Type
                            </th>

                            <th className="px-6 py-4">
                                Duration
                            </th>

                            <th className="px-6 py-4">
                                Reason
                            </th>

                            <th className="px-6 py-4 text-center">
                                Status
                            </th>

                            <th className="px-6 py-4 text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="text-center p-8 text-slate-500"
                                >
                                    Loading requests...
                                </td>
                            </tr>
                        ) : paginatedRequests.length >
                            0 ? (
                            paginatedRequests.map(
                                (req) => (
                                    <tr
                                        key={req.id}
                                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                                        onClick={() =>
                                            setSelectedRequest(
                                                req
                                            )
                                        }
                                    >
                                        {/* Employee */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold border-2 border-white shadow-sm">
                                                    {req.userName.charAt(
                                                        0
                                                    )}
                                                </div>

                                                <div>
                                                    <p className="font-semibold text-slate-800">
                                                        {
                                                            req.userName
                                                        }
                                                    </p>

                                                    <p className="text-xs text-slate-500">
                                                        {
                                                            req.userEmail
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Applied On */}
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-500 font-medium">
                                                {formatApplyDate(
                                                    req.createdAt
                                                )}
                                            </span>
                                        </td>

                                        {/* Leave Type */}
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-slate-700">
                                                {
                                                    req.leaveType
                                                }
                                            </span>
                                        </td>

                                        {/* Duration */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                                    <Calendar
                                                        size={
                                                            14
                                                        }
                                                        className="text-slate-400"
                                                    />

                                                    {
                                                        req.startDate
                                                    }
                                                </span>

                                                {req.duration !==
                                                    "Half Day" &&
                                                    req.startDate !==
                                                    req.endDate && (
                                                        <span className="text-xs text-slate-400 ml-5">
                                                            to{" "}
                                                            {
                                                                req.endDate
                                                            }
                                                        </span>
                                                    )}

                                                <span className="text-xs font-semibold text-indigo-600 ml-5 mt-0.5">
                                                    {getLeaveDays(
                                                        req
                                                    )}{" "}
                                                    Day
                                                    {getLeaveDays(
                                                        req
                                                    ) !== 1
                                                        ? "s"
                                                        : ""}

                                                    {req.duration ===
                                                        "Half Day"
                                                        ? ` (${req.halfDayType ||
                                                        "Morning"
                                                        })`
                                                        : ""}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Reason */}
                                        <td className="px-6 py-4">
                                            <div
                                                className="max-w-[200px] text-sm text-slate-600 line-clamp-2"
                                                title={
                                                    req.reason
                                                }
                                            >
                                                {req.reason}
                                            </div>

                                            {req.statusReason && (
                                                <p
                                                    className="text-[10px] text-indigo-600 mt-1 font-semibold bg-indigo-50/60 px-2 py-0.5 rounded border border-indigo-100/30 inline-block max-w-[200px] truncate"
                                                    title={
                                                        req.statusReason
                                                    }
                                                >
                                                    Remarks:{" "}
                                                    {
                                                        req.statusReason
                                                    }
                                                </p>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${req.status ===
                                                        LeaveStatus.APPROVED
                                                        ? "bg-green-50 text-green-700 border-green-100"
                                                        : req.status ===
                                                            LeaveStatus.REJECTED
                                                            ? "bg-red-50 text-red-700 border-red-100"
                                                            : "bg-yellow-50 text-yellow-700 border-yellow-100"
                                                    }`}
                                            >
                                                {req.status ===
                                                    LeaveStatus.APPROVED && (
                                                        <CheckCircle
                                                            size={
                                                                12
                                                            }
                                                        />
                                                    )}

                                                {req.status ===
                                                    LeaveStatus.REJECTED && (
                                                        <XCircle
                                                            size={
                                                                12
                                                            }
                                                        />
                                                    )}

                                                {req.status ===
                                                    LeaveStatus.PENDING && (
                                                        <Clock
                                                            size={
                                                                12
                                                            }
                                                        />
                                                    )}

                                                {req.status}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 text-right">
                                            {req.status ===
                                                LeaveStatus.PENDING ? (
                                                <div
                                                    className="flex items-center justify-end gap-2"
                                                    onClick={(
                                                        e
                                                    ) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={(
                                                            e
                                                        ) => {
                                                            e.stopPropagation();

                                                            setStatusAction(
                                                                {
                                                                    id: req.id,
                                                                    status:
                                                                        LeaveStatus.APPROVED,
                                                                    employeeName:
                                                                        req.userName,
                                                                }
                                                            );

                                                            setStatusReasonText(
                                                                ""
                                                            );
                                                        }}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Approve"
                                                    >
                                                        <Check
                                                            size={
                                                                18
                                                            }
                                                        />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={(
                                                            e
                                                        ) => {
                                                            e.stopPropagation();

                                                            setStatusAction(
                                                                {
                                                                    id: req.id,
                                                                    status:
                                                                        LeaveStatus.REJECTED,
                                                                    employeeName:
                                                                        req.userName,
                                                                }
                                                            );

                                                            setStatusReasonText(
                                                                ""
                                                            );
                                                        }}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Reject"
                                                    >
                                                        <X
                                                            size={
                                                                18
                                                            }
                                                        />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 font-medium italic">
                                                    {req.status ===
                                                        LeaveStatus.APPROVED
                                                        ? "Processed"
                                                        : "Closed"}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            )
                        ) : (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="text-center p-12"
                                >
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <FileText
                                            size={48}
                                            className="mb-2 opacity-20"
                                        />

                                        <p>
                                            No leave requests
                                            found.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Load More */}
            {hasMore && !searchTerm && (
                <div className="p-4 text-center border-t border-slate-100 bg-slate-50/50">
                    <button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="px-6 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-all shadow-sm disabled:opacity-50"
                    >
                        {loading
                            ? "Loading..."
                            : "Load More"}
                    </button>
                </div>
            )}
        </Card>
    );
};

export default LeaveTable;