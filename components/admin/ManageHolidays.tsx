/**
 * @file ManageHolidays.tsx
 * @description React component for rendering ManageHolidays UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

"use client";

import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
} from "firebase/firestore";
import { Holiday } from "../../types";
import Card from "../common/Card";
import Button from "../common/Button";
import { toast } from "react-hot-toast";
import {
    Calendar,
    Plus,
    Trash2,
    Loader2,
    ChevronDown,
} from "lucide-react";

const ManageHolidays: React.FC = () => {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const [isTypeOpen, setIsTypeOpen] = useState(false);

    const [newHoliday, setNewHoliday] = useState({
        name: "",
        date: "",
        type: "National" as Holiday["type"],
        description: "",
    });

    useEffect(() => {
        const holidaysRef = collection(db, "holidays");

        const q = query(
            holidaysRef,
            orderBy("date", "asc")
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedHolidays =
                    snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    } as Holiday));

                setHolidays(fetchedHolidays);
                setLoading(false);
            },
            (error) => {
                console.error(
                    "Error fetching holidays:",
                    error
                );

                toast.error(
                    "Failed to load holidays"
                );

                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const handleAddHoliday = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        if (
            !newHoliday.name.trim() ||
            !newHoliday.date
        ) {
            toast.error(
                "Please fill in name and date"
            );
            return;
        }

        setIsAdding(true);

        try {
            await addDoc(
                collection(db, "holidays"),
                {
                    ...newHoliday,
                    name: newHoliday.name.trim(),
                }
            );

            toast.success(
                "Holiday added successfully"
            );

            setNewHoliday({
                name: "",
                date: "",
                type: "National",
                description: "",
            });

            setIsTypeOpen(false);
        } catch (error) {
            console.error(
                "Error adding holiday:",
                error
            );

            toast.error(
                "Failed to add holiday"
            );
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteHoliday = async (
        id: string
    ) => {
        if (
            !window.confirm(
                "Are you sure you want to delete this holiday?"
            )
        ) {
            return;
        }

        try {
            await deleteDoc(
                doc(db, "holidays", id)
            );

            toast.success("Holiday deleted");
        } catch (error) {
            console.error(
                "Error deleting holiday:",
                error
            );

            toast.error(
                "Failed to delete holiday"
            );
        }
    };

    const inputClasses =
        "mt-1 block w-full min-w-0 max-w-full box-border rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10";

    const holidayTypes: Holiday["type"][] = [
        "National",
        "Company",
        "Other",
    ];

    return (
        <div className="w-full min-w-0 max-w-full overflow-x-hidden space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between min-w-0">
                <h2 className="text-2xl font-bold text-slate-900">
                    Manage Holidays
                </h2>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
                {/* =====================================================
                    ADD HOLIDAY FORM
                ====================================================== */}
                <Card className="lg:col-span-1 h-fit w-full min-w-0 max-w-full overflow-visible">
                    <div className="flex items-center gap-2 mb-4 min-w-0">
                        <Plus
                            className="text-primary shrink-0"
                            size={20}
                        />

                        <h3 className="text-lg font-semibold text-slate-900">
                            Add New Holiday
                        </h3>
                    </div>

                    <form
                        onSubmit={handleAddHoliday}
                        className="space-y-4 w-full min-w-0 max-w-full"
                    >
                        {/* Name */}
                        <div className="w-full min-w-0">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Name
                            </label>

                            <input
                                type="text"
                                value={newHoliday.name}
                                onChange={(e) =>
                                    setNewHoliday({
                                        ...newHoliday,
                                        name: e.target.value,
                                    })
                                }
                                className={inputClasses}
                                placeholder="e.g. Independence Day"
                                required
                            />
                        </div>

                        {/* Date */}
                        <div className="w-full min-w-0">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Date
                            </label>

                            <input
                                type="date"
                                value={newHoliday.date}
                                onChange={(e) =>
                                    setNewHoliday({
                                        ...newHoliday,
                                        date: e.target.value,
                                    })
                                }
                                className={inputClasses}
                                required
                            />
                        </div>

                        {/* Type */}
                        <div className="w-full min-w-0 relative">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Type
                            </label>

                            {/* Custom Dropdown Trigger */}
                            <button
                                type="button"
                                onClick={() =>
                                    setIsTypeOpen(
                                        (prev) => !prev
                                    )
                                }
                                className={`${inputClasses} h-[52px] flex items-center justify-between text-left cursor-pointer`}
                            >
                                <span className="truncate">
                                    {newHoliday.type}
                                </span>

                                <ChevronDown
                                    size={18}
                                    className={`shrink-0 ml-2 text-slate-500 transition-transform duration-200 ${isTypeOpen
                                            ? "rotate-180"
                                            : ""
                                        }`}
                                />
                            </button>

                            {/* Custom Dropdown Menu */}
                            {isTypeOpen && (
                                <>
                                    {/* Mobile overlay */}
                                    <button
                                        type="button"
                                        aria-label="Close dropdown"
                                        onClick={() =>
                                            setIsTypeOpen(
                                                false
                                            )
                                        }
                                        className="fixed inset-0 z-[90] cursor-default md:hidden"
                                    />

                                    <div className="absolute left-0 right-0 top-full mt-1 z-[100] w-full min-w-0 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-xl">
                                        {holidayTypes.map(
                                            (type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => {
                                                        setNewHoliday(
                                                            {
                                                                ...newHoliday,
                                                                type,
                                                            }
                                                        );

                                                        setIsTypeOpen(
                                                            false
                                                        );
                                                    }}
                                                    className={`w-full min-w-0 px-4 py-3 text-left text-sm transition-colors ${newHoliday.type ===
                                                            type
                                                            ? "bg-primary/10 text-primary font-semibold"
                                                            : "text-slate-700 hover:bg-slate-50"
                                                        }`}
                                                >
                                                    {type}
                                                </button>
                                            )
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Description */}
                        <div className="w-full min-w-0">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Description (Optional)
                            </label>

                            <textarea
                                value={
                                    newHoliday.description
                                }
                                onChange={(e) =>
                                    setNewHoliday({
                                        ...newHoliday,
                                        description:
                                            e.target.value,
                                    })
                                }
                                className={`${inputClasses} resize-none`}
                                rows={3}
                            />
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            className="w-full justify-center"
                            disabled={isAdding}
                        >
                            {isAdding ? (
                                <Loader2
                                    className="animate-spin mr-2"
                                    size={18}
                                />
                            ) : null}

                            {isAdding
                                ? "Adding..."
                                : "Add Holiday"}
                        </Button>
                    </form>
                </Card>

                {/* =====================================================
                    HOLIDAYS LIST
                ====================================================== */}
                <Card className="lg:col-span-2 w-full min-w-0 max-w-full overflow-hidden">
                    <div className="flex items-center gap-2 mb-4 min-w-0">
                        <Calendar
                            className="text-primary shrink-0"
                            size={20}
                        />

                        <h3 className="text-lg font-semibold text-slate-900">
                            Holiday List
                        </h3>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2
                                className="animate-spin text-primary"
                                size={32}
                            />
                        </div>
                    ) : holidays.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <p>
                                No holidays added yet.
                            </p>
                        </div>
                    ) : (
                        <div className="w-full min-w-0 overflow-x-auto custom-scrollbar">
                            <table className="min-w-[620px] w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Date
                                        </th>

                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Name
                                        </th>

                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Type
                                        </th>

                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="bg-white divide-y divide-slate-200">
                                    {holidays.map(
                                        (holiday) => (
                                            <tr
                                                key={
                                                    holiday.id
                                                }
                                                className="hover:bg-slate-50 transition-colors"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                    {new Date(
                                                        holiday.date
                                                    ).toLocaleDateString(
                                                        "en-US",
                                                        {
                                                            dateStyle:
                                                                "long",
                                                        }
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                    {
                                                        holiday.name
                                                    }
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${holiday.type ===
                                                                "National"
                                                                ? "bg-blue-100 text-blue-800"
                                                                : holiday.type ===
                                                                    "Company"
                                                                    ? "bg-green-100 text-green-800"
                                                                    : "bg-slate-100 text-slate-800"
                                                            }`}
                                                    >
                                                        {
                                                            holiday.type
                                                        }
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDeleteHoliday(
                                                                holiday.id
                                                            )
                                                        }
                                                        className="text-red-600 hover:text-red-900 transition-colors p-1"
                                                    >
                                                        <Trash2
                                                            size={
                                                                18
                                                            }
                                                        />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>

            {/* Mobile Responsive Protection */}
            <style jsx>{`
                @media (max-width: 767px) {
                    input,
                    textarea,
                    button {
                        box-sizing: border-box;
                    }

                    input,
                    textarea {
                        width: 100%;
                        max-width: 100%;
                        min-width: 0;
                    }

                    form,
                    form > div,
                    .grid,
                    .space-y-6 {
                        min-width: 0;
                        max-width: 100%;
                    }

                    table {
                        width: max-content;
                    }
                }
            `}</style>
        </div>
    );
};

export default ManageHolidays;