"use client";

type CulinaryAiShowcaseBannerProps = {
  onOpenSnapPlate: () => void;
  onOpenScanCookbook: () => void;
  onOpenImport?: () => void;
};

export default function CulinaryAiShowcaseBanner({
  onOpenSnapPlate,
  onOpenScanCookbook,
  onOpenImport,
}: CulinaryAiShowcaseBannerProps) {
  return (
    <section aria-label="Smart Culinary Tools" className="relative h-full w-full rounded-[32px] bg-stone-50 border border-stone-200/60 dark:bg-[#13110f] dark:border-white/5 overflow-hidden flex flex-col p-8 sm:p-10">
      {/* Subtle ambient glow in the background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm h-full max-h-96 bg-amber-400/5 dark:bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
      
      {/* HEADER */}
      <div className="relative z-10 mb-10">
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-950 to-slate-950 dark:from-white dark:to-white tracking-tight">
          Instant Recipe Capture & Import
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-stone-400 font-medium antialiased leading-relaxed">
          Digitize handwritten recipe books, analyze plated meals with AI, or import directly from web links.
        </p>
      </div>

      {/* 3 TOOLS IN RESPONSIVE GRID */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-auto">
        
        {/* TOOL 1: AI COOKBOOK SCANNER */}
        <div className="flex items-start gap-5 group">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-white/5 text-amber-600 dark:text-amber-500 border border-stone-200/80 dark:border-white/10 shadow-sm group-hover:-translate-y-1 transition-transform duration-300">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
              Cookbook OCR
            </span>
            <h4 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-950 to-slate-950 dark:from-white dark:to-white mb-1.5">
              Scan Physical Cookbooks
            </h4>
            <button
              type="button"
              onClick={onOpenScanCookbook}
              className="text-sm font-bold text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 flex items-center gap-1.5 transition-colors cursor-pointer group-hover:underline underline-offset-4"
            >
              <span>Scan Cookbook</span>
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        </div>

        {/* TOOL 2: SNAP & ANALYZE MEAL */}
        <div className="flex items-start gap-5 group">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-white/5 text-amber-600 dark:text-amber-500 border border-stone-200/80 dark:border-white/10 shadow-sm group-hover:-translate-y-1 transition-transform duration-300">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
              Vision AI
            </span>
            <h4 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-950 to-slate-950 dark:from-white dark:to-white mb-1.5">
              Snap &amp; Analyze Plate
            </h4>
            <button
              type="button"
              onClick={onOpenSnapPlate}
              className="text-sm font-bold text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 flex items-center gap-1.5 transition-colors cursor-pointer group-hover:underline underline-offset-4"
            >
              <span>Analyze Plate</span>
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        </div>

        {/* TOOL 3: 1-TAP SOCIAL & WEB IMPORTER */}
        <div className="flex items-start gap-5 group">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-white/5 text-amber-600 dark:text-amber-500 border border-stone-200/80 dark:border-white/10 shadow-sm group-hover:-translate-y-1 transition-transform duration-300">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
              1-Tap Import
            </span>
            <h4 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-950 to-slate-950 dark:from-white dark:to-white mb-1.5">
              Import TikTok &amp; Web
            </h4>
            <button
              type="button"
              onClick={onOpenImport}
              className="text-sm font-bold text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 flex items-center gap-1.5 transition-colors cursor-pointer group-hover:underline underline-offset-4"
            >
              <span>Import from Link</span>
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
