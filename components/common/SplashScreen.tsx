/**
 * @file SplashScreen.tsx
 * @description React component for rendering SplashScreen UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React from 'react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/5 rounded-full blur-3xl animate-pulse delay-700"></div>

      <div className="relative flex flex-col items-center">
        {/* Logo Container with Animation */}
        <div className="relative mb-8 animate-in fade-in zoom-in duration-1000">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
          <img 
            src="/assets/company-logo.png" 
            alt="Hirush Global Logo" 
            className="w-32 h-32 md:w-40 md:h-40 object-contain relative z-10 drop-shadow-2xl"
          />
        </div>

        {/* Text Content */}
        <div className="text-center space-y-3 z-10 animate-in slide-in-from-bottom duration-700 delay-300 fill-mode-both">
          <h1 className="text-3xl md:text-5xl font-bold text-slate-800 tracking-tight">
            Hirush <span className="text-primary italic">Global</span>
          </h1>
          <p className="text-slate-500 font-medium tracking-widest uppercase text-xs md:text-sm">
            Excel in Search Visibility!
          </p>
          
          <div className="pt-8 flex flex-col items-center gap-4">
            {/* Elegant Loading Bar */}
            <div className="w-48 h-1 background rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-[loading_2s_ease-in-out_infinite] origin-left"></div>
            </div>
            <p className="text-slate-400 text-xs font-light">Initializing Secure Console...</p>
          </div>
        </div>
      </div>

      {/* Modern Footer Branding */}
      <div className="absolute bottom-10 text-center animate-in fade-in duration-1000 delay-500 fill-mode-both">
        <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em]">
          Powered by Hirush Tech Solutions
        </p>
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: scaleX(0); opacity: 0.1; }
          50% { transform: scaleX(0.5); opacity: 1; }
          100% { transform: scaleX(1); opacity: 0; }
        }
        
        .animate-in {
          animation-fill-mode: both;
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes zoom-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        @keyframes slide-in-from-bottom {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .animate-fade-in { animation: fade-in 1s ease-out; }
        .animate-zoom-in { animation: zoom-in 1s ease-out; }
        .animate-slide-in-from-bottom { animation: slide-in-from-bottom 0.7s ease-out; }
      `}</style>
    </div>
  );
};

export default SplashScreen;
