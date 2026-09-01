/**
 * User Settings & Culinary Preferences Management
 */
import type { AppRecipe } from "./types";

export type MeasurementUnitSystem = "metric" | "imperial";

export type DietaryPreference =
  | "vegetarian"
  | "vegan"
  | "gluten_free"
  | "dairy_free"
  | "nut_free"
  | "low_carb"
  | "pescatarian"
  | "high_protein";

export type UserSettings = {
  unitSystem: MeasurementUnitSystem;
  defaultServings: number;
  dietaryPreferences: DietaryPreference[];
  strictDietaryFilter: boolean;
  autoScaleRecipes: boolean;
  autoAddLowPantryToList: boolean;
  subscriptionTier: "free" | "pro";
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  unitSystem: "metric",
  defaultServings: 4,
  dietaryPreferences: [],
  strictDietaryFilter: false, // Default is OFF as requested
  autoScaleRecipes: true,
  autoAddLowPantryToList: true, // Auto-add low pantry staples to shopping list
  subscriptionTier: "free",
};

export const USER_SETTINGS_KEY = "recipe_collector_user_settings";

export function getStoredUserSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_USER_SETTINGS;
  try {
    const raw = localStorage.getItem(USER_SETTINGS_KEY);
    if (!raw) return DEFAULT_USER_SETTINGS;
    return { ...DEFAULT_USER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_USER_SETTINGS;
  }
}

export function saveUserSettings(settings: UserSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("user_settings_updated", { detail: settings }));
  } catch {}
}

export function isRecipeDietaryCompatible(recipe: AppRecipe, preferences: DietaryPreference[]): boolean {
  if (!preferences || preferences.length === 0) return true;

  const meatKeywords = ["chicken", "beef", "pork", "bacon", "salmon", "shrimp", "steak", "tuna", "meat", "turkey", "lamb", "prosciutto", "sausage", "ham"];
  const dairyKeywords = ["milk", "cheese", "cream", "butter", "yogurt", "parmesan", "mozzarella", "cheddar", "sour cream", "ricotta", "feta"];
  const eggKeywords = ["egg", "eggs", "mayonnaise"];
  const glutenKeywords = ["flour", "wheat", "bread", "pasta", "soy sauce", "barley", "rye", "couscous", "breadcrumb"];
  const nutKeywords = ["peanut", "almond", "walnut", "cashew", "pecan", "hazelnut", "pistachio", "pine nut"];

  const ingText = recipe.ingredients.map((i) => i.toLowerCase()).join(" ");

  if (preferences.includes("vegan")) {
    if (meatKeywords.some((k) => ingText.includes(k))) return false;
    if (dairyKeywords.some((k) => ingText.includes(k))) return false;
    if (eggKeywords.some((k) => ingText.includes(k))) return false;
    if (recipe.tags?.some((t) => ["meat", "chicken", "beef", "pork"].includes(t.toLowerCase()))) return false;
  } else if (preferences.includes("vegetarian")) {
    if (meatKeywords.some((k) => ingText.includes(k))) return false;
    if (recipe.tags?.some((t) => ["meat", "chicken", "beef", "pork"].includes(t.toLowerCase()))) return false;
  } else if (preferences.includes("pescatarian")) {
    const nonFishMeats = ["chicken", "beef", "pork", "bacon", "steak", "turkey", "lamb", "ham"];
    if (nonFishMeats.some((k) => ingText.includes(k))) return false;
  }

  if (preferences.includes("dairy_free")) {
    if (dairyKeywords.some((k) => ingText.includes(k))) return false;
  }

  if (preferences.includes("gluten_free")) {
    if (glutenKeywords.some((k) => ingText.includes(k))) return false;
  }

  if (preferences.includes("nut_free")) {
    if (nutKeywords.some((k) => ingText.includes(k))) return false;
  }

  return true;
}
