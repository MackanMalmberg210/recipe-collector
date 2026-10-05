"use client";

import { useRef, useState, useEffect } from "react";
import RecipeCard from "../RecipeCard";
import type { RecipeMatchResult } from "../../lib/types";

type RecipeShelfProps = {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  recipes: RecipeMatchResult[];
  onSeeAll?: () => void;
};

export default function RecipeShelf({
  title,
  subtitle,
  icon,
  recipes,
  onSeeAll,
}: RecipeShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isAnimatingRef = useRef(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const newLeft = scrollLeft > 10;
    const newRight = scrollLeft + clientWidth < scrollWidth - 10;
    setCanScrollLeft((prev) => (prev !== newLeft ? newLeft : prev));
    setCanScrollRight((prev) => (prev !== newRight ? newRight : prev));
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      let timeoutId: number | null = null;
      const handleScroll = () => {
        if (isAnimatingRef.current) return;
        if (timeoutId) cancelAnimationFrame(timeoutId);
        timeoutId = requestAnimationFrame(checkScroll);
      };

      el.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", checkScroll);
        if (timeoutId) cancelAnimationFrame(timeoutId);
      };
    }
  }, [recipes]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el || isAnimatingRef.current) return;

    const firstCard = el.firstElementChild as HTMLElement | null;
    const cardWidth = firstCard ? firstCard.offsetWidth + 20 : 340;
    const cardsToScroll = Math.max(1, Math.floor(el.clientWidth / cardWidth));
    const delta = (direction === "left" ? -1 : 1) * cardsToScroll * cardWidth;

    const start = el.scrollLeft;
    const target = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, start + delta));
    const distance = target - start;

    if (Math.abs(distance) < 1) return;

    isAnimatingRef.current = true;
    const startTime = performance.now();
    const duration = 360;

    const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4);

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      el.scrollLeft = start + distance * easeOutQuart(progress);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.scrollLeft = target;
        isAnimatingRef.current = false;
        checkScroll();
      }
    };

    requestAnimationFrame(step);
  };

  if (recipes.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* SHELF HEADER */}
      <div className="flex items-end justify-between px-1">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-950 to-slate-950 dark:from-white dark:to-white">
            {title}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-stone-400 font-normal">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onSeeAll && (
            <button
              type="button"
              onClick={onSeeAll}
              className="text-xs sm:text-sm font-semibold text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer mr-2"
            >
              <span>See all ({recipes.length})</span>
              <span>→</span>
            </button>
          )}

          {/* Desktop scroll arrows */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              aria-label={`Scroll ${title} left`}
              className={`h-8 w-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 shadow-2xs transition dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-300 cursor-pointer ${
                canScrollLeft
                  ? "hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 dark:hover:border-white/20 dark:hover:text-white"
                  : "opacity-40 cursor-not-allowed"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              aria-label={`Scroll ${title} right`}
              className={`h-8 w-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 shadow-2xs transition dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-300 cursor-pointer ${
                canScrollRight
                  ? "hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 dark:hover:border-white/20 dark:hover:text-white"
                  : "opacity-40 cursor-not-allowed"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* HORIZONTAL SCROLL CAROUSEL */}
      <div
        ref={scrollRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 px-1 scrollbar-hide overscroll-x-contain"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {recipes.map((recipe, index) => (
          <div
            key={recipe.id}
            className="w-[280px] sm:w-[320px] max-w-[340px] shrink-0"
          >
            <RecipeCard
              id={recipe.id}
              title={recipe.title}
              image={recipe.image}
              cookTime={recipe.cookTime}
              calories={recipe.calories}
              matchedIngredients={recipe.matchedIngredients}
              totalIngredients={recipe.totalIngredients}
              selectedIngredients={[]}
              origin={recipe.origin}
              ingredients={recipe.ingredients}
              priority={index < 4}
              isPublic={recipe.isPublic}
              authorName={recipe.authorName}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
