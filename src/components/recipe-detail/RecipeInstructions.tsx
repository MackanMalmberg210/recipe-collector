"use client";

import { useState } from "react";

type RecipeInstructionsProps = {
  steps: string[];
  onOpenCookMode?: () => void;
};

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
    <section className="rounded-4xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xl dark:border-[#2e2722] dark:border-t-amber-500/20 dark:bg-[#1a1715] dark:shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-500 dark:text-amber-400">
            Method &amp; Execution
          </p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-950 dark:text-[#fafaf9]">
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
              className={`group flex cursor-pointer items-start gap-3.5 rounded-2xl border p-3.5 sm:p-4.5 transition ${
                isDone
                  ? "border-emerald-500/25 bg-emerald-500/10 opacity-70"
                  : "border-stone-200/90 bg-stone-50/60 hover:bg-stone-100 hover:border-amber-500/30 dark:border-[#2e2722] dark:bg-[#24201c] dark:hover:bg-[#2d2823] dark:hover:border-amber-400/30 shadow-2xs"
              }`}
            >
              {/* STEP NUMBER BADGE */}
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center text-center leading-none rounded-xl text-xs font-black transition select-none mt-0.5 ${
                  isDone
                    ? "bg-emerald-500 text-stone-950 shadow-xs shadow-emerald-500/30"
                    : "bg-stone-100 text-stone-800 border border-stone-300 dark:bg-[#1a1715] dark:border-[#3a322c] dark:text-amber-400 group-hover:border-amber-400 group-hover:text-amber-400"
                }`}
              >
                <span className="translate-y-px">{isDone ? "✓" : index + 1}</span>
              </div>

              {/* CLEAN INSTRUCTION TEXT */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p
                  className={`text-sm sm:text-base leading-relaxed ${
                    isDone
                      ? "text-emerald-700 dark:text-emerald-300 line-through decoration-emerald-400/50"
                      : "text-stone-900 dark:text-[#fafaf9]"
                  }`}
                >
                  {step}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
