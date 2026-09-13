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
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [secondsLeft, setSecondsLeft] = useState(countdownSeconds);

  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setSecondsLeft(countdownSeconds);
    }
  }

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
    if (!isOpen || countdownSeconds <= 0) return;

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
  }, [isOpen, countdownSeconds]);

  if (!isOpen) return null;

  const isCountdownActive = secondsLeft > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Solid High-Speed Backdrop */}
      <div
        onClick={onCancel}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200 cursor-pointer"
      />

      {/* Dialog Box */}
      <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-slate-200/90 bg-white p-6 sm:p-7 text-slate-900 shadow-2xl dark:border-white/10 dark:bg-[#121212] dark:text-stone-100 animate-in zoom-in-95 fade-in duration-200">
        <div className="flex items-start gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            isDestructive
              ? "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30 shadow-xs"
              : "bg-slate-900 text-white dark:bg-amber-500 dark:text-stone-950 shadow-sm"
          }`}>
            {isDestructive ? (
              <svg className="h-5 w-5 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.08 4h.01" />
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">
              {title}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 dark:border-white/10 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 transition cursor-pointer"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            disabled={isCountdownActive}
            onClick={onConfirm}
            className={`rounded-full px-6 py-2.5 text-xs sm:text-sm font-bold transition active:scale-95 cursor-pointer shadow-sm ${
              isDestructive
                ? "bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-gradient-to-b dark:from-amber-500 dark:to-amber-600 dark:hover:from-amber-400 dark:hover:to-amber-500 dark:text-stone-950 dark:border dark:border-amber-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          >
            {isCountdownActive ? `${confirmLabel} (${secondsLeft}s)` : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
