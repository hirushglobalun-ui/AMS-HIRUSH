/**
 * @file Holidays.tsx
 * @description React component for rendering Holidays UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Holiday } from '../../types';
import Card from '../common/Card';
import { Calendar, Info, Loader2 } from 'lucide-react';

const Holidays: React.FC = () => {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const holidaysRef = collection(db, 'holidays');
        const q = query(holidaysRef, orderBy('date', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedHolidays = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Holiday));
            setHolidays(fetchedHolidays);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching holidays:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const isUpcoming = (dateStr: string) => {
        const holidayDate = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return holidayDate >= today;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                    <Calendar size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Company Holidays</h2>
                    <p className="text-sm text-slate-500">View upcoming holidays and company closures</p>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <Loader2 className="animate-spin text-primary mb-4" size={40} />
                    <p className="text-slate-500 font-medium">Loading holiday schedule...</p>
                </div>
            ) : holidays.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm text-center px-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <Calendar size={40} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Holidays Announced</h3>
                    <p className="text-slate-500 max-w-sm">The holiday schedule for this period has not been posted yet. Check back soon!</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {holidays.map((holiday) => {
                        const upcoming = isUpcoming(holiday.date);
                        return (
                            <div key={holiday.id} className={`bg-white rounded-xl border p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6 transition-all hover:bg-slate-50 ${upcoming ? 'border-indigo-100 opacity-100' : 'border-slate-100 opacity-60 grayscale'}`}>
                                <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center border ${upcoming ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                    <span className="text-xs font-bold uppercase">{new Date(holiday.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                    <span className="text-2xl font-bold leading-none mt-1">{new Date(holiday.date).getDate()}</span>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold text-slate-900 text-lg">{holiday.name}</h3>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${holiday.type === 'National' ? 'bg-blue-100 text-blue-700' :
                                                holiday.type === 'Company' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-slate-100 text-slate-600'
                                            }`}>
                                            {holiday.type}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 text-sm">{new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' })}</p>
                                    {holiday.description && <p className="text-slate-400 text-xs mt-1">{holiday.description}</p>}
                                </div>

                                {!upcoming && (
                                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full self-start sm:self-auto flex-shrink-0">PASSED</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Holidays;
