import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative mt-20 px-4 sm:px-6 lg:px-10 pb-16 pt-6">
      {/* FLOATING BENTO CULINARY CONSOLE */}
      <div className="mx-auto max-w-7xl 2xl:max-w-[1820px] rounded-[32px] border border-slate-200/90 bg-white text-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-white/10 dark:bg-[#12100e] dark:text-stone-100 p-8 sm:p-10 lg:p-12 relative overflow-hidden transition-colors duration-300">
        
        {/* SUBTLE AMBIENT CORNER GLOW */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/5 blur-3xl dark:bg-amber-500/5" />
        <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-slate-500/5 blur-3xl dark:bg-emerald-500/5" />

        {/* TOP LEVEL: INTERACTIVE QUICK COMMAND DOCK */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-slate-100 dark:border-white/10 pb-8">
          
          {/* BRAND EMBLEM */}
          <Link href="/" className="inline-flex items-center gap-3.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-gradient-to-br dark:from-amber-500 dark:to-amber-600 dark:text-stone-950 shadow-sm transition-transform group-hover:scale-105">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-950 dark:text-white block">
                Recipe Collector
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-amber-400">
                Smart Kitchen &amp; Recipe Studio
              </span>
            </div>
          </Link>

          {/* QUICK ACCESS DOCK PILLS */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100/90 px-4 py-2 text-xs sm:text-sm font-bold text-slate-800 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/15 dark:hover:text-white transition-all duration-200 shadow-2xs group"
            >
              <svg className="h-3.5 w-3.5 text-slate-500 group-hover:text-white dark:text-amber-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
              </svg>
              <span>Explore</span>
            </Link>

            <Link
              href="/saved"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100/90 px-4 py-2 text-xs sm:text-sm font-bold text-slate-800 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/15 dark:hover:text-white transition-all duration-200 shadow-2xs group"
            >
              <svg className="h-3.5 w-3.5 text-slate-500 group-hover:text-white dark:text-amber-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Cookbook</span>
            </Link>

            <Link
              href="/planner"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100/90 px-4 py-2 text-xs sm:text-sm font-bold text-slate-800 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/15 dark:hover:text-white transition-all duration-200 shadow-2xs group"
            >
              <svg className="h-3.5 w-3.5 text-slate-500 group-hover:text-white dark:text-amber-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Meal Planner</span>
            </Link>

            <Link
              href="/groceries"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100/90 px-4 py-2 text-xs sm:text-sm font-bold text-slate-800 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/15 dark:hover:text-white transition-all duration-200 shadow-2xs group"
            >
              <svg className="h-3.5 w-3.5 text-slate-500 group-hover:text-white dark:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Groceries</span>
            </Link>

            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 text-white px-4 py-2 text-xs sm:text-sm font-bold hover:bg-zinc-800 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400 transition shadow-xs"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Recipe</span>
            </Link>
          </div>

        </div>

        {/* MID SECTION: 4-COLUMN BENTO GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 py-10">
          
          {/* Bento 1: Philosophy & Craft */}
          <div className="space-y-3.5">
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950 dark:text-amber-400">
              Culinary Philosophy
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-stone-300 leading-relaxed font-medium">
              Designed for passionate cooks who cherish clarity. No intrusive popups, no sponsored clutter—just clean ingredients, smart step-by-step guidance, and accurate measurements.
            </p>
          </div>

          {/* Bento 2: Quick Navigation */}
          <div className="space-y-3.5">
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950 dark:text-amber-400">
              Quick Navigation
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-stone-300 font-semibold">
              <li>
                <Link href="/" className="hover:text-slate-950 hover:translate-x-1 dark:hover:text-white transition-all inline-flex items-center gap-2 group">
                  <span className="text-slate-400 group-hover:text-slate-950 dark:text-amber-500/80 transition-colors">›</span>
                  <span>Explore Recipes</span>
                </Link>
              </li>
              <li>
                <Link href="/saved" className="hover:text-slate-950 hover:translate-x-1 dark:hover:text-white transition-all inline-flex items-center gap-2 group">
                  <span className="text-slate-400 group-hover:text-slate-950 dark:text-amber-500/80 transition-colors">›</span>
                  <span>Cookbook Library</span>
                </Link>
              </li>
              <li>
                <Link href="/planner" className="hover:text-slate-950 hover:translate-x-1 dark:hover:text-white transition-all inline-flex items-center gap-2 group">
                  <span className="text-slate-400 group-hover:text-slate-950 dark:text-amber-500/80 transition-colors">›</span>
                  <span>Weekly Meal Planner</span>
                </Link>
              </li>
              <li>
                <Link href="/groceries" className="hover:text-slate-950 hover:translate-x-1 dark:hover:text-white transition-all inline-flex items-center gap-2 group">
                  <span className="text-slate-400 group-hover:text-slate-950 dark:text-amber-500/80 transition-colors">›</span>
                  <span>Grocery &amp; Pantry Hub</span>
                </Link>
              </li>
              <li>
                <Link href="/create" className="hover:text-slate-950 hover:translate-x-1 dark:hover:text-white transition-all inline-flex items-center gap-2 group">
                  <span className="text-slate-400 group-hover:text-slate-950 dark:text-amber-500/80 transition-colors">›</span>
                  <span>Create / Import Recipe</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Bento 3: AI Privacy & GDPR */}
          <div className="space-y-3.5">
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950 dark:text-amber-400">
              Privacy &amp; AI Ethics
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-stone-300 leading-relaxed font-medium">
              <strong className="font-bold text-slate-950 dark:text-stone-100 block mb-1">
                Zero Model Training Policy
              </strong>
              All image recognition and recipe OCR run via commercial API tiers. Your personal photos, recipes, and notes are never used for AI training.
            </p>
          </div>

          {/* Bento 4: Settings & Preferences */}
          <div className="space-y-3.5">
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950 dark:text-amber-400">
              Settings &amp; Preferences
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-stone-300 font-semibold">
              <li>
                <Link href="/settings?focus=account#account" className="hover:text-slate-950 hover:translate-x-1 dark:hover:text-white transition-all inline-flex items-center gap-2 group">
                  <span className="text-slate-400 group-hover:text-slate-950 dark:text-amber-500/80 transition-colors">›</span>
                  <span>Account Settings</span>
                </Link>
              </li>
              <li>
                <Link href="/settings?focus=dietary#dietary" className="hover:text-slate-950 hover:translate-x-1 dark:hover:text-white transition-all inline-flex items-center gap-2 group">
                  <span className="text-slate-400 group-hover:text-slate-950 dark:text-amber-500/80 transition-colors">›</span>
                  <span>Dietary Restrictions</span>
                </Link>
              </li>
              <li>
                <Link href="/settings?focus=standards#standards" className="hover:text-slate-950 hover:translate-x-1 dark:hover:text-white transition-all inline-flex items-center gap-2 group">
                  <span className="text-slate-400 group-hover:text-slate-950 dark:text-amber-500/80 transition-colors">›</span>
                  <span>Measurement Standards</span>
                </Link>
              </li>
              <li>
                <Link href="/settings?focus=membership#membership" className="hover:text-slate-950 hover:translate-x-1 dark:hover:text-white transition-all inline-flex items-center gap-2 group">
                  <span className="text-slate-400 group-hover:text-slate-950 dark:text-amber-500/80 transition-colors">›</span>
                  <span>Chef Pro Membership</span>
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* BOTTOM SECTION: DISCLAIMER & COPYRIGHT */}
        <div className="border-t border-slate-100 dark:border-white/10 pt-6 space-y-4">
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-stone-300 bg-slate-50/90 dark:bg-white/5 rounded-2xl p-4.5 border border-slate-200/80 dark:border-white/5 font-medium">
            <strong className="font-bold text-slate-950 dark:text-stone-100">Culinary &amp; Nutrition Disclaimer:</strong> Nutritional estimations and ingredient parses are approximations generated by culinary algorithms and Google Gemini Vision. They do not constitute medical or allergen advice.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-stone-500 pt-2 font-medium">
            <p>© {new Date().getFullYear()} Recipe Collector. All rights reserved.</p>
            <div className="flex items-center gap-3">
              <span>Distraction-free culinary studio</span>
              <span>•</span>
              <Link href="/settings" className="hover:text-slate-950 dark:hover:text-stone-300 transition">
                Settings &amp; Preferences
              </Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
