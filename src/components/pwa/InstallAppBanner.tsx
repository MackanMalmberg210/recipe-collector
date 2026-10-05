"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    // Only target mobile/touch devices (never show on desktop PC)
    const isMobile =
      window.matchMedia("(pointer: coarse)").matches ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      window.innerWidth < 768;
    setIsMobileDevice(Boolean(isMobile));

    // Check if already running in standalone PWA mode
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(Boolean(isStandaloneMode));

    // Check if user previously dismissed banner
    const dismissed = localStorage.getItem("recipe_pwa_dismissed");
    if (dismissed) {
      setIsDismissed(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("recipe_pwa_dismissed", "true");
  };

  // Don't show on desktop PCs, if already in app mode, dismissed, or prompt not available
  if (!isMobileDevice || isStandalone || isDismissed || !deferredPrompt) {
    return null;
  }

  return (
    <aside
      aria-label="Install App"
      className="fixed bottom-6 right-4 sm:right-6 z-40 max-w-sm rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#151311]/95 backdrop-blur-xl p-3.5 shadow-2xl text-slate-900 dark:text-stone-100 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E05D38] text-white font-bold shadow-xs">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 18h16" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-900 dark:text-stone-100">Install Culineer</p>
          <p className="text-[11px] text-slate-500 dark:text-stone-400 truncate">Cook offline with full screen &amp; fast access</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleInstallClick}
          className="rounded-xl bg-[#E05D38] hover:bg-[#C84E2D] text-white font-semibold px-3.5 py-1.5 text-xs transition shadow-xs cursor-pointer active:scale-95"
        >
          Install
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-stone-400 hover:text-stone-200 text-xs p-1 cursor-pointer"
          aria-label="Dismiss banner"
        >
          ✕
        </button>
      </div>
    </aside>
  );
}
