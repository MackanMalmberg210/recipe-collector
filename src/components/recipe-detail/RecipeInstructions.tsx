"use client";

type RecipeInstructionsProps = {
  steps: string[];
};

export default function RecipeInstructions({ steps }: RecipeInstructionsProps) {
  return (
    <section className="rounded-4xl border border-white/10 bg-[#17120f]/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.3)] ring-1 ring-white/3">
      <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-amber-100/55">
        Instructions
      </p>

      <h2 className="mb-6 text-3xl font-semibold text-[#fff8ef]">
        Step-by-step cooking
      </h2>

      <ol className="space-y-4">
        {steps.map((step, index) => (
          <li
            key={`${index}-${step}`}
            className="flex gap-4 rounded-3xl border border-white/10 bg-[#211915]/80 p-4"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff4e2] text-sm font-bold text-[#19120e]">
              {index + 1}
            </div>

            <p className="pt-1 text-sm leading-7 text-stone-200 md:text-base">
              {step}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
