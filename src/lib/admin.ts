import { createClient } from "./supabase/client";

export interface AdminMetrics {
  totalRecipes: number;
  publicRecipes: number;
  privateRecipes: number;
  totalCookPhotos: number;
  totalUsers: number;
  totalFavorites: number;
  pendingReportsCount: number;
}

export interface AdminRecipe {
  id: number;
  title: string;
  image: string | null;
  category: string | null;
  meal_type: string | null;
  cook_time: number | null;
  calories: number | null;
  servings: number | null;
  is_public: boolean;
  is_quarantined?: boolean;
  author_name: string | null;
  user_id: string | null;
  created_at: string;
}

export interface PaginatedAdminRecipes {
  recipes: AdminRecipe[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminCookPhoto {
  id: string;
  recipe_id: number;
  recipe_title: string | null;
  author_name: string;
  image_url: string;
  storage_path: string | null;
  caption: string;
  rating: number | null;
  created_at: string;
  user_id: string;
  is_quarantined?: boolean;
}

export interface AdminUserProfile {
  user_id: string;
  email: string | null;
  display_name: string | null;
  role: string;
  subscription_tier: string | null;
  updated_at: string | null;
}

export interface AdminReviewItem {
  id: string; // target_id
  targetType: "recipe" | "cook_photo";
  title: string;
  authorName: string;
  image?: string;
  reportCount: number;
  reasons: string[];
  details: string[];
  isQuarantined: boolean;
  isPublic?: boolean;
  latestReportAt: string;
}

/**
 * Fetch top-level dashboard metrics for the admin panel.
 */
export async function getAdminMetrics(): Promise<AdminMetrics> {
  const supabase = createClient();

  const [
    recipesRes,
    publicRes,
    photosRes,
    usersRes,
    favoritesRes,
    reportsRes,
  ] = await Promise.all([
    supabase.from("recipes").select("id", { count: "exact", head: true }),
    supabase.from("recipes").select("id", { count: "exact", head: true }).eq("is_public", true),
    supabase.from("recipe_cook_photos").select("id", { count: "exact", head: true }),
    supabase.from("user_profiles").select("user_id", { count: "exact", head: true }),
    supabase.from("user_favorites").select("recipe_id", { count: "exact", head: true }),
    supabase.from("content_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const totalRecipes = recipesRes.count ?? 0;
  const publicRecipes = publicRes.count ?? 0;
  const privateRecipes = Math.max(0, totalRecipes - publicRecipes);
  const totalCookPhotos = photosRes.count ?? 0;
  const totalUsers = usersRes.count ?? 0;
  const totalFavorites = favoritesRes.count ?? 0;
  const pendingReportsCount = reportsRes.count ?? 0;

  return {
    totalRecipes,
    publicRecipes,
    privateRecipes,
    totalCookPhotos,
    totalUsers,
    totalFavorites,
    pendingReportsCount,
  };
}

/**
 * Fetch recipes for admin moderation with server-side pagination, search, and visibility filtering.
 */
export async function getAdminRecipes(
  page = 1,
  pageSize = 25,
  search = "",
  filter: "all" | "public" | "private" = "all"
): Promise<PaginatedAdminRecipes> {
  const supabase = createClient();

  let query = supabase
    .from("recipes")
    .select(
      "id, title, image, category, meal_type, cook_time, calories, servings, is_public, author_name, user_id, created_at, is_quarantined",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (filter === "public") {
    query = query.eq("is_public", true);
  } else if (filter === "private") {
    query = query.eq("is_public", false);
  }

  if (search.trim()) {
    query = query.ilike("title", `%${search.trim()}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) {
    console.error("Failed to fetch admin recipes:", error);
    throw new Error(error.message);
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    recipes: (data || []).map((row) => ({
      id: Number(row.id),
      title: row.title,
      image: row.image,
      category: row.category,
      meal_type: row.meal_type,
      cook_time: row.cook_time ? Number(row.cook_time) : null,
      calories: row.calories ? Number(row.calories) : null,
      servings: row.servings ? Number(row.servings) : null,
      is_public: Boolean(row.is_public),
      is_quarantined: Boolean((row as any).is_quarantined),
      author_name: row.author_name,
      user_id: row.user_id,
      created_at: row.created_at,
    })),
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Toggle or update the public status of a recipe as admin.
 */
export async function updateRecipePublicStatus(
  recipeId: number,
  isPublic: boolean
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from("recipes")
    .update({ is_public: isPublic, is_quarantined: false })
    .eq("id", recipeId);

  if (error) {
    console.error(`Failed to update public status for recipe ${recipeId}:`, error);
    throw new Error(error.message);
  }

  return true;
}

/**
 * Delete a recipe as admin.
 */
export async function deleteRecipeAsAdmin(recipeId: number): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", recipeId);

  if (error) {
    console.error(`Failed to delete recipe ${recipeId}:`, error);
    throw new Error(error.message);
  }

  return true;
}

/**
 * Fetch all cook photos across the community for moderation.
 */
export async function getAdminCookPhotos(): Promise<AdminCookPhoto[]> {
  const supabase = createClient();

  const [photosRes, recipesRes] = await Promise.all([
    supabase
      .from("recipe_cook_photos")
      .select("id, recipe_id, author_name, image_url, storage_path, caption, rating, created_at, user_id, is_quarantined")
      .order("created_at", { ascending: false }),
    supabase.from("recipes").select("id, title"),
  ]);

  if (photosRes.error) {
    console.error("Failed to fetch cook photos for admin:", photosRes.error);
    throw new Error(photosRes.error.message);
  }

  const recipeMap = new Map<number, string>();
  if (recipesRes.data) {
    for (const r of recipesRes.data) {
      recipeMap.set(Number(r.id), r.title);
    }
  }

  return (photosRes.data || []).map((row: any) => ({
    id: row.id,
    recipe_id: Number(row.recipe_id),
    recipe_title: recipeMap.get(Number(row.recipe_id)) || `Recipe #${row.recipe_id}`,
    author_name: row.author_name || "Anonymous Cook",
    image_url: row.image_url,
    storage_path: row.storage_path,
    caption: row.caption || "",
    rating: row.rating ? Number(row.rating) : null,
    created_at: row.created_at,
    user_id: row.user_id,
    is_quarantined: Boolean(row.is_quarantined),
  }));
}

/**
 * Delete a cook photo as admin (cleans up storage bucket and database row).
 */
export async function deleteCookPhotoAsAdmin(
  photoId: string,
  storagePath?: string
): Promise<boolean> {
  const supabase = createClient();

  if (storagePath) {
    try {
      await supabase.storage.from("recipe-media").remove([storagePath]);
    } catch (err) {
      console.warn("Storage deletion warning in admin:", err);
    }
  }

  const { error } = await supabase
    .from("recipe_cook_photos")
    .delete()
    .eq("id", photoId);

  if (error) {
    console.error(`Failed to delete cook photo ${photoId}:`, error);
    throw new Error(error.message);
  }

  return true;
}

/**
 * Fetch registered users for administrative view.
 */
export async function getAdminUsers(): Promise<AdminUserProfile[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("user_id, email, display_name, role, subscription_tier, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch user profiles for admin:", error);
    throw new Error(error.message);
  }

  return (data || []).map((row) => ({
    user_id: row.user_id,
    email: row.email,
    display_name: row.display_name,
    role: row.role || "user",
    subscription_tier: row.subscription_tier || "free",
    updated_at: row.updated_at,
  }));
}

/**
 * Update user role (promote to admin or demote to user).
 */
export async function updateUserRoleAsAdmin(
  userId: string,
  newRole: "admin" | "user"
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from("user_profiles")
    .update({ role: newRole })
    .eq("user_id", userId);

  if (error) {
    console.error(`Failed to update role for user ${userId}:`, error);
    throw new Error(error.message);
  }

  return true;
}

/**
 * Fetch pending reported items for the "Needs Review" queue.
 */
export async function getAdminReviewQueue(): Promise<AdminReviewItem[]> {
  const supabase = createClient();

  const { data: reports, error } = await supabase
    .from("content_reports")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error || !reports || reports.length === 0) {
    return [];
  }

  // Group reports by target_type + target_id
  const grouped = new Map<string, typeof reports>();
  for (const rep of reports) {
    const key = `${rep.target_type}:${rep.target_id}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(rep);
  }

  const reviewItems: AdminReviewItem[] = [];

  for (const [key, itemReports] of grouped.entries()) {
    const [targetType, targetId] = key.split(":");
    const reasons = Array.from(new Set(itemReports.map((r) => r.reason)));
    const details = itemReports.map((r) => r.details).filter(Boolean);
    const latestReportAt = itemReports[0].created_at;

    if (targetType === "recipe") {
      const { data: recipe } = await supabase
        .from("recipes")
        .select("id, title, image, author_name, is_public, is_quarantined")
        .eq("id", Number(targetId))
        .maybeSingle();

      if (recipe) {
        reviewItems.push({
          id: targetId,
          targetType: "recipe",
          title: recipe.title,
          authorName: recipe.author_name || "Community Cook",
          image: recipe.image || undefined,
          reportCount: itemReports.length,
          reasons,
          details,
          isQuarantined: Boolean(recipe.is_quarantined),
          isPublic: Boolean(recipe.is_public),
          latestReportAt,
        });
      }
    } else if (targetType === "cook_photo") {
      const { data: photo } = await supabase
        .from("recipe_cook_photos")
        .select("id, recipe_id, image_url, author_name, caption, is_quarantined")
        .eq("id", targetId)
        .maybeSingle();

      if (photo) {
        reviewItems.push({
          id: targetId,
          targetType: "cook_photo",
          title: `Cook Photo #${targetId.substring(0, 8)}`,
          authorName: photo.author_name || "Community Cook",
          image: photo.image_url,
          reportCount: itemReports.length,
          reasons,
          details,
          isQuarantined: Boolean(photo.is_quarantined),
          latestReportAt,
        });
      }
    }
  }

  return reviewItems.sort((a, b) => b.reportCount - a.reportCount);
}

