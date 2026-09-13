import { recipes as mockRecipes } from "./mockData";
import { normalizeRecipe } from "./recipeNormalizer";
import { createClient } from "./supabase/client";
import type {
  AppRecipe,
  SavedImportedRecipe,
  SavedUserRecipe,
  RecipeCategory,
  MealType,
  IngredientGroup,
} from "./types";

export type { AppRecipe } from "./types";

export const IMPORTED_RECIPES_KEY = "importedRecipes";
export const USER_RECIPES_KEY = "userRecipes";
export const SAVED_RECIPES_KEY = "savedRecipes";
export const TRASH_RECIPES_KEY = "trashedRecipes";

export type TrashedRecipe = AppRecipe & {
  deletedAt: number;
};

interface RecipeExtraMetadata {
  description?: string;
  servingsText?: string;
  ingredientGroups?: IngredientGroup[];
  videoUrl?: string;
  videoEmbedUrl?: string;
}

export type RecipeDbRow = {
  id: number;
  user_id?: string;
  title: string;
  image?: string | null;
  cook_time?: number | null;
  calories?: number | null;
  servings?: number | null;
  category?: string | null;
  meal_type?: string | null;
  origin: "mock" | "imported" | "user";
  ingredients: string[];
  instructions: string[];
  nutrition?: Record<string, unknown>;
  tags?: string[];
  source_url?: string | null;
  source_name?: string | null;
  is_public?: boolean | null;
  author_name?: string | null;
  created_at?: string;
  is_quarantined?: boolean | null;
  moderation_reason?: string | null;
};

// Mapper: Supabase DB row to AppRecipe
export function mapDbRowToRecipe(row: RecipeDbRow): AppRecipe {
  const extra = (row.nutrition as unknown as RecipeExtraMetadata) || {};
  const normalized = normalizeRecipe({
    id: Number(row.id),
    title: row.title,
    description: extra.description || undefined,
    image: row.image || "",
    cookTime: row.cook_time ?? undefined,
    calories: row.calories ?? undefined,
    servings: row.servings ?? undefined,
    servingsText: extra.servingsText || undefined,
    ingredientGroups: extra.ingredientGroups || undefined,
    videoUrl: extra.videoUrl || undefined,
    videoEmbedUrl: extra.videoEmbedUrl || undefined,
    origin: row.origin || "user",
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    instructions: Array.isArray(row.instructions) ? row.instructions : [],
    nutrition:
      row.nutrition && Object.keys(row.nutrition).length > 0
        ? row.nutrition
        : undefined,
    sourceUrl: row.source_url ?? undefined,
    sourceName: row.source_name ?? undefined,
  });

  return {
    ...normalized,
    description: extra.description || normalized.description,
    servingsText: extra.servingsText || normalized.servingsText,
    ingredientGroups: extra.ingredientGroups || normalized.ingredientGroups,
    videoUrl: extra.videoUrl || normalized.videoUrl,
    videoEmbedUrl: extra.videoEmbedUrl || normalized.videoEmbedUrl,
    category: (row.category as RecipeCategory) || normalized.category,
    mealType: (row.meal_type as MealType) || normalized.mealType,
    tags:
      Array.isArray(row.tags) && row.tags.length > 0
        ? row.tags
        : normalized.tags,
    isPublic: Boolean(row.is_public),
    authorName: row.author_name || undefined,
    userId: row.user_id || undefined,
    isQuarantined: Boolean(row.is_quarantined),
    moderationReason: row.moderation_reason || undefined,
  };
}

// Mapper: AppRecipe to Supabase DB payload
export function mapRecipeToDbRow(recipe: Partial<AppRecipe>, userId: string) {
  return {
    user_id: userId,
    title: recipe.title?.trim() || "Untitled Recipe",
    image: recipe.image?.trim() || "",
    cook_time: recipe.cookTime ?? null,
    calories: recipe.calories ?? null,
    servings: recipe.servings ?? null,
    category: recipe.category ?? null,
    meal_type: recipe.mealType ?? null,
    origin: recipe.origin || "user",
    ingredients: recipe.ingredients || [],
    instructions: recipe.instructions || [],
    nutrition: {
      ...(recipe.nutrition || {}),
      description: recipe.description || null,
      servingsText: recipe.servingsText || null,
      ingredientGroups: recipe.ingredientGroups || null,
      videoUrl: recipe.videoUrl || null,
      videoEmbedUrl: recipe.videoEmbedUrl || null,
    },
    tags: recipe.tags || [],
    source_url: recipe.sourceUrl ?? null,
    source_name: recipe.sourceName ?? null,
    is_public: Boolean(recipe.isPublic),
    author_name: recipe.authorName?.trim() || "",
  };
}

