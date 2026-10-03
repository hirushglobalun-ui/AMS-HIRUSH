/**
 * File: components/ai/AICopilotDrawer.tsx
 * Purpose: Global AI Assistant Drawer & Floating Widget for Hirush Global AMS.
 * Connects directly to Firestore data to answer questions about attendance, leads, leaves, etc.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { dispatchAiQuery } from '../../services/aiIntentDispatcher';
import { AIMarkdownRenderer } from './AIMarkdownRenderer';
import {
  Sparkles,
  X,
  Send,
  Mic,
  MicOff,
  Bot,
  User as UserIcon,
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
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  queryType?: string;
  hasRealAi?: boolean;
}

const SUGGESTIONS = [
  { label: 'Who was present on Friday?', icon: Calendar, query: 'Who was present last Friday?' },
  { label: 'Active CRM Leads', icon: Briefcase, query: 'Show all ongoing leads in CRM' },
  { label: 'Pending Leaves', icon: HelpCircle, query: 'Are there any pending leave requests?' },
  { label: 'Domain & SSL Health', icon: Globe, query: 'Check custom domain status and SSL health' },
  { label: 'Team Directory', icon: Users, query: 'How many team members in each department?' },
];

export const AICopilotDrawer: React.FC = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [customKey, setCustomKey] = useState<string>('');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello ${user?.name?.split(' ')[0] || 'there'}! 👋 I am the **Hirush AMS Copilot**.\n\nI have direct access to our live database. Ask me anything like:\n- *"Who was present on Friday?"*\n- *"Show all ongoing leads"*\n- *"What leaves are pending?"*\n- You can also ask in **Malayalam** or **English**!`,
      timestamp: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

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
  }, [messages, isOpen]);

  // Speech Recognition Setup (Web Speech API)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        // Supports Malayalam and Indian English
        recognition.lang = 'en-IN';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
          }
          setIsListening(false);
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech recognition error:', err);
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
        toast('Listening... Speak now', { icon: '🎙️' });
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
      // Build history for context
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
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      toast.error('Failed to get answer from AI Assistant');
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: `⚠️ Sorry, I encountered an error while processing that query: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
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

  const saveApiKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hirush_gemini_api_key', customKey.trim());
      toast.success('Gemini API key saved!');
      setShowApiKeyModal(false);
    }
  };

  if (!user || pathname === '/assistant') return null;

  return (
    <>
      {/* Floating Trigger Button */}
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
          <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider backdrop-blur-sm">
            Copilot
          </span>
        </button>
      )}

      {/* Floating / Sliding Chat Drawer */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-in-out flex flex-col bg-white shadow-2xl border border-slate-200/80 rounded-2xl overflow-hidden ${
            isExpanded
              ? 'inset-4 md:inset-8'
              : 'bottom-4 right-4 w-[92vw] sm:w-[440px] md:w-[480px] h-[640px] max-h-[85vh]'
          }`}
        >
          {/* Drawer Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white flex items-center justify-between border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">Hirush Database Copilot</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </div>
                <p className="text-[11px] text-slate-300">Live attendance, CRM & enterprise query</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowApiKeyModal(true)}
                title="Configure Gemini API Key"
                className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Key size={16} />
              </button>
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
                title="Close"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Query Pills */}
          <div className="bg-slate-50 border-b border-slate-100 px-3 py-2 flex items-center gap-1.5 overflow-x-auto custom-scrollbar flex-shrink-0">
            {SUGGESTIONS.map((s, idx) => {
              const Icon = s.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSend(s.query)}
                  disabled={loading}
                  className="whitespace-nowrap flex items-center gap-1.5 text-[11px] font-medium bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 px-2.5 py-1 rounded-full border border-slate-200 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Icon size={12} className="text-indigo-500" />
                  <span>{s.label}</span>
                </button>
              );
            })}
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
                  className={`relative group max-w-[85%] rounded-2xl p-3.5 shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-none'
                      : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-none'
                  }`}
                >
                  {msg.sender === 'ai' ? (
                    <AIMarkdownRenderer content={msg.text} />
                  ) : (
                    <p className="text-xs font-medium leading-relaxed">{msg.text}</p>
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
                    Querying live database & generating answer...
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
                    ? 'Listening... Speak in Malayalam or English'
                    : 'Ask about attendance, leads, Friday presence...'
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
              Hirush AMS AI queries the Firestore database in real-time. Adding your <strong>Google Gemini API Key</strong> enables advanced generative summarization and natural multilingual conversations in Malayalam and English.
            </p>

            <div className="space-y-3 mb-5">
              <label className="text-xs font-bold text-slate-700">Gemini API Key</label>
              <input
                type="password"
                value={customKey}
                onChange={e => setCustomKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400">
                Key is stored securely in your browser and used only for your queries.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveApiKey}
                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow transition-colors"
              >
                Save API Key
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AICopilotDrawer;
