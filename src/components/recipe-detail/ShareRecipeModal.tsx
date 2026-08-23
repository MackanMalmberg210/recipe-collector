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
  const shareText = `Check out this recipe for ${recipe.title} on Recipe Collector! 🍲`;
  const shareSummary = `🍴 ${recipe.title}\n⏱ Cook time: ${recipe.cookTime || 30} mins\n🥘 Ingredients: ${recipe.ingredients.slice(0, 4).join(", ")}...\n\n👉 Full recipe: ${currentUrl}`;

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
      icon: "💬",
      action: () => {
        const body = encodeURIComponent(`${shareText}\n${currentUrl}`);
        window.open(`sms:?&body=${body}`, "_blank");
      },
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: "🟢",
      action: () => {
        const text = encodeURIComponent(`${shareText}\n${currentUrl}`);
        window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
      },
    },
    {
      id: "email",
      name: "Email",
      icon: "✉️",
      action: () => {
        const subject = encodeURIComponent(`Recipe: ${recipe.title}`);
        const body = encodeURIComponent(`${shareSummary}`);
        window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
      },
    },
    {
      id: "tiktok",
      name: "TikTok / Social (Copy Text)",
      icon: "🎵",
      action: handleCopySnippet,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-stone-200/90 bg-white text-stone-900 shadow-2xl dark:border-white/10 dark:bg-[#151210] dark:text-stone-100 animate-in zoom-in-95 fade-in duration-200 my-auto p-6 sm:p-7 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-white/8 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔗</span>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-stone-950 dark:text-stone-50">
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
              className="rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-bold text-stone-950 shadow-xs transition active:scale-95 cursor-pointer shrink-0"
            >
              {copied ? "✓ Copied!" : "Copy Link"}
            </button>
          </div>
        </div>

        {/* Multi-Channel Grid */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Share to Channels
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {shareChannels.map((channel) => (
              <button
                key={channel.id}
                type="button"
                onClick={channel.action}
                className="flex items-center gap-3 rounded-2xl border border-stone-200/90 bg-stone-50/50 p-3.5 text-left text-xs font-bold text-stone-800 hover:bg-amber-500/10 hover:border-amber-500/30 dark:border-white/10 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-white/10 transition active:scale-98 cursor-pointer"
              >
                <span className="text-lg">{channel.icon}</span>
                <span className="truncate flex-1">
                  {channel.id === "tiktok" && copiedSnippet ? "✓ Copied Text!" : channel.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Native Web Share Button (on Mobile/Supported browsers) */}
        {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-white hover:bg-stone-100 py-3 text-xs font-bold text-stone-800 dark:border-white/10 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-white/10 transition cursor-pointer shadow-xs"
          >
            <span>📱</span>
            <span>Open System Share Menu</span>
          </button>
        )}

      </div>
    </div>
  );
}
