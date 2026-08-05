"use client";

import { useEffect, useState } from "react";

type RecipeNotesPanelProps = {
  recipeId: number;
};

function getNotesKey(recipeId: number) {
  return `recipeNotes:${recipeId}`;
}

function getRatingKey(recipeId: number) {
  return `recipeRating:${recipeId}`;
}

export default function RecipeNotesPanel({ recipeId }: RecipeNotesPanelProps) {
  const [noteInput, setNoteInput] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  useEffect(() => {
    const storedNotes = localStorage.getItem(getNotesKey(recipeId));

    if (!storedNotes) return;

    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotes(JSON.parse(storedNotes) as string[]);
    } catch {
      localStorage.removeItem(getNotesKey(recipeId));
    }
  }, [recipeId]);

  useEffect(() => {
    const storedRating = localStorage.getItem(getRatingKey(recipeId));
    if (storedRating) {
      const parsedRating = parseInt(storedRating, 10);
      if (!isNaN(parsedRating) && parsedRating >= 1 && parsedRating <= 5) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRating(parsedRating);
      } else {
        localStorage.removeItem(getRatingKey(recipeId));
      }
    }
  }, [recipeId]);

  const handleRate = (newRating: number) => {
    setRating(newRating);
    localStorage.setItem(getRatingKey(recipeId), newRating.toString());
    window.dispatchEvent(new Event("recipeRatingUpdated"));
  };

  const handleSaveNote = () => {
    const trimmedNote = noteInput.trim();

    if (!trimmedNote) return;

    const updatedNotes = [trimmedNote, ...notes];

    setNotes(updatedNotes);
    localStorage.setItem(getNotesKey(recipeId), JSON.stringify(updatedNotes));
    setNoteInput("");
  };

  const handleDeleteNote = (indexToDelete: number) => {
    const updatedNotes = notes.filter((_, index) => index !== indexToDelete);

    setNotes(updatedNotes);
    localStorage.setItem(getNotesKey(recipeId), JSON.stringify(updatedNotes));
  };

  return (
    <section className="rounded-4xl border border-white/10 bg-[#17120f]/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.3)] ring-1 ring-white/3">
      <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-amber-100/55">
        My notes
      </p>

      <h2 className="text-2xl font-semibold text-[#fff8ef]">
        Remember for next time
      </h2>

      <p className="mt-2 text-sm leading-6 text-stone-400">
        Save personal tweaks, cooking observations, or things you want to change
        the next time you make this recipe.
      </p>

      <div className="mt-5 space-y-3">
        <textarea
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          placeholder="Example: Add more lemon, cook 5 minutes less, use chili flakes..."
          rows={4}
          className="w-full resize-none rounded-3xl border border-white/10 bg-[#211915]/80 px-4 py-3 text-sm leading-6 text-[#fff8ef] outline-none transition placeholder:text-stone-500 focus:border-amber-100/25 focus:bg-[#261d17]"
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveNote}
            disabled={!noteInput.trim()}
            className="rounded-2xl bg-[#fff4e2] px-5 py-3 text-sm font-bold text-[#19120e] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save note
          </button>
        </div>
      </div>

      {notes.length > 0 ? (
        <div className="mt-6 space-y-3">
          {notes.map((note, index) => (
            <article
              key={`${recipeId}-note-${index}`}
              className="rounded-3xl border border-white/10 bg-[#211915]/80 p-4"
            >
              <p className="text-sm leading-6 text-stone-200">{note}</p>

              <button
                type="button"
                onClick={() => handleDeleteNote(index)}
                className="mt-3 text-xs font-medium text-stone-500 transition hover:text-red-300"
              >
                Delete note
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-white/3 p-5 text-sm leading-6 text-stone-500">
          No notes yet. Add a quick reminder after cooking this recipe.
        </div>
      )}

      <div className="mt-8 border-t border-white/10 pt-6">
        <h3 className="mb-2 text-lg font-semibold text-[#fff8ef]">
          Rate this recipe
        </h3>
        <p className="mb-4 text-sm leading-6 text-stone-400">
          Rate a recipe after trying it out. You can give it a rating from 1 to
          5 stars, with 1 being the lowest and 5 being the highest. Consider
          factors such as taste, ease of preparation, and overall satisfaction
          when rating the recipe.
        </p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`text-3xl transition-colors ${
                (hoverRating !== null ? hoverRating : rating ?? 0) >= star
                  ? "text-amber-400"
                  : "text-white/20"
              }`}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
            >
              ★
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
