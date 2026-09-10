"use client";

import { useEffect, useState } from "react";
import { useToast } from "../ui/ToastProvider";
import { getStoredUserSettings, saveUserSettings } from "../../lib/settings";

type ChefProModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ChefProModal({ isOpen, onClose }: ChefProModalProps) {
  const { success } = useToast();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleActivatePro = () => {
    setLoading(true);
    setTimeout(() => {
      const current = getStoredUserSettings();
      saveUserSettings({ ...current, subscriptionTier: "pro" });
      setLoading(false);
      success("Welcome to Chef Pro! All premium features unlocked.");
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Solid High-Speed Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 transition-opacity duration-200 cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-4xl border border-amber-500/30 bg-gradient-to-br from-[#241c15] via-[#1a1410] to-[#120f0d] p-6 sm:p-8 text-white shadow-[0_25px_80px_rgba(0,0,0,0.9)] transition-all duration-300">
        
        {/* Top Gold Light Beam */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500" />
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl" />

        {/* Close button (X) */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-stone-400 transition hover:bg-white/10 hover:text-white cursor-pointer"
          aria-label="Close modal"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 mb-3">
            <span>PRO Membership</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#fff8ef]">
            Unlock the Full Experience
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-stone-300 leading-relaxed">
            Unlimited AI vision scans, complete nutritional macros, multi-device cloud sync, and an ad-free kitchen.
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="mt-6 flex items-center justify-center">
          <div className="flex items-center rounded-2xl border border-white/10 bg-black/40 p-1">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-xl px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-amber-500 text-stone-950 shadow-md"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              Monthly ($4.99/mo)
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                billingCycle === "yearly"
                  ? "bg-amber-500 text-stone-950 shadow-md"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <span>Annual ($3.99/mo)</span>
              <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 text-[9px] font-bold">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Features Checklist - Clean SVGs without heavy background shapes */}
        <div className="mt-6 space-y-3 rounded-3xl border border-white/8 bg-black/30 p-5 text-xs text-stone-200">
          <div className="flex items-start gap-3">
            <svg className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span><strong>100% Ad-Free Experience</strong> – Clean, uninterrupted cooking without sponsor ads or banners</span>
          </div>
          <div className="flex items-start gap-3">
            <svg className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span><strong>Unlimited AI Vision Scans</strong> – Snap cookbook pages, handwritten shopping notes &amp; plates</span>
          </div>
          <div className="flex items-start gap-3">
            <svg className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span><strong>Full Macro &amp; Nutritional Breakdown</strong> – Protein, carbs, fat and calorie analysis per serving</span>
          </div>
          <div className="flex items-start gap-3">
            <svg className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span><strong>Unlimited Cloud Storage</strong> – Store thousands of recipes synced in real-time across all your devices</span>
          </div>
          <div className="flex items-start gap-3">
            <svg className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span><strong>Smart Meal Planner &amp; Grocery Sync</strong> – Plan weeks ahead and consolidate grocery items in 1 click</span>
          </div>
        </div>

        {/* CTA Actions */}
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleActivatePro}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3.5 text-sm font-bold text-stone-950 border border-amber-600/60 shadow-md shadow-amber-400/25 transition cursor-pointer disabled:opacity-50 active:scale-[0.99]"
          >
            <span>{loading ? "Activating..." : "Start 14-Day Free Trial"}</span>
          </button>

          <p className="text-center text-[11px] text-stone-400">
            14 days free, then {billingCycle === "monthly" ? "$4.99/month" : "$47.88/year"}. Cancel anytime in 1 click.
          </p>
        </div>

      </div>
    </div>
  );
}
