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
    <section className="relative overflow-hidden rounded-4xl border border-stone-200/90 bg-white p-6 sm:p-7 shadow-[0_10px_35px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-[#16120f]/95 dark:shadow-[0_16px_50px_rgba(0,0,0,0.4)] h-full flex flex-col justify-between transition-all hover:border-amber-400/40 dark:hover:border-amber-400/30">
      <div className="space-y-4">
        
        {/* Top Eyebrow Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
            <span className="text-base">✨</span>
            <span>Scan &amp; Analyze</span>
          </div>

          <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-black text-amber-800 dark:text-amber-300 border border-amber-400/30">
            👑 PRO
          </span>
        </div>

        {/* Headline & Value Prop */}
        <div className="space-y-2">
          <h3 className="text-xl font-extrabold tracking-tight text-stone-950 dark:text-[#fff8ef] leading-snug">
            Turn any food photo or cookbook into a digital recipe.
          </h3>

          <p className="text-xs sm:text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            Take a picture of your meal to estimate calories and ingredients, or scan a page from your physical cookbook with our AI Recipe Scanner.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
          <div className="flex items-center gap-2 text-sm font-bold text-stone-800 dark:text-stone-200">
            <span className="text-base text-amber-500 font-black">✓</span>
            <span>Nutrition &amp; Calories</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-stone-800 dark:text-stone-200">
            <span className="text-base text-amber-500 font-black">✓</span>
            <span>Recipe Scanner</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Footer with Sharp High-Contrast SVG Icons */}
      <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-stone-100 dark:border-white/6">
        <button
          type="button"
          onClick={onOpenSnapPlate}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 border border-amber-600/60 dark:border-amber-600/50 py-3 px-4 text-xs sm:text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] transition active:scale-95 cursor-pointer"
        >
          <svg className="h-4.5 w-4.5 shrink-0 text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Analyze Meal</span>
        </button>

        <button
          type="button"
          onClick={onOpenScanCookbook}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300/90 bg-stone-50 hover:bg-stone-100 text-stone-800 dark:border-white/12 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-white/10 px-4.5 py-3 text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 cursor-pointer"
        >
          <svg className="h-4.5 w-4.5 shrink-0 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span>Scan Recipe</span>
        </button>
      </div>
    </section>
  );
}
