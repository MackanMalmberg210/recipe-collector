import React from "react";
import Link from "next/link";

interface ProSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProSuccessModal({ isOpen, onClose }: ProSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* High-speed dark backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity duration-300 cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-4xl border border-white/12 bg-[#141210] p-6 sm:p-8 text-white shadow-[0_25px_80px_rgba(0,0,0,0.9)] transition-all duration-300">
        
        {/* Top Orange Light Beam & Ambient Glow */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500" />
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />

        {/* Close Button (X) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-stone-400 transition hover:bg-white/10 hover:text-white cursor-pointer"
          aria-label="Close modal"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header (Clean, only PRO Membership badge) */}
        <div className="text-left">
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
              PRO Membership
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome to Chef Pro!
          </h2>
          <p className="mt-2 text-sm sm:text-base text-stone-300 leading-relaxed">
            Your membership is active. All limits have been unlocked and your digital kitchen is ready.
          </p>
        </div>

        {/* Features Checklist - Larger text, crisp line-height, distinct bullet points */}
        <div className="mt-6 space-y-3.5 rounded-3xl border border-white/10 bg-black/30 p-5 sm:p-6 text-sm text-stone-200">
          <div className="flex items-start gap-3.5">
            <svg className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="leading-snug">
              <strong className="text-white font-bold">100% Ad-Free Experience</strong> – Clean, uninterrupted cooking without sponsor ads or banners
            </span>
          </div>

          <div className="flex items-start gap-3.5">
            <svg className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="leading-snug">
              <strong className="text-white font-bold">Unlimited AI Vision Scans</strong> – Snap cookbook pages, handwritten shopping notes &amp; plates
            </span>
          </div>

          <div className="flex items-start gap-3.5">
            <svg className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="leading-snug">
              <strong className="text-white font-bold">Full Macro &amp; Nutritional Breakdown</strong> – Calories, protein, fat, and carbs calculated per serving
            </span>
          </div>

          <div className="flex items-start gap-3.5">
            <svg className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="leading-snug">
              <strong className="text-white font-bold">Unlimited Cloud Storage &amp; Sync</strong> – Store thousands of recipes synced in real-time across all your devices
            </span>
          </div>

          <div className="flex items-start gap-3.5">
            <svg className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="leading-snug">
              <strong className="text-white font-bold">Smart Meal Planner &amp; Grocery Sync</strong> – Plan weeks ahead and consolidate grocery items in 1 click
            </span>
          </div>
        </div>

        {/* CTA Actions */}
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-500 hover:bg-orange-600 py-3.5 text-sm font-semibold text-white shadow-md transition cursor-pointer active:scale-[0.99]"
          >
            <span>Start Exploring Chef Pro</span>
          </button>

          <Link
            href="/create"
            onClick={onClose}
            className="text-center text-xs font-semibold text-stone-400 hover:text-white transition py-1 cursor-pointer"
          >
            or scan your first recipe with AI Vision →
          </Link>
        </div>

      </div>
    </div>
  );
}
