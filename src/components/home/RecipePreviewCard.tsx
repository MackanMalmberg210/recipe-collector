import Link from "next/link";
import type { AppRecipe } from "../../lib/types";

type Badge = {
  label: string;
  variant?: "default" | "success" | "dark";
};

type RecipePreviewCardProps = {
  recipe: AppRecipe;
  href: string;
  badges?: Badge[];
};

function badgeClasses(variant: Badge["variant"] = "default") {
  switch (variant) {
    case "success":
      return "bg-emerald-500/10 text-emerald-200";
    case "dark":
      return "bg-stone-950/90 text-stone-100";
    default:
      return "bg-stone-800 text-stone-300";
  }
}

export default function RecipePreviewCard({
  recipe,
  href,
  badges = [],
}: RecipePreviewCardProps) {
  return (
    <Link
      href={href}
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: "0 380px",
        contain: "paint",
      }}
      className="overflow-hidden rounded-[1.75rem] border border-white/8 bg-stone-900/80 shadow-[0_10px_40px_rgba(0,0,0,0.25)] transition hover:-translate-y-1 hover:border-white/14 hover:shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
    >
      <img
        src={recipe.image}
        alt={recipe.title}
        className="h-52 w-full object-cover"
      />

      <div className="p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={`${recipe.id}-${badge.label}`}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClasses(
                badge.variant,
              )}`}
            >
              {badge.label}
            </span>
          ))}
        </div>

        <h3 className="text-xl font-semibold text-stone-50">{recipe.title}</h3>

        <div className="mt-3 flex flex-wrap gap-4 text-sm text-stone-400">
          {recipe.cookTime !== undefined && (
            <span>⏱ {recipe.cookTime} min</span>
          )}
          {recipe.calories !== undefined && (
            <span>🔥 {recipe.calories} kcal</span>
          )}
          <span>🥕 {recipe.ingredients.length} ingredients</span>
        </div>
      </div>
    </Link>
  );
}
