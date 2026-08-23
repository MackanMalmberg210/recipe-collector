"use client";

import React, { useEffect, useState } from "react";

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  countdownSeconds?: number;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = false,
  countdownSeconds = 0,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(countdownSeconds);

  useEffect(() => {
    if (!isOpen) return;
    setSecondsLeft(countdownSeconds);

    if (countdownSeconds > 0) {
      const interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen, countdownSeconds]);

  if (!isOpen) return null;

  const isCountdownActive = secondsLeft > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Dark Ambient Backdrop */}
      <div
        onClick={onCancel}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200 cursor-pointer"
      />

      {/* Dialog Box */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-6 text-stone-900 shadow-2xl dark:border-white/10 dark:bg-[#181412] dark:text-stone-100 animate-in zoom-in-95 fade-in duration-200">
        <div className="flex items-start gap-4">
          <span className="text-2xl shrink-0 mt-0.5">
            {isDestructive ? "⚠️" : "❓"}
          </span>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-stone-950 dark:text-stone-50">
              {title}
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-100 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/10 transition cursor-pointer"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            disabled={isCountdownActive}
            onClick={onConfirm}
            className={`rounded-xl px-5 py-2 text-xs sm:text-sm font-bold shadow-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isDestructive
                ? "bg-rose-600 text-white hover:bg-rose-500 shadow-rose-600/20"
                : "bg-amber-500 text-stone-950 hover:bg-amber-400 shadow-amber-500/20"
            }`}
          >
            {isCountdownActive ? `${confirmLabel} (${secondsLeft}s)` : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