export function getMockRecipes(): AppRecipe[] {
  return mockRecipes.map((recipe) =>
    normalizeRecipe({
      ...recipe,
      origin: "mock",
    }),
  );
}

export function getImportedRecipes(): AppRecipe[] {
  if (typeof window === "undefined") return [];

  const storedImportedRecipes = localStorage.getItem(IMPORTED_RECIPES_KEY);
  if (!storedImportedRecipes) return [];

  try {
    const parsed = JSON.parse(storedImportedRecipes) as SavedImportedRecipe[];
    return parsed.map((recipe) =>
      normalizeRecipe({
        ...recipe,
        calories: recipe.nutrition?.calories,
        origin: "imported",
      }),
    );
  } catch {
    localStorage.removeItem(IMPORTED_RECIPES_KEY);
    return [];
  }
}

export function getUserRecipes(): AppRecipe[] {
  if (typeof window === "undefined") return [];

  const storedUserRecipes = localStorage.getItem(USER_RECIPES_KEY);
  if (!storedUserRecipes) return [];

  try {
    const parsed = JSON.parse(storedUserRecipes) as SavedUserRecipe[];
    return parsed.map((recipe) =>
      normalizeRecipe({
        ...recipe,
        origin: "user",
      }),
    );
  } catch {
    localStorage.removeItem(USER_RECIPES_KEY);
    return [];
  }
}

export function getSavedRecipeIds(): number[] {
  if (typeof window === "undefined") return [];

  const storedSavedRecipes = localStorage.getItem(SAVED_RECIPES_KEY);
  if (!storedSavedRecipes) return [];

  try {
    return JSON.parse(storedSavedRecipes) as number[];
  } catch {
    localStorage.removeItem(SAVED_RECIPES_KEY);
    return [];
  }
}

export function saveRecipeId(id: number) {
  if (typeof window === "undefined") return;

  const savedIds = getSavedRecipeIds();
  if (savedIds.includes(id)) return;

  localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify([...savedIds, id]));

  // Background sync to Supabase
  import("./sync/cloudSync").then(({ addCloudFavorite }) => {
    addCloudFavorite(id).catch(() => {});
  });
}

export function removeSavedRecipe(id: number) {
  if (typeof window === "undefined") return;

  const savedIds = getSavedRecipeIds();
  const updatedSavedIds = savedIds.filter((savedId) => savedId !== id);

  localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(updatedSavedIds));

  // Background sync to Supabase
  import("./sync/cloudSync").then(({ removeCloudFavorite }) => {
    removeCloudFavorite(id).catch(() => {});
  });
}

export async function getSavedRecipeIdsWithCloud(): Promise<number[]> {
  const local = getSavedRecipeIds();
  try {
    const { fetchCloudFavorites } = await import("./sync/cloudSync");
    const cloud = await fetchCloudFavorites();
    if (cloud && cloud.length > 0) {
      const merged = Array.from(new Set([...local, ...cloud]));
      if (typeof window !== "undefined") {
        localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(merged));
      }
      return merged;
    }
  } catch {}
  return local;
}

export function removeImportedRecipe(id: number) {
  if (typeof window === "undefined") return;

  const storedImportedRecipes = localStorage.getItem(IMPORTED_RECIPES_KEY);
  if (storedImportedRecipes) {
    try {
      const parsed = JSON.parse(storedImportedRecipes) as SavedImportedRecipe[];
      const updated = parsed.filter((recipe) => recipe.id !== id);
      localStorage.setItem(IMPORTED_RECIPES_KEY, JSON.stringify(updated));
    } catch {
      localStorage.removeItem(IMPORTED_RECIPES_KEY);
    }
  }

  removeSavedRecipe(id);
}

