"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ImportRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/saved");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-stone-900 dark:bg-[#0e0c0a] dark:text-stone-100 flex items-center justify-center p-8">
      <div className="flex items-center gap-3 rounded-2xl bg-white dark:bg-[#151210] border border-stone-200 dark:border-white/10 p-6 shadow-sm">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        <span className="text-sm font-semibold">Redirecting to Cookbook...</span>
      </div>
    </div>
  );
}
