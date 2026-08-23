"use client";

import type { AppRecipe } from "../../lib/types";

type RecipeVideoPlayerProps = {
  recipe: AppRecipe;
};

export default function RecipeVideoPlayer({ recipe }: RecipeVideoPlayerProps) {
  const embedUrl = recipe.videoEmbedUrl;
  const rawUrl = recipe.videoUrl;

  if (!embedUrl && !rawUrl) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-4xl border border-white/10 bg-[#17120f]/90 p-6 sm:p-7 shadow-[0_24px_80px_rgba(0,0,0,0.3)] ring-1 ring-white/3">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
            Video Guide
          </p>
          <h3 className="mt-1 text-xl sm:text-2xl font-bold text-[#fff8ef]">
            How to Make {recipe.title}
          </h3>
        </div>

        {rawUrl && (
          <a
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-200 hover:bg-red-500/20 hover:border-red-500/40 hover:text-white transition cursor-pointer shadow-sm"
          >
            {/* YOUTUBE ICON */}
            <svg
              className="h-4 w-4 fill-red-500 group-hover:scale-110 transition-transform"
              viewBox="0 0 24 24"
            >
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span>Watch on YouTube</span>
            <span className="text-red-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-[11px]">↗</span>
          </a>
        )}
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-black/80 shadow-inner border border-white/5">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={`How to make ${recipe.title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full border-0"
          />
        ) : (
          <video
            src={rawUrl}
            controls
            className="h-full w-full"
            preload="metadata"
          />
        )}
      </div>
    </section>
  );
}
