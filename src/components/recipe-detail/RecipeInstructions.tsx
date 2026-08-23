"use client";

import { useState } from "react";

type RecipeInstructionsProps = {
  steps: string[];
  onOpenCookMode?: () => void;
};

const COOKING_CUES_REGEX =
  /(\d{2,3}\s*°\s*[CF]?|\d{2,3}\s*(?:degrees|degree)(?:\s*[CF])?|\d+(?:\s*-\s*\d+)?\s*(?:minutes|minute|mins|min|hours|hour|hrs|hr|seconds|secs|sec)|medium-high heat|medium-low heat|medium heat|high heat|low heat|golden and crispy|golden brown|caramelized and bubbly|fork tender|al dente)/gi;

/**
 * Highlights cooking cues (times, temps, heat levels) with refined inline elegance.
 */
function highlightCookingCues(text: string) {
  const parts = text.split(COOKING_CUES_REGEX);

  return parts.map((part, i) => {
    // Check if this part matches the regex
    const isHighlight =
      /^(\d{2,3}\s*°\s*[CF]?|\d{2,3}\s*(?:degrees|degree)(?:\s*[CF])?|\d+(?:\s*-\s*\d+)?\s*(?:minutes|minute|mins|min|hours|hour|hrs|hr|seconds|secs|sec)|medium-high heat|medium-low heat|medium heat|high heat|low heat|golden and crispy|golden brown|caramelized and bubbly|fork tender|al dente)$/i.test(
        part.trim(),
      );

    if (isHighlight) {
      return (
        <span
          key={i}
          className="font-semibold text-amber-300 bg-amber-400/10 px-1 py-0.5 rounded text-[0.95em] border-b border-amber-400/30"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export default function RecipeInstructions({
  steps,
  onOpenCookMode,
}: RecipeInstructionsProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const toggleStep = (index: number) => {
    setCompletedSteps((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  return (
    <section className="rounded-4xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-sm dark:border-white/10 dark:bg-[#17120f]/90 dark:shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
            Method &amp; Execution
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-950 dark:text-[#fff8ef]">
            Step-by-step instructions
          </h2>
        </div>

        {onOpenCookMode && (
          <button
            type="button"
            onClick={onOpenCookMode}
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-stone-950 transition active:scale-95 cursor-pointer shadow-sm"
          >
            <span>👨‍🍳</span>
            <span>Start Cook Mode</span>
          </button>
        )}
      </div>

      <ol className="space-y-3.5">
        {steps.map((step, index) => {
          const isDone = completedSteps.includes(index);
          return (
            <li
              key={`${index}-${step}`}
              onClick={() => toggleStep(index)}
              className={`group flex cursor-pointer items-start gap-3.5 rounded-2xl border p-3.5 sm:p-4 transition ${
                isDone
                  ? "border-emerald-500/20 bg-emerald-500/5 opacity-65"
                  : "border-stone-200 bg-stone-50/50 hover:bg-stone-100/80 hover:border-amber-400/40 dark:border-white/10 dark:bg-[#211915]/80 dark:hover:bg-[#261d17] dark:hover:border-amber-400/20 shadow-2xs"
              }`}
            >
              {/* REFINED COMPACT STEP NUMBER BADGE */}
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center text-center leading-none rounded-lg text-xs font-extrabold transition shadow-2xs select-none mt-0.5 ${
                  isDone
                    ? "bg-emerald-500 text-white shadow-emerald-400/20"
                    : "bg-amber-500/15 text-amber-900 border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-stone-950 dark:bg-amber-500/20 dark:text-amber-300"
                }`}
              >
                <span className="translate-y-px">{isDone ? "✓" : index + 1}</span>
              </div>

              {/* INSTRUCTION TEXT */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p
                  className={`text-sm sm:text-base leading-relaxed ${
                    isDone
                      ? "text-emerald-100/70 line-through decoration-emerald-400/40"
                      : "text-stone-100"
                  }`}
                >
                  {highlightCookingCues(step)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
