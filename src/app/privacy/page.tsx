import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy • Recipe Collector",
  description: "Privacy policy and GDPR data protection practices for Recipe Collector.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#12100e] text-stone-900 dark:text-stone-100 px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="mx-auto max-w-4xl space-y-8">
        
        {/* HEADER */}
        <header className="space-y-3 border-b border-stone-200 dark:border-white/10 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-400">
            Privacy &amp; Data Security
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-950 dark:text-white">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400">
            Last updated: September 13, 2026
          </p>
        </header>

        {/* CONTENT BENTO SECTIONS */}
        <div className="space-y-6 text-sm sm:text-base leading-relaxed text-stone-700 dark:text-stone-300">
          
          <section className="rounded-3xl border border-stone-200/90 bg-white dark:border-white/10 dark:bg-[#181411] p-6 sm:p-8 space-y-3 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white">
              1. Overview &amp; Our Commitment
            </h2>
            <p>
              Your privacy is paramount. Recipe Collector is built to be a clean, distraction-free culinary tool. We do not sell your personal data, track your activity across unrelated websites, or monetize your culinary habits through third-party data brokers.
            </p>
          </section>

          <section className="rounded-3xl border border-stone-200/90 bg-white dark:border-white/10 dark:bg-[#181411] p-6 sm:p-8 space-y-3 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white">
              2. Data We Collect
            </h2>
            <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              <li>
                <strong className="text-stone-900 dark:text-stone-100">Account Credentials:</strong> If you register, we store your email address and encrypted password via Supabase Authentication.
              </li>
              <li>
                <strong className="text-stone-900 dark:text-stone-100">Culinary Creations:</strong> Recipes you create, import, or save, along with your pantry ingredients, grocery items, meal plans, and cook photos.
              </li>
              <li>
                <strong className="text-stone-900 dark:text-stone-100">Client Preferences:</strong> Dark/light mode selection, dietary restrictions, and measurement unit system (metric vs. US imperial).
              </li>
            </ul>
          </section>

          <section className="rounded-3xl border border-stone-200/90 bg-white dark:border-white/10 dark:bg-[#181411] p-6 sm:p-8 space-y-3 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white">
              3. Data Storage &amp; Security
            </h2>
            <p>
              All cloud data is hosted on enterprise-grade infrastructure managed by Supabase. Data is protected in transit via HTTPS/TLS and at rest with AES-256 encryption. Database access is strictly governed by Postgres Row Level Security (RLS), ensuring only you (or administrators performing moderation duties) can access your private recipes and lists.
            </p>
          </section>

          <section className="rounded-3xl border border-stone-200/90 bg-white dark:border-white/10 dark:bg-[#181411] p-6 sm:p-8 space-y-3 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white">
              4. Cookies &amp; Local Storage
            </h2>
            <p>
              Recipe Collector uses browser local storage and essential cookies strictly for functional operations:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              <li>Maintaining your authenticated session.</li>
              <li>Remembering your visual theme preference (Light or Dark).</li>
              <li>Supporting offline kitchen and supermarket capabilities when mobile reception is low.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-stone-200/90 bg-white dark:border-white/10 dark:bg-[#181411] p-6 sm:p-8 space-y-3 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white">
              5. GDPR Compliance &amp; Your Rights
            </h2>
            <p>
              Under the General Data Protection Regulation (GDPR) and related data protection frameworks, you have full control over your personal information:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              <li><strong className="text-stone-900 dark:text-stone-100">Right of Access:</strong> You can view all data associated with your profile at any time.</li>
              <li><strong className="text-stone-900 dark:text-stone-100">Right to Portability:</strong> You can export and print your recipes as PDF or physical copies.</li>
              <li><strong className="text-stone-900 dark:text-stone-100">Right to Erasure (Be Forgotten):</strong> You can permanently delete your account and all associated cloud records with one click in Account Settings.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-stone-200/90 bg-white dark:border-white/10 dark:bg-[#181411] p-6 sm:p-8 space-y-3 shadow-xs">
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white">
              6. Contact Privacy Team
            </h2>
            <p>
              For any data inquiry, contact our Data Protection Officer at{" "}
              <span className="font-semibold text-amber-600 dark:text-amber-400">privacy@recipecollector.app</span>.
            </p>
          </section>

        </div>

        {/* FOOTER NAVIGATION */}
        <div className="pt-4 flex items-center justify-between border-t border-stone-200 dark:border-white/10 text-xs font-semibold">
          <Link href="/terms" className="hover:text-amber-600 dark:hover:text-amber-400 transition">
            ← Terms of Service
          </Link>
          <Link href="/" className="hover:text-amber-600 dark:hover:text-amber-400 transition">
            Back to Explore →
          </Link>
        </div>

      </div>
    </div>
  );
}
