/**
 * @file Messages.tsx
 * @description React component for rendering Messages UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Message, User, Role } from '../../types';
import Card from '../common/Card';
import { db } from '../../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { Plus, X, Send, Search, Mail, User as UserIcon, Inbox, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';


const Messages: React.FC = () => {
  const { user } = useAuth();
  const [userMessages, setUserMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [newMessage, setNewMessage] = useState({
    title: '',
    content: '',
    recipient: '' as string | string[],
  });
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [viewingMessage, setViewingMessage] = useState<Message | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const userId = user?.id;
  const userRole = user?.role;
  const userDept = user?.department ? user.department.trim() : '';

  useEffect(() => {
    if (!userId) return;
    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        const msg = { id: doc.id, ...data } as Message;

        // Filter messages
        if (
          msg.recipient === 'all' ||
          (typeof msg.recipient === 'string' && msg.recipient === userDept) ||
          (typeof msg.recipient === 'string' && msg.recipient === userRole) ||
          (Array.isArray(msg.recipient) && msg.recipient.includes(userId)) ||
          msg.senderId === userId
        ) {
          msgs.push(msg);
        }
      });

      // Local sort for pending writes
      msgs.sort((a, b) => {
        const getVal = (m: Message) => {
          if (m.timestamp && typeof m.timestamp.toDate === 'function') {
            return m.timestamp.toDate().getTime();
          }
          return Date.now();
        };
        return getVal(b) - getVal(a);
      });

      setUserMessages(msgs);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to messages:", error);
      toast.error("Failed to sync messages.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, userRole, userDept]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || sending) return;

    if (!newMessage.title || !newMessage.content || selectedUsers.length === 0) {
      toast.error("Please fill in all fields and select at least one user");
      return;
    }

    setSending(true);
    try {
      await addDoc(collection(db, 'messages'), {
        title: newMessage.title,
        content: newMessage.content,
        recipient: selectedUsers,
        timestamp: serverTimestamp(),
        senderId: user.id,
        senderName: user.name
      });
      toast.success("Message sent successfully!");
      setShowCompose(false);
      setNewMessage({ title: '', content: '', recipient: '' });
      setSelectedUsers([]);
      setUserSearch('');
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message.");
    }
    setSending(false);
  };

  const formatTimestamp = (timestamp: any) => {
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleString();
    }
    return 'Just now';
  }

  if (!user) return null;

  return (
    <div className={`grid grid-cols-1 ${user.role === Role.ADMIN ? 'lg:grid-cols-2' : ''} gap-6 items-start `}>
      {/* Compose Section - Admins Only */}
      {user.role === Role.ADMIN && (
        <Card className="flex flex-col lg:sticky lg:top-24">
        <div className="flex items-center gap-3 mb-6 flex-shrink-0">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Plus size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">New Message</h2>
            <p className="text-sm text-slate-500">Send direct messages to colleagues</p>
          </div>
        </div>

        <form onSubmit={handleSendMessage} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Recipient(s)</label>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search colleagues..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-slate-200 bg-slate-50/50 focus:border-primary transition-all outline-none"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-2 bg-white space-y-1 custom-scrollbar">
                  {users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) && u.id !== user.id).map(u => (
                    <label
                      key={u.id}
                      className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${selectedUsers.includes(u.id) ? 'bg-primary/5 text-primary' : 'hover:bg-slate-50'
                        }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={selectedUsers.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, u.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                          }
                        }}
                      />
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mr-3 transition-all ${selectedUsers.includes(u.id) ? 'bg-primary border-primary' : 'border-slate-300'
                        }`}>
                        {selectedUsers.includes(u.id) && <CheckCircle2 size={14} className="text-white" />}
                      </div>
                      <span className="text-sm font-medium">{u.name}</span>
                      <span className="text-xs text-slate-400 ml-auto">{u.role}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Subject</label>
                <input
                  type="text"
                  placeholder="Message subject"
                  className="w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50/50 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  value={newMessage.title}
                  onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Message Content</label>
                <textarea
                  rows={4}
                  placeholder="Type your message..."
                  className="w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50/50 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  required
                ></textarea>
              </div>
            </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/25 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <Send size={18} />
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
        </Card>
      )}

      {/* Inbox Section */}
      <Card className="flex flex-col">
        <div className="flex items-center gap-3 mb-6 flex-shrink-0">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Inbox size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Inbox</h2>
            <p className="text-sm text-slate-500">Announcements and private messages</p>
          </div>
        </div>

        <div className="space-y-4 max-h-[calc(100vh-250px)] custom-scrollbar overflow-y-auto pr-1 pb-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-400">Loading messages...</p>
            </div>
          ) : userMessages.length > 0 ? userMessages.map(msg => (
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
                From: {msg.senderName || 'Unknown'} {msg.senderId === user.id ? '(You)' : ''}
              </p>
              <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">
                {msg.content}
              </p>
            </div>
          )) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-60 min-h-[400px]">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Inbox size={32} />
              </div>
              <p className="text-lg font-medium">No messages yet.</p>
              <p className="text-sm">Your notifications will appear here.</p>
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
                    From {viewingMessage.senderName || 'Unknown'} • {formatTimestamp(viewingMessage.timestamp)}
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
                      alt="Attachment"
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

export default Messages;