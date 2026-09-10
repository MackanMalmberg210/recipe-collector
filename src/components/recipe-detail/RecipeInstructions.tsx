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
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-500 dark:text-amber-400">
          Method &amp; Execution
        </p>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-950 dark:text-[#fafaf9]">
          Step-by-step instructions
        </h2>
      </div>

      <ol className="space-y-3.5">
        {steps.map((step, index) => {
          const isDone = completedSteps.includes(index);
          const stepNum = String(index + 1).padStart(2, "0");
          return (
            <li
              key={`${index}-${step}`}
              onClick={() => toggleStep(index)}
              className={`group flex cursor-pointer items-baseline gap-3.5 sm:gap-4 rounded-2xl border p-3.5 sm:p-4.5 transition ${
                isDone
                  ? "border-emerald-500/25 bg-emerald-500/10 opacity-70"
                  : "border-stone-200/90 bg-stone-50/60 hover:bg-stone-100 hover:border-amber-500/30 dark:border-[#2e2722] dark:bg-[#24201c] dark:hover:bg-[#2d2823] dark:hover:border-amber-400/30 shadow-2xs"
              }`}
            >
              {/* SLEEK EDITORIAL STEP NUMBER (01, 02, 03...) - PERFECT BASELINE ALIGNMENT */}
              <span
                className={`shrink-0 w-7 select-none font-bold text-sm sm:text-base tracking-tight transition ${
                  isDone
                    ? "text-emerald-500 font-black text-base"
                    : "text-amber-500/90 group-hover:text-amber-600 dark:text-amber-400/80 dark:group-hover:text-amber-300"
                }`}
              >
                {isDone ? "✓" : stepNum}
              </span>

              {/* CLEAN INSTRUCTION TEXT */}
              <p
                className={`flex-1 min-w-0 text-sm sm:text-base leading-relaxed ${
                  isDone
                    ? "text-emerald-700 dark:text-emerald-300 line-through decoration-emerald-400/50"
                    : "text-stone-900 dark:text-[#fafaf9]"
                }`}
              >
                {step}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
