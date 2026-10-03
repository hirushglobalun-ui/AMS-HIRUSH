/**
 * File: app/assistant/page.tsx
 * Purpose: Dedicated full-screen AI Assistant & Enterprise Copilot Command Center.
 * Provides deep database queries, live analytical KPI snapshots, and conversational assistant.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthGuard } from '../../components/layout/AuthGuard';
import Card from '../../components/common/Card';
import {
  Sparkles,
  Bot,
  Send,
  Mic,
  MicOff,
  Calendar,
  Briefcase,
  HelpCircle,
  Globe,
  Users,
  Copy,
  Check,
  RefreshCw,
  Database,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { dispatchAiQuery } from '../../services/aiIntentDispatcher';
import { queryExecutiveSnapshot } from '../../services/aiDataQueryService';
import { AIMarkdownRenderer } from '../../components/ai/AIMarkdownRenderer';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  queryType?: string;
}

const QUICK_ACTIONS = [
  {
    title: 'Friday Attendance',
    desc: 'Who attended office & worked last Friday',
    query: 'Who was present last Friday?',
    icon: Calendar,
    color: 'from-blue-500 to-indigo-600',
  },
  {
    title: 'CRM Ongoing Leads',
    desc: 'Active projects, POCs and client pipelines',
    query: 'List all ongoing leads with client details',
    icon: Briefcase,
    color: 'from-amber-500 to-orange-600',
  },
  {
    title: 'Pending Leave Auditing',
    desc: 'Unapproved leave & WFH submissions',
    query: 'Show all pending leave requests and dates',
    icon: HelpCircle,
    color: 'from-rose-500 to-pink-600',
  },
  {
    title: 'Domain Health & SSL',
    desc: 'Expiring domains and certificate status',
    query: 'Check custom domains health and SSL status',
    icon: Globe,
    color: 'from-emerald-500 to-teal-600',
  },
];

export default function AssistantPage() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `### 🌟 Welcome to Hirush Enterprise Intelligence Copilot\n\nI am connected directly to your live **Firebase Cloud Firestore** database.\n\nYou can ask me natural questions in **English** or **Malayalam** (Manglish), such as:\n- *"Who was present on Friday?"*\n- *"Aaraayirunnu vellikizhaacha vannathu?"*\n- *"Show all ongoing leads with client POC names"*\n- *"Which domains are expiring in the next 30 days?"*\n\nSelect a quick action card above or type your question below!`,
      timestamp: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Load snapshot KPI metrics
    const loadSnapshot = async () => {
      try {
        const snap = await queryExecutiveSnapshot();
        setStats(snap);
      } catch (err) {
        console.warn('Could not load executive snapshot:', err);
      }
    };
    loadSnapshot();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Web Speech API for voice queries
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-IN';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
          }
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
          toast.error('Voice input error. Please try again.');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error('Voice recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast('Listening... Speak in Malayalam or English', { icon: '🎙️' });
      } catch (e) {
        console.error(e);
        setIsListening(false);
      }
    }
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || !user || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const chatHistory = messages
        .filter(m => m.id !== 'welcome')
        .slice(-6)
        .map(m => ({
          role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
          parts: [{ text: m.text }],
        }));

      const res = await dispatchAiQuery(textToSend, user, chatHistory);

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        queryType: res.queryType,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      toast.error('Failed to get answer from AI Assistant');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AuthGuard>
      <div className="space-y-5">
        {/* Header Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 text-white shadow-md border border-slate-800">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold mb-2.5 border border-white/10 backdrop-blur-xs">
                  <Sparkles size={13} />
                  <span>Real-Time Database Intelligence</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                  Hirush AMS AI Copilot
                </h1>
                <p className="mt-1 text-xs text-slate-300 max-w-xl leading-relaxed">
                  Conversational assistant querying your live Firestore database for Attendance, CRM Leads, Leave Auditing, and Domain Health.
                </p>
              </div>

              {stats && (
                <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 text-center border border-white/10 min-w-[85px]">
                    <span className="text-[10px] text-slate-300 font-bold uppercase block tracking-wider">Present Today</span>
                    <span className="text-lg font-black text-emerald-400">{stats.presentToday}</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 text-center border border-white/10 min-w-[85px]">
                    <span className="text-[10px] text-slate-300 font-bold uppercase block tracking-wider">Active Leads</span>
                    <span className="text-lg font-black text-amber-400">{stats.ongoingLeads}</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 text-center border border-white/10 min-w-[85px]">
                    <span className="text-[10px] text-slate-300 font-bold uppercase block tracking-wider">Pending Leaves</span>
                    <span className="text-lg font-black text-rose-400">{stats.pendingLeaves}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Suggestion Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {QUICK_ACTIONS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSend(item.query)}
                  disabled={loading}
                  className="group p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all text-left flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-xs`}
                    >
                      <Icon size={18} />
                    </div>
                    <ArrowRight
                      size={15}
                      className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Main Conversational Workspace */}
          <Card className="flex flex-col h-[560px] sm:h-[620px] p-0 overflow-hidden shadow-xs border border-slate-200/90 bg-white">
            {/* Top Workspace Bar */}
            <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-700">Live Database Session</span>
                <span className="text-[11px] text-slate-400">• Firestore Authenticated</span>
              </div>
              <button
                onClick={() => setMessages(messages.slice(0, 1))}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-200/60 transition-colors"
                title="Reset conversation"
              >
                <RefreshCw size={13} />
                <span>Clear</span>
              </button>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30 custom-scrollbar">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end items-end' : 'justify-start items-start'}`}
                >
                  {msg.sender === 'ai' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5 shadow-sm">
                      <Sparkles size={16} className="text-amber-300" />
                    </div>
                  )}

                  <div
                    className={`relative group max-w-[90%] sm:max-w-[85%] rounded-2xl p-4 shadow-2xs ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                    }`}
                  >
                    {msg.sender === 'ai' ? (
                      <AIMarkdownRenderer content={msg.text} />
                    ) : (
                      <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    )}

                    <div
                      className={`flex items-center justify-between gap-3 mt-2.5 pt-1.5 border-t text-[10px] ${
                        msg.sender === 'user'
                          ? 'border-indigo-500/50 text-indigo-200'
                          : 'border-slate-100 text-slate-400'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {msg.sender === 'ai' && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-slate-600 p-0.5"
                          title="Copy Response"
                        >
                          {copiedId === msg.id ? (
                            <Check size={13} className="text-emerald-500" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs flex-shrink-0 shadow-xs font-bold ring-2 ring-white">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center text-xs flex-shrink-0 shadow-sm animate-pulse">
                    <Sparkles size={16} className="text-amber-300" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 shadow-2xs flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-xs text-slate-500 font-medium ml-1">
                      Querying live Firestore collections & generating answer...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form Bar */}
            <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2 sm:gap-3"
              >
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`p-2.5 rounded-xl transition-all ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-slate-100 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                  title={isListening ? 'Stop Listening' : 'Voice Input (Malayalam/English)'}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={
                    isListening
                      ? 'Listening... Speak now in Malayalam or English'
                      : 'Ask anything about database details (e.g. "Who was present on Friday?", "Active leads")...'
                  }
                  disabled={loading}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-50"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="px-4 sm:px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-xl font-bold shadow-xs transition-all flex items-center gap-2 disabled:cursor-not-allowed flex-shrink-0 text-xs sm:text-sm"
                >
                  <Send size={15} />
                  <span>Ask AI</span>
                </button>
              </form>
            </div>
          </Card>
        </div>
    </AuthGuard>
  );
}
