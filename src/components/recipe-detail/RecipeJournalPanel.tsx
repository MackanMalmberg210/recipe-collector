"use client";

import { useState, useEffect } from "react";

export type RecipeNoteItem = {
  id: string;
  text: string;
  date: string;
  timestamp: number;
};

type RecipeJournalPanelProps = {
  recipeId: number;
  initialRating?: number;
  initialNote?: string;
  notesList?: RecipeNoteItem[];
  onRatingChange?: (rating: number) => void;
  onSaveNotesList?: (notes: RecipeNoteItem[]) => void;
};

export default function RecipeJournalPanel({
  recipeId,
  initialRating = 0,
  initialNote = "",
  notesList = [],
  onRatingChange,
  onSaveNotesList,
}: RecipeJournalPanelProps) {
  const [rating, setRating] = useState<number>(initialRating);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [notes, setNotes] = useState<RecipeNoteItem[]>(notesList);
  
  // Note creation & editing state
  const [isAddingNote, setIsAddingNote] = useState<boolean>(false);
  const [newNoteText, setNewNoteText] = useState<string>("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [isSavedToast, setIsSavedToast] = useState<boolean>(false);

  // Sync state from props or localStorage
  useEffect(() => {
    try {
      const storedRating = localStorage.getItem(`recipe_rating_${recipeId}`);
      if (storedRating !== null) {
        setRating(Number(storedRating));
      } else if (initialRating) {
        setRating(initialRating);
      }

      const storedNotes = localStorage.getItem(`recipe_notes_${recipeId}`);
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      } else if (notesList && notesList.length > 0) {
        setNotes(notesList);
      } else if (initialNote) {
        // Migration of single legacy note into timeline format
        setNotes([
          {
            id: "initial-note",
            text: initialNote,
            date: "Previous note",
            timestamp: Date.now(),
          },
        ]);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [recipeId, initialRating, initialNote, notesList]);

  // Real-time synchronization event listeners from Cook Mode
  useEffect(() => {
    const handleRatingSync = (e: CustomEvent<{ recipeId: number; rating: number }>) => {
      if (e.detail.recipeId === recipeId) {
        setRating(e.detail.rating);
      }
    };

    const handleNoteSync = (e: CustomEvent<{ recipeId: number; note?: RecipeNoteItem }>) => {
      if (e.detail.recipeId === recipeId && e.detail.note) {
        setNotes((prev) => [e.detail.note!, ...prev]);
      }
    };

    window.addEventListener("recipe_rating_updated", handleRatingSync as EventListener);
    window.addEventListener("recipe_note_updated", handleNoteSync as EventListener);

    return () => {
      window.removeEventListener("recipe_rating_updated", handleRatingSync as EventListener);
      window.removeEventListener("recipe_note_updated", handleNoteSync as EventListener);
    };
  }, [recipeId]);

  const handleSaveRating = (newRating: number) => {
    const finalRating = rating === newRating ? 0 : newRating;
    setRating(finalRating);
    try {
      localStorage.setItem(`recipe_rating_${recipeId}`, String(finalRating));
      window.dispatchEvent(
        new CustomEvent("recipe_rating_updated", {
          detail: { recipeId, rating: finalRating },
        })
      );
    } catch {
      // Ignore
    }
    onRatingChange?.(finalRating);
  };

  const saveNotesToStorage = (updatedNotes: RecipeNoteItem[]) => {
    setNotes(updatedNotes);
    try {
      localStorage.setItem(`recipe_notes_${recipeId}`, JSON.stringify(updatedNotes));
      // Save most recent note as single fallback string for backward compatibility
      if (updatedNotes.length > 0) {
        localStorage.setItem(`recipe_note_${recipeId}`, updatedNotes[0].text);
      } else {
        localStorage.removeItem(`recipe_note_${recipeId}`);
      }
    } catch {
      // Ignore
    }
    onSaveNotesList?.(updatedNotes);
  };

  const handleCreateNote = () => {
    if (!newNoteText.trim()) return;
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const newEntry: RecipeNoteItem = {
      id: `note-${Date.now()}`,
      text: newNoteText.trim(),
      date: formattedDate,
      timestamp: Date.now(),
    };

    const updated = [newEntry, ...notes];
    saveNotesToStorage(updated);
    setNewNoteText("");
    setIsAddingNote(false);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);

    window.dispatchEvent(
      new CustomEvent("recipe_note_updated", {
        detail: { recipeId, note: newEntry },
      })
    );
  };

  const handleUpdateNote = (id: string) => {
    if (!editingText.trim()) return;
    const updated = notes.map((n) =>
      n.id === id ? { ...n, text: editingText.trim() } : n,
    );
    saveNotesToStorage(updated);
    setEditingNoteId(null);
    setEditingText("");
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    saveNotesToStorage(updated);
  };

  return (
    <section className="rounded-4xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xl dark:border-[#2e2722] dark:border-t-amber-500/20 dark:bg-[#1a1715] dark:shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.03)]">
      {/* HEADER & RATING */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-[#2e2722] pb-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-500 dark:text-amber-400">
            Cooking Journal
          </p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-950 dark:text-[#fafaf9]">
            Your Rating &amp; Notes
          </h2>
        </div>

        {/* STAR RATING INTERACTIVE */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-stone-500 dark:text-[#a8a29e]">
            {rating > 0 ? `${rating} of 5 stars` : "Rate this dish:"}
          </span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleSaveRating(star)}
                className="text-2xl transition hover:scale-125 active:scale-95 cursor-pointer"
                title={`Rate ${star} star${star > 1 ? "s" : ""}`}
              >
                <span
                  className={
                    star <= (hoverRating || rating)
                      ? "text-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                      : "text-stone-300 dark:text-[#3a322c]"
                  }
                >
                  ★
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CHEF'S NOTES TIMELINE */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-stone-500 dark:text-[#a8a29e]">
            Chef&apos;s Notes &amp; Cooking Log ({notes.length})
          </h3>

          {!isAddingNote && (
            <button
              type="button"
              onClick={() => {
                setIsAddingNote(true);
                setEditingNoteId(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-50 dark:border-[#2e2722] dark:bg-[#24201c] dark:text-[#d6d3d1] dark:hover:bg-[#2d2823] transition cursor-pointer shadow-2xs active:scale-95"
            >
              <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Add Note</span>
            </button>
          )}
        </div>

        {/* ADD NOTE FORM */}
        {isAddingNote && (
          <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 dark:border-amber-400/25 dark:bg-[#1f1b18] animate-in fade-in zoom-in-98 duration-150">
            <textarea
              rows={3}
              autoFocus
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="e.g. Added extra garlic, baked 2 mins less. Double sauce next time!"
              className="w-full rounded-xl bg-white p-3 text-sm text-stone-900 border border-stone-200 placeholder-stone-400 focus:border-amber-500 focus:outline-none transition resize-none dark:bg-[#141210] dark:border-[#2e2722] dark:text-[#fafaf9] dark:placeholder-[#78716c]"
            />
            <div className="flex items-center justify-between">
              {isSavedToast && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  ✓ Note saved!
                </span>
              )}
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNote(false);
                    setNewNoteText("");
                  }}
                  className="rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 dark:border-[#2e2722] dark:text-[#a8a29e] dark:hover:text-[#fafaf9] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateNote}
                  className="rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold border border-amber-600/60 shadow-xs px-4.5 py-1.5 text-xs transition active:scale-95 cursor-pointer"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NOTES LIST */}
        {notes.length === 0 && !isAddingNote ? (
          <div className="rounded-2xl border border-dashed border-stone-200 p-6 text-center text-xs text-stone-400 dark:border-[#2e2722] dark:text-[#78716c]">
            No notes logged yet. Log your personal tweaks, timings, and feedback!
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((item) => {
              const isEditing = editingNoteId === item.id;
              return (
                <div
                  key={item.id}
                  className="group rounded-2xl border border-stone-200/90 bg-stone-50/60 p-4 transition hover:border-amber-500/30 dark:border-[#2e2722] dark:bg-[#24201c] dark:hover:bg-[#2d2823] shadow-2xs"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        rows={2}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full rounded-xl bg-white p-3 text-sm text-stone-900 border border-stone-200 focus:border-amber-500 focus:outline-none dark:bg-[#141210] dark:border-[#2e2722] dark:text-[#fafaf9]"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingNoteId(null)}
                          className="rounded-xl border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-600 dark:border-[#2e2722] dark:text-[#a8a29e]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateNote(item.id)}
                          className="rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-3 py-1 text-xs transition cursor-pointer"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 dark:border-[#2e2722] mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            {item.date}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteId(item.id);
                              setEditingText(item.text);
                            }}
                            className="p-1 rounded-lg hover:bg-stone-200 dark:hover:bg-[#2e2722] text-stone-400 hover:text-stone-700 dark:text-[#a8a29e] dark:hover:text-[#fafaf9] transition cursor-pointer"
                            title="Edit note"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(item.id)}
                            className="p-1 rounded-lg hover:bg-rose-500/10 text-rose-500 transition cursor-pointer"
                            title="Delete note"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-stone-800 dark:text-[#e7e5e4] leading-relaxed whitespace-pre-wrap">
                        {item.text}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
