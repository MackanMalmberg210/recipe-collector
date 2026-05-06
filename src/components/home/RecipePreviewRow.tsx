import Link from "next/link";
import type { AppRecipe } from "../../lib/types";

type Badge = {
  label: string;
  variant?: "default" | "success" | "dark";
};

type RecipePreviewRowProps = {
  recipe: AppRecipe;
  href: string;
  badges?: Badge[];
};

function badgeClasses(variant: Badge["variant"] = "default") {
  switch (variant) {
    case "success":
      return "bg-emerald-500/10 text-emerald-200";
    case "dark":
      return "bg-stone-800 text-stone-300";
    default:
      return "bg-stone-800 text-stone-300";
  }
}

export default function RecipePreviewRow({
  recipe,
  href,
  badges = [],
}: RecipePreviewRowProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-3xl border border-white/6 bg-[#151311] p-4 transition hover:-translate-y-0.5 hover:border-white/12 hover:bg-[#1a1714]"
    >
      <img
        src={recipe.image}
        alt={recipe.title}
        className="h-20 w-20 rounded-2xl object-cover"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="truncate text-base font-semibold text-stone-50">
            {recipe.title}
          </h4>

          {badges.map((badge) => (
            <span
              key={`${recipe.id}-${badge.label}`}
              className={`rounded-full px-2 py-1 text-xs ${badgeClasses(
                badge.variant,
              )}`}
            >
              {badge.label}
            </span>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap gap-3 text-sm text-stone-400">
          <span>
            ⏱ {recipe.cookTime !== undefined ? `${recipe.cookTime} min` : "—"}
          </span>
          <span>🥕 {recipe.ingredients.length} ingredients</span>
          <span>
            🔥 {recipe.calories !== undefined ? `${recipe.calories} kcal` : "—"}
          </span>
        </div>
      </div>
    </Link>
  );
}
