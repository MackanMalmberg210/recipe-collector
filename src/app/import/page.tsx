"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function extractUrlFromText(text: string): string {
  if (!text) return "";
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : text.trim();
}

function ImportRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const rawUrl = searchParams.get("url") || searchParams.get("text") || "";
    const extracted = extractUrlFromText(rawUrl);

    if (extracted) {
      router.replace(`/saved?import=true&url=${encodeURIComponent(extracted)}`);
    } else {
      router.replace("/saved?import=true");
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#12100e] flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <div className="h-7 w-7 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
        <span className="text-xs font-semibold text-stone-500 dark:text-[#a8a29e]">
          Opening Recipe Importer...
        </span>
      </div>
    </div>
  );
}

export default function ImportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf8f5] dark:bg-[#12100e] flex items-center justify-center p-8">
          <div className="h-7 w-7 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
        </div>
      }
    >
      <ImportRedirect />
    </Suspense>
  );
}
