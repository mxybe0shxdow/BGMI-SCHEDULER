import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { Download, Sparkles, X, Share, PlusSquare, Monitor, Smartphone, CheckCircle2, Clock } from 'lucide-react';

interface PWAInstallBannerProps {
  // Option to trigger modal from header button
  showModalTrigger?: boolean;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = () => {
  const {
    isInstalled,
    isIOS,
    timeSpentSeconds,
    hasSpent5Minutes,
    install,
    fastForwardTo5Minutes,
  } = usePWAInstall();

  const [showAutoPopup, setShowAutoPopup] = useState<boolean>(false);
  const [showManualGuide, setShowManualGuide] = useState<boolean>(false);
  const [hasDismissedAutoPopup, setHasDismissedAutoPopup] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('bgmi_pwa_dismissed_auto_popup') === 'true';
    } catch {
      return false;
    }
  });

  // When 5 minutes is reached, trigger auto-popup if not installed and not previously dismissed
  useEffect(() => {
    if (hasSpent5Minutes && !isInstalled && !hasDismissedAutoPopup) {
      setShowAutoPopup(true);
    }
  }, [hasSpent5Minutes, isInstalled, hasDismissedAutoPopup]);

  // Don't render anything if already installed as standalone PWA
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    const outcome = await install();
    if (outcome === 'accepted') {
      setShowAutoPopup(false);
      setShowManualGuide(false);
    } else if (outcome === 'manual_instructions' || isIOS) {
      setShowAutoPopup(false);
      setShowManualGuide(true);
    }
  };

  const handleDismissAutoPopup = () => {
    setShowAutoPopup(false);
    setHasDismissedAutoPopup(true);
    try {
      sessionStorage.setItem('bgmi_pwa_dismissed_auto_popup', 'true');
    } catch {
      // ignore
    }
  };

  // Format time remaining or elapsed
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <>
      {/* 1. TOP HEADER / IN-APP BUTTON: Appears when user spends more than 5 minutes */}
      {hasSpent5Minutes && (
        <div className="bg-gradient-to-r from-emerald-950 via-zinc-900 to-emerald-950 border-b border-emerald-500/30 px-3 py-2 animate-fadeIn">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-zinc-200 font-medium">
                <span className="text-emerald-400 font-bold">You spent more then 5 minutes might as well install?</span>
                <span className="hidden md:inline text-zinc-400 text-[11px] ml-1.5">
                  (Installed as an app for fast launch & squad alerts)
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 transition cursor-pointer"
                title="Install BGMI Squad Scheduler"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Install PWA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. FLOATING ACTION PILL: Accessible on mobile/desktop after 5 minutes */}
      {hasSpent5Minutes && (
        <div className="fixed bottom-20 right-4 z-40 sm:bottom-6 sm:right-6">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2.5 bg-zinc-950/90 hover:bg-zinc-900 text-white border border-emerald-500/50 hover:border-emerald-400 px-3.5 py-2.5 rounded-2xl shadow-xl shadow-emerald-500/10 backdrop-blur-md transition-all hover:scale-105 cursor-pointer group"
            title="You spent more then 5 minutes might as well install?"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-zinc-950 transition">
              <Download className="w-4 h-4" />
            </div>
            <div className="text-left pr-1">
              <div className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400 inline" />
                <span>Install PWA</span>
              </div>
              <div className="text-[11px] text-zinc-300 font-medium">
                You spent more then 5 minutes might as well install?
              </div>
            </div>
          </button>
        </div>
      )}

      {/* 3. AUTO-POPUP DIALOG: Prominently asking the user upon hitting 5 minutes */}
      {showAutoPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-zinc-950 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl shadow-emerald-500/10 text-white">
            {/* Close button */}
            <button
              onClick={handleDismissAutoPopup}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              title="Dismiss for now"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header badge */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-inner">
                <Download className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 inline" />
                  Session Milestone reached ({formatTime(timeSpentSeconds)})
                </span>
                <h3 className="text-lg font-black text-white leading-snug">
                  You spent more then 5 minutes might as well install?
                </h3>
              </div>
            </div>

            {/* Content description */}
            <p className="text-zinc-400 text-xs leading-relaxed mb-5">
              Enjoy a dedicated full-screen BGMI squad coordinator right from your home screen or desktop taskbar.
              Instant access, zero browser clutter, and offline schedule viewing.
            </p>

            {/* Features checkmarks */}
            <div className="space-y-2 mb-6 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80 text-xs">
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>1-Tap launch from Phone Home Screen or Desktop</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Fast squad match scheduling & availability check</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Offline caching & lightning performance</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleInstallClick}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                Install App Now
              </button>
              <button
                onClick={handleDismissAutoPopup}
                className="py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer border border-zinc-800"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MANUAL INSTALL GUIDE MODAL (For iOS Safari or browsers where prompt requires user trigger) */}
      {showManualGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl text-white">
            <button
              onClick={() => setShowManualGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                {isIOS ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  {isIOS ? 'Install on iPhone / iPad' : 'Install on Your Device'}
                </h3>
                <p className="text-xs text-zinc-400">
                  Follow these quick steps to install the app:
                </p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 text-xs text-zinc-300 mb-5">
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Tap the <strong className="text-white">Share</strong> icon (<Share className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />) in the Safari bottom toolbar.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Scroll down and select <strong className="text-white">Add to Home Screen</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />).
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Tap <strong className="text-emerald-400">Add</strong> in the top right corner. The BGMI Squad icon will appear on your home screen!
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 text-xs text-zinc-300 mb-5">
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Look for the <strong className="text-white">Install</strong> icon (<Download className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />) in your browser's address bar (right side in Chrome, Edge, or Brave).
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Alternatively, click the browser menu (⋮ or ⋯) and select <strong className="text-emerald-400">"Install BGMI Squad Scheduler"</strong>.
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowManualGuide(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider border border-zinc-800 transition cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* DEV / REVIEW TEST HELPER (Shows time counter and quick fast-forward button if < 5m) */}
      {!hasSpent5Minutes && (
        <div className="fixed bottom-2 right-2 z-30 opacity-70 hover:opacity-100 transition-opacity">
          <div className="bg-zinc-950/90 border border-zinc-800 rounded-lg px-2.5 py-1 text-[10px] text-zinc-400 flex items-center gap-2 shadow-lg backdrop-blur-sm">
            <Clock className="w-3 h-3 text-zinc-500" />
            <span>Time on site: {formatTime(timeSpentSeconds)} / 5m</span>
            <button
              onClick={fastForwardTo5Minutes}
              className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
              title="Instantly test the 5-minute install prompt"
            >
              Test 5m prompt
            </button>
          </div>
        </div>
      )}
    </>
  );
};
