"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PlannerDayCard from "../../components/planner/PlannerDayCard";
import PlannerWeekBoard from "../../components/planner/PlannerWeekBoard";
import GroceryPanel from "../../components/home/GroceryPanel";
import { getAllRecipes } from "../../lib/recipes";
import type { AppRecipe } from "../../lib/types";
import PlannerGroceryPanel from "../../components/planner/PlannerGroceryPanel";
import {
  WEEK_DAYS,
  clearStoredMealPlan,
  createEmptyMealPlan,
  getPlannedRecipes,
  getStoredDailyCalorieTarget,
  getStoredMealPlan,
  saveDailyCalorieTarget,
  saveMealPlan,
  getUniquePlannedIngredients,
  type MealPlan,
  type MealSlot,
  type WeekDay,
} from "../../lib/planner";
import { GROCERY_LIST_KEY } from "../../lib/home";

type GroceryItem = {
  name: string;
  bought: boolean;
};

function normalizeIngredient(value: string) {
  return value.trim().toLowerCase();
}

export default function PlannerPage() {
  const [allRecipes, setAllRecipes] = useState<AppRecipe[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlan>(createEmptyMealPlan());
  const [hasHydrated, setHasHydrated] = useState(false);
  const [plannerFeedback, setPlannerFeedback] = useState("");
  const [dailyCalorieTarget, setDailyCalorieTarget] = useState(2200);
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([]);
  const [showGroceryPanel, setShowGroceryPanel] = useState(false);

  useEffect(() => {
    setAllRecipes(getAllRecipes());
    setMealPlan(getStoredMealPlan());
    setDailyCalorieTarget(getStoredDailyCalorieTarget());
    setHasHydrated(true);

    const storedGroceryList = localStorage.getItem(GROCERY_LIST_KEY);

    if (storedGroceryList) {
      try {
        setGroceryList(JSON.parse(storedGroceryList) as GroceryItem[]);
      } catch {
        localStorage.removeItem(GROCERY_LIST_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    saveMealPlan(mealPlan);
  }, [mealPlan, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    saveDailyCalorieTarget(dailyCalorieTarget);
  }, [dailyCalorieTarget, hasHydrated]);

  useEffect(() => {
    const handleFocus = () => {
      setAllRecipes(getAllRecipes());
      setMealPlan(getStoredMealPlan());
      setDailyCalorieTarget(getStoredDailyCalorieTarget());

      const storedGroceryList = localStorage.getItem(GROCERY_LIST_KEY);

      if (storedGroceryList) {
        try {
          setGroceryList(JSON.parse(storedGroceryList) as GroceryItem[]);
        } catch {
          localStorage.removeItem(GROCERY_LIST_KEY);
        }
      } else {
        setGroceryList([]);
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    if (!plannerFeedback) return;

    const timeout = window.setTimeout(() => {
      setPlannerFeedback("");
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [plannerFeedback]);

  const plannedRecipes = useMemo(() => {
    return getPlannedRecipes(allRecipes, mealPlan);
  }, [allRecipes, mealPlan]);

  const plannedMealsCount = useMemo(() => {
    return plannedRecipes.length;
  }, [plannedRecipes]);

  const handleSelectRecipe = (
    day: WeekDay,
    slot: MealSlot,
    recipeId: number | null,
  ) => {
    setMealPlan((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot]: recipeId,
      },
    }));
    setPlannerFeedback("");
  };

  const handleClearSlot = (day: WeekDay, slot: MealSlot) => {
    setMealPlan((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot]: null,
      },
    }));
    setPlannerFeedback("");
  };

  const handleClearDay = (day: WeekDay) => {
    setMealPlan((prev) => ({
      ...prev,
      [day]: {
        breakfast: null,
        lunch: null,
        dinner: null,
      },
    }));
    setPlannerFeedback("");
  };

  const handleClearWeek = () => {
    const emptyPlan = createEmptyMealPlan();
    setMealPlan(emptyPlan);
    clearStoredMealPlan();
    setPlannerFeedback("");
  };

  const handleAddPlannedIngredientsToGroceryList = () => {
    if (plannedRecipes.length === 0) {
      setPlannerFeedback("You have no planned meals yet.");
      return;
    }

    const existingList = localStorage.getItem(GROCERY_LIST_KEY);

    let parsedList: GroceryItem[] = [];

    if (existingList) {
      try {
        parsedList = JSON.parse(existingList) as GroceryItem[];
      } catch {
        localStorage.removeItem(GROCERY_LIST_KEY);
      }
    }

    const existingNames = new Set(
      parsedList.map((item) => normalizeIngredient(item.name)),
    );

    const plannedIngredients = getUniquePlannedIngredients(
      allRecipes,
      mealPlan,
    );

    const newItems = plannedIngredients
      .filter((ingredient) => !existingNames.has(ingredient.name))
      .map((ingredient) => ({
        name: ingredient.name,
        bought: false,
      }));

    const updatedList = [...parsedList, ...newItems];

    localStorage.setItem(GROCERY_LIST_KEY, JSON.stringify(updatedList));

    setGroceryList(updatedList);
    setShowGroceryPanel(true);

    if (newItems.length === 0) {
      setPlannerFeedback(
        "All planned ingredients are already in your grocery list.",
      );
      return;
    }

    setPlannerFeedback(
      `${newItems.length} ingredient${
        newItems.length !== 1 ? "s" : ""
      } added to your grocery list.`,
    );
  };

  const handleToggleBought = (name: string) => {
    const normalizedName = normalizeIngredient(name);

    setGroceryList((prev) => {
      const updatedList = prev.map((item) =>
        item.name === normalizedName ? { ...item, bought: !item.bought } : item,
      );

      localStorage.setItem(GROCERY_LIST_KEY, JSON.stringify(updatedList));

      return updatedList;
    });
  };

  const handleRemoveGroceryItem = (name: string) => {
    const normalizedName = normalizeIngredient(name);

    setGroceryList((prev) => {
      const updatedList = prev.filter((item) => item.name !== normalizedName);

      localStorage.setItem(GROCERY_LIST_KEY, JSON.stringify(updatedList));

      return updatedList;
    });
  };

  const handleClearGroceryList = () => {
    setGroceryList([]);
    localStorage.setItem(GROCERY_LIST_KEY, JSON.stringify([]));
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0f0d0b] px-6 py-8 text-white xl:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-5%] h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute right-[-8%] top-[10%] h-96 w-96 rounded-full bg-orange-400/8 blur-3xl" />
        <div className="absolute bottom-[-8%] left-[15%] h-80 w-80 rounded-full bg-emerald-500/6 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-425 flex-col gap-8">
        <header className="relative overflow-hidden rounded-4xl border border-white/10 bg-[#17120f]/90 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.35)] ring-1 ring-white/3 md:p-8">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute right-[-8%] top-[-20%] h-72 w-72 rounded-full bg-amber-400/12 blur-3xl" />
            <div className="absolute bottom-[-30%] left-[15%] h-72 w-72 rounded-full bg-orange-500/8 blur-3xl" />
          </div>

          <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <div className="max-w-3xl">
              <p className="mb-3 text-sm font-bold uppercase tracking-4 text-amber-100/55">
                Meal planning
              </p>

              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-[#fff8ef] md:text-6xl">
                Plan your week around meals you actually want to cook.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-stone-300 md:text-lg">
                Choose breakfast, lunch and dinner, keep daily calories visible,
                and send your planned ingredients straight to the grocery list.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-2xl border border-white/10 bg-white/4 px-5 py-3 text-sm font-medium text-stone-200 transition hover:bg-white/8"
              >
                Back home
              </Link>

              <button
                type="button"
                onClick={handleClearWeek}
                className="rounded-2xl border border-red-300/15 bg-red-400/10 px-5 py-3 text-sm font-medium text-red-100 transition hover:bg-red-400/15"
              >
                Clear week
              </button>
            </div>
          </div>
        </header>

        <section className="rounded-4xl border border-white/10 bg-[#17120f]/90 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.24)] ring-1 ring-white/3 md:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-4 text-amber-100/55">
                Planner controls
              </p>

              <h2 className="text-2xl font-semibold tracking-tight text-[#fff8ef]">
                Build the week, then create your grocery list.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-400">
                {plannedMealsCount} meal{plannedMealsCount === 1 ? "" : "s"}{" "}
                planned so far. Keep the target simple and focus on one day at a
                time.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-[#211915]/80 px-4 text-sm text-stone-300">
                <span className="whitespace-nowrap text-stone-400">
                  Daily target
                </span>

                <input
                  type="number"
                  min="1"
                  value={dailyCalorieTarget}
                  onChange={(e) =>
                    setDailyCalorieTarget(
                      e.target.value ? Number(e.target.value) : 2200,
                    )
                  }
                  className="w-24 rounded-xl border border-white/10 bg-[#15110e] px-3 py-2 text-sm text-[#fff8ef] outline-none transition focus:border-amber-100/25"
                />
              </label>

              <button
                type="button"
                onClick={handleAddPlannedIngredientsToGroceryList}
                className="h-12 rounded-2xl bg-[#fff4e2] px-5 text-sm font-bold text-[#19120e] transition hover:bg-white"
              >
                Add planned ingredients
              </button>

              <button
                type="button"
                onClick={() => setShowGroceryPanel((prev) => !prev)}
                className="h-12 rounded-2xl border border-white/10 bg-white/4 px-5 text-sm font-medium text-stone-200 transition hover:bg-white/8"
              >
                {showGroceryPanel ? "Hide grocery list" : "View grocery list"}
              </button>
            </div>
          </div>

          {plannerFeedback && (
            <div className="mt-5 rounded-2xl border border-emerald-200/15 bg-emerald-300/10 px-4 py-3 text-sm font-medium text-emerald-100">
              {plannerFeedback}
            </div>
          )}
        </section>
        {showGroceryPanel && (
          <GroceryPanel
            items={groceryList}
            onToggleBought={handleToggleBought}
            onRemove={handleRemoveGroceryItem}
            onClear={handleClearGroceryList}
          />
        )}

        <section className="relative">
          <div className="grid gap-8 2xl:grid-cols-[minmax(0,1fr)_460px] 2xl:items-start">
            <div className="min-w-0">
              <PlannerWeekBoard
                recipes={allRecipes}
                mealPlan={mealPlan}
                dailyCalorieTarget={dailyCalorieTarget}
                onSelectRecipe={handleSelectRecipe}
                onClearSlot={handleClearSlot}
                onClearDay={handleClearDay}
              />
            </div>

            <aside className="xl:sticky xl:top-6">
              <PlannerGroceryPanel recipes={allRecipes} mealPlan={mealPlan} />
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
