"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import {
  getAdminMetrics,
  getAdminRecipes,
  updateRecipePublicStatus,
  deleteRecipeAsAdmin,
  getAdminCookPhotos,
  deleteCookPhotoAsAdmin,
  getAdminUsers,
  updateUserRoleAsAdmin,
  getAdminReviewQueue,
  resolveReviewItem,
  type AdminMetrics,
  type AdminRecipe,
  type AdminCookPhoto,
  type AdminUserProfile,
  type AdminReviewItem,
} from "../../lib/admin";
import AdminNavHeader, { type AdminTab } from "../../components/admin/AdminNavHeader";
import AdminStatsBento from "../../components/admin/AdminStatsBento";
import AdminRecipeTable from "../../components/admin/AdminRecipeTable";
import AdminPhotoGallery from "../../components/admin/AdminPhotoGallery";
import AdminUserList from "../../components/admin/AdminUserList";
import AdminReviewQueue from "../../components/admin/AdminReviewQueue";

export default function AdminPage() {
  const { user, isLoading: isAuthLoading, isAdmin, displayName } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);

  // Recipes with pagination state
  const [recipes, setRecipes] = useState<AdminRecipe[]>([]);
  const [recipePage, setRecipePage] = useState(1);
  const [recipePageSize] = useState(25);
  const [recipeTotalCount, setRecipeTotalCount] = useState(0);
  const [recipeTotalPages, setRecipeTotalPages] = useState(1);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeFilter, setRecipeFilter] = useState<"all" | "public" | "private">("all");

  // Other entities
  const [photos, setPhotos] = useState<AdminCookPhoto[]>([]);
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [reviewQueue, setReviewQueue] = useState<AdminReviewItem[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch paginated recipes
  const loadRecipes = useCallback(
    async (page: number, search: string, filter: "all" | "public" | "private") => {
      try {
        const res = await getAdminRecipes(page, recipePageSize, search, filter);
        setRecipes(res.recipes);
        setRecipeTotalCount(res.totalCount);
        setRecipeTotalPages(res.totalPages);
        setRecipePage(res.page);
      } catch (err) {
        console.error("Failed to load recipes:", err);
      }
    },
    [recipePageSize]
  );

  // Initial and refresh load
  const loadAllAdminData = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setIsLoadingData(true);
      const [m, recRes, p, u, rq] = await Promise.all([
        getAdminMetrics(),
        getAdminRecipes(recipePage, recipePageSize, recipeSearch, recipeFilter),
        getAdminCookPhotos(),
        getAdminUsers(),
        getAdminReviewQueue(),
      ]);
      setMetrics(m);
      setRecipes(recRes.recipes);
      setRecipeTotalCount(recRes.totalCount);
      setRecipeTotalPages(recRes.totalPages);
      setPhotos(p);
      setUsers(u);
      setReviewQueue(rq);
    } catch (err) {
      console.error("Failed to load admin data:", err);
      showToast("Failed to load admin data");
    } finally {
      setIsLoadingData(false);
    }
  }, [isAdmin, recipePage, recipePageSize, recipeSearch, recipeFilter]);

  useEffect(() => {
    if (!isAuthLoading && isAdmin) {
      loadAllAdminData();
    }
  }, [isAuthLoading, isAdmin, loadAllAdminData]);

  // When recipe search or filter changes
  const handleRecipeSearchChange = (newSearch: string) => {
    setRecipeSearch(newSearch);
    loadRecipes(1, newSearch, recipeFilter);
  };

  const handleRecipeFilterChange = (newFilter: "all" | "public" | "private") => {
    setRecipeFilter(newFilter);
    loadRecipes(1, recipeSearch, newFilter);
  };

  const handleRecipePageChange = (newPage: number) => {
    setRecipePage(newPage);
    loadRecipes(newPage, recipeSearch, recipeFilter);
  };

  // Handle Recipe Actions
  const handleToggleRecipePublic = async (recipeId: number, currentStatus: boolean) => {
    try {
      setIsActionLoading(true);
      const nextStatus = !currentStatus;
      await updateRecipePublicStatus(recipeId, nextStatus);
      setRecipes((prev) =>
        prev.map((r) => (r.id === recipeId ? { ...r, is_public: nextStatus, is_quarantined: false } : r))
      );
      if (metrics) {
        setMetrics({
          ...metrics,
          publicRecipes: nextStatus ? metrics.publicRecipes + 1 : metrics.publicRecipes - 1,
          privateRecipes: nextStatus ? metrics.privateRecipes - 1 : metrics.privateRecipes + 1,
        });
      }
      showToast(nextStatus ? "Recipe published" : "Recipe set to private");
    } catch (err) {
      console.error(err);
      showToast("Failed to update status");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteRecipe = async (recipeId: number) => {
    try {
      setIsActionLoading(true);
      await deleteRecipeAsAdmin(recipeId);
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      setRecipeTotalCount((prev) => Math.max(0, prev - 1));
      if (metrics) {
        setMetrics({
          ...metrics,
          totalRecipes: Math.max(0, metrics.totalRecipes - 1),
        });
      }
      showToast("Recipe permanently deleted");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete recipe");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Photo Actions
  const handleDeletePhoto = async (photoId: string, storagePath?: string) => {
    try {
      setIsActionLoading(true);
      await deleteCookPhotoAsAdmin(photoId, storagePath);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      if (metrics) {
        setMetrics({
          ...metrics,
          totalCookPhotos: Math.max(0, metrics.totalCookPhotos - 1),
        });
      }
      showToast("Cook photo deleted");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete photo");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle User Role Actions
  const handleUpdateRole = async (userId: string, newRole: "admin" | "user") => {
    try {
      setIsActionLoading(true);
      await updateUserRoleAsAdmin(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u))
      );
      showToast(`User role updated to ${newRole}`);
    } catch (err) {
      console.error(err);
      showToast("Failed to update user role");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Moderation Review Actions
  const handleDismissReview = async (
    targetType: "recipe" | "cook_photo",
    targetId: string
  ) => {
    try {
      setIsActionLoading(true);
      await resolveReviewItem(targetType, targetId, "dismiss");
      setReviewQueue((prev) => prev.filter((item) => item.id !== targetId));
      if (metrics) {
        setMetrics({
          ...metrics,
          pendingReportsCount: Math.max(0, metrics.pendingReportsCount - 1),
        });
      }
      if (targetType === "recipe") {
        setRecipes((prev) =>
          prev.map((r) => (r.id === Number(targetId) ? { ...r, is_quarantined: false } : r))
        );
      }
      showToast("Report dismissed. Content marked as safe.");
    } catch (err) {
      console.error(err);
      showToast("Failed to dismiss report");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleTakedownReview = async (
    targetType: "recipe" | "cook_photo",
    targetId: string,
    reason: string
  ) => {
    try {
      setIsActionLoading(true);
      await resolveReviewItem(targetType, targetId, "takedown", reason);
      setReviewQueue((prev) => prev.filter((item) => item.id !== targetId));
      if (metrics) {
        setMetrics({
          ...metrics,
          pendingReportsCount: Math.max(0, metrics.pendingReportsCount - 1),
        });
      }
      if (targetType === "recipe") {
        setRecipes((prev) =>
          prev.map((r) =>
            r.id === Number(targetId)
              ? { ...r, is_public: false, is_quarantined: true }
              : r
          )
        );
      }
      showToast("Content taken down and set to private. Author notified.");
    } catch (err) {
      console.error(err);
      showToast("Failed to take down content");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteReview = async (
    targetType: "recipe" | "cook_photo",
    targetId: string
  ) => {
    try {
      setIsActionLoading(true);
      await resolveReviewItem(targetType, targetId, "delete");
      setReviewQueue((prev) => prev.filter((item) => item.id !== targetId));
      if (targetType === "recipe") {
        setRecipes((prev) => prev.filter((r) => r.id !== Number(targetId)));
        setRecipeTotalCount((prev) => Math.max(0, prev - 1));
      } else {
        setPhotos((prev) => prev.filter((p) => p.id !== targetId));
      }
      if (metrics) {
        setMetrics({
          ...metrics,
          pendingReportsCount: Math.max(0, metrics.pendingReportsCount - 1),
          totalRecipes: targetType === "recipe" ? Math.max(0, metrics.totalRecipes - 1) : metrics.totalRecipes,
          totalCookPhotos: targetType === "cook_photo" ? Math.max(0, metrics.totalCookPhotos - 1) : metrics.totalCookPhotos,
        });
      }
      showToast("Content permanently deleted");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete content");
    } finally {
      setIsActionLoading(false);
    }
  };

  // 1. AUTH LOADING STATE
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-[#12100e] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="text-xs font-bold text-stone-500 dark:text-stone-400">
            Verifying admin access...
          </p>
        </div>
      </div>
    );
  }

  // 2. UNAUTHENTICATED / GUEST STATE
  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-[#12100e] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-xl dark:border-[#2e2722] dark:bg-[#1a1715] space-y-4">
          <svg className="mx-auto h-12 w-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>

          <h2 className="text-xl font-black text-stone-900 dark:text-white">
            Admin Access Required
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            You must be signed in with an authorized administrator account to access this console.
          </p>

          <div className="pt-3 flex flex-col gap-2">
            <Link
              href="/auth?redirectTo=/admin"
              className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold px-4 py-2.5 text-xs shadow-xs transition active:scale-95"
            >
              Sign In as Administrator
            </Link>
            <Link
              href="/"
              className="text-xs font-semibold text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white pt-1"
            >
              &larr; Return to Recipe Collector
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. LOGGED IN BUT FORBIDDEN (NON-ADMIN)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-[#12100e] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-xl dark:border-[#2e2722] dark:bg-[#1a1715] space-y-4">
          <svg className="mx-auto h-12 w-12 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>

          <h2 className="text-xl font-black text-stone-900 dark:text-white">
            403 • Access Denied
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            Your account (<strong className="text-stone-900 dark:text-white">{user.email}</strong>) is currently a standard user and does not have administrator privileges.
          </p>

          <div className="pt-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#201c19] text-stone-700 dark:text-stone-300 font-bold px-4 py-2 text-xs hover:bg-stone-50 dark:hover:bg-[#26221e] transition"
            >
              &larr; Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. AUTHORIZED ADMIN DASHBOARD VIEW
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#12100e] text-stone-900 dark:text-[#fafaf9] transition-colors pb-16">
      {/* Navigation Header */}
      <AdminNavHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        adminName={displayName}
        adminEmail={user.email || ""}
        pendingReportsCount={reviewQueue.length}
        onRefresh={loadAllAdminData}
        isRefreshing={isLoadingData}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* Toast alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-stone-900 text-white dark:bg-amber-500 dark:text-stone-950 font-bold px-4 py-2.5 text-xs shadow-xl animate-in slide-in-from-bottom-3 duration-200">
            {toastMessage}
          </div>
        )}

        {/* Tab Content: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Needs Review Alert Banner (if any reports are pending) */}
            {reviewQueue.length > 0 && (
              <div className="rounded-3xl border border-stone-200/90 bg-white p-5 dark:border-[#2e2722] dark:bg-[#1a1715] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-[#fafaf9]">
                      {reviewQueue.length} item{reviewQueue.length > 1 ? "s" : ""} require your moderation
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-[#a8a29e]">
                      Community members have reported content. Items receiving 3+ reports have been automatically quarantined.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab("review")}
                  className="rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold border border-amber-600/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] px-4 py-2 text-xs transition active:scale-95 cursor-pointer shrink-0"
                >
                  Review Now &rarr;
                </button>
              </div>
            )}

            {metrics ? (
              <AdminStatsBento
                metrics={metrics}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            ) : (
              <div className="h-32 rounded-3xl bg-stone-200/50 dark:bg-[#1a1715] animate-pulse" />
            )}

            {/* Quick overview panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Latest Recipes preview */}
              <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-sm dark:border-[#2e2722] dark:bg-[#1a1715] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                    <span>Recent Recipes</span>
                    <span className="rounded-full bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300 text-[10px] font-bold px-2 py-0.5">
                      {recipeTotalCount}
                    </span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("recipes")}
                    className="text-xs font-bold text-amber-600 hover:text-amber-500 dark:text-amber-400 cursor-pointer"
                  >
                    View all &rarr;
                  </button>
                </div>

                <div className="divide-y divide-stone-100 dark:divide-[#25201c]">
                  {recipes.slice(0, 5).map((recipe) => (
                    <div
                      key={recipe.id}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-3">
                        <Link
                          href={`/recipes/${recipe.id}`}
                          target="_blank"
                          className="font-bold text-stone-800 hover:text-amber-600 dark:text-stone-200 dark:hover:text-amber-400 truncate block"
                        >
                          {recipe.title}
                        </Link>
                        <p className="text-[11px] text-stone-400">
                          {recipe.category || "General"} • {recipe.author_name || "Editorial"}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          recipe.is_quarantined
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                            : recipe.is_public
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400"
                        }`}
                      >
                        {recipe.is_quarantined
                          ? "Quarantined"
                          : recipe.is_public
                          ? "Public"
                          : "Private"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Latest Photos preview */}
              <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-sm dark:border-[#2e2722] dark:bg-[#1a1715] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                    <span>Recent Cook Photos</span>
                    <span className="rounded-full bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300 text-[10px] font-bold px-2 py-0.5">
                      {photos.length}
                    </span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("photos")}
                    className="text-xs font-bold text-amber-600 hover:text-amber-500 dark:text-amber-400 cursor-pointer"
                  >
                    Moderate &rarr;
                  </button>
                </div>

                {photos.length === 0 ? (
                  <p className="text-xs text-stone-400 py-6 text-center">
                    No cook photos uploaded yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {photos.slice(0, 4).map((photo) => (
                      <div
                        key={photo.id}
                        onClick={() => setActiveTab("photos")}
                        className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-white/10 cursor-pointer group"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.image_url}
                          alt={photo.caption || "Cook photo"}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: RECIPES */}
        {activeTab === "recipes" && (
          <AdminRecipeTable
            recipes={recipes}
            totalCount={recipeTotalCount}
            page={recipePage}
            pageSize={recipePageSize}
            totalPages={recipeTotalPages}
            onPageChange={handleRecipePageChange}
            search={recipeSearch}
            onSearchChange={handleRecipeSearchChange}
            filter={recipeFilter}
            onFilterChange={handleRecipeFilterChange}
            onTogglePublic={handleToggleRecipePublic}
            onDeleteRecipe={handleDeleteRecipe}
            isActionLoading={isActionLoading}
          />
        )}

        {/* Tab Content: PHOTOS */}
        {activeTab === "photos" && (
          <AdminPhotoGallery
            photos={photos}
            onDeletePhoto={handleDeletePhoto}
            isActionLoading={isActionLoading}
          />
        )}

        {/* Tab Content: REVIEW QUEUE */}
        {activeTab === "review" && (
          <AdminReviewQueue
            items={reviewQueue}
            onDismiss={handleDismissReview}
            onTakedown={handleTakedownReview}
            onDelete={handleDeleteReview}
            isActionLoading={isActionLoading}
          />
        )}

        {/* Tab Content: USERS */}
        {activeTab === "users" && (
          <AdminUserList
            users={users}
            currentUserId={user.id}
            onUpdateRole={handleUpdateRole}
            isActionLoading={isActionLoading}
          />
        )}
      </main>
    </div>
  );
}
