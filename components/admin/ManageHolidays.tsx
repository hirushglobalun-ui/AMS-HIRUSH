/**
 * @file ManageHolidays.tsx
 * @description React component for rendering ManageHolidays UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Holiday } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import { toast } from 'react-hot-toast';
import { Calendar, Plus, Trash2, Loader2 } from 'lucide-react';

const ManageHolidays: React.FC = () => {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newHoliday, setNewHoliday] = useState({
        name: '',
        date: '',
        type: 'National' as Holiday['type'],
        description: ''
    });

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
            toast.error("Failed to load holidays");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleAddHoliday = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHoliday.name || !newHoliday.date) {
            toast.error("Please fill in name and date");
            return;
        }

        setIsAdding(true);
        try {
            await addDoc(collection(db, 'holidays'), {
                ...newHoliday
            });
            toast.success("Holiday added successfully");
            setNewHoliday({ name: '', date: '', type: 'National', description: '' });
        } catch (error) {
            console.error("Error adding holiday:", error);
            toast.error("Failed to add holiday");
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteHoliday = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this holiday?")) return;

        try {
            await deleteDoc(doc(db, 'holidays', id));
            toast.success("Holiday deleted");
        } catch (error) {
            console.error("Error deleting holiday:", error);
            toast.error("Failed to delete holiday");
        }
    };

    const inputClasses = "mt-1 block w-full rounded-md border-slate-200 dark:border-slate-700 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-slate-50 p-2.5";

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Manage Holidays</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Add Holiday Form */}
                <Card className="lg:col-span-1 h-fit">
                    <div className="flex items-center gap-2 mb-4">
                        <Plus className="text-primary" size={20} />
                        <h3 className="text-lg font-semibold">Add New Holiday</h3>
                    </div>
                    <form onSubmit={handleAddHoliday} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Name</label>
                            <input
                                type="text"
                                value={newHoliday.name}
                                onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })}
                                className={inputClasses}
                                placeholder="e.g. Independence Day"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Date</label>
                            <input
                                type="date"
                                value={newHoliday.date}
                                onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })}
                                className={inputClasses}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Type</label>
                            <select
                                value={newHoliday.type}
                                onChange={e => setNewHoliday({ ...newHoliday, type: e.target.value as Holiday['type'] })}
                                className={inputClasses}
                            >
                                <option value="National">National</option>
                                <option value="Company">Company</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Description (Optional)</label>
                            <textarea
                                value={newHoliday.description}
                                onChange={e => setNewHoliday({ ...newHoliday, description: e.target.value })}
                                className={inputClasses}
                                rows={3}
                            />
                        </div>
                        <Button type="submit" className="w-full justify-center" disabled={isAdding}>
                            {isAdding ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                            {isAdding ? 'Adding...' : 'Add Holiday'}
                        </Button>
                    </form>
                </Card>

                {/* Holidays List */}
                <Card className="lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="text-primary" size={20} />
                        <h3 className="text-lg font-semibold">Holiday List</h3>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                    ) : holidays.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <p>No holidays added yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {holidays.map((holiday) => (
                                        <tr key={holiday.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                {new Date(holiday.date).toLocaleDateString('en-US', { dateStyle: 'long' })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                {holiday.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${holiday.type === 'National' ? 'bg-blue-100 text-blue-800' :
                                                    holiday.type === 'Company' ? 'bg-green-100 text-green-800' :
                                                        'bg-slate-100 text-slate-800'
                                                    }`}>
                                                    {holiday.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleDeleteHoliday(holiday.id)}
                                                    className="text-red-600 hover:text-red-900 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default ManageHolidays;