export function removeUserRecipe(id: number) {
  if (typeof window === "undefined") return;

  const storedUserRecipes = localStorage.getItem(USER_RECIPES_KEY);
  if (storedUserRecipes) {
    try {
      const parsed = JSON.parse(storedUserRecipes) as SavedUserRecipe[];
      const updated = parsed.filter((recipe) => recipe.id !== id);
      localStorage.setItem(USER_RECIPES_KEY, JSON.stringify(updated));
    } catch {
      localStorage.removeItem(USER_RECIPES_KEY);
    }
  }

  removeSavedRecipe(id);
}

// -------------------------------------------------------------
// CLOUD + LOCAL SYNC OPERATIONS
// -------------------------------------------------------------

// Fetch user's recipes from Supabase Postgres
export async function fetchUserRecipesFromCloud(): Promise<AppRecipe[]> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // If user is not logged in, gracefully return empty list
    if (userError || !user) return [];

    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Could not query recipes from Supabase:", error.message);
      return [];
    }

    if (!data) return [];

    return (data as unknown as RecipeDbRow[]).map((row) => mapDbRowToRecipe(row));
  } catch {
    return [];
  }
}

// Fetch public community recipes shared by other users
export async function fetchPublicCommunityRecipesFromCloud(): Promise<AppRecipe[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return (data as unknown as RecipeDbRow[]).map((row) => mapDbRowToRecipe(row));
  } catch {
    return [];
  }
}

// Save a recipe to Supabase if logged in, otherwise localStorage fallback
export async function saveRecipeToCloudOrLocal(
  recipe: Partial<AppRecipe>,
): Promise<{ success: boolean; recipe?: AppRecipe; isCloud: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // 1. Save to Supabase Cloud
      const dbRow = mapRecipeToDbRow(recipe, user.id);
      const { data, error } = await supabase
        .from("recipes")
        .insert(dbRow)
        .select()
        .single();

      if (error || !data) {
        console.error("Supabase insert error:", error);
        return {
          success: false,
          isCloud: false,
          error: error?.message || "Failed to save recipe to database.",
        };
      }

      const savedRecipe = mapDbRowToRecipe(data as RecipeDbRow);

      // Cache locally for instant synchronous access across routes
      if (typeof window !== "undefined") {
        if (savedRecipe.origin === "imported") {
          const existing = getImportedRecipes().filter((r) => r.id !== savedRecipe.id);
          localStorage.setItem(
            IMPORTED_RECIPES_KEY,
            JSON.stringify([savedRecipe, ...existing]),
          );
        } else {
          const existing = getUserRecipes().filter((r) => r.id !== savedRecipe.id);
          localStorage.setItem(
            USER_RECIPES_KEY,
            JSON.stringify([savedRecipe, ...existing]),
          );
        }
      }

      return { success: true, recipe: savedRecipe, isCloud: true };
    }

    // 2. Fallback to LocalStorage
    if (typeof window !== "undefined") {
      const generatedId = Date.now();
      const localRecipe: AppRecipe = normalizeRecipe({
        ...recipe,
        id: generatedId,
        origin: recipe.origin || "user",
      } as Partial<AppRecipe>);

      if (recipe.origin === "imported") {
        const existing = getImportedRecipes();
        localStorage.setItem(
          IMPORTED_RECIPES_KEY,
          JSON.stringify([localRecipe, ...existing]),
        );
      } else {
        const existing = getUserRecipes();
        localStorage.setItem(
          USER_RECIPES_KEY,
          JSON.stringify([localRecipe, ...existing]),
        );
      }

      return { success: true, recipe: localRecipe, isCloud: false };
    }

    return { success: false, isCloud: false, error: "Window is undefined." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to save.";
    return { success: false, isCloud: false, error: errorMsg };
  }
}

