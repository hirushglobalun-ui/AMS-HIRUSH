/**
 * File: components/ai/AICopilotDrawer.tsx
 * Purpose: Enterprise AI Copilot Drawer & Floating Widget for Hirush Global AMS.
 * Features: Ctrl+K hotkey, Deterministic-first answers, Dynamic Action Pills, Source Indicators,
 * Sub-second Latency Telemetry, and Admin AI Health Observability.
 * Author: Hirush Global AMS
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { dispatchAiQuery } from '../../services/aiIntentDispatcher';
import { AIMarkdownRenderer } from './AIMarkdownRenderer';
import { getAiHealthMetrics, AIHealthMetrics } from '../../services/aiAuditService';
import { ActionButton } from '../../services/aiDeterministicEngine';
import { Role } from '../../types';
import {
  Sparkles,
  X,
  Send,
  Mic,
  MicOff,
  Bot,
  RefreshCw,
  Key,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Calendar,
  Briefcase,
  Users,
  Globe,
  HelpCircle,
  Activity,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  queryType?: string;
  hasRealAi?: boolean;
  source?: 'verified_db' | 'ai_analysis' | 'general';
  suggestedActions?: ActionButton[];
  latencyMs?: number;
}

const CATEGORY_TABS = ['Quick', 'Attendance', 'Leaves', 'CRM', 'Domains', 'Team', 'Executive'];

const CATEGORY_PROMPTS: Record<string, { label: string; query: string }[]> = {
  Quick: [
    { label: '👥 Today\'s Attendance', query: 'Who is present today?' },
    { label: '❌ Who is Absent?', query: 'Who is absent today?' },
    { label: '📝 Pending Leaves', query: 'Are there any pending leave requests?' },
    { label: '💼 Ongoing CRM Leads', query: 'Show all ongoing leads in CRM' },
    { label: '🌐 Domain Health', query: 'Check custom domain status and SSL health' },
    { label: '📈 Executive Summary', query: 'Give me today\'s executive summary' },
  ],
  Attendance: [
    { label: 'Today', query: 'Who is present today?' },
    { label: 'Yesterday', query: 'Who was present yesterday?' },
    { label: 'Last Friday', query: 'Who was present on Friday?' },
    { label: 'Absentees', query: 'Who is absent today?' },
    { label: 'WFH Staff', query: 'Who is working from home today?' },
    { label: 'Late Check-Ins', query: 'Who checked in late today?' },
    { label: 'This Week', query: 'Attendance for this week' },
  ],
  Leaves: [
    { label: 'Pending Approvals', query: 'Show pending leave requests' },
    { label: 'On Leave Today', query: 'Who is on leave today?' },
    { label: 'Upcoming Leaves', query: 'Show upcoming approved leaves' },
    { label: 'All Leaves Summary', query: 'Show leaves summary' },
  ],
  CRM: [
    { label: 'Ongoing Deals', query: 'Show ongoing CRM leads' },
    { label: 'Proposal Sent', query: 'Show leads in proposal stage' },
    { label: 'Pending Leads', query: 'Show pending leads' },
    { label: 'Pipeline Summary', query: 'Summarize our CRM pipeline' },
  ],
  Domains: [
    { label: 'Expiring in 30 Days', query: 'Which domains are expiring soon?' },
    { label: 'SSL Health', query: 'Any SSL certificate issues on domains?' },
    { label: 'DNS Issues', query: 'Any DNS issues detected?' },
    { label: 'All Domains', query: 'Show all monitored domains' },
  ],
  Team: [
    { label: 'Developers Count', query: 'How many developers in team?' },
    { label: 'Development Dept', query: 'Show members in Development department' },
    { label: 'HR Team', query: 'Show HR department staff' },
    { label: 'Total Employees', query: 'How many total active employees?' },
  ],
  Executive: [
    { label: 'Today\'s Briefing', query: 'Give me today\'s executive summary' },
    { label: 'Attendance Rate', query: 'What is today\'s attendance percentage?' },
    { label: 'Critical Issues', query: 'Any critical domain or leave issues?' },
  ],
};

export const AICopilotDrawer: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Quick');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStatusText, setLoadingStatusText] = useState('Querying live database...');
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthMetrics, setHealthMetrics] = useState<AIHealthMetrics | null>(null);
  const [customKey, setCustomKey] = useState<string>('');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello ${user?.name?.split(' ')[0] || 'there'}! 👋 I am the **Hirush Enterprise AI Copilot**.\n\nI answer factual database queries with **verified ground truth** and zero hallucination:\n- 👥 *"Who is present today?"* / *"Innu aara vannathu?"*\n- ❌ *"Who was absent yesterday?"*\n- 📝 *"Show pending leave requests"*\n- 💼 *"Show ongoing CRM leads"*\n- 🌐 *"Check domain health & SSL"*\n\nPress \`Ctrl + K\` anytime to toggle me. Ask in **English** or **Malayalam**!`,
      timestamp: 'Just now',
      source: 'verified_db',
      suggestedActions: [
        { label: '👥 Who is Present Today?', query: 'Who is present today?' },
        { label: '❌ Who is Absent?', query: 'Who is absent today?' },
        { label: '💼 Active CRM Leads', query: 'Show ongoing CRM leads' },
        { label: '📈 Executive Summary', query: 'Give me today\'s executive summary' },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Keyboard Shortcut: Ctrl + K or Cmd + K to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load custom key from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hirush_gemini_api_key');
      if (stored) setCustomKey(stored);
    }
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  const shouldListenRef = useRef<boolean>(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [voiceLang, setVoiceLang] = useState<'ml-IN' | 'en-IN'>('ml-IN');

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

  // Speech Recognition Setup with Continuous Recognition
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
    setLoadingStatusText('Checking verified database records...');

    try {
      const chatHistory = messages
        .filter(m => m.id !== 'welcome')
        .slice(-6)
        .map(m => ({
          role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
          parts: [{ text: m.text }],
        }));

      const res = await dispatchAiQuery(textToSend, user, chatHistory, customKey || undefined);

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        queryType: res.queryType,
        hasRealAi: res.hasRealAi,
        source: res.source || (res.hasRealAi ? 'ai_analysis' : 'verified_db'),
        suggestedActions: res.suggestedActions,
        latencyMs: res.latencyMs,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      toast.error('Failed to retrieve response');
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: `⚠️ Sorry, I encountered an issue retrieving that data right now. Please try again.`,
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

  const saveApiKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hirush_gemini_api_key', customKey.trim());
      toast.success('Gemini API key saved!');
      setShowApiKeyModal(false);
    }
  };

  const openHealthModal = () => {
    setHealthMetrics(getAiHealthMetrics());
    setShowHealthModal(true);
  };

  if (!user || pathname === '/assistant') return null;

  return (
    <>
      {/* Floating Trigger Button with Keyboard Shortcut Badge */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-full shadow-2xl hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-300 group border border-white/20"
          aria-label="Open Hirush AI Assistant"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          </div>
          <span className="font-semibold text-sm tracking-wide">Hirush AI</span>
          <span className="bg-black/30 border border-white/20 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold tracking-tight">
            Ctrl+K
          </span>
        </button>
      )}

      {/* Floating / Sliding Chat Drawer */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-in-out flex flex-col bg-white shadow-2xl border border-slate-200/80 rounded-2xl overflow-hidden ${
            isExpanded
              ? 'inset-4 md:inset-8'
              : 'bottom-4 right-4 w-[92vw] sm:w-[460px] md:w-[500px] h-[660px] max-h-[88vh]'
          }`}
        >
          {/* Drawer Header */}
          <div className="p-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white flex items-center justify-between border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">Hirush Database Copilot</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <p className="text-[11px] text-slate-300 flex items-center gap-1.5">
                  <span>Deterministic First</span>
                  <span>•</span>
                  <span>Live Firestore</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setMessages(messages.slice(0, 1))}
                title="Clear Chat"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <RefreshCw size={16} />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Minimize' : 'Maximize'}
                className="hidden sm:block p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close (Ctrl+K)"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Category Switcher Tabs */}
          <div className="bg-slate-100/90 border-b border-slate-200/80 px-3 py-1.5 flex items-center gap-1 overflow-x-auto custom-scrollbar flex-shrink-0">
            {CATEGORY_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveCategory(tab)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === tab
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Quick Query Sub-Pills for the Active Category */}
          <div className="bg-slate-50 border-b border-slate-200/60 px-3 py-2 flex items-center gap-1.5 overflow-x-auto custom-scrollbar flex-shrink-0">
            {(CATEGORY_PROMPTS[activeCategory] || CATEGORY_PROMPTS.Quick).map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s.query)}
                disabled={loading}
                className="whitespace-nowrap flex items-center gap-1 text-[11px] font-medium bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 px-2.5 py-1 rounded-full border border-slate-200/80 transition-colors shadow-xs disabled:opacity-50"
              >
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 custom-scrollbar">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5 shadow-sm">
                    <Sparkles size={14} className="text-amber-300" />
                  </div>
                )}

                <div
                  className={`relative group max-w-[88%] rounded-2xl p-3.5 shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-none'
                      : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-none'
                  }`}
                >
                  {/* Source Indicator Badge */}
                  {msg.sender === 'ai' && (
                    <div className="mb-2 flex items-center gap-2 flex-wrap">
                      {msg.source === 'verified_db' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <ShieldCheck size={11} className="text-emerald-600" />
                          <span>Verified AMS Data</span>
                          {msg.latencyMs !== undefined && (
                            <span className="text-emerald-500 font-mono font-normal">· {msg.latencyMs}ms</span>
                          )}
                        </span>
                      )}
                      {msg.source === 'ai_analysis' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                          <Zap size={11} className="text-purple-600" />
                          <span>AI Analysis · Live AMS Data</span>
                          {msg.latencyMs !== undefined && (
                            <span className="text-purple-500 font-mono font-normal">· {(msg.latencyMs / 1000).toFixed(1)}s</span>
                          )}
                        </span>
                      )}
                      {msg.source === 'general' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          <span>ℹ Assistant Notice</span>
                        </span>
                      )}
                    </div>
                  )}

                  {msg.sender === 'ai' ? (
                    <AIMarkdownRenderer content={msg.text} />
                  ) : (
                    <p className="text-xs font-medium leading-relaxed">{msg.text}</p>
                  )}

                  {/* Interactive Action Buttons attached to response */}
                  {msg.sender === 'ai' && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {msg.suggestedActions.map((act, actIdx) => (
                        <button
                          key={actIdx}
                          onClick={() => handleActionClick(act)}
                          disabled={loading}
                          className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 transition-colors disabled:opacity-50"
                        >
                          <span>{act.label}</span>
                          <ArrowRight size={10} className="text-indigo-500" />
                        </button>
                      ))}
                    </div>
                  )}

                  <div
                    className={`flex items-center justify-between gap-2 mt-2 pt-1 border-t text-[10px] ${
                      msg.sender === 'user'
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
                          <Check size={12} className="text-emerald-500" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5 shadow-sm font-bold">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-start">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs flex-shrink-0 shadow-sm animate-pulse">
                  <Sparkles size={14} className="text-amber-300" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-xs text-slate-500 font-medium ml-1">
                    {loadingStatusText}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200 flex-shrink-0">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-2 rounded-xl transition-all ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
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
                    ? 'Listening... Speak in Malayalam or English'
                    : 'Ask AMS anything (e.g. Who is present today? / Innu aara vannathu?)'
                }
                disabled={loading}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-xl shadow-md transition-colors disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin AI Health & Latency Telemetry Modal */}
      {showHealthModal && healthMetrics && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <Activity size={20} />
                <h3>AI Copilot Health & Telemetry</h3>
              </div>
              <button
                onClick={() => setShowHealthModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Requests Today</div>
                  <div className="text-xl font-bold text-slate-900">{healthMetrics.totalRequestsToday}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Avg Latency</div>
                  <div className="text-xl font-bold text-emerald-600">{healthMetrics.averageLatencyMs} ms</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Deterministic %</div>
                  <div className="text-xl font-bold text-indigo-600">{healthMetrics.deterministicPercentage}%</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Cache Hit %</div>
                  <div className="text-xl font-bold text-purple-600">{healthMetrics.cacheHitPercentage}%</div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] leading-relaxed">
                ✓ <strong>Database-First Engine Active</strong>: Simple queries are delivered with verified Firestore records at zero Gemini API cost.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gemini API Key Configuration Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-indigo-600 font-bold">
                <Key size={20} />
                <h3>Google Gemini API Configuration</h3>
              </div>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Hirush AMS Copilot runs on a <strong>Deterministic Database Engine</strong> by default. Adding a <strong>Google Gemini API Key</strong> enables deep multilingual synthesis, reasoning, and comparative operational analytics.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Gemini API Key</label>
                <input
                  type="password"
                  value={customKey}
                  onChange={e => setCustomKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApiKeyModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveApiKey}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                >
                  Save Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
