"use client";

import type { GroceryCategory } from "../../lib/groceries";

type GroceryCategoryIconProps = {
  category: GroceryCategory;
  className?: string;
};

export default function GroceryCategoryIcon({
  category,
  className = "h-4 w-4",
}: GroceryCategoryIconProps) {
  switch (category) {
    case "produce":
      // Fresh leaf / herb sprig (Kept - User confirmed they love this!)
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      );

    case "meat_seafood":
      // Classic Fish / Seafood icon
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.46-3.44 6-7 6-3.56 0-7.56-2.54-8.5-6Z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 12v.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 16l4.5-4L2 8" />
        </svg>
      );

    case "dairy_fridge":
      // Organic Egg silhouette (User requested specifically: "ett Ägg som ikon")
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 2C8 2 4.5 7.5 4.5 13.5A7.5 7.5 0 0 0 12 21a7.5 7.5 0 0 0 7.5-7.5C19.5 7.5 16 2 12 2Z"
          />
        </svg>
      );

    case "bakery_grains":
      // Artisan Bread Loaf with baker's scoring marks
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.5C3 8.8 6.6 5 12 5s9 3.8 9 8.5a3.5 3.5 0 0 1-3.5 3.5h-11A3.5 3.5 0 0 1 3 13.5Z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9.5c.5 1.5 1 3 1.5 4.5m4-5.5c0 2 .5 4 1 6m4-5c-.5 1.5-1 3-1.5 4.5" />
        </svg>
      );

    case "spices_condiments":
      // Oil / Condiment shaker bottle (Kept - User confirmed they love this!)
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 2h4v3h-4z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5h6l2 4v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9l2-4z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v4" />
        </svg>
      );

    case "beverages":
      // Steaming coffee mug (Kept - User confirmed they love this!)
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h1a4 4 0 1 1 0 8h-1" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
          <line x1="6" y1="2" x2="6" y2="4" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="10" y1="2" x2="10" y2="4" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="14" y1="2" x2="14" y2="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    default:
      // Household & essentials sparkle
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
        </svg>
      );
  }
}
