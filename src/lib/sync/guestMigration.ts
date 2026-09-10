/**
 * Guest-to-Cloud Migration Utility
 * Sömlös överföring av gästens lokala data (localStorage) till Supabase
 * när användaren loggar in eller registrerar sig.
 */

import { createClient } from "../supabase/client";
import {
  IMPORTED_RECIPES_KEY,
  USER_RECIPES_KEY,
  SAVED_RECIPES_KEY,
  getImportedRecipes,
  getUserRecipes,
  getSavedRecipeIds,
  mapRecipeToDbRow,
  mapDbRowToRecipe,
  type RecipeDbRow,
  type AppRecipe,
} from "../recipes";
import { getPantryInventory, type StoredGroceryItem } from "../groceries";
import { getStoredMealPlan, WEEK_DAYS, MEAL_SLOTS, type MealPlan } from "../planner";
import { syncCloudGroceries, syncCloudPantry, syncCloudMealPlan, addCloudFavorite } from "./cloudSync";

export async function migrateGuestDataToCloud(userId: string): Promise<{
  migratedRecipesCount: number;
  migratedFavoritesCount: number;
  migratedGroceriesCount: number;
}> {
  if (typeof window === "undefined" || !userId) {
    return { migratedRecipesCount: 0, migratedFavoritesCount: 0, migratedGroceriesCount: 0 };
  }

  // Prevent multiple concurrent migrations
  const migrationLockKey = `recipe_migrated_${userId}`;
  if (sessionStorage.getItem(migrationLockKey)) {
    return { migratedRecipesCount: 0, migratedFavoritesCount: 0, migratedGroceriesCount: 0 };
  }
  sessionStorage.setItem(migrationLockKey, "true");

  const supabase = createClient();
  let migratedRecipesCount = 0;
  let migratedFavoritesCount = 0;
  let migratedGroceriesCount = 0;

  try {
    // -------------------------------------------------------------
    // 1. MIGRATE GUEST RECIPES (Imported & Created User Recipes)
    // -------------------------------------------------------------
    const guestImported = getImportedRecipes();
    const guestCreated = getUserRecipes();
    const allGuestRecipes = [...guestImported, ...guestCreated];

    // Map old guest ID -> new cloud DB ID (for updating favorites)
    const idMapping = new Map<number, number>();

    if (allGuestRecipes.length > 0) {
      // Fetch user's existing cloud recipes to prevent duplicates
      const { data: existingCloudData } = await supabase
        .from("recipes")
        .select("id, title, origin")
        .eq("user_id", userId);

      const existingTitles = new Set(
        (existingCloudData || []).map((r) => `${r.title?.trim().toLowerCase()}_${r.origin}`)
      );

      const newlySavedCloudRecipes: AppRecipe[] = [];

      for (const recipe of allGuestRecipes) {
        // Skip if already in cloud with same title & origin
        const key = `${recipe.title?.trim().toLowerCase()}_${recipe.origin}`;
        if (existingTitles.has(key)) {
          const match = (existingCloudData || []).find(
            (r) => `${r.title?.trim().toLowerCase()}_${recipe.origin}` === key
          );
          if (match) {
            idMapping.set(recipe.id, match.id);
          }
          continue;
        }

        const dbRow = mapRecipeToDbRow(recipe, userId);
        const { data: insertedRow, error: insertErr } = await supabase
          .from("recipes")
          .insert(dbRow)
          .select()
          .single();

        if (!insertErr && insertedRow) {
          const cloudRecipe = mapDbRowToRecipe(insertedRow as RecipeDbRow);
          idMapping.set(recipe.id, cloudRecipe.id);
          newlySavedCloudRecipes.push(cloudRecipe);
          migratedRecipesCount++;
        }
      }

      if (newlySavedCloudRecipes.length > 0) {
        // Update local storage caches with updated cloud IDs
        const remainingImported = guestImported.map((r) => {
          const cloudId = idMapping.get(r.id);
          return cloudId ? { ...r, id: cloudId } : r;
        });
        localStorage.setItem(IMPORTED_RECIPES_KEY, JSON.stringify(remainingImported));

        const remainingCreated = guestCreated.map((r) => {
          const cloudId = idMapping.get(r.id);
          return cloudId ? { ...r, id: cloudId } : r;
        });
        localStorage.setItem(USER_RECIPES_KEY, JSON.stringify(remainingCreated));

        window.dispatchEvent(new CustomEvent("cookbook_recipes_updated"));
      }
    }

    // -------------------------------------------------------------
    // 2. MIGRATE SAVED FAVORITES
    // -------------------------------------------------------------
    const localFavoriteIds = getSavedRecipeIds();
    if (localFavoriteIds.length > 0) {
      // Remap any IDs that got new cloud IDs
      const mappedFavoriteIds = localFavoriteIds.map((id) => idMapping.get(id) || id);

      for (const recipeId of mappedFavoriteIds) {
        await addCloudFavorite(recipeId).catch(() => {});
        migratedFavoritesCount++;
      }

      localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(Array.from(new Set(mappedFavoriteIds))));
      window.dispatchEvent(new CustomEvent("saved_recipes_updated"));
    }

    // -------------------------------------------------------------
    // 3. MIGRATE GROCERIES
    // -------------------------------------------------------------
    const rawLocalGroceries = localStorage.getItem("groceryList");
    if (rawLocalGroceries) {
      try {
        const localGroceries = JSON.parse(rawLocalGroceries) as StoredGroceryItem[];
        if (Array.isArray(localGroceries) && localGroceries.length > 0) {
          // Remap recipe IDs on grocery items if applicable
          const remappedGroceries = localGroceries.map((item) => {
            if (item.sourceRecipeId && idMapping.has(Number(item.sourceRecipeId))) {
              return {
                ...item,
                sourceRecipeId: idMapping.get(Number(item.sourceRecipeId)),
              };
            }
            return item;
          });

          await syncCloudGroceries(remappedGroceries);
          migratedGroceriesCount = remappedGroceries.length;
          window.dispatchEvent(new CustomEvent("grocery_list_updated"));
        }
      } catch (err) {
        console.warn("Could not parse local groceries for migration:", err);
      }
    }

    // -------------------------------------------------------------
    // 4. MIGRATE PANTRY
    // -------------------------------------------------------------
    const localPantry = getPantryInventory();
    if (Array.isArray(localPantry) && localPantry.length > 0) {
      await syncCloudPantry(localPantry).catch(() => {});
      window.dispatchEvent(new CustomEvent("pantry_inventory_updated"));
    }

    // -------------------------------------------------------------
    // 5. MIGRATE MEAL PLAN
    // -------------------------------------------------------------
    const localMealPlan = getStoredMealPlan();
    if (localMealPlan) {
      // Remap recipe IDs in the meal plan if they changed
      let hasPlan = false;
      const remappedPlan: MealPlan = { ...localMealPlan };

      for (const day of WEEK_DAYS) {
        for (const slot of MEAL_SLOTS) {
          const oldId = localMealPlan[day]?.[slot];
          if (typeof oldId === "number" && oldId > 0) {
            hasPlan = true;
            if (idMapping.has(oldId)) {
              remappedPlan[day][slot] = idMapping.get(oldId) || oldId;
            }
          }
        }
      }

      if (hasPlan) {
        await syncCloudMealPlan(remappedPlan).catch(() => {});
        window.dispatchEvent(new CustomEvent("meal_plan_updated"));
      }
    }

    return {
      migratedRecipesCount,
      migratedFavoritesCount,
      migratedGroceriesCount,
    };
  } catch (err) {
    console.error("Error during guest migration:", err);
    return {
      migratedRecipesCount,
      migratedFavoritesCount,
      migratedGroceriesCount,
    };
  }
}
