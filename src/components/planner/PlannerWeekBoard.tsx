"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PlannerDayCard from "./PlannerDayCard";
import type { AppRecipe } from "../../lib/types";
import type { DayPlan, MealSlot, WeekDay } from "../../lib/planner";
import { WEEK_DAYS, formatWeekDay } from "../../lib/planner";

type PlannerWeekBoardProps = {
  recipes: AppRecipe[];
  mealPlan: Record<WeekDay, DayPlan>;
  dailyCalorieTarget: number;
  onSelectRecipe: (
    day: WeekDay,
    slot: MealSlot,
    recipeId: number | null,
  ) => void;
  onClearSlot: (day: WeekDay, slot: MealSlot) => void;
  onClearDay: (day: WeekDay) => void;
};

const CARD_WIDTH = 440;
const CARD_GAP = 28;

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none">
      <path
        d="M15 5L8 12L15 19"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none">
      <path
        d="M9 5L16 12L9 19"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PlannerWeekBoard({
  recipes,
  mealPlan,
  dailyCalorieTarget,
  onSelectRecipe,
  onClearSlot,
  onClearDay,
}: PlannerWeekBoardProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [activeDay, setActiveDay] = useState<WeekDay>("monday");

  const activeIndex = WEEK_DAYS.indexOf(activeDay);

  const plannedDaysCount = useMemo(() => {
    return WEEK_DAYS.filter((day) =>
      Object.values(mealPlan[day]).some((recipeId) => recipeId !== null),
    ).length;
  }, [mealPlan]);

  const scrollToIndex = (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, WEEK_DAYS.length - 1));
    const nextDay = WEEK_DAYS[safeIndex];

    setActiveDay(nextDay);

    scrollRef.current?.scrollTo({
      left: safeIndex * (CARD_WIDTH + CARD_GAP) - 56,
      behavior: "smooth",
    });
  };

  const scrollToDay = (day: WeekDay) => {
    scrollToIndex(WEEK_DAYS.indexOf(day));
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

      const canScrollLeft = container.scrollLeft > 0;
      const canScrollRight =
        container.scrollLeft + container.clientWidth <
        container.scrollWidth - 1;

      const scrollingDown = event.deltaY > 0;
      const scrollingUp = event.deltaY < 0;

      const shouldCapture =
        (scrollingDown && canScrollRight) || (scrollingUp && canScrollLeft);

      if (!shouldCapture) return;

      event.preventDefault();

      container.scrollBy({
        left: event.deltaY,
        behavior: "auto",
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;

    const index = Math.round(container.scrollLeft / (CARD_WIDTH + CARD_GAP));
    const day = WEEK_DAYS[Math.max(0, Math.min(index, WEEK_DAYS.length - 1))];

    setActiveDay(day);
  };

  return (
    <section className="relative overflow-hidden rounded-4xl border border-white/10 bg-[#17120f]/90 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.35)] ring-1 ring-white/3">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-6%] top-[-20%] h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute bottom-[-30%] left-[10%] h-80 w-80 rounded-full bg-emerald-400/6 blur-3xl" />
      </div>

      <div className="relative mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-4 text-amber-100/55">
            Weekly schedule
          </p>

          <h2 className="text-3xl font-bold tracking-tight text-[#fff8ef] md:text-4xl">
            Your week
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-400">
            Plan breakfast, lunch and dinner across the full week.
          </p>

          <p className="mt-3 text-sm font-medium text-amber-100/70">
            Use the side controls or scroll sideways.
          </p>
        </div>

        <div className="rounded-3xl bg-white/4 px-5 py-4 ring-1 ring-white/7">
          <p className="text-xs font-medium text-stone-500">Days planned</p>
          <p className="mt-1 text-xl font-bold text-[#fff8ef]">
            {plannedDaysCount}/7
          </p>
        </div>
      </div>

      <div className="relative mt-2">
        <button
          type="button"
          onClick={() => scrollToIndex(activeIndex - 1)}
          className="group absolute left-4 top-86 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-stone-100 shadow-[0_18px_50px_rgba(0,0,0,0.42)] ring-1 ring-white/12 backdrop-blur-md transition hover:scale-105 hover:bg-black/55 hover:ring-amber-100/25"
          aria-label="Previous day"
        >
          <span className="absolute inset-0 rounded-full bg-white/8 opacity-0 transition group-hover:opacity-100" />
          <span className="relative transition group-hover:-translate-x-0.5">
            <ChevronLeftIcon />
          </span>
        </button>

        <button
          type="button"
          onClick={() => scrollToIndex(activeIndex + 1)}
          className="group absolute right-4 top-86 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-stone-100 shadow-[0_18px_50px_rgba(0,0,0,0.42)] ring-1 ring-white/12 backdrop-blur-md transition hover:scale-105 hover:bg-black/55 hover:ring-amber-100/25"
          aria-label="Next day"
        >
          <span className="absolute inset-0 rounded-full bg-white/8 opacity-0 transition group-hover:opacity-100" />
          <span className="relative transition group-hover:translate-x-0.5">
            <ChevronRightIcon />
          </span>
        </button>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory gap-7 overflow-x-auto scroll-smooth px-16 pb-8"
          style={{
            scrollbarWidth: "none",
            maskImage:
              "linear-gradient(to right, transparent 0, black 72px, black calc(100% - 72px), transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0, black 72px, black calc(100% - 72px), transparent 100%)",
          }}
        >
          {WEEK_DAYS.map((day) => {
            return (
              <div
                key={day}
                className="group shrink-0 snap-center py-4 transition duration-500"
                style={{ width: CARD_WIDTH }}
              >
                <PlannerDayCard
                  day={day}
                  recipes={recipes}
                  dayPlan={mealPlan[day]}
                  dailyCalorieTarget={dailyCalorieTarget}
                  onSelectRecipe={onSelectRecipe}
                  onClearSlot={onClearSlot}
                  onClearDay={onClearDay}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
