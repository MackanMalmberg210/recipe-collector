/**
 * Supabase Cloud Sync Engine
 * Handles bidirectional synchronization for Groceries, Meal Planner,
 * User Favorites, Pantry, and Settings with full offline/localStorage fallback.
 */

import { createClient } from "../supabase/client";
import type { StoredGroceryItem, PantryItem } from "../groceries";
import type { MealPlan, WeekDay, MealSlot } from "../planner";
import { createEmptyMealPlan, WEEK_DAYS, MEAL_SLOTS } from "../planner";
import type { UserSettings } from "../settings";

interface GroceryRow {
  id: string;
  name: string;
  bought?: boolean;
  category?: any;
  quantity?: string | number;
  unit?: string;
  notes?: string;
  recipe_id?: number | string;
  recipe_title?: string;
}

interface PantryRow {
  id: string;
  name: string;
  in_stock?: boolean;
  category?: any;
  last_updated?: string;
}

interface MealPlanRow {
  day_of_week?: string;
  slot?: string;
  recipe_id?: number | string;
}

interface FavoriteRow {
  recipe_id: number | string;
}

interface ProfileRow {
  unit_system?: "metric" | "imperial";
  default_servings?: number;
  dietary_preferences?: string[];
  strict_dietary_filter?: boolean;
  auto_scale_recipes?: boolean;
  auto_add_low_pantry?: boolean;
  subscription_tier?: "free" | "pro";
}

// -------------------------------------------------------------
// 1. GROCERIES CLOUD SYNC
// -------------------------------------------------------------

export async function fetchCloudGroceries(listName: string = "main"): Promise<StoredGroceryItem[] | null> {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;

    const { data, error } = await supabase
      .from("grocery_items")
      .select("*")
      .eq("list_name", listName)
      .order("created_at", { ascending: true });

    if (error || !data) {
      console.warn("Could not fetch cloud groceries:", error?.message);
      return null;
    }

    return (data as unknown as GroceryRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      bought: Boolean(row.bought),
      category: row.category,
      quantity: row.quantity ? Number(row.quantity) || 1 : 1,
      unit: row.unit || undefined,
      notes: row.notes || undefined,
      sourceRecipeId: row.recipe_id ? Number(row.recipe_id) : undefined,
      sourceRecipeTitle: row.recipe_title || undefined,
    }));
  } catch (err) {
    console.warn("fetchCloudGroceries error:", err);
    return null;
  }
}

export async function syncCloudGroceries(items: StoredGroceryItem[], listName: string = "main"): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return false;

    // Helper to guarantee valid UUID
    const toValidUuid = (id?: string): string => {
      if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return id;
      }
      return crypto.randomUUID();
    };

    if (items.length > 0) {
      const rows = items.map((item) => ({
        id: toValidUuid(item.id),
        user_id: user.id,
        name: item.name.trim(),
        bought: Boolean(item.bought),
        category: item.category || "Other",
        quantity: String(item.quantity || 1),
        unit: item.unit || "",
        notes: item.notes || "",
        recipe_id: item.sourceRecipeId || null,
        recipe_title: item.sourceRecipeTitle || "",
        list_name: listName,
      }));

      // 1. Safe idempotent upsert first
      const { error: upsertError } = await supabase
        .from("grocery_items")
        .upsert(rows, { onConflict: "id" });

      if (upsertError) {
        console.warn("syncCloudGroceries upsert error:", upsertError.message);
        return false;
      }

      // 2. Only remove items in cloud that are no longer present locally
      const activeIds = rows.map((r) => r.id);
      const { data: existingRows } = await supabase
        .from("grocery_items")
        .select("id")
        .eq("list_name", listName)
        .eq("user_id", user.id);

      if (existingRows) {
        const idsToDelete = (existingRows as Array<{ id: string }>)
          .map((r) => r.id)
          .filter((id) => !activeIds.includes(id));

        if (idsToDelete.length > 0) {
          await supabase
            .from("grocery_items")
            .delete()
            .in("id", idsToDelete);
        }
      }
    } else {
      // User explicitly cleared the entire list
      await supabase
        .from("grocery_items")
        .delete()
        .eq("list_name", listName)
        .eq("user_id", user.id);
    }

    return true;
  } catch (err) {
    console.warn("syncCloudGroceries error:", err);
    return false;
  }
}

// -------------------------------------------------------------
// 2. PANTRY INVENTORY CLOUD SYNC
// -------------------------------------------------------------

export async function fetchCloudPantry(): Promise<PantryItem[] | null> {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;

    const { data, error } = await supabase
      .from("pantry_items")
      .select("*")
      .order("name", { ascending: true });

    if (error || !data) return null;

    return (data as unknown as PantryRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      inStock: Boolean(row.in_stock),
      category: row.category,
      lastUpdated: row.last_updated ? new Date(row.last_updated).getTime() : undefined,
    }));
  } catch {
    return null;
  }
}

export async function syncCloudPantry(items: PantryItem[]): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return false;

    if (items.length > 0) {
      const rows = items.map((item) => ({
        user_id: user.id,
        name: item.name.trim(),
        in_stock: Boolean(item.inStock),
        category: item.category || "Other",
        last_updated: new Date().toISOString(),
      }));

      // 1. Safe upsert with UNIQUE (user_id, name)
      const { error: upsertError } = await supabase
        .from("pantry_items")
        .upsert(rows, { onConflict: "user_id,name" });

      if (upsertError) {
        console.warn("syncCloudPantry upsert error:", upsertError.message);
        return false;
      }

      // 2. Prune only items whose names were removed
      const activeNames = rows.map((r) => r.name);
      const { data: existingRows } = await supabase
        .from("pantry_items")
        .select("id, name")
        .eq("user_id", user.id);

      if (existingRows) {
        const idsToDelete = (existingRows as Array<{ id: string; name: string }>)
          .filter((r) => !activeNames.includes(r.name))
          .map((r) => r.id);

        if (idsToDelete.length > 0) {
          await supabase.from("pantry_items").delete().in("id", idsToDelete);
        }
      }
    } else {
      await supabase.from("pantry_items").delete().eq("user_id", user.id);
    }

    return true;
  } catch (err) {
    console.warn("syncCloudPantry error:", err);
    return false;
  }
}

