"use client";

type CulinaryAiShowcaseBannerProps = {
  onOpenSnapPlate: () => void;
  onOpenScanCookbook: () => void;
};

export default function CulinaryAiShowcaseBanner({
  onOpenSnapPlate,
  onOpenScanCookbook,
}: CulinaryAiShowcaseBannerProps) {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-indigo-200/80 bg-gradient-to-br from-indigo-100/90 via-slate-100/95 to-indigo-50/70 dark:from-[#221b16] dark:via-[#181310] dark:to-[#120f0d] p-7 sm:p-9 shadow-[0_10px_35px_rgb(99,102,241,0.07)] dark:border-white/10 dark:shadow-none h-full flex flex-col justify-between transition-all group">
      {/* Decorative ambient corner glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-indigo-500/15 blur-2xl dark:bg-amber-500/5" />

      <div className="relative space-y-6">
        
        {/* Top Eyebrow Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/95 border border-indigo-200/80 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-indigo-950 shadow-2xs dark:bg-white/5 dark:border-white/10 dark:text-stone-200">
            <svg className="h-4 w-4 text-indigo-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span>Culinary AI Studio</span>
          </div>

          <span className="rounded-xl bg-zinc-900 text-white dark:bg-amber-400 dark:text-slate-950 px-2.5 py-1 text-[11px] font-black tracking-wider shadow-xs">
            PRO
          </span>
        </div>

        {/* Headline & Value Prop */}
        <div className="space-y-3">
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-[#fff8ef] leading-snug">
            Turn any food photo into an instant recipe.
          </h3>

          <p className="text-sm sm:text-base font-medium leading-relaxed text-slate-700 dark:text-stone-300">
            Snap a plate to estimate calories and ingredients, or scan physical cookbook pages with our AI scanner.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="flex flex-col gap-3 pt-1">
          <div className="flex items-center gap-3 text-sm sm:text-base font-bold text-slate-900 dark:text-stone-200">
            <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 text-xs font-black">✓</span>
            <span>Accurate Nutrition &amp; Macros</span>
          </div>
          <div className="flex items-center gap-3 text-sm sm:text-base font-bold text-slate-900 dark:text-stone-200">
            <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 text-xs font-black">✓</span>
            <span>Cookbook OCR &amp; Digitization</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="relative mt-8 flex flex-col sm:flex-row items-center gap-3 pt-5 border-t border-indigo-200/60 dark:border-white/10">
        <button
          type="button"
          onClick={onOpenSnapPlate}
          className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-900 dark:bg-gradient-to-b dark:from-amber-500 dark:to-amber-600 dark:hover:from-amber-400 dark:hover:to-amber-500 dark:text-stone-950 dark:border-amber-600/50 py-3.5 px-5 text-sm sm:text-base font-bold shadow-[0_4px_12px_rgb(0,0,0,0.08)] transition-all active:scale-95 cursor-pointer"
        >
          <svg className="h-5 w-5 shrink-0 text-white dark:text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Analyze Plate</span>
        </button>

        <button
          type="button"
          onClick={onOpenScanCookbook}
          className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 text-slate-900 dark:border-white/12 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-white/10 px-5 py-3.5 text-sm sm:text-base font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
        >
          <svg className="h-5 w-5 shrink-0 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span>Scan Book</span>
        </button>
      </div>
    </section>
  );
}
