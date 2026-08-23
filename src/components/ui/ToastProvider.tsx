"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type ToastAction = {
  label: string;
  onClick: () => void;
};

type ToastMessage = {
  id: string;
  type?: "success" | "info" | "warning" | "error";
  title?: string;
  message: string;
  action?: ToastAction;
  duration?: number;
};

type ToastContextType = {
  showToast: (toast: Omit<ToastMessage, "id">) => void;
  success: (message: string, action?: ToastAction) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      type = "success",
      title,
      message,
      action,
      duration = 4000,
    }: Omit<ToastMessage, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = { id, type, title, message, action, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast],
  );

  const success = useCallback(
    (message: string, action?: ToastAction) => {
      showToast({ type: "success", message, action });
    },
    [showToast],
  );

  const error = useCallback(
    (message: string) => {
      showToast({ type: "error", message, duration: 5000 });
    },
    [showToast],
  );

  const info = useCallback(
    (message: string) => {
      showToast({ type: "info", message });
    },
    [showToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}

      {/* FIXED MINIMALIST TOAST CONTAINER */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl border border-stone-300/80 bg-white/95 px-4 py-3 text-stone-900 shadow-xl backdrop-blur-md dark:border-white/12 dark:bg-[#181412]/95 dark:text-stone-100 animate-in slide-in-from-bottom-3 fade-in duration-200"
          >
            {/* Minimalist SVG Glyphs */}
            {toast.type === "success" && (
              <svg className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {toast.type === "error" && (
              <svg className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {toast.type === "info" && (
              <svg className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {toast.type === "warning" && (
              <svg className="h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}

            <p className="flex-1 text-xs sm:text-sm font-medium leading-snug">
              {toast.message}
            </p>

            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  removeToast(toast.id);
                }}
                className="shrink-0 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-white/10 dark:hover:bg-white/15 px-2.5 py-1 text-xs font-bold text-stone-800 dark:text-stone-200 transition cursor-pointer"
              >
                {toast.action.label}
              </button>
            )}

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs px-1 cursor-pointer"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
