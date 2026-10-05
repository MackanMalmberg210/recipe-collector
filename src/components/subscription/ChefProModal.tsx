"use client";

import { useEffect, useState } from "react";
import { useToast } from "../ui/ToastProvider";
import { getStoredUserSettings, saveUserSettings } from "../../lib/settings";
import { useAuth } from "../../contexts/AuthContext";
import AuthModal from "../auth/AuthModal";

type ChefProModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ChefProModal({ isOpen, onClose }: ChefProModalProps) {
  const { success, error, info } = useToast();
  const { user, session, isGuest } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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

  const handleActivatePro = async () => {
    // 1. If guest or not signed in, require account creation first so the subscription binds to an account
    if (!user || isGuest) {
      info("Please sign in or create an account first so your Pro subscription is linked to your profile.");
      setIsAuthModalOpen(true);
      return;
    }

    setLoading(true);

    try {
      // 2. Call Stripe Checkout session creation endpoint
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ plan: billingCycle }),
      });

      const data = await res.json().catch(() => ({}));

      // 3. Fallback to VIP beta if Stripe keys are not yet configured
      if (res.status === 503 || data.notConfigured) {
        const current = getStoredUserSettings();
        saveUserSettings({ ...current, subscriptionTier: "pro" });
        setLoading(false);
        success("🎉 Welcome to Chef Pro! VIP Beta Access unlocked (Free preview).");
        onClose();
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to start checkout");
      }

      // 4. Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned from payment server");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment checkout error";
      error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Solid High-Speed Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 transition-opacity duration-200 cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-4xl border border-white/12 bg-[#141210] p-6 sm:p-8 text-white shadow-[0_25px_80px_rgba(0,0,0,0.9)] transition-all duration-300">
        
        {/* Top Orange Light Beam */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500" />
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />

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
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              PRO Membership
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
              ✨ Free During Beta
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
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
                  ? "bg-white text-black shadow-md"
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
                  ? "bg-white text-black shadow-md"
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
            <svg className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span><strong>100% Ad-Free Experience</strong> – Clean, uninterrupted cooking without sponsor ads or banners</span>
          </div>
          <div className="flex items-start gap-3">
            <svg className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span><strong>Unlimited AI Vision Scans</strong> – Snap cookbook pages, handwritten shopping notes &amp; plates</span>
          </div>
          <div className="flex items-start gap-3">
            <svg className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span><strong>Full Macro &amp; Nutritional Breakdown</strong> – Protein, carbs, fat and calorie analysis per serving</span>
          </div>
          <div className="flex items-start gap-3">
            <svg className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span><strong>Unlimited Cloud Storage</strong> – Store thousands of recipes synced in real-time across all your devices</span>
          </div>
          <div className="flex items-start gap-3">
            <svg className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-500 hover:bg-orange-600 py-3.5 text-sm font-semibold text-white shadow-md transition cursor-pointer disabled:opacity-50 active:scale-[0.99]"
          >
            {loading && (
              <span className="h-4 w-4 rounded-full border-2 border-stone-950 border-t-transparent animate-spin" />
            )}
            <span>
              {loading
                ? "Connecting to Stripe..."
                : billingCycle === "yearly"
                ? "Start Annual Pro ($47.88/yr)"
                : "Start Monthly Pro ($4.99/mo)"}
            </span>
          </button>

          <p className="text-center text-[11px] text-stone-400">
            Cancel anytime from your account settings. Secure encrypted payment via Stripe.
          </p>
        </div>

      </div>

      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode="signup"
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}
    </div>
  );
}
