"use client";

/**
 * File: Login.tsx
 * Purpose: User authentication interface.
 * Author: Refactored system
 * Notes: Now consumes global AuthContext instead of relying on prop callbacks.
 */

import React, { useState } from 'react';
import Button from './common/Button';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await login(email, password);
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Background blobs matching dashboard */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-100 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-100 rounded-full blur-3xl opacity-40 translate-y-1/3 -translate-x-1/3"></div>

      <div className="w-full max-w-[92%] xs:max-w-sm sm:max-w-md bg-white/70 backdrop-blur-xl rounded-2xl shadow-premium border border-white/50 p-5 sm:p-8 md:p-12 relative z-10 transition-all hover:shadow-2xl hover:bg-white/80">
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-block p-3 sm:p-4 rounded-full bg-white shadow-md mb-4 sm:mb-6">
            <img src="/assets/company-logo.png" alt="Hirush Global Logo" className="h-10 sm:h-12 w-auto" />
          </div>
          <h1 className="text-xl sm:text-3xl font-bold text-slate-800 tracking-tight">Hirush Global</h1>
          <p className="text-xs sm:text-base text-slate-500 mt-1 sm:mt-2 font-medium">Enterprise Management System</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-2" htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-3 text-sm sm:text-base bg-white/50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              placeholder="name@company.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-2" htmlFor="password">Password</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 text-sm sm:text-base bg-white/50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 pr-12 transition-all shadow-sm [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full justify-center py-3.5 text-base font-semibold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all rounded-xl" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default Login;