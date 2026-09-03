"use client";

import { useEffect, useState } from "react";
import type { AppRecipe } from "../../lib/types";

type ShareRecipeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  recipe: AppRecipe;
};

export default function ShareRecipeModal({
  isOpen,
  onClose,
  recipe,
}: ShareRecipeModalProps) {
  const [copied, setCopied] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

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

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `Check out this recipe for ${recipe.title} on Recipe Collector!`;
  const shareSummary = `${recipe.title}\nCook time: ${recipe.cookTime || 30} mins\nIngredients: ${recipe.ingredients.slice(0, 4).join(", ")}...\n\nFull recipe: ${currentUrl}`;

  const handleCopyLink = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCopySnippet = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareSummary);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: shareText,
          url: currentUrl,
        });
      } catch {
        // User dismissed
      }
    } else {
      handleCopyLink();
    }
  };

  const shareChannels = [
    {
      id: "sms",
      name: "Messages / SMS",
      iconSvg: (
        <svg className="h-5 w-5 text-sky-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      action: () => {
        const body = encodeURIComponent(`${shareText}\n${currentUrl}`);
        window.open(`sms:?&body=${body}`, "_blank");
      },
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      iconSvg: (
        <svg className="h-5 w-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      action: () => {
        const text = encodeURIComponent(`${shareText}\n${currentUrl}`);
        window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
      },
    },
    {
      id: "email",
      name: "Email",
      iconSvg: (
        <svg className="h-5 w-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      action: () => {
        const subject = encodeURIComponent(`Recipe: ${recipe.title}`);
        const body = encodeURIComponent(`${shareSummary}`);
        window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
      },
    },
    {
      id: "tiktok",
      name: "Copy Summary Text",
      iconSvg: (
        <svg className="h-5 w-5 text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      action: handleCopySnippet,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Solid High-Speed Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-stone-200/90 bg-white text-stone-900 shadow-2xl dark:border-white/10 dark:bg-[#151210] dark:text-stone-100 animate-in zoom-in-95 fade-in duration-200 my-auto p-6 sm:p-7 space-y-6">
        
        {/* Header with clean standalone icon (no boxy background) */}
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-white/8 pb-4">
          <div className="flex items-center gap-3">
            <svg className="h-6 w-6 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <div>
              <h2 className="text-lg font-black tracking-tight text-stone-950 dark:text-stone-50">
                Share Recipe
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Share &ldquo;{recipe.title}&rdquo; with family &amp; friends.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/10 dark:hover:text-white transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Quick Link Copy Bar */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Direct Recipe Link
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-stone-300/90 bg-stone-50/70 p-1.5 dark:border-white/10 dark:bg-[#1f1a17]">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="flex-1 bg-transparent px-3 text-xs font-semibold text-stone-800 dark:text-stone-200 outline-none truncate"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold border border-amber-600/60 shadow-xs px-4 py-2 text-xs transition active:scale-95 cursor-pointer shrink-0"
            >
              {copied ? "✓ Copied!" : "Copy Link"}
            </button>
          </div>
        </div>

        {/* Multi-Channel Grid (larger text, clean direct icons, refined cards) */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Share to Channels
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {shareChannels.map((channel) => (
              <button
                key={channel.id}
                type="button"
                onClick={channel.action}
                className="flex items-center gap-3 rounded-2xl border border-stone-200/90 bg-stone-50/60 p-3.5 text-left text-sm font-semibold text-stone-800 hover:bg-amber-500/10 hover:border-amber-500/30 dark:border-white/10 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-white/10 dark:hover:border-amber-400/30 transition active:scale-98 cursor-pointer"
              >
                {channel.iconSvg}
                <span className="truncate flex-1">
                  {channel.id === "tiktok" && copiedSnippet ? "✓ Copied Text!" : channel.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Native Web Share Button */}
        {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-white hover:bg-stone-100 py-3 text-xs sm:text-sm font-bold text-stone-800 dark:border-white/10 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-white/10 transition cursor-pointer shadow-xs active:scale-95"
          >
            <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>Open System Share Menu</span>
          </button>
        )}

      </div>
    </div>
  );
}
