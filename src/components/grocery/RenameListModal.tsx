"use client";

import { useState, useEffect } from "react";

type RenameListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onSave: (newName: string) => void;
};

export default function RenameListModal({
  isOpen,
  onClose,
  currentName,
  onSave,
}: RenameListModalProps) {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    setName(currentName);
  }, [currentName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    onSave(clean);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-stone-200/90 bg-white p-6 shadow-2xl space-y-4 cursor-default animate-in zoom-in-95 duration-150 dark:border-white/12 dark:bg-[#16120f]"
      >
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-3 dark:border-white/8">
          <h3 className="text-lg font-bold text-stone-900 dark:text-[#fff8ef]">Rename Grocery List</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-white transition cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="List name..."
            autoFocus
            required
            className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-amber-500 focus:outline-none dark:border-white/10 dark:bg-black/40 dark:text-stone-100 dark:placeholder-stone-500 dark:focus:border-amber-400"
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || name.trim() === currentName}
              className="rounded-2xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs sm:text-sm font-bold text-stone-950 shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer disabled:opacity-40"
            >
              Save Name
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
