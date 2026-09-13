"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8 relative overflow-hidden bg-[#faf8f5] dark:bg-[#12100e] text-stone-900 dark:text-stone-100 transition-colors duration-300">
      {/* AMBIENT BACKGROUND GLOW */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-rose-500/5 blur-[140px] dark:bg-rose-500/10" />

      <div className="relative z-10 max-w-lg w-full text-center space-y-6 rounded-3xl border border-stone-200/90 bg-white/95 dark:border-white/10 dark:bg-[#181411] p-8 sm:p-12 shadow-xl">
        {/* WARNING EMBLEM */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 border border-rose-500/20 shadow-xs">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* HEADINGS */}
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">
            Culinary Glitch • 500
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">
            Something simmered over
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed pt-1">
            An unexpected error occurred while loading this page. Our team has been notified.
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold border border-amber-600/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] px-5 py-2.5 text-xs transition active:scale-95 cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 dark:border-white/10 dark:bg-[#25201c] dark:text-stone-200 dark:hover:bg-[#2e2722] font-semibold px-5 py-2.5 text-xs transition active:scale-95"
          >
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
