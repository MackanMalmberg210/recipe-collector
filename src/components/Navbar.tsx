"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import ChefProModal from "./subscription/ChefProModal";
import ThemeToggle from "./ThemeToggle";
import { getStoredUserSettings, DEFAULT_USER_SETTINGS, type UserSettings } from "../lib/settings";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch {}
      setLoading(false);
    };

    getUser();
    setUserSettings(getStoredUserSettings());

    const handleSettingsUpdate = () => {
      setUserSettings(getStoredUserSettings());
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    window.addEventListener("storage", handleSettingsUpdate);
    window.addEventListener("user_settings_updated", handleSettingsUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", handleSettingsUpdate);
      window.removeEventListener("user_settings_updated", handleSettingsUpdate);
    };
  }, [supabase]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    window.location.href = "/";
  };

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Chef";
  const userInitial = displayName.charAt(0).toUpperCase();

  const navLinks = [
    {
      href: "/",
      label: "Explore",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: "/saved",
      label: "Cookbook",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      href: "/planner",
      label: "Meal Planner",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: "/groceries",
      label: "Groceries",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ];

  const bottomNavItems = [
    {
      href: "/",
      label: "Explore",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: "/saved",
      label: "Cookbook",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      href: "/planner",
      label: "Planner",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: "/groceries",
      label: "Groceries",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      href: "/settings",
      label: "Settings",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* TOP DESKTOP & MOBILE HEADER */}
      <nav className="sticky top-0 z-40 w-full border-b border-stone-300/90 bg-white/95 backdrop-blur-xl shadow-xs transition-colors duration-300 dark:border-white/12 dark:bg-[#130f0c]/95">
        <div className="mx-auto flex h-16 w-full max-w-7xl 2xl:max-w-[1820px] items-center justify-between px-3 sm:px-6 xl:px-10">
          
          {/* LOGO & BRAND */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-90 cursor-pointer"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-stone-950 shadow-md shadow-amber-500/25">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V20H6v-6.13z" />
                  <line x1="6" y1="17" x2="18" y2="17" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-bold leading-tight tracking-tight text-stone-900 dark:text-stone-100">
                  Recipe Collector
                </span>
                <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Culinary Studio
                </span>
              </div>
            </Link>

            {/* DESKTOP NAV LINKS (md and up) */}
            <div className="hidden md:flex md:items-center md:gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                      isActive
                        ? "bg-stone-900 text-white shadow-xs dark:bg-white/10 dark:text-amber-300"
                        : "text-stone-600 hover:bg-stone-100 hover:text-stone-950 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-100"
                    }`}
                  >
                    <span className={isActive ? "text-amber-400" : ""}>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* RIGHT UTILITIES & USER MENU */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* THEME TOGGLE */}
            <ThemeToggle />

            {/* CHEF PRO NAV BADGE */}
            {mounted && userSettings.subscriptionTier === "pro" ? (
              <span className="inline-flex items-center gap-1 rounded-xl bg-amber-400/20 px-2 py-1 text-[10px] sm:text-[11px] font-black uppercase text-amber-400 border border-amber-400/30">
                👑 PRO
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setIsProModalOpen(true)}
                className="inline-flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-black shadow-xs transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <span>👑</span>
                <span className="hidden xs:inline">Pro</span>
              </button>
            )}

            {/* USER PROFILE DROPDOWN (DESKTOP) */}
            {!loading && user ? (
              <div className="relative hidden md:block" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 p-1.5 pr-2.5 transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 cursor-pointer group"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-400 font-bold text-xs text-stone-950 shadow-xs">
                    {userInitial}
                  </div>
                  <span className="max-w-[110px] truncate text-xs font-bold text-stone-900 dark:text-stone-200 transition-colors group-hover:text-amber-700 dark:group-hover:text-amber-300">
                    {displayName}
                  </span>
                  <svg
                    className={`h-3 w-3 text-stone-500 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180 text-amber-600 dark:text-amber-400" : "group-hover:text-stone-800 dark:group-hover:text-stone-200"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 origin-top-right rounded-2xl border border-stone-200 bg-white p-1.5 shadow-2xl ring-1 ring-black/5 transition-all z-50 dark:border-white/12 dark:bg-[#171412] dark:ring-black/50">
                    <div className="px-3 py-2.5 border-b border-stone-100 dark:border-white/5">
                      <p className="text-xs font-black text-stone-900 dark:text-stone-100 truncate">
                        {displayName}
                      </p>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/settings"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100 hover:text-stone-950 dark:text-stone-300 dark:hover:bg-white/5 dark:hover:text-white transition"
                      >
                        <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Account & Settings</span>
                      </Link>

                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 transition cursor-pointer"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-1.5 text-xs font-bold text-stone-50 shadow-md transition hover:bg-stone-800 dark:bg-gradient-to-r dark:from-amber-500 dark:to-amber-600 dark:text-stone-950 cursor-pointer"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign In</span>
                </Link>
              </div>
            )}

            {/* MOBILE HAMBURGER BUTTON (md:hidden) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-stone-100 text-stone-900 hover:bg-stone-200 dark:border-white/10 dark:bg-white/5 dark:text-stone-100 dark:hover:bg-white/10 transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

          </div>

        </div>
      </nav>

      {/* MOBILE FULL-SCREEN SLIDE-OVER DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white dark:bg-[#16120f] border-l border-stone-200 dark:border-white/10 p-5 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              
              {/* Drawer Top / User info */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-stone-950 font-black text-sm shadow-md shadow-amber-500/25">
                    {user ? userInitial : "🍳"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                      {user ? displayName : "Guest Chef"}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                      {user ? user.email : "Local session"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100 dark:bg-white/5 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-500 px-3 py-1">
                  Menu Navigation
                </p>

                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold transition ${
                        isActive
                          ? "bg-amber-500 text-stone-950 font-black shadow-md shadow-amber-400/20"
                          : "text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-white/5"
                      }`}
                    >
                      <span className={isActive ? "text-stone-950" : "text-amber-500"}>
                        {link.icon}
                      </span>
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Special Shortcuts */}
              <div className="pt-2 space-y-2 border-t border-stone-200 dark:border-white/10">
                <Link
                  href="/settings"
                  className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-white/5 transition"
                >
                  <svg className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Account & Settings</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsProModalOpen(true);
                  }}
                  className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-black text-stone-950 shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span>👑</span>
                    <span>Chef Pro VIP</span>
                  </span>
                  <span className="text-xs uppercase tracking-wider bg-stone-950 text-amber-300 px-2 py-0.5 rounded-md">
                    {userSettings.subscriptionTier === "pro" ? "Active" : "Upgrade"}
                  </span>
                </button>
              </div>

            </div>

            {/* Bottom Sign In / Sign Out */}
            <div className="pt-4 border-t border-stone-200 dark:border-white/10">
              {user ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 py-3 text-xs font-bold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-3 text-xs font-bold text-stone-50 dark:bg-amber-400 dark:text-stone-950 shadow-md"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign In to Account</span>
                </Link>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR (FIXED ON SCREEN BOTTOM FOR INSTANT 1-THUMB NAVIGATION) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#130f0c]/95 backdrop-blur-xl border-t border-stone-200/90 dark:border-white/10 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_25px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition duration-150 cursor-pointer ${
                  isActive
                    ? "text-amber-600 dark:text-amber-400 font-bold"
                    : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
                }`}
              >
                <div className="p-0.5">
                  {item.icon}
                </div>
                <span className="text-[10px] font-medium leading-none mt-1">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <ChefProModal
        isOpen={isProModalOpen}
        onClose={() => {
          setIsProModalOpen(false);
          setUserSettings(getStoredUserSettings());
        }}
      />
    </>
  );
}
