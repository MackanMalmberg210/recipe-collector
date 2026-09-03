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
    if (category.includes("seafood") || category.includes("salad")) {
      return {
        wine: "Crisp Sauvignon Blanc, Pinot Grigio, or Chablis",
        nonAlcoholic: "Sparkling Lemon-Herb Infused Water or Cucumber Mint Tonic",
      };
    }
    if (
      category.includes("pasta") ||
      category.includes("beef") ||
      category.includes("meat")
    ) {
      return {
        wine: "Chianti Classico, Sangiovese, or Medium-Bodied Pinot Noir",
        nonAlcoholic: "Pomegranate Spritz with Rosemary or Cold-Brewed Earl Grey",
      };
    }
    if (
      category.includes("asian") ||
      category.includes("curry") ||
      category.includes("ramen")
    ) {
      return {
        wine: "Dry Riesling, Gewürztraminer, or Crisp Japanese Lager",
        nonAlcoholic: "Iced Roasted Hojicha or Sparkling Ginger-Lime Soda",
      };
    }
    return {
      wine: "Light Pinot Noir, Dry Rosé, or Unoaked Chardonnay",
      nonAlcoholic: "Sparkling Mineral Water with Fresh Lime & Mint",
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

      {/* BEVERAGE PAIRING ROW WITH CLEAN STANDALONE ICON */}
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4.5 dark:border-amber-400/25 dark:bg-[#1f1b18] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <svg
            className="h-6 w-6 text-amber-500 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            />
          </svg>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Recommended Pairings
            </h4>
            <p className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-[#fafaf9] mt-0.5">
              🍷 {pairing.wine}
            </p>
            <p className="text-xs text-stone-500 dark:text-[#a8a29e] mt-0.5">
              🥤 {pairing.nonAlcoholic}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
