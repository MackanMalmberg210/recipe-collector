import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8 relative overflow-hidden bg-[#faf8f5] dark:bg-[#12100e] text-stone-900 dark:text-stone-100 transition-colors duration-300">
      {/* AMBIENT BACKGROUND GLOW */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-amber-500/5 blur-[140px] dark:bg-amber-500/10" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-orange-500/5 blur-[140px] dark:bg-orange-500/10" />

      <div className="relative z-10 max-w-lg w-full text-center space-y-6 rounded-3xl border border-stone-200/90 bg-white/95 dark:border-white/10 dark:bg-[#181411] p-8 sm:p-12 shadow-xl">
        {/* CULINARY EMBLEM */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-500/20 shadow-xs">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>

        {/* HEADINGS */}
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
            404 Error • Page Missing
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">
            This dish isn&apos;t in the kitchen
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed pt-1">
            The page or recipe you are looking for might have simmered away, been renamed, or does not exist.
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold border border-amber-600/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] px-5 py-2.5 text-xs transition active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
            </svg>
            <span>Explore Recipes</span>
          </Link>

          <Link
            href="/saved"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 dark:border-white/10 dark:bg-[#25201c] dark:text-stone-200 dark:hover:bg-[#2e2722] font-semibold px-5 py-2.5 text-xs transition active:scale-95"
          >
            <span>My Cookbook</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