// Update an existing recipe in Supabase Cloud or LocalStorage
export async function updateRecipeInCloudOrLocal(
  recipe: AppRecipe,
): Promise<{ success: boolean; recipe?: AppRecipe; isCloud: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let isCloud = false;

    if (user) {
      const dbRow = mapRecipeToDbRow(recipe, user.id);
      const { data, error } = await supabase
        .from("recipes")
        .update(dbRow)
        .eq("id", recipe.id)
        .select()
        .maybeSingle();

      if (data && !error) {
        isCloud = true;
      }
    }

    if (typeof window !== "undefined") {
      const normalized = normalizeRecipe(recipe);

      if (normalized.origin === "imported") {
        const existing = getImportedRecipes();
        const updated = existing.map((r) => (r.id === normalized.id ? normalized : r));
        if (!existing.some((r) => r.id === normalized.id)) {
          updated.push(normalized);
        }
        localStorage.setItem(IMPORTED_RECIPES_KEY, JSON.stringify(updated));
      } else {
        const existing = getUserRecipes();
        let found = false;
        const updated = existing.map((r) => {
          if (r.id === normalized.id) {
            found = true;
            return normalized;
          }
          return r;
        });
        if (!found) {
          updated.unshift(normalized);
        }
        localStorage.setItem(USER_RECIPES_KEY, JSON.stringify(updated));
      }

      window.dispatchEvent(new Event("storage"));
      return { success: true, recipe: normalized, isCloud };
    }

    return { success: true, recipe, isCloud };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to update.";
    return { success: false, isCloud: false, error: errorMsg };
  }
}

// Delete recipe from Supabase or LocalStorage
export async function deleteRecipeFromCloudOrLocal(
  id: number,
  origin?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("recipes").delete().eq("id", id);
    }

    // Also clean up local storage
    if (origin === "imported") {
      removeImportedRecipe(id);
    } else {
      removeUserRecipe(id);
    }
    removeSavedRecipe(id);

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to delete.";
    return { success: false, error: errorMsg };
  }
}

// Combined synchronous helper (User & Imported recipes ALWAYS override mock recipes)
export function getAllRecipes(): AppRecipe[] {
  const recipeMap = new Map<number, AppRecipe>();

  // 1. Base mock recipes
  for (const recipe of getMockRecipes()) {
    recipeMap.set(recipe.id, recipe);
  }

  // 2. Imported recipes override mock
  for (const recipe of getImportedRecipes()) {
    recipeMap.set(recipe.id, recipe);
  }

  // 3. User recipes override mock
  for (const recipe of getUserRecipes()) {
    recipeMap.set(recipe.id, recipe);
  }

  const trashed = new Set(getTrashedRecipes().map((t) => t.id));
  return Array.from(recipeMap.values()).filter((r) => !trashed.has(r.id));
}

// Combined asynchronous helper for fetching all recipes including Cloud
export async function getAllRecipesWithCloud(): Promise<AppRecipe[]> {
  const recipeMap = new Map<number, AppRecipe>();

  // 1. Base mock recipes
  for (const recipe of getMockRecipes()) {
    recipeMap.set(recipe.id, recipe);
  }

  // 2. Local imported & user recipes
  for (const recipe of getImportedRecipes()) {
    recipeMap.set(recipe.id, recipe);
  }
  for (const recipe of getUserRecipes()) {
    recipeMap.set(recipe.id, recipe);
  }

  // 3. Supabase Public Community recipes
  try {
    const communityRecipes = await fetchPublicCommunityRecipesFromCloud();
    for (const recipe of communityRecipes) {
      recipeMap.set(recipe.id, recipe);
    }
  } catch (err) {
    console.warn("Failed to fetch community recipes:", err);
  }

  // 4. Supabase User's own Cloud recipes (highest authority!)
  try {
    const cloudRecipes = await fetchUserRecipesFromCloud();
    for (const recipe of cloudRecipes) {
      recipeMap.set(recipe.id, recipe);
    }
  } catch (err) {
    console.warn("Failed to fetch cloud recipes:", err);
  }

  const trashed = new Set(getTrashedRecipes().map((t) => t.id));
  return Array.from(recipeMap.values()).filter((r) => !trashed.has(r.id));
}

