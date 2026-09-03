import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative mt-16 px-4 sm:px-6 lg:px-10 pb-12 pt-6">
      {/* FLOATING BENTO CULINARY CONSOLE */}
      <div className="mx-auto max-w-7xl 2xl:max-w-[1820px] rounded-4xl border border-stone-800/90 bg-gradient-to-b from-[#1c1916] via-[#141210] to-[#0c0a09] text-white p-7 sm:p-10 lg:p-12 shadow-[0_20px_70px_rgba(0,0,0,0.35)] relative overflow-hidden dark:border-[#2e2722]">
        
        {/* SUBTLE AMBIENT CORNER GLOW */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-500/5 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-emerald-500/5 blur-3xl" />

        {/* TOP LEVEL: INTERACTIVE QUICK COMMAND DOCK */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-8">
          
          {/* BRAND EMBLEM */}
          <Link href="/" className="inline-flex items-center gap-3.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-stone-950 shadow-md shadow-amber-500/25 transition-transform group-hover:scale-105">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-white block">
                Recipe Collector
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                Smart Kitchen &amp; Recipe Studio
              </span>
            </div>
          </Link>

          {/* QUICK ACCESS DOCK PILLS WITH CRISP SVGS */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-stone-300 hover:bg-white/15 hover:text-white transition"
            >
              <svg className="h-3.5 w-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Explore</span>
            </Link>

            <Link
              href="/saved"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-stone-300 hover:bg-white/15 hover:text-white transition"
            >
              <svg className="h-3.5 w-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Cookbook</span>
            </Link>

            <Link
              href="/planner"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-stone-300 hover:bg-white/15 hover:text-white transition"
            >
              <svg className="h-3.5 w-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Meal Planner</span>
            </Link>

            <Link
              href="/groceries"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-stone-300 hover:bg-white/15 hover:text-white transition"
            >
              <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Groceries</span>
            </Link>

            <Link
              href="/create"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-stone-300 hover:bg-white/15 hover:text-white transition"
            >
              <svg className="h-3.5 w-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Recipe</span>
            </Link>
          </div>

        </div>

        {/* MID SECTION: 4-COLUMN BENTO GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 py-10">
          
          {/* Bento 1: Philosophy & Craft */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
              Culinary Philosophy
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              Designed for passionate cooks who cherish clarity. No intrusive popups, no sponsored clutter—just clean ingredients, smart step-by-step guidance, and accurate measurements.
            </p>
          </div>

          {/* Bento 2: Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs text-stone-400 font-medium">
              <li>
                <Link href="/" className="hover:text-white transition flex items-center gap-1.5">
                  <span className="text-amber-500/80">›</span>
                  <span>Explore Recipes</span>
                </Link>
              </li>
              <li>
                <Link href="/saved" className="hover:text-white transition flex items-center gap-1.5">
                  <span className="text-amber-500/80">›</span>
                  <span>Cookbook Library</span>
                </Link>
              </li>
              <li>
                <Link href="/planner" className="hover:text-white transition flex items-center gap-1.5">
                  <span className="text-amber-500/80">›</span>
                  <span>Weekly Meal Planner</span>
                </Link>
              </li>
              <li>
                <Link href="/groceries" className="hover:text-white transition flex items-center gap-1.5">
                  <span className="text-amber-500/80">›</span>
                  <span>Grocery &amp; Pantry Hub</span>
                </Link>
              </li>
              <li>
                <Link href="/create" className="hover:text-white transition flex items-center gap-1.5">
                  <span className="text-amber-500/80">›</span>
                  <span>Create / Import Recipe</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Bento 3: AI Privacy & GDPR */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
              Privacy &amp; AI Ethics
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              <strong className="font-semibold text-stone-200 block mb-1">
                Zero Model Training Policy
              </strong>
              All image recognition and recipe OCR run via commercial API tiers. Your personal photos, recipes, and notes are never used for AI training.
            </p>
          </div>

          {/* Bento 4: Settings & Preferences */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
              Settings &amp; Preferences
            </h4>
            <ul className="space-y-2 text-xs text-stone-400 font-medium">
              <li>
                <Link href="/settings?focus=account#account" className="hover:text-white transition flex items-center gap-1.5">
                  <span className="text-amber-500/80">›</span>
                  <span>Account Settings</span>
                </Link>
              </li>
              <li>
                <Link href="/settings?focus=dietary#dietary" className="hover:text-white transition flex items-center gap-1.5">
                  <span className="text-amber-500/80">›</span>
                  <span>Dietary Restrictions</span>
                </Link>
              </li>
              <li>
                <Link href="/settings?focus=standards#standards" className="hover:text-white transition flex items-center gap-1.5">
                  <span className="text-amber-500/80">›</span>
                  <span>Measurement Standards</span>
                </Link>
              </li>
              <li>
                <Link href="/settings?focus=membership#membership" className="hover:text-white transition flex items-center gap-1.5">
                  <span className="text-amber-500/80">›</span>
                  <span>Chef Pro Membership</span>
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* BOTTOM SECTION: DISCLAIMER & COPYRIGHT */}
        <div className="border-t border-white/10 pt-6 space-y-4">
          <p className="text-xs leading-relaxed text-stone-400 bg-white/3 rounded-2xl p-4 border border-white/5">
            <strong className="font-semibold text-stone-200">Culinary &amp; Nutrition Disclaimer:</strong> Nutritional estimations and ingredient parses are approximations generated by culinary algorithms and Google Gemini Vision. They do not constitute medical or allergen advice.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400 pt-2">
            <p>© {new Date().getFullYear()} Recipe Collector. All rights reserved.</p>
            <div className="flex items-center gap-3">
              <span>Distraction-free culinary studio</span>
              <span>•</span>
              <Link href="/settings" className="hover:text-stone-200 transition">
                Settings &amp; Preferences
              </Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
