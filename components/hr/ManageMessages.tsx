/**
 * @file ManageMessages.tsx
 * @description React component for rendering ManageMessages UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import { toast } from 'react-hot-toast';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore';
import { User, Message, Role } from '../../types';
import { Send, Inbox, Users, Building2, User as UserIcon, Mail, Search, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ManageMessages: React.FC = () => {
    const { user: admin } = useAuth();
    const formInputClasses = "mt-1 block w-full border-slate-200 dark:border-slate-700 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-slate-50";
    const [recipientType, setRecipientType] = useState('all');
    const [users, setUsers] = useState<User[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);
    const [viewingMessage, setViewingMessage] = useState<Message | null>(null);

    useEffect(() => {
        // Fetch users for individual selection
        const fetchUsers = async () => {
            try {
                const usersRef = collection(db, 'users');
                const snapshot = await getDocs(usersRef);
                const userList: User[] = [];
                snapshot.forEach(doc => {
                    userList.push({ id: doc.id, ...doc.data() } as User);
                });
                setUsers(userList);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        fetchUsers();
    }, []);

    const adminId = admin?.id;
    const adminRole = admin?.role;

    useEffect(() => {
        if (!adminId) return;
        const messagesRef = collection(db, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: Message[] = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                const msg = { id: doc.id, ...data } as Message;

                // Filter messages:
                // 1. Sent to everyone
                // 2. Sent to admin's role
                // 3. Sent to admin individually
                // 4. Sent BY the admin (so they can see their history)
                if (
                    msg.recipient === 'all' ||
                    (typeof msg.recipient === 'string' && msg.recipient === adminRole) ||
                    (Array.isArray(msg.recipient) && msg.recipient.includes(adminId)) ||
                    msg.senderId === adminId
                ) {
                    msgs.push(msg);
                }
            });

            // Re-sort locally to handle messages with null server timestamps (pending writes)
            msgs.sort((a, b) => {
                const getVal = (m: Message) => {
                    if (m.timestamp && typeof m.timestamp.toDate === 'function') {
                        return m.timestamp.toDate().getTime();
                    }
                    return Date.now(); // Put new ones at the top
                };
                return getVal(b) - getVal(a);
            });

            setReceivedMessages(msgs);
        }, (error) => {
            console.error("Error listening to messages:", error);
            toast.error("Failed to sync messages.");
        });

        return () => unsubscribe();
    }, [adminId, adminRole]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!admin) return;
        const form = e.currentTarget;
        const formData = new FormData(form);
        let recipient: string | string[] = 'all';
        const recipientTypeValue = formData.get('recipientType');

        if (recipientTypeValue === 'all') {
            recipient = 'all';
        } else if (recipientTypeValue === 'department') {
            const dept = formData.get('department');
            recipient = typeof dept === 'string' ? dept.trim() : '';
            if (!recipient) {
                toast.error("Please select a department");
                return;
            }
        } else if (recipientTypeValue === 'individual') {
            const selected = formData.get('selectedUsers');
            recipient = typeof selected === 'string' ? selected.split(',').filter(id => id.trim()) : [];
            if (!Array.isArray(recipient) || recipient.length === 0) {
                toast.error("Please select at least one user");
                return;
            }
        }

        const newMessage = {
            title: formData.get('title'),
            content: formData.get('content'),
            imageUrl: formData.get('imageUrl'), // New field
            recipient,
            recipientType: recipientTypeValue,
            timestamp: serverTimestamp(),
            senderId: admin.id,
            senderName: admin.name || 'HR'
        };

        try {
            await addDoc(collection(db, 'messages'), newMessage);
            toast.success("Message sent successfully!");
            form.reset();
            setRecipientType('all');
            setSelectedUsers([]);
            setUserSearch('');
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Failed to send message.");
        }
    };

    const formatTimestamp = (timestamp: any) => {
        if (timestamp && typeof timestamp.toDate === 'function') {
            return timestamp.toDate().toLocaleString();
        }
        return 'Just now';
    };

    if (!admin) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Compose Section */}
            <Card className="flex flex-col lg:sticky lg:top-24">
                <div className="flex items-center gap-3 mb-6 flex-shrink-0">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <Send size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Compose Message</h2>
                        <p className="text-sm text-slate-500">Send announcements or direct messages</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Recipient Type Tabs */}
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'all', label: 'Everyone', icon: Users },
                                { id: 'department', label: 'Department', icon: Building2 },
                                { id: 'individual', label: 'Individual', icon: UserIcon },
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setRecipientType(type.id)}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-300 ${recipientType === type.id
                                        ? 'border-primary bg-primary/5 text-primary font-bold shadow-sm ring-1 ring-primary/20'
                                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    <type.icon size={20} />
                                    <span className="text-xs font-semibold">{type.label}</span>
                                </button>
                            ))}
                            <input type="hidden" name="recipientType" value={recipientType} />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Subject</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    placeholder="Enter message subject"
                                    className="w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50/50 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                    required
                                />
                            </div>

                            {recipientType === 'department' && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Select Department</label>
                                    <select
                                        id="department"
                                        name="department"
                                        className="w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50/50 focus:border-primary transition-all outline-none cursor-pointer"
                                        defaultValue=""
                                        required
                                    >
                                        <option value="">Select Department</option>
                                        <option value="SEO">SEO</option>
                                        <option value="Development">Development</option>
                                        <option value="Product">Product</option>
                                        <option value="Media">Media</option>
                                        <option value="Sales">Sales</option>
                                        <option value="Visitor">Visitor</option>
                                    </select>
                                </div>
                            )}

                            {recipientType === 'individual' && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Select Users</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search by name or ID..."
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border-slate-200 bg-slate-50/50 focus:border-primary transition-all outline-none"
                                            value={userSearch}
                                            onChange={e => setUserSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-2 bg-white space-y-1 custom-scrollbar">
                                        {users.filter(user =>
                                            user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                                            (user.employeeId && user.employeeId.toLowerCase().includes(userSearch.toLowerCase()))
                                        ).map(user => (
                                            <label
                                                key={user.id}
                                                className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${selectedUsers.includes(user.id) ? 'bg-primary/5 text-primary' : 'hover:bg-slate-50'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={selectedUsers.includes(user.id)}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            setSelectedUsers([...selectedUsers, user.id]);
                                                        } else {
                                                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                                        }
                                                    }}
                                                />
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mr-3 transition-all ${selectedUsers.includes(user.id) ? 'bg-primary border-primary' : 'border-slate-300'
                                                    }`}>
                                                    {selectedUsers.includes(user.id) && <CheckCircle2 size={14} className="text-white" />}
                                                </div>
                                                <span className="text-sm font-medium">{user.name}</span>
                                                <span className="text-xs text-slate-400 ml-auto">{user.employeeId || 'No ID'}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <input type="hidden" name="selectedUsers" value={selectedUsers.join(',')} />
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Message Content</label>
                                <textarea
                                    id="content"
                                    name="content"
                                    rows={4}
                                    placeholder="Type your message here..."
                                    className="w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50/50 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                                    required
                                ></textarea>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Image URL (Optional)</label>
                                <input
                                    type="url"
                                    id="imageUrl"
                                    name="imageUrl"
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50/50 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                />
                            </div>
                        </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/25 transition-all active:scale-[0.98] cursor-pointer"
                        >
                            <Send size={18} />
                            Send Message
                        </button>
                    </div>
                </form>
            </Card>

            {/* Inbox Section */}
            <Card className="flex flex-col">
                <div className="flex items-center gap-3 mb-6 flex-shrink-0">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Inbox size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Inbox</h2>
                        <p className="text-sm text-slate-500">Messages sent to you {admin.role === Role.ADMIN ? '(Admin)' : (admin.role === Role.HR ? '(HR)' : '')}</p>
                    </div>
                </div>

                <div className="space-y-4 max-h-[calc(100vh-250px)] custom-scrollbar overflow-y-auto pr-1 pb-4">
                    {receivedMessages.length > 0 ? receivedMessages.map(msg => (
                        <div
                            key={msg.id}
                            onClick={() => setViewingMessage(msg)}
                            className="group p-5 border border-slate-100 rounded-2xl bg-white hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary rounded-lg transition-colors">
                                    <Mail size={18} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full uppercase tracking-tight">
                                    {formatTimestamp(msg.timestamp)}
                                </span>
                            </div>
                            <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors mb-1">{msg.title}</h3>
                            <p className="text-xs font-semibold text-slate-400 mb-4 flex items-center gap-1">
                                <UserIcon size={12} />
                                From: {msg.senderName || 'Unknown'}
                            </p>
                            <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                                {msg.content}
                            </p>
                        </div>
                    )) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-60 min-h-[400px]">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Inbox size={32} />
                            </div>
                            <p className="text-lg font-medium">No messages received yet.</p>
                            <p className="text-sm">Announcements will appear here.</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Message Detail Modal */}
            {viewingMessage && (
                <div 
                    onClick={() => setViewingMessage(null)}
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-transparent animate-in fade-in duration-200"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
                    >
                        <div className="relative p-6 border-b border-slate-100">
                            <button
                                onClick={() => setViewingMessage(null)}
                                className="absolute right-6 top-6 p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">{viewingMessage.title}</h3>
                                    <p className="text-sm text-slate-400 flex items-center gap-1">
                                        <UserIcon size={14} />
                                        Sent by {viewingMessage.senderName || 'Unknown'} • {formatTimestamp(viewingMessage.timestamp)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="prose prose-slate max-w-none">
                                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-lg">
                                    {viewingMessage.content}
                                </p>
                                {(viewingMessage as any).imageUrl && (
                                    <div className="mt-6 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                                        <img
                                            src={(viewingMessage as any).imageUrl}
                                            alt="Message attachment"
                                            className="w-full h-auto object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 flex justify-end">
                            <button
                                onClick={() => setViewingMessage(null)}
                                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageMessages;