"use client";

import { useEffect, useState } from "react";
import {
  submitContentReport,
  hasUserReported,
  type ReportReason,
  type ReportTargetType,
} from "../../lib/reports";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle?: string;
  onReportSubmitted?: () => void;
}

const REPORT_REASONS: { key: ReportReason; label: string; desc: string }[] = [
  {
    key: "inappropriate",
    label: "Inappropriate or offensive content",
    desc: "Contains offensive imagery, abusive language, or violates community guidelines.",
  },
  {
    key: "spam",
    label: "Spam or advertising",
    desc: "Commercial promotion, automated bot submissions, or irrelevant spam.",
  },
  {
    key: "misleading",
    label: "Misleading or dangerous recipe",
    desc: "Inedible ingredients, unsafe cooking instructions, or incorrect information.",
  },
  {
    key: "copyright",
    label: "Copyright infringement",
    desc: "Image or proprietary recipe text used without author permission.",
  },
  {
    key: "other",
    label: "Other issue",
    desc: "Other problems that require administrative moderation.",
  },
];

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
  onReportSubmitted,
}: ReportModalProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState<ReportReason>("inappropriate");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user) {
      setAlreadyReported(false);
      return;
    }
    hasUserReported(targetType, targetId)
      .then((reported) => {
        setAlreadyReported(reported);
      })
      .catch(() => {});
  }, [isOpen, user, targetType, targetId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const result = await submitContentReport({
        targetType,
        targetId,
        reason,
        details,
      });

      if (result.success) {
        setSubmittedMessage(result.message);
        setAlreadyReported(true);
        onReportSubmitted?.();
      } else {
        setErrorMessage(result.message);
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmittedMessage(null);
    setErrorMessage(null);
    setDetails("");
    setReason("inappropriate");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        className="relative max-w-lg w-full rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 dark:border-[#2e2722] dark:bg-[#1a1715] space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <svg className="h-6 w-6 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a1.5 1.5 0 0 0 1.142-1.455V4.75a1.5 1.5 0 0 0-1.854-1.455l-2.402.565a9 9 0 0 1-6.086-.71l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
            </svg>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-[#fafaf9]">
                Report Content
              </h3>
              <p className="text-xs text-stone-500 dark:text-[#a8a29e] line-clamp-1">
                {targetTitle ? targetTitle : targetType === "recipe" ? "Recipe" : "Cook Photo"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:text-[#fafaf9] dark:hover:bg-[#26211d] transition cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Unauthenticated notice */}
        {!user ? (
          <div className="space-y-4 py-3 text-center">
            <p className="text-xs text-stone-600 dark:text-stone-400">
              You need to be signed in to report community content.
            </p>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2 text-xs transition active:scale-95 shadow-xs"
            >
              Sign In
            </Link>
          </div>
        ) : alreadyReported && !submittedMessage ? (
          /* Already Reported Notice State */
          <div className="py-5 text-center space-y-3.5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-stone-900 dark:text-[#fafaf9]">
                Report Already Submitted
              </h4>
              <p className="text-xs text-stone-600 dark:text-[#a8a29e] max-w-sm mx-auto leading-relaxed">
                You have already submitted a report for this content. Our moderation team has received it and is reviewing the submission. Thank you for keeping Recipe Collector safe!
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 dark:border-[#2e2722] dark:bg-[#221c17] dark:hover:bg-[#2a241e] px-5 py-2 text-xs font-bold text-stone-700 dark:text-stone-300 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : submittedMessage ? (
          /* Confirmation Success State */
          <div className="py-4 text-center space-y-4">
            <svg className="mx-auto h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <p className="text-xs text-stone-700 dark:text-[#d6d3d1] max-w-sm mx-auto leading-relaxed">
              {submittedMessage}
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl bg-stone-900 text-white dark:bg-stone-800 dark:text-white font-bold px-5 py-2 text-xs hover:bg-stone-800 dark:hover:bg-stone-700 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="rounded-xl bg-rose-50 border border-rose-200/80 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300">
                {errorMessage}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 dark:text-[#d6d3d1]">
                Select reason
              </label>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {REPORT_REASONS.map((r) => {
                  const isSelected = reason === r.key;
                  return (
                    <label
                      key={r.key}
                      onClick={() => setReason(r.key)}
                      className={`flex items-start gap-3 p-2.5 rounded-2xl border cursor-pointer transition ${
                        isSelected
                          ? "border-amber-500 bg-stone-100/90 dark:border-amber-500/80 dark:bg-[#221e1a]"
                          : "border-stone-200 bg-stone-50/50 hover:bg-stone-100/70 dark:border-[#2e2722] dark:bg-[#141210] dark:hover:bg-[#1e1a17]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="report_reason"
                        value={r.key}
                        checked={isSelected}
                        onChange={() => setReason(r.key)}
                        className="mt-0.5 accent-amber-500 cursor-pointer"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-stone-900 dark:text-[#fafaf9]">
                          {r.label}
                        </span>
                        <span className="block text-[11px] text-stone-500 dark:text-[#a8a29e] mt-0.5">
                          {r.desc}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Additional details input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-[#d6d3d1] flex items-center justify-between">
                <span>Additional details (optional)</span>
                <span className="text-[10px] text-stone-400 font-normal">Max 300 chars</span>
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value.slice(0, 300))}
                rows={2}
                placeholder="Briefly describe why this content should be reviewed..."
                className="w-full rounded-2xl border border-stone-200 bg-white p-3 text-xs text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none dark:border-[#2e2722] dark:bg-[#141210] dark:text-[#fafaf9] dark:placeholder-stone-500 resize-none transition"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-[#25211d]">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 dark:border-[#2e2722] dark:text-[#a8a29e] dark:hover:bg-[#25211d] transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2 text-xs transition cursor-pointer active:scale-95 disabled:opacity-50 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-stone-950 border-t-transparent" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Report</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
