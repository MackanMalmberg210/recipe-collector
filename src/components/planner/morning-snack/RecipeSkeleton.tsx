"use client";

import React from "react";

export function RecipeSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col overflow-hidden rounded-2xl border border-[#35312D] bg-[#1C1917] p-0 animate-pulse"
        >
          {/* 4:3 Aspect Ratio Image Skeleton */}
          <div className="aspect-[4/3] w-full bg-white/5" />

          {/* Card Content Skeleton */}
          <div className="p-4 space-y-3">
            <div className="h-4 w-3/4 rounded-md bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="h-3 w-16 rounded-md bg-white/5" />
              <div className="h-3 w-3 rounded-full bg-white/5" />
              <div className="h-3 w-20 rounded-md bg-white/5" />
            </div>
            <div className="pt-2 border-t border-[#35312D]/60 flex justify-between items-center">
              <div className="h-3 w-16 rounded-md bg-white/5" />
              <div className="h-3 w-4 rounded-md bg-white/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
