"use client";

import { useEffect, useState } from "react";

type RecipeNotesPanelProps = {
  recipeId: number;
};

function getNotesKey(recipeId: number) {
  return `recipeNotes:${recipeId}`;
}

export default function RecipeNotesPanel({ recipeId }: RecipeNotesPanelProps) {
  const [noteInput, setNoteInput] = useState("");
  const [notes, setNotes] = useState<string[]>([]);

  useEffect(() => {
    const storedNotes = localStorage.getItem(getNotesKey(recipeId));

    if (!storedNotes) return;

    try {
      setNotes(JSON.parse(storedNotes) as string[]);
    } catch {
      localStorage.removeItem(getNotesKey(recipeId));
    }
  }, [recipeId]);

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
    </section>
  );
}
