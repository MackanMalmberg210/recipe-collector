"use client";

import { useState, useEffect } from "react";
import { getRecipeRating, saveRecipeRating, type RecipeRating } from "../../lib/ratings";

const RECIPE_NOTES_KEY = "recipe_collector_notes";

type RecipeJournalPanelProps = {
  recipeId: number;
};

export default function RecipeJournalPanel({
  recipeId,
}: RecipeJournalPanelProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSavedToast, setIsSavedToast] = useState(false);

  // Load rating & notes
  useEffect(() => {
    const currentRating = getRecipeRating(recipeId);
    if (currentRating) {
      setRating(currentRating);
    }

    try {
      const storedNotes = localStorage.getItem(RECIPE_NOTES_KEY);
      if (storedNotes) {
        const parsedNotes = JSON.parse(storedNotes) as Record<string, string>;
        if (parsedNotes[recipeId]) {
          setNote(parsedNotes[recipeId]);
          setSavedNote(parsedNotes[recipeId]);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [recipeId]);

  const handleSaveRating = (stars: number) => {
    const r = stars as RecipeRating;
    setRating(stars);
    saveRecipeRating(recipeId, r);
    window.dispatchEvent(new CustomEvent("recipe_rating_updated", { detail: { recipeId, rating: stars } }));
  };

  const handleSaveNote = () => {
    try {
      const storedNotes = localStorage.getItem(RECIPE_NOTES_KEY);
      const parsed = storedNotes ? (JSON.parse(storedNotes) as Record<string, string>) : {};
      parsed[recipeId] = note.trim();
      localStorage.setItem(RECIPE_NOTES_KEY, JSON.stringify(parsed));
      setSavedNote(note.trim());
      setIsEditing(false);
      setIsSavedToast(true);
      setTimeout(() => setIsSavedToast(false), 2500);
    } catch {
      // Ignore
    }
  };

  return (
    <section className="rounded-4xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-sm dark:border-white/10 dark:bg-[#17120f]/90 dark:shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
      {/* HEADER & RATING */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-white/10 pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
            Cooking Journal
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-950 dark:text-[#fff8ef]">
            Your Rating &amp; Notes
          </h2>
        </div>

        {/* STAR RATING INTERACTIVE */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
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
                      : "text-stone-300 dark:text-stone-700"
                  }
                >
                  ★
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PERSONAL COOKING NOTE */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300/80">
              Chef&apos;s Notes &amp; Personal Tweaks
            </h3>
            {isEditing && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300 animate-pulse border border-amber-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                <span>Editing note</span>
              </span>
            )}
          </div>

          {!isEditing && savedNote && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300 transition cursor-pointer"
            >
              <span>✎</span>
              <span>Edit Note</span>
            </button>
          )}
        </div>

        {isEditing || !savedNote ? (
          <div className="space-y-3">
            <div className={`relative rounded-3xl border transition ${
              isEditing
                ? "border-amber-500/50 bg-amber-500/5 shadow-[0_0_24px_rgba(251,191,36,0.1)] ring-1 ring-amber-500/40 dark:bg-[#251d18]"
                : "border-stone-200 bg-stone-50/50 dark:border-white/10 dark:bg-[#211915]/80"
            }`}>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Added extra garlic, baked at 200°C for 22 mins instead of 20. Loved by everyone!"
                className="w-full rounded-3xl bg-transparent p-4 sm:p-5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none transition resize-none dark:text-stone-100 dark:placeholder-stone-500"
              />
            </div>

            <div className="flex items-center justify-between">
              {isSavedToast && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                  ✓ Note saved to recipe!
                </span>
              )}
              <div className="ml-auto flex gap-2">
                {savedNote && (
                  <button
                    type="button"
                    onClick={() => {
                      setNote(savedNote);
                      setIsEditing(false);
                    }}
                    className="rounded-xl border border-stone-300 px-3.5 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 dark:border-white/10 dark:text-stone-400 dark:hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-1.5 text-xs font-bold text-stone-950 transition active:scale-95 cursor-pointer shadow-xs"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* DESIGNED CHEF'S NOTE CARD */
          <div className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-linear-to-br from-amber-500/8 to-transparent dark:from-[#261d17] dark:to-[#1c1612] p-5 sm:p-6 shadow-2xs">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-500/70" />
            
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300/80 mb-2">
                <span>📌</span>
                <span>Personal Recipe Note</span>
              </div>
            </div>

            <p className="text-sm sm:text-base leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-wrap font-sans">
              &ldquo;{savedNote}&rdquo;
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
