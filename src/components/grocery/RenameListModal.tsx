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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[32px] border border-slate-200/90 bg-white p-6 sm:p-7 shadow-2xl space-y-5 cursor-default animate-in zoom-in-95 duration-150 dark:border-white/10 dark:bg-[#121212]"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-white/10">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Rename Grocery List</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Give your list a descriptive title</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:bg-white/10 dark:text-slate-400 dark:hover:bg-white/20 dark:hover:text-white transition cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="List name..."
            autoFocus
            required
            className="w-full rounded-[20px] border border-slate-200 bg-slate-50/60 px-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none transition dark:border-white/10 dark:bg-white/5 dark:text-stone-100 dark:placeholder-stone-500 dark:focus:bg-white/10 dark:focus:border-amber-400/60"
          />

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || name.trim() === currentName}
              className="rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-gradient-to-b dark:from-amber-500 dark:to-amber-600 dark:hover:from-amber-400 dark:hover:to-amber-500 dark:text-stone-950 dark:border dark:border-amber-600/50 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm active:scale-95 transition cursor-pointer disabled:opacity-40"
            >
              Save Name
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
