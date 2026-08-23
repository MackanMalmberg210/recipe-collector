"use client";

import { useState } from "react";
import type { RecipeRating } from "../lib/ratings";

type StarRatingProps = {
  value: RecipeRating | null;
  onChange?: (rating: RecipeRating | null) => void;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
};

const SIZE_CLASSES = {
  sm: "text-base gap-0.5",
  md: "text-xl gap-1",
  lg: "text-2xl gap-1.5",
} as const;

export default function StarRating({
  value,
  onChange,
  size = "md",
  readOnly = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<RecipeRating | null>(null);
  const displayValue = hoverValue ?? value;
  const interactive = !readOnly && onChange !== undefined;

  const handleSelect = (rating: RecipeRating) => {
    if (!interactive || !onChange) return;

    onChange(value === rating ? null : rating);
  };

  return (
    <div
      className={`inline-flex items-center ${SIZE_CLASSES[size]}`}
      onMouseLeave={() => interactive && setHoverValue(null)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={
        displayValue
          ? `${displayValue} out of 5 stars`
          : "No rating selected"
      }
    >
      {([1, 2, 3, 4, 5] as const).map((star) => {
        const filled = displayValue !== null && star <= displayValue;

        if (interactive) {
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} star${star === 1 ? "" : "s"}`}
              onMouseEnter={() => setHoverValue(star)}
              onClick={() => handleSelect(star)}
              className={`transition ${
                filled
                  ? "text-amber-300"
                  : "text-stone-600 hover:text-amber-200/70"
              }`}
            >
              {filled ? "★" : "☆"}
            </button>
          );
        }

        return (
          <span
            key={star}
            className={filled ? "text-amber-300" : "text-stone-600"}
            aria-hidden="true"
          >
            {filled ? "★" : "☆"}
          </span>
        );
      })}
    </div>
  );
}
