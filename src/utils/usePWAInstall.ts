import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const FIVE_MINUTES_SECONDS = 300; // 5 minutes
const STORAGE_TIME_KEY = 'bgmi_pwa_time_spent_seconds';
const STORAGE_PROMPT_SEEN_KEY = 'bgmi_pwa_5min_prompt_seen';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_TIME_KEY);
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [hasSpent5Minutes, setHasSpent5Minutes] = useState<boolean>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_TIME_KEY);
      const seconds = saved ? parseInt(saved, 10) || 0 : 0;
      return seconds >= FIVE_MINUTES_SECONDS;
    } catch {
      return false;
    }
  });

  // Track session duration
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpentSeconds((prev) => {
        const next = prev + 1;
        try {
          sessionStorage.setItem(STORAGE_TIME_KEY, String(next));
        } catch {
          // Ignore storage errors in strict privacy modes
        }
        if (next >= FIVE_MINUTES_SECONDS) {
          setHasSpent5Minutes(true);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check standalone mode and platform
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect standalone display mode (app already installed and running as PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    setIsInstalled(Boolean(isStandalone));

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(Boolean(isIOSDevice));

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Trigger install prompt
  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'manual_instructions'> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
        }
        return outcome;
      } catch (err) {
        console.error('PWA install prompt error:', err);
        return 'manual_instructions';
      }
    }
    // If browser doesn't support beforeinstallprompt (iOS or already prompted)
    return 'manual_instructions';
  }, [deferredPrompt]);

  // Dev helper to fast-forward timer to 5 minutes immediately for testing/verification
  const fastForwardTo5Minutes = useCallback(() => {
    setTimeSpentSeconds(FIVE_MINUTES_SECONDS + 1);
    setHasSpent5Minutes(true);
    try {
      sessionStorage.setItem(STORAGE_TIME_KEY, String(FIVE_MINUTES_SECONDS + 1));
    } catch {
      // ignore
    }
  }, []);

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    timeSpentSeconds,
    hasSpent5Minutes,
    install,
    fastForwardTo5Minutes,
  };
}