// -------------------------------------------------------------
// 3. MEAL PLANNER CLOUD SYNC
// -------------------------------------------------------------

export async function fetchCloudMealPlan(): Promise<MealPlan | null> {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;

    const { data, error } = await supabase
      .from("meal_plans")
      .select("*");

    if (error || !data) return null;

    const plan = createEmptyMealPlan();

    (data as unknown as MealPlanRow[]).forEach((row) => {
      const day = row.day_of_week?.toLowerCase() as WeekDay;
      const slot = row.slot?.toLowerCase() as MealSlot;
      const recipeId = row.recipe_id ? Number(row.recipe_id) : null;

      if (WEEK_DAYS.includes(day) && MEAL_SLOTS.includes(slot)) {
        plan[day][slot] = recipeId;
      }
    });

    return plan;
  } catch (err) {
    console.warn("fetchCloudMealPlan error:", err);
    return null;
  }
}

export async function syncCloudMealPlan(plan: MealPlan): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return false;

    const rows: Array<{
      user_id: string;
      day_of_week: string;
      slot: string;
      recipe_id: number;
    }> = [];

    const activeSlotKeys = new Set<string>();

    for (const day of WEEK_DAYS) {
      const dayPlan = plan[day];
      if (!dayPlan) continue;

      for (const slot of MEAL_SLOTS) {
        const recipeId = dayPlan[slot];
        if (typeof recipeId === "number" && recipeId > 0) {
          rows.push({
            user_id: user.id,
            day_of_week: day,
            slot,
            recipe_id: recipeId,
          });
          activeSlotKeys.add(`${day}_${slot}`);
        }
      }
    }

    // 1. Safe upsert with UNIQUE (user_id, day_of_week, slot)
    if (rows.length > 0) {
      const { error: upsertError } = await supabase
        .from("meal_plans")
        .upsert(rows, { onConflict: "user_id,day_of_week,slot" });

      if (upsertError) {
        console.warn("syncCloudMealPlan upsert error:", upsertError.message);
        return false;
      }
    }

    // 2. Clean up only cleared slots
    const { data: existingSlots } = await supabase
      .from("meal_plans")
      .select("id, day_of_week, slot")
      .eq("user_id", user.id);

    if (existingSlots) {
      const idsToDelete = (existingSlots as Array<{ id: string; day_of_week: string; slot: string }>)
        .filter((r) => !activeSlotKeys.has(`${r.day_of_week}_${r.slot}`))
        .map((r) => r.id);

      if (idsToDelete.length > 0) {
        await supabase.from("meal_plans").delete().in("id", idsToDelete);
      }
    }

    return true;
  } catch (err) {
    console.warn("syncCloudMealPlan error:", err);
    return false;
  }
}

// -------------------------------------------------------------
// 4. FAVORITES CLOUD SYNC
// -------------------------------------------------------------

export async function fetchCloudFavorites(): Promise<number[] | null> {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;

    const { data, error } = await supabase
      .from("user_favorites")
      .select("recipe_id");

    if (error || !data) return null;

    return (data as unknown as FavoriteRow[])
      .map((row) => Number(row.recipe_id))
      .filter((id) => !isNaN(id) && id > 0);
  } catch {
    return null;
  }
}

export async function addCloudFavorite(recipeId: number): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return false;

    const { error } = await supabase
      .from("user_favorites")
      .upsert({
        user_id: user.id,
        recipe_id: recipeId,
      }, { onConflict: "user_id,recipe_id" });

    return !error;
  } catch {
    return false;
  }
}

export async function removeCloudFavorite(recipeId: number): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return false;

    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("recipe_id", recipeId);

    return !error;
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// 5. USER PROFILE / SETTINGS CLOUD SYNC
// -------------------------------------------------------------

export async function fetchCloudUserSettings(): Promise<Partial<UserSettings> | null> {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) return null;

    const profile = data as unknown as ProfileRow;
    return {
      unitSystem: profile.unit_system,
      defaultServings: Number(profile.default_servings) || 4,
      dietaryPreferences: Array.isArray(profile.dietary_preferences)
        ? (profile.dietary_preferences as UserSettings["dietaryPreferences"])
        : [],
      strictDietaryFilter: Boolean(profile.strict_dietary_filter),
      autoScaleRecipes: Boolean(profile.auto_scale_recipes),
      autoAddLowPantryToList: Boolean(profile.auto_add_low_pantry),
      subscriptionTier: profile.subscription_tier,
    };
  } catch {
    return null;
  }
}

export async function syncCloudUserSettings(settings: UserSettings): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return false;

    const { error } = await supabase
      .from("user_profiles")
      .upsert({
        user_id: user.id,
        unit_system: settings.unitSystem,
        default_servings: settings.defaultServings,
        dietary_preferences: settings.dietaryPreferences,
        strict_dietary_filter: settings.strictDietaryFilter,
        auto_scale_recipes: settings.autoScaleRecipes,
        auto_add_low_pantry: settings.autoAddLowPantryToList,
        subscription_tier: settings.subscriptionTier,
        updated_at: new Date().toISOString(),
      });

    return !error;
  } catch {
    return false;
  }
}
