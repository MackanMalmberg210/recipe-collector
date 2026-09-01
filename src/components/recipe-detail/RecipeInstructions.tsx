"use client";

import { useState } from "react";

type RecipeInstructionsProps = {
  steps: string[];
  onOpenCookMode?: () => void;
};

// 1. Precise check for Times, Temperatures, and Heat Levels
const CULINARY_TIME_TEMP_REGEX =
  /^(\b\d{2,3}\s*°\s*[CF]\b|\b\d{2,3}\s*(?:degrees|degree)(?:\s*[CF])?\b|\b\d+(?:\s*-\s*\d+)?\s*(?:minutes|minute|mins|min|hours|hour|hrs|hr|seconds|secs|sec)\b|\bovernight\b|\b(?:medium-high|medium-low|medium|high|low)\s+heat\b|\b(?:gentle|rolling|rapid)\s+(?:simmer|boil)\b)$/i;

// 2. Comprehensive check for Techniques, Actions, and Doneness / Visual Target States
const CULINARY_ACTION_DONENESS_REGEX =
  /^(\b(?:gently|vigorously|lightly|finely|roughly|slowly|carefully|evenly|constantly|frequently)\s+(?:sauté|saute|stir|whisk|toss|simmer|sear|mix|drizzle|fold|brush|season|coat|mince|chop)\b|\b(?:golden\s+and\s+(?:cooked\s+through|crispy|bubbly|tender|caramelized)|golden\s+brown|golden\s+and\s+crispy|crispy\s+and\s+browned|caramelized\s+and\s+bubbly|melted\s+and\s+bubbly|cooked\s+through|heated\s+through|fork[- ]tender|tender[- ]crisp|lightly\s+browned|well[- ]browned|translucent|fragrant|softened|reduced\s+by\s+half|doubled\s+in\s+size|bubbling\s+gently|thickened|al\s+dente|deglaize|caramelize|blanch|poach|braise|sauté|saute|sear|whisk|fold\s+in)\b)$/i;

// 3. Master splitter pattern (ordered longest/compound matches first)
const COMBINED_COOKING_CUES_REGEX =
  /(\b\d{2,3}\s*°\s*[CF]\b|\b\d{2,3}\s*(?:degrees|degree)(?:\s*[CF])?\b|\b\d+(?:\s*-\s*\d+)?\s*(?:minutes|minute|mins|min|hours|hour|hrs|hr|seconds|secs|sec)\b|\bovernight\b|\b(?:medium-high|medium-low|medium|high|low)\s+heat\b|\b(?:gentle|rolling|rapid)\s+(?:simmer|boil)\b|\b(?:gently|vigorously|lightly|finely|roughly|slowly|carefully|evenly|constantly|frequently)\s+(?:sauté|saute|stir|whisk|toss|simmer|sear|mix|drizzle|fold|brush|season|coat|mince|chop)\b|\b(?:golden\s+and\s+(?:cooked\s+through|crispy|bubbly|tender|caramelized)|golden\s+brown|golden\s+and\s+crispy|crispy\s+and\s+browned|caramelized\s+and\s+bubbly|melted\s+and\s+bubbly|cooked\s+through|heated\s+through|fork[- ]tender|tender[- ]crisp|lightly\s+browned|well[- ]browned|translucent|fragrant|softened|reduced\s+by\s+half|doubled\s+in\s+size|bubbling\s+gently|thickened|al\s+dente|deglaize|caramelize|blanch|poach|braise|sauté|saute|sear|whisk|fold\s+in)\b)/gi;

/**
 * Highlights cooking cues with one consistent, unified, elegant styling.
 */
function highlightCookingCues(text: string) {
  const parts = text.split(COMBINED_COOKING_CUES_REGEX);

  return parts.map((part, i) => {
    const trimmed = part.trim();
    const isHighlight =
      CULINARY_TIME_TEMP_REGEX.test(trimmed) ||
      CULINARY_ACTION_DONENESS_REGEX.test(trimmed);

    if (isHighlight) {
      return (
        <span
          key={i}
          className="inline-block font-semibold text-amber-900 dark:text-amber-200 bg-amber-500/10 dark:bg-amber-400/12 px-1.5 py-0.5 rounded-md border border-amber-500/20 dark:border-amber-400/20 text-[0.95em]"
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
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-950 dark:text-[#fff8ef]">
            Step-by-step instructions
          </h2>
        </div>

        {onOpenCookMode && (
          <button
            type="button"
            onClick={onOpenCookMode}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold border border-amber-600/60 dark:border-amber-600/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] px-4.5 py-2.5 text-xs sm:text-sm transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <svg className="h-4 w-4 text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
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
              {/* REFINED STEP NUMBER BADGE WITH BALANCED NEUTRAL BACKGROUND */}
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center text-center leading-none rounded-xl text-xs font-black transition select-none mt-0.5 ${
                  isDone
                    ? "bg-emerald-500 text-stone-950 shadow-xs shadow-emerald-500/30"
                    : "bg-stone-100 text-stone-800 border border-stone-300/80 dark:bg-white/8 dark:border-white/12 dark:text-stone-200 group-hover:border-amber-400/40 group-hover:text-amber-400"
                }`}
              >
                <span className="translate-y-px">{isDone ? "✓" : index + 1}</span>
              </div>

              {/* INSTRUCTION TEXT */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p
                  className={`text-sm sm:text-base leading-relaxed ${
                    isDone
                      ? "text-emerald-800 dark:text-emerald-100/70 line-through decoration-emerald-400/40"
                      : "text-stone-900 dark:text-stone-100"
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
