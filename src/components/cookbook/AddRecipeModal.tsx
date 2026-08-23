"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AddRecipeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: "scratch" | "scan_cookbook" | "import_url" | "snap_plate") => void;
};

export default function AddRecipeModal({
  isOpen,
  onClose,
  onSelectOption,
}: AddRecipeModalProps) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const options = [
    {
      id: "scratch" as const,
      icon: "✍️",
      title: "Write from Scratch",
      description: "Enter your title, ingredients, and step-by-step cooking instructions manually.",
      badge: "Manual",
      action: () => {
        onClose();
        router.push("/create");
      },
    },
    {
      id: "scan_cookbook" as const,
      icon: "📷",
      title: "Scan Cookbook or Recipe Card",
      description: "Take a photo of a cookbook page or handwritten family recipe card with AI OCR.",
      badge: "AI Vision",
      action: () => {
        onClose();
        onSelectOption("scan_cookbook");
      },
    },
    {
      id: "import_url" as const,
      icon: "🔗",
      title: "Import from Web URL",
      description: "Paste a recipe link from any food blog or website to extract clean ingredients and steps.",
      badge: "Web Link",
      action: () => {
        onClose();
        onSelectOption("import_url");
      },
    },
    {
      id: "snap_plate" as const,
      icon: "🍽️",
      title: "Snap My Plate (Reverse Recipe)",
      description: "Photograph a plated dish to estimate calories, macros, and generate a full home-cook recipe.",
      badge: "Culinary AI",
      action: () => {
        onClose();
        onSelectOption("snap_plate");
      },
    },
  ];

  // Reset selected index when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation: ArrowUp, ArrowDown, Enter, Space, Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % options.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + options.length) % options.length);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        options[selectedIndex].action();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, onClose, options]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-4xl border border-stone-200/90 bg-white text-stone-900 shadow-2xl dark:border-white/10 dark:bg-[#151210] dark:text-stone-100 animate-in zoom-in-95 fade-in duration-200 my-auto p-6 sm:p-8 space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50">
              Add to Your Cookbook
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Use arrow keys <kbd className="rounded bg-stone-100 dark:bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">↑</kbd> <kbd className="rounded bg-stone-100 dark:bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">↓</kbd> and <kbd className="rounded bg-stone-100 dark:bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd> to choose.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/10 dark:hover:text-white transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Option Cards List */}
        <div className="grid grid-cols-1 gap-3" role="listbox" aria-label="Recipe creation methods">
          {options.map((opt, idx) => {
            const isSelected = selectedIndex === idx;

            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={opt.action}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`group flex items-start gap-4 rounded-2xl p-4.5 text-left border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30 scale-[1.01] shadow-md dark:border-amber-500 dark:bg-amber-500/15"
                    : "border-stone-200/90 bg-stone-50/60 hover:bg-stone-100/80 hover:border-stone-300 dark:border-white/10 dark:bg-[#1b1613] dark:hover:bg-white/5 dark:hover:border-white/20"
                }`}
              >
                {/* Standalone Icon */}
                <span className={`text-2xl sm:text-3xl shrink-0 mt-0.5 transition-transform duration-200 ${isSelected ? "scale-110" : "group-hover:scale-105"}`}>
                  {opt.icon}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-sm sm:text-base font-bold transition-colors ${
                      isSelected
                        ? "text-amber-700 dark:text-amber-300 font-extrabold"
                        : "text-stone-900 dark:text-stone-100"
                    }`}>
                      {opt.title}
                    </h3>
                    <span className={`shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                      isSelected
                        ? "border-amber-500/40 bg-amber-500/20 text-amber-800 dark:text-amber-300"
                        : "border-stone-200 dark:border-white/10 bg-white dark:bg-white/5 text-stone-600 dark:text-stone-400"
                    }`}>
                      {opt.badge}
                    </span>
                  </div>
                  <p className={`mt-1 text-xs leading-relaxed transition-colors ${
                    isSelected ? "text-stone-700 dark:text-stone-300" : "text-stone-500 dark:text-stone-400"
                  }`}>
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
