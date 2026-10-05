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
  preferredLanguage: string;
  subscriptionTier: "free" | "pro";
  monthlyAiScansUsed?: number;
  monthlyAiScansResetDate?: string;
};

export const FREE_MONTHLY_AI_SCANS_LIMIT = 3;

export const DEFAULT_USER_SETTINGS: UserSettings = {
  unitSystem: "metric",
  defaultServings: 4,
  dietaryPreferences: [],
  strictDietaryFilter: false, // Default is OFF as requested
  autoScaleRecipes: true,
  autoAddLowPantryToList: true, // Auto-add low pantry staples to shopping list
  preferredLanguage: "Swedish",
  subscriptionTier: "free",
  monthlyAiScansUsed: 0,
  monthlyAiScansResetDate: "",
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

    // Background cloud sync
    import("./sync/cloudSync").then(({ syncCloudUserSettings }) => {
      syncCloudUserSettings(settings).catch(() => {});
    });
  } catch {
    // Ignore storage write errors
  }
}

export function getAiScanUsage(settings?: UserSettings): {
  used: number;
  max: number;
  isUnlimited: boolean;
  remaining: number;
  canScan: boolean;
} {
  const s = settings || getStoredUserSettings();
  const currentMonth = new Date().toISOString().slice(0, 7);

  if (s.subscriptionTier === "pro") {
    return {
      used: s.monthlyAiScansUsed || 0,
      max: Infinity,
      isUnlimited: true,
      remaining: Infinity,
      canScan: true,
    };
  }

  const used = s.monthlyAiScansResetDate === currentMonth ? (s.monthlyAiScansUsed || 0) : 0;
  const remaining = Math.max(0, FREE_MONTHLY_AI_SCANS_LIMIT - used);

  return {
    used,
    max: FREE_MONTHLY_AI_SCANS_LIMIT,
    isUnlimited: false,
    remaining,
    canScan: remaining > 0,
  };
}

export function recordAiScanUsage(): void {
  const s = getStoredUserSettings();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentUsed = s.monthlyAiScansResetDate === currentMonth ? (s.monthlyAiScansUsed || 0) : 0;

  saveUserSettings({
    ...s,
    monthlyAiScansUsed: currentUsed + 1,
    monthlyAiScansResetDate: currentMonth,
  });
}

export function toggleSubscriptionTier(): "free" | "pro" {
  const current = getStoredUserSettings();
  const newTier = current.subscriptionTier === "pro" ? "free" : "pro";
  saveUserSettings({
    ...current,
    subscriptionTier: newTier,
  });
  return newTier;
}

export async function getStoredUserSettingsWithCloud(): Promise<UserSettings> {
  const local = getStoredUserSettings();
  try {
    const { fetchCloudUserSettings } = await import("./sync/cloudSync");
    const cloud = await fetchCloudUserSettings();
    if (cloud) {
      const merged: UserSettings = { ...local, ...cloud };
      if (typeof window !== "undefined") {
        localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(merged));
      }
      return merged;
    }
  } catch {}
  return local;
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



