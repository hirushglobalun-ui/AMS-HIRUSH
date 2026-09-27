/**
 * @file usePWAInstall.ts
 * @description Provides logic and utilities for usePWAInstall.
 * @module hooks
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWAInstall = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
            console.log('PWA install prompt is ready');
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
                setIsInstalled(true);
                setIsInstallable(false);
            }
        };

        checkInstalled();
    }, []);

    const installApp = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
                toast.success('App installed successfully!');
                setIsInstalled(true);
                setIsInstallable(false);
            }

            setDeferredPrompt(null);
        } else {
            // Manual instructions
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isAndroid = /Android/.test(navigator.userAgent);

            if (isIOS) {
                toast.success('Tap Share and selecting "Add to Home Screen"', { icon: '📱' });
            } else if (isAndroid) {
                toast.success('Tap menu (⋮) and select "Add to Home Screen"', { icon: '📱' });
            } else {
                toast.success('Look for the install icon (⬇️ or ➕) in your browser address bar', { icon: '💻', duration: 4000 });
            }
        }
    };

    return { isInstalled, isInstallable, installApp };
};
