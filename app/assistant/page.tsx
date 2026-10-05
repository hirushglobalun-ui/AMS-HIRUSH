/**
 * File: app/assistant/page.tsx
 * Purpose: Dedicated full-screen AI Assistant & Enterprise Copilot Command Center.
 * Ultra-modern, premium UI with real-time KPI streaming, interactive action pills,
 * glassmorphic design, and instant deterministic answering.
 * Author: Hirush Global AMS
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { AuthGuard } from '../../components/layout/AuthGuard';
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
  ShieldCheck,
  Zap,
  Activity,
  ChevronRight,
  Clock,
  Layers,
} from 'lucide-react';
import { dispatchAiQuery } from '../../services/aiIntentDispatcher';
import { queryExecutiveSnapshot } from '../../services/aiDataQueryService';
import { ActionButton } from '../../services/aiDeterministicEngine';
import { AIMarkdownRenderer } from '../../components/ai/AIMarkdownRenderer';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  queryType?: string;
  source?: 'verified_db' | 'ai_analysis' | 'general';
  suggestedActions?: ActionButton[];
  latencyMs?: number;
}

const CATEGORIES = [
  { id: 'popular', label: '⚡ Popular' },
  { id: 'attendance', label: '👥 Attendance' },
  { id: 'crm', label: '💼 CRM Deals' },
  { id: 'leaves', label: '🏖️ Leaves' },
  { id: 'domains', label: '🌐 Domains & SSL' },
  { id: 'executive', label: '📈 Executive' },
];

const PROMPT_SUGGESTIONS: Record<string, { title: string; desc: string; query: string; icon: any; gradient: string }[]> = {
  popular: [
    {
      title: 'Today\'s Attendance',
      desc: 'Check live presence, absentees, and WFH',
      query: 'Who is present today?',
      icon: Users,
      gradient: 'from-blue-600 to-indigo-600',
    },
    {
      title: 'Ongoing CRM Leads',
      desc: 'Active deals, client POCs and pipelines',
      query: 'Show all ongoing leads in CRM',
      icon: Briefcase,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      title: 'Pending Leave Approvals',
      desc: 'Unapproved leave and WFH submissions',
      query: 'Are there any pending leave requests?',
      icon: HelpCircle,
      gradient: 'from-rose-500 to-pink-600',
    },
    {
      title: 'Domain & SSL Health',
      desc: 'Expiring domains and certificate audit',
      query: 'Check custom domain status and SSL health',
      icon: Globe,
      gradient: 'from-emerald-500 to-teal-600',
    },
  ],
  attendance: [
    {
      title: 'Who is Absent Today?',
      desc: 'Staff members not checked in',
      query: 'Who is absent today?',
      icon: Users,
      gradient: 'from-rose-500 to-pink-600',
    },
    {
      title: 'Work From Home Staff',
      desc: 'Remote check-ins recorded',
      query: 'Who is working from home today?',
      icon: Users,
      gradient: 'from-purple-500 to-indigo-600',
    },
    {
      title: 'Friday Attendance',
      desc: 'Office attendance from last Friday',
      query: 'Who was present on Friday?',
      icon: Calendar,
      gradient: 'from-blue-500 to-cyan-600',
    },
    {
      title: 'Late Check-Ins',
      desc: 'Punched in after 09:30 AM',
      query: 'Who checked in late today?',
      icon: Clock,
      gradient: 'from-amber-500 to-yellow-600',
    },
  ],
  crm: [
    {
      title: 'Ongoing Deals',
      desc: 'Projects in active execution',
      query: 'Show ongoing CRM leads',
      icon: Briefcase,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      title: 'Proposals Sent',
      desc: 'Awaiting client approvals',
      query: 'Show leads in proposal stage',
      icon: Briefcase,
      gradient: 'from-indigo-500 to-purple-600',
    },
    {
      title: 'Pipeline Summary',
      desc: 'Lead counts by current stage',
      query: 'Summarize our CRM pipeline',
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'All Active Clients',
      desc: 'Full portfolio overview',
      query: 'List all active client projects',
      icon: Globe,
      gradient: 'from-blue-500 to-indigo-600',
    },
  ],
  leaves: [
    {
      title: 'Pending Approvals',
      desc: 'Requires management action',
      query: 'Show pending leave requests',
      icon: HelpCircle,
      gradient: 'from-rose-500 to-pink-600',
    },
    {
      title: 'On Leave Today',
      desc: 'Staff absent on approved leave',
      query: 'Who is on leave today?',
      icon: Calendar,
      gradient: 'from-purple-500 to-indigo-600',
    },
    {
      title: 'Upcoming Leaves',
      desc: 'Scheduled vacations this month',
      query: 'Show upcoming approved leaves',
      icon: Clock,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      title: 'Department Leaves',
      desc: 'Absence distribution by team',
      query: 'Show leave distribution by department',
      icon: Layers,
      gradient: 'from-blue-500 to-cyan-600',
    },
  ],
  domains: [
    {
      title: 'Expiring in 30 Days',
      desc: 'Domains nearing registration expiry',
      query: 'Which domains are expiring in the next 30 days?',
      icon: Globe,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      title: 'SSL Certificate Issues',
      desc: 'Certificates expiring or invalid',
      query: 'Any SSL certificate issues on domains?',
      icon: ShieldCheck,
      gradient: 'from-rose-500 to-pink-600',
    },
    {
      title: 'DNS Health Check',
      desc: 'Nameserver and DNS status',
      query: 'Any DNS issues detected?',
      icon: Activity,
      gradient: 'from-indigo-500 to-blue-600',
    },
    {
      title: 'All Domains Overview',
      desc: 'Complete portfolio health',
      query: 'Check custom domain status and SSL health',
      icon: Globe,
      gradient: 'from-emerald-500 to-teal-600',
    },
  ],
  executive: [
    {
      title: 'Executive Snapshot',
      desc: 'Consolidated enterprise briefing',
      query: 'Give me today\'s executive summary',
      icon: TrendingUp,
      gradient: 'from-indigo-600 to-purple-600',
    },
    {
      title: 'Attendance Rate',
      desc: 'Today\'s percentage vs total staff',
      query: 'What is today\'s attendance percentage?',
      icon: Users,
      gradient: 'from-blue-600 to-indigo-600',
    },
    {
      title: 'Critical Alerts',
      desc: 'Urgent domain and leave items',
      query: 'Any critical domain or leave issues?',
      icon: HelpCircle,
      gradient: 'from-rose-600 to-red-600',
    },
    {
      title: 'Team Directory',
      desc: 'Staff count by department',
      query: 'How many team members in each department?',
      icon: Layers,
      gradient: 'from-emerald-600 to-teal-600',
    },
  ],
};

export default function AssistantPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Querying live database...');
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string>('popular');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `### 🌟 Welcome to Hirush Enterprise Intelligence Copilot\n\nI answer your operational questions with **verified live Firestore ground truth** and sub-second deterministic intelligence:\n\n- 👥 *"Who is present today?"* (or in Malayalam: *"Innu aara vannathu?"*)\n- ❌ *"Who was absent yesterday?"*\n- 📝 *"Show all pending leave requests"*\n- 💼 *"Show all ongoing leads with client POC names"*\n- 🌐 *"Which domains are expiring in the next 30 days?"*\n\nSelect a quick action card above, click any suggestion, or type below in **English** or **Malayalam**!`,
      timestamp: 'Just now',
      source: 'verified_db',
      suggestedActions: [
        { label: '👥 Who is Present Today?', query: 'Who is present today?' },
        { label: '❌ Absent Staff', query: 'Who is absent today?' },
        { label: '💼 Ongoing CRM Deals', query: 'Show all ongoing leads in CRM' },
        { label: '📈 Executive Summary', query: 'Give me today\'s executive summary' },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef<boolean>(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [voiceLang, setVoiceLang] = useState<'ml-IN' | 'en-IN'>('ml-IN');

  useEffect(() => {
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

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const resetSilenceTimer = () => {
    clearSilenceTimer();
    // Allow up to 5 seconds of pause before gracefully completing speech
    silenceTimerRef.current = setTimeout(() => {
      if (shouldListenRef.current && recognitionRef.current) {
        shouldListenRef.current = false;
        try {
          recognitionRef.current.stop();
        } catch (_) {}
        setIsListening(false);
      }
    }, 5000);
  };

  // Web Speech API with Continuous Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = voiceLang;

        recognition.onresult = (event: any) => {
          let accumulatedFinal = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              accumulatedFinal += event.results[i][0].transcript;
            }
          }
          if (accumulatedFinal) {
            setInput(prev => {
              const cleaned = prev.trim();
              const addition = accumulatedFinal.trim();
              return cleaned ? `${cleaned} ${addition}` : addition;
            });
          }
          resetSilenceTimer();
        };

        recognition.onerror = (err: any) => {
          if (err.error === 'no-speech') {
            return;
          }
          console.warn('Speech recognition error:', err);
          shouldListenRef.current = false;
          clearSilenceTimer();
          setIsListening(false);
        };

        recognition.onend = () => {
          if (shouldListenRef.current) {
            try {
              recognition.start();
            } catch (_) {
              setIsListening(false);
              shouldListenRef.current = false;
            }
          } else {
            setIsListening(false);
            clearSilenceTimer();
          }
        };

        recognitionRef.current = recognition;
      }
    }
    return () => {
      clearSilenceTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, [voiceLang]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('hirush_voice_lang') as 'ml-IN' | 'en-IN';
      if (savedLang) setVoiceLang(savedLang);
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error('Voice recognition is not supported in this browser.');
      return;
    }

    if (isListening || shouldListenRef.current) {
      shouldListenRef.current = false;
      clearSilenceTimer();
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    } else {
      try {
        shouldListenRef.current = true;
        recognitionRef.current.lang = voiceLang;
        recognitionRef.current.start();
        setIsListening(true);
        resetSilenceTimer();
        toast(
          voiceLang === 'ml-IN'
            ? 'കേൾക്കുന്നു... സംസാരിച്ചോളൂ'
            : 'Listening... Speak continuously',
          { icon: '🎙️' }
        );
      } catch (e) {
        console.error(e);
        shouldListenRef.current = false;
        setIsListening(false);
      }
    }
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || !user || loading) return;

    if (shouldListenRef.current && recognitionRef.current) {
      shouldListenRef.current = false;
      clearSilenceTimer();
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setLoadingText('Fetching live AMS data & preparing your answer...');

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
        source: res.source || (res.hasRealAi ? 'ai_analysis' : 'verified_db'),
        suggestedActions: res.suggestedActions,
        latencyMs: res.latencyMs,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      toast.error('Failed to get answer from AI Assistant');
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: `⚠️ I encountered an issue retrieving that data. Please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: 'general',
          suggestedActions: [
            { label: 'Today\'s Attendance', query: 'Who is present today?' },
            { label: 'Executive Summary', query: 'Give me today\'s executive summary' },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: ActionButton) => {
    if (action.route) {
      router.push(action.route);
      return;
    }
    if (action.query) {
      handleSend(action.query);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentPrompts = PROMPT_SUGGESTIONS[activeCategory] || PROMPT_SUGGESTIONS.popular;

  return (
    <AuthGuard>
      <div className="space-y-6 max-w-7xl mx-auto pb-8">
        {/* Flagship Hero Command Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl p-6 sm:p-8 text-white">
          {/* Ambient Lighting Gradients */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-600/30 to-purple-600/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-gradient-to-tr from-blue-600/20 to-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 backdrop-blur-md">
                  <Sparkles size={13} className="text-indigo-400 animate-pulse" />
                  <span>Sub-Second Intelligence</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 backdrop-blur-md">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span>100% Ground Truth</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-slate-300 text-[11px] font-medium border border-white/10">
                  <span>Gemini 3.8 Flash Active</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                Hirush Global AMS AI Copilot
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Enterprise neural assistant querying live Firestore collections in real-time. Ask operational questions in natural English, Malayalam, or Manglish.
              </p>
            </div>

            {/* Live KPI Metric Chips */}
            {stats && (
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3 flex-shrink-0">
                <div className="group relative overflow-hidden rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 p-3 sm:p-4 text-center backdrop-blur-md transition-all">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-2.5 right-2.5" />
                  <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider block">Present Today</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight mt-0.5 block">{stats.presentToday}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Checked In</span>
                </div>

                <div className="group relative overflow-hidden rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 p-3 sm:p-4 text-center backdrop-blur-md transition-all">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-2.5 right-2.5" />
                  <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider block">Active Leads</span>
                  <span className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight mt-0.5 block">{stats.ongoingLeads}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">In Pipeline</span>
                </div>

                <div className="group relative overflow-hidden rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 p-3 sm:p-4 text-center backdrop-blur-md transition-all">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400 absolute top-2.5 right-2.5" />
                  <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider block">Pending Leaves</span>
                  <span className="text-xl sm:text-2xl font-black text-rose-400 tracking-tight mt-0.5 block">{stats.pendingLeaves}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Need Approval</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-102'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                }`}
            >
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Prompt Suggestion Cards (Dynamic per Category) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {currentPrompts.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSend(item.query)}
                disabled={loading}
                className="group relative overflow-hidden p-4 bg-white hover:bg-gradient-to-br hover:from-white hover:to-indigo-50/50 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-indigo-400/60 hover:-translate-y-1 transition-all duration-300 text-left flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-110 transition-transform`}>
                    <Icon size={19} />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-slate-50 group-hover:bg-indigo-600 text-slate-400 group-hover:text-white flex items-center justify-center transition-colors">
                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1 leading-normal font-normal">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Central Chat Workspace */}
        <div className="flex flex-col h-[650px] sm:h-[720px] rounded-3xl bg-white border border-slate-200/90 shadow-xl overflow-hidden">
          {/* Top Session Bar */}
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute inset-0 opacity-75" />
                <div className="w-3 h-3 rounded-full bg-emerald-500 relative" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">Live Database Session</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    Deterministic Ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Real-time synchronization with Firestore</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMessages(messages.slice(0, 1))}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-200/60 transition-colors"
                title="Reset conversation"
              >
                <RefreshCw size={13} />
                <span>Clear Chat</span>
              </button>
            </div>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-gradient-to-b from-slate-50/40 via-white to-slate-50/20 custom-scrollbar">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end items-end' : 'justify-start items-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5 shadow-md shadow-indigo-500/20">
                    <Sparkles size={17} className="text-amber-300" />
                  </div>
                )}

                <div
                  className={`relative group max-w-[92%] sm:max-w-[85%] rounded-3xl p-4 sm:p-5 shadow-sm ${msg.sender === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-xs shadow-indigo-500/20'
                      : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs'
                    }`}
                >
                  {/* Source Indicator Tag for AI */}
                  {msg.sender === 'ai' && (
                    <div className="mb-2.5 flex items-center gap-2 flex-wrap">
                      {msg.source === 'verified_db' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                          <ShieldCheck size={12} className="text-emerald-600" />
                          <span>Verified AMS Data</span>
                          {msg.latencyMs !== undefined && (
                            <span className="text-emerald-500 font-mono font-normal">· {msg.latencyMs}ms</span>
                          )}
                        </span>
                      )}
                      {msg.source === 'ai_analysis' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 shadow-2xs">
                          <Zap size={12} className="text-purple-600" />
                          <span>AI Analysis · Live AMS Data</span>
                          {msg.latencyMs !== undefined && (
                            <span className="text-purple-500 font-mono font-normal">· {(msg.latencyMs / 1000).toFixed(1)}s</span>
                          )}
                        </span>
                      )}
                      {msg.source === 'general' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          <span>ℹ System Notice</span>
                        </span>
                      )}
                    </div>
                  )}

                  {msg.sender === 'ai' ? (
                    <AIMarkdownRenderer content={msg.text} />
                  ) : (
                    <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  )}

                  {/* Interactive Suggested Action Buttons */}
                  {msg.sender === 'ai' && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                      {msg.suggestedActions.map((act, actIdx) => (
                        <button
                          key={actIdx}
                          onClick={() => handleActionClick(act)}
                          disabled={loading}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-indigo-50/90 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 transition-all hover:scale-102 active:scale-98 disabled:opacity-50"
                        >
                          <span>{act.label}</span>
                          <ArrowRight size={11} className="text-indigo-500" />
                        </button>
                      ))}
                    </div>
                  )}

                  <div
                    className={`flex items-center justify-between gap-3 mt-3 pt-1.5 border-t text-[10px] ${msg.sender === 'user'
                        ? 'border-indigo-500/40 text-indigo-200'
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
                  <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xs flex-shrink-0 shadow-md font-bold ring-2 ring-white">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3.5 items-start">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white flex items-center justify-center text-xs flex-shrink-0 shadow-md shadow-indigo-500/20 animate-pulse">
                  <Sparkles size={17} className="text-amber-300" />
                </div>
                <div className="bg-white border border-slate-200 rounded-3xl rounded-bl-xs p-4 shadow-sm flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-bounce" />
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-xs text-slate-600 font-semibold ml-1">
                    {loadingText}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Floating Command Bar */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200/90 flex-shrink-0">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 sm:gap-3 bg-slate-50 border border-slate-200/90 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent focus-within:bg-white transition-all shadow-inner"
            >
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-2.5 rounded-xl transition-all ${isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-white text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200/80 shadow-xs'
                  }`}
                title={isListening ? 'Stop Listening' : `Voice Input (${voiceLang === 'ml-IN' ? 'മലയാളം' : 'English'})`}
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
                    : 'Ask anything about AMS (e.g. "Who is present today?", "Innu aara vannathu?", "Active leads")...'
                }
                disabled={loading}
                className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-slate-200 disabled:to-slate-300 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:cursor-not-allowed flex-shrink-0 text-xs sm:text-sm active:scale-95"
              >
                <Send size={15} />
                <span className="hidden sm:inline">Ask AI</span>
              </button>
            </form>

            <div className="mt-2 px-2 flex items-center justify-between text-[11px] text-slate-400">
              <span className="hidden sm:inline">💡 Tip: You can query in English, Malayalam script, or Manglish.</span>
              <span className="font-mono text-[10px] text-slate-400">Press Enter ↵ to send</span>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
