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
    <header className="relative z-50 rounded-3xl border border-white/10 bg-[#16120f] p-5 sm:p-7 shadow-2xl space-y-6">
      
      {/* TOP ROW: TITLE & MASTER DUAL MODE SWITCHER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        
        {/* ACTIVE TITLE & RENAME */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
            <svg className="h-3.5 w-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {activeTab === "shopping_list" ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              )}
            </svg>
            <span>{activeTab === "shopping_list" ? "Smart Grocery List" : "Kitchen Inventory"}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#fff8ef]">
              {activeTitle}
            </h1>

            {activeTab === "shopping_list" && activeListId !== "main" && (
              <button
                type="button"
                onClick={onOpenRenameListModal}
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-stone-300 hover:bg-white/10 hover:text-amber-300 transition cursor-pointer"
                title="Rename this custom list"
              >
                <span>✏️</span>
                <span className="hidden sm:inline">Rename</span>
              </button>
            )}
          </div>

          <p className="text-xs sm:text-sm text-stone-400">
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
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 border border-amber-600/60 dark:border-amber-600/50 px-4 py-2 text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <svg className="h-4 w-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V20H6v-6.13zM6 17h12" />
            </svg>
            <span>Pantry Matcher</span>
          </button>

          {/* DUAL MODE SWITCHER */}
          <div className="flex items-center rounded-2xl border border-white/10 bg-stone-950/80 p-1 shadow-inner">
            <button
              type="button"
              onClick={() => onTabChange("shopping_list")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm transition cursor-pointer ${
                activeTab === "shopping_list"
                  ? "bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 font-bold border border-amber-600/60 dark:border-amber-600/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)]"
                  : "text-stone-400 hover:text-stone-100 border border-transparent font-medium"
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
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm transition cursor-pointer ${
                activeTab === "pantry"
                  ? "bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 font-bold border border-amber-600/60 dark:border-amber-600/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)]"
                  : "text-stone-400 hover:text-stone-100 border border-transparent font-medium"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/8">
        
        {/* LEFT: SCALABLE LIST SELECTOR DROPDOWN (Supports 1 to 50+ lists cleanly) */}
        {activeTab === "shopping_list" ? (
          <div className="relative" ref={listMenuRef}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider select-none">
                List:
              </span>

              {/* LIST SELECTOR BUTTON */}
              <button
                type="button"
                onClick={() => setIsListMenuOpen(!isListMenuOpen)}
                className="flex items-center gap-2.5 rounded-2xl border border-amber-500/30 bg-[#1d1612] px-3.5 py-2 text-xs sm:text-sm font-bold text-amber-300 hover:border-amber-400/50 hover:bg-[#241a15] transition cursor-pointer shadow-sm"
              >
                {activeListId === "main" ? (
                  <svg className="h-4 w-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                )}
                <span className="max-w-[180px] sm:max-w-[260px] truncate">
                  {activeCustomList ? activeCustomList.name : "Main Shopping List"}
                </span>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.2 text-[10px] font-mono font-bold text-amber-300">
                  {activeListId === "main" ? mainListCount : activeCustomList?.items.length || 0}
                </span>
                <span className="text-[10px] text-stone-400 ml-0.5">▼</span>
              </button>

              {/* NEW LIST BUTTON */}
              <button
                type="button"
                onClick={onOpenNewListModal}
                className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-white/20 bg-white/3 hover:bg-white/8 px-3 py-2 text-xs font-semibold text-stone-300 hover:border-amber-400 hover:text-amber-300 transition cursor-pointer"
                title="Create a new custom grocery list"
              >
                <span>+</span>
                <span>New List</span>
              </button>
            </div>

            {/* LIST SELECTOR POPOVER (Handles 20+ lists with scroll & search) */}
            {isListMenuOpen && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-72 sm:w-80 rounded-2xl border border-amber-500/30 bg-[#1a1411] p-2.5 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 space-y-2">
                
                {/* SEARCH LISTS (If > 3 custom lists) */}
                {customLists.length > 3 && (
                  <input
                    type="text"
                    value={listSearchQuery}
                    onChange={(e) => setListSearchQuery(e.target.value)}
                    placeholder="Search lists..."
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-stone-100 placeholder-stone-500 focus:border-amber-400 focus:outline-none"
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
                        ? "bg-amber-500 text-stone-950 font-black shadow-xs"
                        : "text-stone-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <svg className={`h-4 w-4 shrink-0 ${activeListId === "main" ? "text-stone-950" : "text-amber-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="truncate">Main Shopping List</span>
                    </div>
                    <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                      activeListId === "main" ? "bg-stone-950/20 text-stone-950 font-black" : "bg-white/10 text-stone-400"
                    }`}>
                      {mainListCount}
                    </span>
                  </button>

                  {/* CUSTOM LIST ITEMS */}
                  {filteredCustomLists.map((list) => {
                    const isActive = activeListId === list.id;
                    return (
                      <button
                        key={list.id}
                        type="button"
                        onClick={() => {
                          onListIdChange(list.id);
                          setIsListMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-bold transition text-left cursor-pointer ${
                          isActive
                            ? "bg-amber-500 text-stone-950 font-black shadow-xs"
                            : "text-stone-300 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <svg className={`h-4 w-4 shrink-0 ${isActive ? "text-stone-950" : "text-stone-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                          <span className="truncate">{list.name}</span>
                        </div>
                        <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                          isActive ? "bg-stone-950/20 text-stone-950 font-black" : "bg-white/10 text-stone-400"
                        }`}>
                          {list.items.length}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-white/8">
                  <button
                    type="button"
                    onClick={() => {
                      setIsListMenuOpen(false);
                      onOpenNewListModal();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-white/5 hover:bg-amber-500 hover:text-stone-950 py-2 text-xs font-bold text-amber-300 transition cursor-pointer"
                  >
                    <span>+</span>
                    <span>Create New List</span>
                  </button>
                </div>

              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-stone-400 font-medium">
            <span>Keep your household inventory updated to discover what you can cook.</span>
          </div>
        )}

        {/* RIGHT: CLEAN COMPACT TOOLBAR */}
        {activeTab === "shopping_list" && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            
            {/* AISLE / FLAT VIEW SWITCH */}
            <div className="flex items-center h-9 rounded-xl border border-white/10 bg-stone-950/80 p-0.5">
              <button
                type="button"
                onClick={() => onToggleGroupByAisle(true)}
                className={`h-full px-3 rounded-lg text-xs transition cursor-pointer flex items-center ${
                  groupByAisle
                    ? "bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 font-bold border border-amber-600/60 dark:border-amber-600/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)]"
                    : "text-stone-400 hover:text-stone-200 border border-transparent font-medium"
                }`}
                title="Group by supermarket aisles"
              >
                Aisles
              </button>
              <button
                type="button"
                onClick={() => onToggleGroupByAisle(false)}
                className={`h-full px-3 rounded-lg text-xs transition cursor-pointer flex items-center ${
                  !groupByAisle
                    ? "bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 font-bold border border-amber-600/60 dark:border-amber-600/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)]"
                    : "text-stone-400 hover:text-stone-200 border border-transparent font-medium"
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
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-stone-200 transition cursor-pointer"
              title="Scan handwritten shopping note or printed list with camera"
            >
              <svg className="h-4 w-4 text-stone-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isCopied
                    ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-300 scale-105 shadow-sm shadow-emerald-500/20"
                    : "border-white/10 bg-white/5 text-stone-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {isCopied ? (
                  <>
                    <svg className="h-4 w-4 text-emerald-400 animate-in zoom-in-50 duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-emerald-300 font-extrabold text-[11px]">Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="hidden sm:inline text-stone-300 text-[11px]">Copy</span>
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
                className="h-8.5 w-8.5 flex items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}

            {/* DELETE CUSTOM LIST BUTTON */}
            {activeListId !== "main" && (
              <button
                type="button"
                onClick={onDeleteCustomList}
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
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