// Direct fetch by ID with exact precedence (Cloud DB -> Local DB -> Mock)
export async function getRecipeById(id: number): Promise<AppRecipe | null> {
  // 1. Try Supabase Cloud DB first
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("recipes")
      .select()
      .eq("id", id)
      .maybeSingle();

    if (!error && data) {
      return mapDbRowToRecipe(data as RecipeDbRow);
    }
  } catch {
    // Offline or unauthenticated
  }

  // 2. Try Local user & imported recipes
  const localUser = getUserRecipes().find((r) => r.id === id);
  if (localUser) return localUser;

  const localImported = getImportedRecipes().find((r) => r.id === id);
  if (localImported) return localImported;

  // 3. Fallback to mock recipes only if no real recipe exists
  const mock = getMockRecipes().find((r) => r.id === id);
  return mock ?? null;
}

// ----------------------------------------------------
// TRASH / RECOVERY SYSTEM (30-day retention)
// ----------------------------------------------------
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function getTrashedRecipes(): TrashedRecipe[] {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem(TRASH_RECIPES_KEY);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored) as TrashedRecipe[];
    const now = Date.now();

    // Auto-prune items older than 30 days
    const activeTrash = parsed.filter(
      (item) => now - item.deletedAt < THIRTY_DAYS_MS,
    );

    if (activeTrash.length !== parsed.length) {
      localStorage.setItem(TRASH_RECIPES_KEY, JSON.stringify(activeTrash));
    }

    return activeTrash;
  } catch {
    localStorage.removeItem(TRASH_RECIPES_KEY);
    return [];
  }
}

export function moveRecipeToTrash(recipe: AppRecipe): TrashedRecipe[] {
  if (typeof window === "undefined") return [];

  const trashedItem: TrashedRecipe = {
    ...recipe,
    deletedAt: Date.now(),
  };

  const currentTrash = getTrashedRecipes();
  const filtered = currentTrash.filter((item) => item.id !== recipe.id);
  const updated = [trashedItem, ...filtered];

  localStorage.setItem(TRASH_RECIPES_KEY, JSON.stringify(updated));

  // Remove from saved/imported/user collections
  if (recipe.origin === "imported") {
    removeImportedRecipe(recipe.id);
  } else if (recipe.origin === "user") {
    removeUserRecipe(recipe.id);
  }
  removeSavedRecipe(recipe.id);

  return updated;
}

export function restoreRecipeFromTrash(id: number): {
  success: boolean;
  restoredRecipe?: AppRecipe;
} {
  if (typeof window === "undefined") return { success: false };

  const currentTrash = getTrashedRecipes();
  const target = currentTrash.find((item) => item.id === id);

  if (!target) return { success: false };

  const updatedTrash = currentTrash.filter((item) => item.id !== id);
  localStorage.setItem(TRASH_RECIPES_KEY, JSON.stringify(updatedTrash));

  // Strip deletedAt and re-save to appropriate list
  const { deletedAt: _deletedAt, ...cleanRecipe } = target;
  void _deletedAt;

  if (cleanRecipe.origin === "imported") {
    const existing = getImportedRecipes();
    localStorage.setItem(
      IMPORTED_RECIPES_KEY,
      JSON.stringify([cleanRecipe, ...existing]),
    );
  } else {
    const existing = getUserRecipes();
    localStorage.setItem(
      USER_RECIPES_KEY,
      JSON.stringify([cleanRecipe, ...existing]),
    );
  }

  // Also re-save ID to saved list
  saveRecipeId(cleanRecipe.id);

  return { success: true, restoredRecipe: cleanRecipe };
}

export async function permanentlyDeleteFromTrash(
  id: number,
  origin?: string,
): Promise<{ success: boolean }> {
  if (typeof window === "undefined") return { success: false };

  const currentTrash = getTrashedRecipes();
  const updatedTrash = currentTrash.filter((item) => item.id !== id);
  localStorage.setItem(TRASH_RECIPES_KEY, JSON.stringify(updatedTrash));

  await deleteRecipeFromCloudOrLocal(id, origin);
  return { success: true };
}

export async function emptyTrash(): Promise<void> {
  if (typeof window === "undefined") return;

  const currentTrash = getTrashedRecipes();
  for (const item of currentTrash) {
    await deleteRecipeFromCloudOrLocal(item.id, item.origin);
  }

  localStorage.removeItem(TRASH_RECIPES_KEY);
}