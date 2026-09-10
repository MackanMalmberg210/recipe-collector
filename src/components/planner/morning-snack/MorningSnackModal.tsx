"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import type { AppRecipe } from "../../../lib/types";
import {
  filterAndRankSnackRecipes,
  type MorningFilterId,
  type MorningSortId,
  type SnackSlot,
} from "./morningSnackFilter";
import { ModalHeader } from "./ModalHeader";
import { SearchInput } from "./SearchInput";
import { FilterChips } from "./FilterChips";
import { SortDropdown } from "./SortDropdown";
import { RecommendedSection } from "./RecommendedSection";
import { RecipeGrid } from "./RecipeGrid";
import { EmptyState } from "./EmptyState";
import { estimateSnackNutrition } from "../../../lib/snackNutrition";
import { saveQuickSnack } from "../../../lib/planner";

export interface SnackPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: AppRecipe[];
  slot?: SnackSlot;
  selectedRecipeId: number | null;
  onSelectRecipe: (recipeId: number, createdRecipe?: AppRecipe) => void;
  onClearRecipe?: () => void;
}

export type MorningSnackModalProps = SnackPickerModalProps;

export const SnackPickerModal: React.FC<SnackPickerModalProps> = ({
  isOpen,
  onClose,
  recipes,
  slot = "morning_snack",
  selectedRecipeId,
  onSelectRecipe,
  onClearRecipe,
}) => {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<MorningFilterId>("all");
  const [sortId, setSortId] = useState<MorningSortId>("recommended");
  const [showAllCookbook, setShowAllCookbook] = useState(false);
  const [isPlanningCustom, setIsPlanningCustom] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveFilter("all");
      setSortId("recommended");
      setShowAllCookbook(false);
      setIsPlanningCustom(false);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Filter & rank computation
  const { recommendedRecipes, filteredRecipes, totalAvailableCount } = useMemo(() => {
    return filterAndRankSnackRecipes({
      recipes,
      query,
      activeFilter,
      sortId,
      slot,
      showAllCookbook,
      selectedRecipeId,
    });
  }, [recipes, query, activeFilter, sortId, slot, showAllCookbook, selectedRecipeId]);

  // Show the Recommended section only when not searching and when filter is "all" or "recommended"
  const shouldShowRecommended =
    !query.trim() &&
    (activeFilter === "all" || activeFilter === "recommended") &&
    recommendedRecipes.length > 0;

  // DEDUPLICATION: Exclude recipes already shown in Recommended so they don't repeat below
  const gridRecipes = useMemo(() => {
    if (!shouldShowRecommended) return filteredRecipes;
    const recIds = new Set(recommendedRecipes.map((r) => r.id));
    return filteredRecipes.filter((r) => !recIds.has(r.id));
  }, [filteredRecipes, shouldShowRecommended, recommendedRecipes]);

  const recommendedIds = useMemo(
    () => new Set(recommendedRecipes.map((r) => r.id)),
    [recommendedRecipes],
  );

  const handlePlanCustom = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setIsPlanningCustom(true);
      const est = estimateSnackNutrition(text.trim());

      // Save exclusively as planner quick snack (never into cookbook database!)
      const quickSnack = saveQuickSnack({
        title: text.trim(),
        calories: est.calories,
        image: est.defaultImage,
        portion: est.portion,
      });

      setIsPlanningCustom(false);
      onSelectRecipe(quickSnack.id, quickSnack);
      onClose();
    },
    [onSelectRecipe, onClose],
  );

  const handleRecipeClick = useCallback(
    (recipe: AppRecipe) => {
      onSelectRecipe(recipe.id, recipe);
      onClose();
    },
    [onSelectRecipe, onClose],
  );

  const handleClearSlot = useCallback(() => {
    if (onClearRecipe) {
      onClearRecipe();
    }
    onClose();
  }, [onClearRecipe, onClose]);

  const handleBrowseCookbook = useCallback(() => {
    setShowAllCookbook(true);
    setQuery("");
    setActiveFilter("all");
  }, []);

  const handleToggleBrowseCookbook = useCallback(() => {
    setShowAllCookbook((prev) => !prev);
  }, []);

  const handleResetFilters = useCallback(() => {
    setQuery("");
    setActiveFilter("all");
    setShowAllCookbook(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const isSearchingOrFiltered = Boolean(query.trim() || activeFilter !== "all" || showAllCookbook);

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="snack-picker-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 md:p-8"
    >
      {/* Dark translucent backdrop with subtle blur */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog container */}
      <div
        ref={modalRef}
        className="relative z-10 flex flex-col w-full max-w-[1100px] h-[90vh] sm:h-auto sm:max-h-[calc(100vh-64px)] bg-[#151311] border border-[#35312D] rounded-t-[24px] sm:rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Sticky Header, Search & Filter Bar */}
        <div className="shrink-0 p-4 sm:p-6 border-b border-[#35312D] bg-[#151311]/95 backdrop-blur-md space-y-4">
          <ModalHeader
            slot={slot}
            hasSelectedRecipe={selectedRecipeId !== null}
            onClearSlot={handleClearSlot}
            onClose={onClose}
          />

          {/* Search + Controls Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search or type a custom snack..."
              className="flex-1"
            />
            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
              <SortDropdown activeSort={sortId} onSortChange={setSortId} />
            </div>
          </div>

          {/* INSTANT CUSTOM SNACK QUICK PLANNER (appears when user types anything) */}
          {/* QUICK SNACK PLANNER ACTION (Clean, dark container matching design system) */}
          {query.trim().length >= 3 && (
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-white/10 bg-[#1a1411] hover:border-amber-500/30 transition-colors shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 shrink-0 text-sm">
                  ⚡
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-stone-100 truncate">
                    Plan &ldquo;{query.trim()}&rdquo; as quick snack
                  </div>
                  <div className="text-[11px] text-stone-400">
                    Planner only • Will not be added to cookbook recipes
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={isPlanningCustom}
                onClick={() => handlePlanCustom(query.trim())}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-bold shrink-0 transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              >
                {isPlanningCustom ? "Adding..." : "+ Plan snack"}
              </button>
            </div>
          )}

          {/* Filter Chips Bar */}
          <FilterChips activeFilter={activeFilter} onFilterChange={setActiveFilter} />
        </div>

        {/* Scrollable Results Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-8">
          {filteredRecipes.length === 0 ? (
            <EmptyState
              onResetSearch={handleResetFilters}
              onBrowseAllCookbook={handleBrowseCookbook}
              isSearching={isSearchingOrFiltered}
              customQuery={query.trim()}
              onPlanCustom={query.trim() ? () => handlePlanCustom(query.trim()) : undefined}
            />
          ) : (
            <>
              {/* Top Recommended Section (Top 4 picks with culinary variety) */}
              {shouldShowRecommended && (
                <RecommendedSection
                  recipes={recommendedRecipes}
                  selectedRecipeId={selectedRecipeId}
                  slot={slot}
                  onSelectRecipe={handleRecipeClick}
                />
              )}

              {/* Main Snack Grid (Deduped from recommended items above) */}
              <RecipeGrid
                recipes={gridRecipes}
                selectedRecipeId={selectedRecipeId}
                recommendedIds={recommendedIds}
                totalAvailableCount={totalAvailableCount}
                showAllCookbook={showAllCookbook}
                slot={slot}
                onToggleBrowseCookbook={handleToggleBrowseCookbook}
                onSelectRecipe={handleRecipeClick}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export const MorningSnackModal = SnackPickerModal;