/**
 * Resolve reported item:
 * - "dismiss" / "approve": Dismiss reports, mark content safe, lift quarantine
 * - "takedown": Unpublish recipe from public community, set to private, and record reason for author
 * - "delete": Permanently delete content from database
 */
export async function resolveReviewItem(
  targetType: "recipe" | "cook_photo",
  targetId: string,
  action: "dismiss" | "takedown" | "delete" | "approve",
  reason?: string
): Promise<boolean> {
  const supabase = createClient();

  // Mark all pending reports for this item as resolved
  await supabase
    .from("content_reports")
    .update({ status: "resolved" })
    .eq("target_type", targetType)
    .eq("target_id", targetId);

  if (action === "dismiss" || action === "approve") {
    // Dismiss reports and lift quarantine (keeping previous public/private setting or restoring public if quarantined)
    if (targetType === "recipe") {
      await supabase
        .from("recipes")
        .update({ is_quarantined: false, moderation_reason: null })
        .eq("id", Number(targetId));
    } else {
      await supabase
        .from("recipe_cook_photos")
        .update({ is_quarantined: false })
        .eq("id", targetId);
    }
  } else if (action === "takedown") {
    // Unpublish recipe from community and record moderation reason for author
    if (targetType === "recipe") {
      await supabase
        .from("recipes")
        .update({
          is_public: false,
          is_quarantined: true,
          moderation_reason: reason || "Community guidelines violation",
        })
        .eq("id", Number(targetId));
    } else {
      await supabase
        .from("recipe_cook_photos")
        .update({ is_quarantined: true })
        .eq("id", targetId);
    }
  } else if (action === "delete") {
    // Permanently delete target
    if (targetType === "recipe") {
      await deleteRecipeAsAdmin(Number(targetId));
    } else {
      const { data: photo } = await supabase
        .from("recipe_cook_photos")
        .select("storage_path")
        .eq("id", targetId)
        .maybeSingle();
      await deleteCookPhotoAsAdmin(targetId, photo?.storage_path || undefined);
    }
  }

  return true;
}
