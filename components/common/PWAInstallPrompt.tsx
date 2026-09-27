/**
 * @file PWAInstallPrompt.tsx
 * @description React component for rendering PWAInstallPrompt UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after 5 seconds delay to not be intrusive
      setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Check if already installed - separate effect to avoid setState in effect
  useEffect(() => {
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setShowPrompt(false);
      }
    };
    checkInstalled();
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for 7 days
    localStorage.setItem('pwa-prompt-dismissed', new Date().toISOString());
  };

  // Check if user dismissed recently - separate effect to avoid setState in effect
  useEffect(() => {
    const checkDismissed = () => {
      const dismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (dismissed) {
        const dismissedDate = new Date(dismissed);
        const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) {
          setShowPrompt(false);
        }
      }
    };
    checkDismissed();
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white shadow-lg rounded-lg border border-gray-200 p-4 z-50 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        aria-label="Close"
      >
        <X size={20} />
      </button>

      <div className="flex items-start gap-3">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Download className="text-primary" size={24} />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            Install Hirush AMS
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Install our app for quick access and offline functionality
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
