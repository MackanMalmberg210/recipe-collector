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
            <span>Chef AI Vision Engine</span>
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
            Snap a plated dish to calculate calories, macros, and reverse-engineer ingredients, or photograph physical recipes with Google Gemini Vision OCR.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300">
            <span className="text-amber-500 font-bold">✓</span>
            <span>Macros &amp; Calories</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300">
            <span className="text-amber-500 font-bold">✓</span>
            <span>Cookbook OCR</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-stone-100 dark:border-white/6">
        <button
          type="button"
          onClick={onOpenSnapPlate}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 py-3 px-4 text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer active:scale-95"
        >
          <span>🍽️</span>
          <span>Snap My Plate</span>
        </button>

        <button
          type="button"
          onClick={onOpenScanCookbook}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-300/90 bg-white hover:bg-stone-100 text-stone-800 dark:border-white/10 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-white/15 px-4 py-3 text-xs sm:text-sm font-bold shadow-xs transition-all duration-150 cursor-pointer active:scale-95"
        >
          <span>📷</span>
          <span>Scan Cookbook</span>
        </button>
      </div>
    </section>
  );
}
