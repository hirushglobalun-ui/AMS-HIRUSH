"use client";

import { useEffect } from 'react';

/**
 * Client-side PWA service worker registration.
 * Registers /sw.js on mount if supported by the browser.
 */
export const SWRegister: React.FC = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('PWA Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('PWA Service Worker registration failed:', err);
        });
    }
  }, []);

  return null;
};
