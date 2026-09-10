"use client";

import { useEffect, useState } from "react";
import { getStoredUserSettings } from "../../lib/settings";
import ChefProModal from "../subscription/ChefProModal";

type AdBannerProps = {
  slot?: "feed" | "recipe_detail" | "planner_bottom";
  className?: string;
};

export default function AdBanner({ slot = "feed", className = "" }: AdBannerProps) {
  const [isPro, setIsPro] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  useEffect(() => {
    const checkTier = () => {
      const settings = getStoredUserSettings();
      setIsPro(settings.subscriptionTier === "pro");
    };
    checkTier();

    window.addEventListener("storage", checkTier);
    window.addEventListener("user_settings_updated", checkTier);
    return () => {
      window.removeEventListener("storage", checkTier);
      window.removeEventListener("user_settings_updated", checkTier);
    };
  }, []);

  // PRO users get 100% ad-free experience
  if (isPro) return null;

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-50/80 p-4 dark:border-white/8 dark:bg-[#181412] text-stone-700 dark:text-stone-300 transition-all ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="rounded-md border border-stone-300 dark:border-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Sponsored
            </span>
            <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
              {slot === "recipe_detail"
                ? "Artisan cookware and chef knives — Crafted for precision everyday cooking."
                : "Organic, farm-fresh ingredients delivered to your doorstep in under 30 minutes."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsProModalOpen(true)}
            className="shrink-0 flex items-center gap-1.5 text-[11px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition cursor-pointer self-end sm:self-auto"
          >
            <span>Remove ads with PRO</span>
            <span>→</span>
          </button>
        </div>
      </div>

      <ChefProModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
      />
    </>
  );
}
