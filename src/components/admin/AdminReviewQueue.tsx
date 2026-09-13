"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { AdminReviewItem } from "../../lib/admin";

interface AdminReviewQueueProps {
  items: AdminReviewItem[];
  onDismiss?: (targetType: "recipe" | "cook_photo", targetId: string) => Promise<void>;
  onApprove?: (targetType: "recipe" | "cook_photo", targetId: string) => Promise<void>;
  onTakedown?: (targetType: "recipe" | "cook_photo", targetId: string, reason: string) => Promise<void>;
  onDelete: (targetType: "recipe" | "cook_photo", targetId: string) => Promise<void>;
  isActionLoading: boolean;
}

const REASON_LABELS: Record<string, string> = {
  inappropriate: "Inappropriate Content",
  spam: "Spam / Promotion",
  misleading: "Misleading Recipe",
  copyright: "Copyright Infringement",
  other: "Other Issue",
};

export default function AdminReviewQueue({
  items,
  onDismiss,
  onApprove,
  onTakedown,
  onDelete,
  isActionLoading,
}: AdminReviewQueueProps) {
  const [selectedItemToDelete, setSelectedItemToDelete] = useState<AdminReviewItem | null>(null);
  const [selectedItemToTakedown, setSelectedItemToTakedown] = useState<AdminReviewItem | null>(null);
  const [takedownReason, setTakedownReason] = useState("Inappropriate content");
  const [takedownCustomNote, setTakedownCustomNote] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleDismiss = async (item: AdminReviewItem) => {
    try {
      setProcessingId(item.id);
      if (onDismiss) {
        await onDismiss(item.targetType, item.id);
      } else if (onApprove) {
        await onApprove(item.targetType, item.id);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const confirmTakedown = async () => {
    if (!selectedItemToTakedown || !onTakedown) return;
    try {
      setProcessingId(selectedItemToTakedown.id);
      const fullReason = takedownCustomNote.trim()
        ? `${takedownReason}: ${takedownCustomNote.trim()}`
        : takedownReason;
      await onTakedown(selectedItemToTakedown.targetType, selectedItemToTakedown.id, fullReason);
      setSelectedItemToTakedown(null);
      setTakedownCustomNote("");
      setTakedownReason("Inappropriate content");
    } finally {
      setProcessingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!selectedItemToDelete) return;
    try {
      setProcessingId(selectedItemToDelete.id);
      await onDelete(selectedItemToDelete.targetType, selectedItemToDelete.id);
      setSelectedItemToDelete(null);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner explaining the Community Moderation Safety Net */}
      <div className="rounded-3xl border border-stone-200/90 bg-white p-5 dark:border-[#2e2722] dark:bg-[#1a1715] shadow-xs">
        <div className="flex items-start gap-3">
          <svg className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <div className="min-w-0 flex-1 space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-[#fafaf9]">
              Community Moderation &amp; Safety Net
            </h4>
            <p className="text-xs text-stone-600 dark:text-[#a8a29e] leading-relaxed">
              Items with 3 or more independent community reports are automatically quarantined (hidden from public view) by the database safety net. 
              Review reported items below: <strong>Dismiss Report</strong> if the recipe is safe, <strong>Take Down</strong> to unpublish from the public feed while keeping it in the user&apos;s private cookbook with an explanation, or <strong>Delete</strong> permanently.
            </p>
          </div>
        </div>
      </div>

      {/* List of items */}
      {items.length === 0 ? (
        <div className="rounded-3xl border border-stone-200/90 bg-white p-12 text-center shadow-sm dark:border-[#2e2722] dark:bg-[#1a1715] space-y-3">
          <svg className="mx-auto h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <h3 className="text-base font-bold text-stone-900 dark:text-[#fafaf9]">
            No reports pending review
          </h3>
          <p className="text-xs text-stone-500 dark:text-[#a8a29e] max-w-sm mx-auto">
            The community is in great shape. All recipes and cook photos comply with platform standards.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-bold text-stone-500 dark:text-stone-400">
              Showing {items.length} item{items.length > 1 ? "s" : ""} requiring moderation
            </p>
          </div>

          <div className="grid gap-4">
            {items.map((item) => {
              const isBusy = processingId === item.id || isActionLoading;
              const isQuarantined = item.isQuarantined || item.reportCount >= 3;

              return (
                <div
                  key={`${item.targetType}-${item.id}`}
                  className={`rounded-3xl border p-5 sm:p-6 shadow-sm transition bg-white dark:bg-[#1a1715] ${
                    isQuarantined
                      ? "border-rose-500/40 dark:border-rose-500/30"
                      : "border-stone-200/90 dark:border-[#2e2722]"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                    {/* Left: Preview image & info */}
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl border border-stone-200 dark:border-white/10 bg-stone-100 dark:bg-stone-900">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-stone-400">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 space-y-2 flex-1">
                        {/* Status badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md bg-stone-100 dark:bg-[#25201c] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-stone-600 dark:text-stone-300">
                            {item.targetType === "recipe" ? "Recipe" : "Cook Photo"}
                          </span>

                          {item.targetType === "recipe" && item.isPublic !== undefined && (
                            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              item.isPublic
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                : "bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
                            }`}>
                              {item.isPublic ? "Public Community Recipe" : "Private Cookbook Recipe"}
                            </span>
                          )}

                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                              item.reportCount >= 3
                                ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                                : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                            }`}
                          >
                            {item.reportCount} report{item.reportCount > 1 ? "s" : ""}
                          </span>

                          {isQuarantined ? (
                            <span className="rounded-md bg-rose-500 text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                              Auto-Quarantined: Hidden
                            </span>
                          ) : (
                            <span className="rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                              Pending Review
                            </span>
                          )}
                        </div>

                        {/* Title & Author */}
                        <div>
                          <h4 className="text-sm sm:text-base font-bold text-stone-900 dark:text-[#fafaf9] leading-snug">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-stone-500 dark:text-[#a8a29e] mt-0.5">
                            By: <strong className="font-semibold text-stone-700 dark:text-stone-300">{item.authorName}</strong>
                            {" • "}
                            Latest report: {new Date(item.latestReportAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>

                        {/* Reason tags */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Reported for:</span>
                          {item.reasons.map((r) => (
                            <span
                              key={r}
                              className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300"
                            >
                              {REASON_LABELS[r] || r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap sm:flex-col items-center sm:items-end justify-end gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-100 dark:border-[#25201c]">
                      {item.targetType === "recipe" && (
                        <Link
                          href={`/recipes/${item.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-amber-600 dark:text-stone-400 dark:hover:text-amber-400 transition"
                        >
                          <span>Open Recipe</span>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        </Link>
                      )}

                      <div className="flex items-center gap-2">
                        {/* 1. Dismiss Report (Mark as Safe) */}
                        <button
                          type="button"
                          onClick={() => handleDismiss(item)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-[#2e2722] bg-white dark:bg-[#201a16] hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 dark:hover:border-emerald-800 text-stone-700 dark:text-stone-300 font-bold px-3 py-1.5 text-xs transition cursor-pointer active:scale-95 disabled:opacity-50 shadow-2xs"
                          title="Dismiss pending reports and keep content active"
                        >
                          <svg className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Dismiss Report</span>
                        </button>

                        {/* 2. Take Down (Unpublish from community & notify author) */}
                        {onTakedown && item.targetType === "recipe" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItemToTakedown(item);
                              setTakedownReason(REASON_LABELS[item.reasons[0]] || "Inappropriate content");
                            }}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300/80 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-bold px-3 py-1.5 text-xs transition cursor-pointer active:scale-95 disabled:opacity-50"
                            title="Unpublish recipe from public community and notify the author"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                            </svg>
                            <span>Take Down</span>
                          </button>
                        )}

                        {/* 3. Delete Permanently */}
                        <button
                          type="button"
                          onClick={() => setSelectedItemToDelete(item)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-bold px-3 py-1.5 text-xs transition cursor-pointer active:scale-95 disabled:opacity-50"
                          title="Permanently delete content and dismiss reports"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Reporter details/notes: VISIBLE BY DEFAULT */}
                  {item.details.length > 0 && (
                    <div className="mt-4 pt-3.5 border-t border-stone-100 dark:border-[#25201c] space-y-1.5">
                      <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                        Reporter User Notes ({item.details.length}):
                      </span>
                      <div className="space-y-1.5">
                        {item.details.map((detail, idx) => (
                          <div
                            key={idx}
                            className="rounded-2xl bg-stone-50 dark:bg-[#141210] p-3 text-xs text-stone-800 dark:text-[#d6d3d1] border border-stone-200/60 dark:border-white/5 italic leading-relaxed"
                          >
                            &ldquo;{detail}&rdquo;
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Take Down Modal */}
      {selectedItemToTakedown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="max-w-lg w-full rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 dark:border-[#2e2722] dark:bg-[#1a1715] space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white">
                  Take Down &ldquo;{selectedItemToTakedown.title}&rdquo;?
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Unpublishes this recipe from the community while preserving it in the author&apos;s private cookbook.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Moderation Reason (shown to author)
                </label>
                <select
                  value={takedownReason}
                  onChange={(e) => setTakedownReason(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 dark:border-[#2e2722] dark:bg-[#12100e] dark:text-white px-3 py-2 text-xs font-medium focus:outline-none focus:border-amber-500"
                >
                  <option value="Inappropriate or offensive content">Inappropriate or offensive content</option>
                  <option value="Copyright infringement">Copyright infringement</option>
                  <option value="Misleading or unsafe cooking instructions">Misleading or unsafe cooking instructions</option>
                  <option value="Spam or promotional advertising">Spam or promotional advertising</option>
                  <option value="Community guidelines violation">Community guidelines violation</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Optional note to author (explaining how they can fix it)
                </label>
                <textarea
                  value={takedownCustomNote}
                  onChange={(e) => setTakedownCustomNote(e.target.value)}
                  placeholder="e.g. Please replace the cover image with an original photo to re-request publication."
                  rows={3}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 dark:border-[#2e2722] dark:bg-[#12100e] dark:text-white p-3 text-xs focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-[#25201c]">
              <button
                type="button"
                onClick={() => {
                  setSelectedItemToTakedown(null);
                  setTakedownCustomNote("");
                }}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 dark:border-[#2e2722] dark:text-[#a8a29e] dark:hover:bg-[#25211d] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmTakedown}
                className="rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2 text-xs transition cursor-pointer shadow-xs active:scale-95"
              >
                Unpublish &amp; Notify Author
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {selectedItemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="max-w-md w-full rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 dark:border-[#2e2722] dark:bg-[#1a1715] space-y-4">
            <div className="flex items-center gap-3">
              <svg className="h-6 w-6 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                  Delete {selectedItemToDelete.targetType === "recipe" ? "Recipe" : "Cook Photo"} Permanently?
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
              Are you sure you want to permanently delete <strong className="font-bold text-stone-900 dark:text-white">&quot;{selectedItemToDelete.title}&quot;</strong> from the database and media storage?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedItemToDelete(null)}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 dark:border-[#2e2722] dark:text-[#a8a29e] dark:hover:bg-[#25211d] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 text-xs transition cursor-pointer shadow-xs active:scale-95"
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
