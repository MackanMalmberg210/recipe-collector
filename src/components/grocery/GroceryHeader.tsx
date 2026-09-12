"use client";

import { useState, useRef, useEffect } from "react";
import type { GroceryListCollection } from "../../lib/groceries";

type GroceryHeaderProps = {
  activeTab: "shopping_list" | "pantry";
  onTabChange: (tab: "shopping_list" | "pantry") => void;
  activeListId: string;
  onListIdChange: (listId: string) => void;
  mainListCount: number;
  customLists: GroceryListCollection[];
  onOpenNewListModal: () => void;
  onOpenRenameListModal: () => void;
  onDeleteCustomList: () => void;
  remainingCount: number;
  boughtCount: number;
  pantryInStockCount: number;
  onOpenVisionModal: () => void;
  onOpenCookWhatIHave: () => void;
  onCopyList: () => void;
  onClearAll: () => void;
  groupByAisle: boolean;
  onToggleGroupByAisle: (val: boolean) => void;
};

export default function GroceryHeader({
  activeTab,
  onTabChange,
  activeListId,
  onListIdChange,
  mainListCount,
  customLists,
  onOpenNewListModal,
  onOpenRenameListModal,
  onDeleteCustomList,
  remainingCount,
  boughtCount,
  pantryInStockCount,
  onOpenVisionModal,
  onOpenCookWhatIHave,
  onCopyList,
  onClearAll,
  groupByAisle,
  onToggleGroupByAisle,
}: GroceryHeaderProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isListMenuOpen, setIsListMenuOpen] = useState(false);
  const [listSearchQuery, setListSearchQuery] = useState("");
  const listMenuRef = useRef<HTMLDivElement | null>(null);

  const activeCustomList = customLists.find((l) => l.id === activeListId);
  const activeTitle = activeTab === "pantry" ? "My Pantry & Fridge" : activeCustomList ? activeCustomList.name : "Main Shopping List";
  const totalItems = remainingCount + boughtCount;
  const progressPercent = totalItems > 0 ? Math.round((boughtCount / totalItems) * 100) : 0;

  // Close list selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (listMenuRef.current && !listMenuRef.current.contains(e.target as Node)) {
        setIsListMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyClick = () => {
    onCopyList();
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const filteredCustomLists = listSearchQuery.trim()
    ? customLists.filter((l) =>
        l.name.toLowerCase().includes(listSearchQuery.toLowerCase().trim())
      )
    : customLists;

  return (
    <header className="relative z-50 rounded-[32px] border border-slate-200/90 bg-white dark:border-white/10 dark:bg-[#121212] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
      
      {/* TOP ROW: TITLE & MASTER DUAL MODE SWITCHER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        
        {/* ACTIVE TITLE & RENAME */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-stone-300">
            <svg className="h-3.5 w-3.5 text-slate-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {activeTab === "shopping_list" ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              )}
            </svg>
            <span>{activeTab === "shopping_list" ? "Smart Grocery List" : "Kitchen Inventory"}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              {activeTitle}
            </h1>

            {activeTab === "shopping_list" && activeListId !== "main" && (
              <button
                type="button"
                onClick={onOpenRenameListModal}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white transition cursor-pointer"
                title="Rename this custom list"
              >
                <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="hidden sm:inline">Rename</span>
              </button>
            )}
          </div>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-stone-400">
            {activeTab === "shopping_list"
              ? `${remainingCount} items left to buy ${boughtCount > 0 ? `• ${boughtCount} checked off (${progressPercent}%)` : ""}`
              : `${pantryInStockCount} kitchen staples in stock • Used for instant recipe matching`}
          </p>
        </div>

        {/* TOP CONTROLS & DUAL MODE SWITCHER */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* PANTRY MATCHER HERO CTA */}
          <button
            type="button"
            onClick={onOpenCookWhatIHave}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white dark:hover:bg-slate-100 px-5 py-2.5 text-xs sm:text-sm font-bold shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <svg className="h-4 w-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V20H6v-6.13zM6 17h12" />
            </svg>
            <span>Pantry Matcher</span>
          </button>

          {/* DUAL MODE SWITCHER */}
          <div className="flex items-center rounded-full border border-slate-200/80 bg-slate-100/90 p-1 dark:border-white/10 dark:bg-white/5 shadow-xs">
            <button
              type="button"
              onClick={() => onTabChange("shopping_list")}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm transition cursor-pointer ${
                activeTab === "shopping_list"
                  ? "bg-slate-900 text-white font-bold shadow-sm dark:bg-white dark:text-slate-950"
                  : "text-slate-600 hover:text-slate-900 dark:text-stone-400 dark:hover:text-white font-semibold"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Lists</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange("pantry")}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm transition cursor-pointer ${
                activeTab === "pantry"
                  ? "bg-slate-900 text-white font-bold shadow-sm dark:bg-white dark:text-slate-950"
                  : "text-slate-600 hover:text-slate-900 dark:text-stone-400 dark:hover:text-white font-semibold"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Pantry</span>
            </button>
          </div>

        </div>

      </div>

      {/* BOTTOM ROW: SCALABLE LIST SELECTOR & UNIFIED ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-white/8">
        
        {/* LEFT: SCALABLE LIST SELECTOR DROPDOWN (Supports 1 to 50+ lists cleanly) */}
        {activeTab === "shopping_list" ? (
          <div className="relative" ref={listMenuRef}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider select-none">
                List:
              </span>

              {/* LIST SELECTOR BUTTON */}
              <button
                type="button"
                onClick={() => setIsListMenuOpen(!isListMenuOpen)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 px-4 py-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-stone-100 transition cursor-pointer shadow-xs"
              >
                {activeListId === "main" ? (
                  <svg className="h-4 w-4 text-slate-900 dark:text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 text-slate-900 dark:text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                )}
                <span className="max-w-[180px] sm:max-w-[260px] truncate">
                  {activeCustomList ? activeCustomList.name : "Main Shopping List"}
                </span>
                <span className="rounded-full bg-slate-200 dark:bg-white/10 px-2 py-0.2 text-[10px] font-mono font-bold text-slate-800 dark:text-white">
                  {activeListId === "main" ? mainListCount : activeCustomList?.items.length || 0}
                </span>
                <span className="text-[10px] text-slate-400 ml-0.5">▼</span>
              </button>

              {/* NEW LIST BUTTON */}
              <button
                type="button"
                onClick={onOpenNewListModal}
                className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 dark:border-white/20 dark:bg-white/3 dark:hover:bg-white/8 px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-slate-400 hover:text-slate-900 dark:text-stone-300 dark:hover:border-white/40 dark:hover:text-white transition cursor-pointer"
                title="Create a new custom grocery list"
              >
                <span>+</span>
                <span>New List</span>
              </button>
            </div>

            {/* LIST SELECTOR POPOVER (Handles 20+ lists with scroll & search) */}
            {isListMenuOpen && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-72 sm:w-80 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl dark:border-amber-500/30 dark:bg-[#1a1411] dark:shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 space-y-2">
                
                {/* SEARCH LISTS (If > 3 custom lists) */}
                {customLists.length > 3 && (
                  <input
                    type="text"
                    value={listSearchQuery}
                    onChange={(e) => setListSearchQuery(e.target.value)}
                    placeholder="Search lists..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 dark:border-white/10 dark:bg-black/50 dark:text-stone-100 dark:placeholder-stone-500 focus:border-slate-900 focus:outline-none"
                  />
                )}

                <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                  {/* MAIN LIST ITEM */}
                  <button
                    type="button"
                    onClick={() => {
                      onListIdChange("main");
                      setIsListMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-bold transition text-left cursor-pointer ${
                      activeListId === "main"
                        ? "bg-slate-900 text-white font-bold shadow-xs dark:bg-amber-500 dark:text-stone-950"
                        : "text-slate-700 hover:bg-slate-100 dark:text-stone-300 dark:hover:bg-white/5 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <svg className={`h-4 w-4 shrink-0 ${activeListId === "main" ? "text-white dark:text-stone-950" : "text-slate-600 dark:text-amber-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="truncate">Main Shopping List</span>
                    </div>
                    <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                      activeListId === "main" ? "bg-white/20 text-white font-bold dark:bg-stone-950/20 dark:text-stone-950" : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-stone-400"
                    }`}>
                      {mainListCount}
                    </span>
                  </button>

                  {/* CUSTOM LISTS */}
                  {filteredCustomLists.map((list) => {
                    const isSelected = activeListId === list.id;
                    return (
                      <div
                        key={list.id}
                        className={`group flex items-center justify-between rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                          isSelected ? "bg-slate-900 text-white font-bold dark:bg-amber-500 dark:text-stone-950" : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-stone-300"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onListIdChange(list.id);
                            setIsListMenuOpen(false);
                          }}
                          className="flex-1 flex items-center gap-2 truncate text-left cursor-pointer py-1"
                        >
                          <svg className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-white dark:text-stone-950" : "text-slate-600 dark:text-amber-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <span className="truncate">{list.name}</span>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                            isSelected ? "bg-white/20 text-white font-bold dark:bg-stone-950/20 dark:text-stone-950" : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-stone-400"
                          }`}>
                            {list.items.length}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-stone-400 font-medium">
            <span>Keep your household inventory updated to discover what you can cook.</span>
          </div>
        )}

        {/* RIGHT: CLEAN COMPACT TOOLBAR */}
        {activeTab === "shopping_list" && (
          <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
            
            {/* AISLE / FLAT VIEW SWITCH */}
            <div className="flex items-center rounded-full border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/5 p-1 shadow-xs">
              <button
                type="button"
                onClick={() => onToggleGroupByAisle(true)}
                className={`px-3.5 py-1.5 rounded-full text-xs transition cursor-pointer flex items-center ${
                  groupByAisle
                    ? "bg-slate-900 text-white font-bold shadow-sm dark:bg-white dark:text-slate-950"
                    : "text-slate-600 hover:text-slate-900 dark:text-stone-400 dark:hover:text-white font-semibold"
                }`}
                title="Group by supermarket aisles"
              >
                Aisles
              </button>
              <button
                type="button"
                onClick={() => onToggleGroupByAisle(false)}
                className={`px-3.5 py-1.5 rounded-full text-xs transition cursor-pointer flex items-center ${
                  !groupByAisle
                    ? "bg-slate-900 text-white font-bold shadow-sm dark:bg-white dark:text-slate-950"
                    : "text-slate-600 hover:text-slate-900 dark:text-stone-400 dark:hover:text-white font-semibold"
                }`}
                title="Simple flat list"
              >
                Flat
              </button>
            </div>

            {/* CAMERA OCR SCAN BUTTON */}
            <button
              type="button"
              onClick={onOpenVisionModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold text-slate-800 dark:text-stone-200 transition cursor-pointer shadow-xs"
              title="Scan handwritten shopping note or printed list with camera"
            >
              <svg className="h-4 w-4 text-slate-700 dark:text-stone-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">Scan</span>
            </button>

            {/* COPY TO CLIPBOARD BUTTON WITH ANIMATED FEEDBACK */}
            {(remainingCount > 0 || boughtCount > 0) && (
              <button
                type="button"
                onClick={handleCopyClick}
                aria-label="Copy list to clipboard"
                title="Copy formatted grocery list to clipboard"
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isCopied
                    ? "border-emerald-600 bg-emerald-600 text-white scale-105 shadow-sm"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white shadow-xs"
                }`}
              >
                {isCopied ? (
                  <>
                    <svg className="h-4 w-4 text-white animate-in zoom-in-50 duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white font-extrabold text-[11px]">Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 text-slate-600 dark:text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="hidden sm:inline text-slate-700 dark:text-stone-300 text-[11px]">Copy</span>
                  </>
                )}
              </button>
            )}

            {/* CLEAR ALL ACTION */}
            {(remainingCount > 0 || boughtCount > 0) && (
              <button
                type="button"
                onClick={onClearAll}
                aria-label="Clear list"
                title="Clear all items from list"
                className="h-9 w-9 flex items-center justify-center rounded-full border border-rose-300 bg-rose-100/90 text-rose-800 hover:bg-rose-600 hover:border-rose-600 hover:text-white dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <svg className="h-4 w-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}

            {/* DELETE CUSTOM LIST BUTTON */}
            {activeListId !== "main" && (
              <button
                type="button"
                onClick={onDeleteCustomList}
                className="rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
              >
                Delete
              </button>
            )}

          </div>
        )}

      </div>

    </header>
  );
}
