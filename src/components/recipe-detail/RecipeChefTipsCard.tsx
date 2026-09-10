"use client";

import type { AppRecipe } from "../../lib/types";

type RecipeChefTipsCardProps = {
  recipe: AppRecipe;
};

export default function RecipeChefTipsCard({ recipe }: RecipeChefTipsCardProps) {
  const category = (recipe.category || "").toLowerCase();
  const mealType = (recipe.mealType || "").toLowerCase();

  // Dynamic culinary pro-tips based on category & recipe context
  const getProTips = () => {
    if (
      mealType.includes("breakfast") ||
      mealType.includes("brunch") ||
      category.includes("breakfast") ||
      category.includes("brunch") ||
      recipe.title.toLowerCase().includes("toast") ||
      recipe.title.toLowerCase().includes("egg") ||
      recipe.title.toLowerCase().includes("pancake") ||
      recipe.title.toLowerCase().includes("porridge")
    ) {
      return [
        {
          title: "Silky Yolks & Egg Temperature",
          text: "Cook eggs on gentle medium-low heat. Lower heat preserves delicate proteins, preventing rubbery whites and keeping yolks velvety and rich.",
        },
        {
          title: "Artisan Bread & Seasoning",
          text: "Toast hearty rustic bread until deeply golden so it holds up under toppings. Always finish warm eggs and avocado with flaky sea salt and freshly cracked pepper immediately.",
        },
      ];
    }

    if (
      category.includes("seafood") ||
      category.includes("fish") ||
      recipe.title.toLowerCase().includes("salmon") ||
      recipe.title.toLowerCase().includes("tuna")
    ) {
      return [
        {
          title: "Searing & Crispy Skin",
          text: "Always pat fish fillets bone-dry with paper towels before hitting a hot pan to guarantee a golden crispy skin without sticking.",
        },
        {
          title: "Resting Time",
          text: "Let cooked fillets rest for 2–3 minutes off the heat. Residual carryover cooking allows moisture to redistribute evenly through the flakes.",
        },
      ];
    }

    if (
      category.includes("salad") ||
      category.includes("vegetables") ||
      mealType.includes("salad")
    ) {
      return [
        {
          title: "Dressing Timing",
          text: "Dress the greens at the very last second before plating. Tossing too early causes delicate lettuce and herbs to wilt rapidly.",
        },
        {
          title: "Room Temperature Toppings",
          text: "Bring cheeses and cured toppings to room temperature 15 minutes ahead to maximize creamy mouthfeel and aromatics.",
        },
      ];
    }

    if (category.includes("pasta") || category.includes("italian")) {
      return [
        {
          title: "Liquid Gold (Pasta Water)",
          text: "Always reserve 1/2 cup of starchy boiling pasta water before draining. It binds fat and sauce into a velvety restaurant-quality glaze.",
        },
        {
          title: "Finish in the Pan",
          text: "Cook pasta 1 minute shy of al dente in water, then vigorously toss it directly in the simmering sauce to absorb deep flavor.",
        },
      ];
    }

    if (
      category.includes("soup") ||
      category.includes("stew") ||
      category.includes("curry") ||
      category.includes("ramen")
    ) {
      return [
        {
          title: "Layering Aromatics",
          text: "Bloom garlic, ginger, and spices in warm oil before adding liquids. This unlocks essential oils and prevents bitter raw flavors.",
        },
        {
          title: "Acid Balance",
          text: "Finish rich broths with a squeeze of fresh lemon, lime, or splash of rice vinegar to cut heaviness and elevate savory depth.",
        },
      ];
    }

    // Universal default culinary wisdom
    return [
      {
        title: "Season in Layers",
        text: "Season lightly at every stage of cooking rather than all at once at the end. This builds complex, deeply integrated flavor throughout the dish.",
      },
      {
        title: "Pan Temperature Control",
        text: "Preheat your skillet thoroughly before adding cooking oils. A hot pan prevents food from absorbing excess grease.",
      },
    ];
  };

  // Dynamic beverage pairings
  const getPairing = () => {
    const isMorning =
      mealType.includes("breakfast") ||
      mealType.includes("brunch") ||
      category.includes("breakfast") ||
      category.includes("brunch") ||
      recipe.title.toLowerCase().includes("toast") ||
      recipe.title.toLowerCase().includes("egg") ||
      recipe.title.toLowerCase().includes("pancake") ||
      recipe.title.toLowerCase().includes("porridge");

    if (isMorning) {
      return {
        isMorning: true,
        primaryLabel: "Morning Coffee / Tea",
        primary: "Freshly brewed coffee, cappuccino, or English breakfast tea",
        nonAlcoholic: "Fresh orange juice, apple cider, or cold oat milk",
      };
    }

    if (category.includes("seafood") || category.includes("salad")) {
      return {
        isMorning: false,
        primaryLabel: "Crisp Wine & Refreshment",
        primary: "Sauvignon Blanc, Pinot Grigio, or a chilled light beer",
        nonAlcoholic: "Sparkling water with lemon or iced herbal tea",
      };
    }
    if (
      category.includes("pasta") ||
      category.includes("beef") ||
      category.includes("meat")
    ) {
      return {
        isMorning: false,
        primaryLabel: "Red Wine & Classic Beers",
        primary: "Medium-bodied red wine (Chianti or Pinot Noir) or pale ale",
        nonAlcoholic: "Iced tea with lemon or sparkling water with berries",
      };
    }
    if (
      category.includes("asian") ||
      category.includes("curry") ||
      category.includes("ramen")
    ) {
      return {
        isMorning: false,
        primaryLabel: "Crisp Beer & Aromatic Wine",
        primary: "Crisp lager, wheat beer, or dry Riesling",
        nonAlcoholic: "Ginger beer, green tea, or sparkling water with lime",
      };
    }
    return {
      isMorning: false,
      primaryLabel: "Wine & Refreshment",
      primary: "A glass of your favorite red or white wine, or a cold beer",
      nonAlcoholic: "Sparkling mineral water with a slice of fresh lemon",
    };
  };

  const proTips = getProTips();
  const pairing = getPairing();

  return (
    <section className="rounded-4xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xl dark:border-[#2e2722] dark:border-t-amber-500/20 dark:bg-[#1a1715] dark:shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.03)] space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-500 dark:text-amber-400">
          Good to Know
        </p>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-950 dark:text-[#fafaf9]">
          Techniques &amp; Perfect Pairings
        </h2>
      </div>

      {/* PRO-TIPS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {proTips.map((tip, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-stone-200/90 bg-stone-50/60 p-4.5 dark:border-[#2e2722] dark:bg-[#24201c] space-y-2 shadow-2xs"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>{tip.title}</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-stone-700 dark:text-[#d6d3d1]">
              {tip.text}
            </p>
          </div>
        ))}
      </div>

      {/* RECOMMENDED PAIRINGS (CLEAN TWO-COLUMN CARDS, NO EMOJIS, SITE-CONSISTENT SVGS) */}
      <div className="space-y-3 pt-2 border-t border-stone-200/80 dark:border-[#2e2722]/80">
        <h3 className="text-xs font-black uppercase tracking-[0.15em] text-amber-600 dark:text-amber-400">
          Recommended Beverage Pairings
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* 1. Primary Pairing */}
          <div className="rounded-2xl border border-stone-200/90 bg-stone-50/60 p-4 dark:border-[#2e2722] dark:bg-[#24201c] space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-900 dark:text-[#fafaf9]">
              {pairing.isMorning ? (
                <svg className="h-4 w-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v6m-4 0h8m-4-6a5 5 0 005-5V4H7v6a5 5 0 005 5z" />
                </svg>
              )}
              <span>{pairing.primaryLabel}</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-700 dark:text-[#d6d3d1] leading-relaxed">
              {pairing.primary}
            </p>
          </div>

          {/* 2. Non-Alcoholic Pairing */}
          <div className="rounded-2xl border border-stone-200/90 bg-stone-50/60 p-4 dark:border-[#2e2722] dark:bg-[#24201c] space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-900 dark:text-[#fafaf9]">
              <svg className="h-4 w-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Non-Alcoholic Refreshment</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-700 dark:text-[#d6d3d1] leading-relaxed">
              {pairing.nonAlcoholic}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
