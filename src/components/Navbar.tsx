"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ChefProModal from "./subscription/ChefProModal";
import ThemeToggle from "./ThemeToggle";
import { getStoredUserSettings, DEFAULT_USER_SETTINGS, type UserSettings } from "../lib/settings";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const { user, isLoading: loading, signOut, displayName, userInitial, isAdmin } = useAuth();
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    setUserSettings(getStoredUserSettings());

    const handleSettingsUpdate = () => {
      setUserSettings(getStoredUserSettings());
    };

    window.addEventListener("storage", handleSettingsUpdate);
    window.addEventListener("user_settings_updated", handleSettingsUpdate);

    return () => {
      window.removeEventListener("storage", handleSettingsUpdate);
      window.removeEventListener("user_settings_updated", handleSettingsUpdate);
    };
  }, []);

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

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isMobileMenuOpen]);

  const handleSignOut = async () => {
    await signOut();
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    window.location.href = "/";
  };

  const navLinks = [
    {
      href: "/",
      label: "Explore",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      href: "/saved",
      label: "My Cookbook",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      href: "/planner",
      label: "Weekly Planner",
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
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      href: "/saved",
      label: "My Cookbook",
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
      <nav className="print:hidden sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-2xs transition-colors duration-300 dark:border-white/[0.07] dark:bg-[#0c0a09]/90 px-4 sm:px-6 xl:px-10">
        <div className="relative mx-auto flex h-16 w-full max-w-7xl 2xl:max-w-[1820px] items-center justify-between gap-3">
          
          {/* LOGO & BRAND (LEFT) */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-90 cursor-pointer group"
              aria-label="Culineer Home"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 shadow-sm transition-transform group-hover:scale-105">
                <svg className="h-5 w-5 text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
                  <line x1="6" y1="17" x2="18" y2="17" />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[22px] font-bold text-slate-900 dark:text-stone-100 antialiased font-sans">
                  Culineer
                </span>
              </div>
            </Link>
          </div>

          {/* DESKTOP NAV LINKS */}
          <div className="hidden lg:flex items-center justify-center flex-1 min-w-0 px-2">
            <div className="flex items-center gap-6">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-xs xl:text-sm font-bold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "bg-stone-200/80 text-stone-900 shadow-sm font-bold dark:bg-white/10 dark:text-white"
                        : "text-stone-600 hover:text-stone-950 hover:bg-white/60 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-white/5 font-semibold"
                    }`}
                  >
                    <span className={`flex items-center justify-center mt-[1px] ${isActive ? "text-amber-600 dark:text-amber-500" : "text-stone-400 dark:text-stone-500"}`}>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* RIGHT UTILITIES & USER MENU */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* THEME TOGGLE */}
            <ThemeToggle />

            {/* PRO NAV BADGE (Only for logged-in Pro users) */}
            {mounted && user && userSettings.subscriptionTier === "pro" && (
              <span className="inline-flex items-center rounded-lg bg-amber-500 text-stone-950 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-xs">
                PRO
              </span>
            )}

            {/* UPGRADE PILL (Visible on xl+ screens where there's plenty of space, keeping navbar clean) */}
            {mounted && userSettings.subscriptionTier !== "pro" && (
              <button
                type="button"
                onClick={() => setIsProModalOpen(true)}
                className="hidden xl:inline-flex items-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 px-3.5 py-1.5 text-xs sm:text-sm font-bold shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <svg className="h-3.5 w-3.5 fill-stone-950 text-stone-950" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Upgrade</span>
                <span className="rounded-md bg-stone-950/20 text-stone-950 px-1.5 py-0.2 text-[10px] font-bold tracking-wide uppercase">
                  PRO
                </span>
              </button>
            )}

            {/* USER PROFILE DROPDOWN (DESKTOP) */}
            {!loading && (
              user ? (
                <div className="relative hidden md:block" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 rounded-full border border-slate-200/90 bg-white p-1 pr-3 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition cursor-pointer group dark:border-white/[0.08] dark:bg-[#151311] dark:hover:bg-[#1c1a17]"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-white font-bold text-xs dark:bg-white/10 dark:text-white shadow-xs">
                      {userInitial}
                    </div>
                    <span className="max-w-[110px] truncate text-xs font-semibold text-slate-900 dark:text-stone-200 transition-colors group-hover:text-slate-950 dark:group-hover:text-white">
                      {displayName}
                    </span>
                    <svg
                      className={`h-3 w-3 text-slate-500 transition-transform duration-200 ${
                        isDropdownOpen ? "rotate-180 text-slate-900 dark:text-amber-400" : "group-hover:text-slate-800 dark:group-hover:text-stone-200"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-stone-200 bg-white p-2 shadow-[0_12px_36px_rgba(0,0,0,0.15)] dark:border-[#332c26] dark:bg-[#181512] dark:shadow-[0_12px_36px_rgba(0,0,0,0.6)] z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="border-b border-stone-100 px-3 py-2.5 dark:border-white/8">
                        <p className="text-xs font-bold text-slate-900 dark:text-stone-100 truncate">{displayName}</p>
                        <p className="text-[11px] text-slate-500 dark:text-stone-400 truncate">{user.email}</p>
                      </div>

                      <div className="py-1 space-y-0.5">
                        <Link
                          href="/settings"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-stone-300 dark:hover:bg-white/5 transition"
                        >
                          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Account & Settings</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setIsProModalOpen(true);
                          }}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-stone-300 dark:hover:bg-white/5 transition"
                        >
                          <span className="flex items-center gap-2.5">
                            <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>Pro Status</span>
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-950 bg-amber-500 px-2 py-0.5 rounded-full shadow-xs">
                            {userSettings.subscriptionTier === "pro" ? "Active" : "Upgrade"}
                          </span>
                        </button>

                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-stone-300 dark:hover:bg-white/5 transition"
                          >
                            <span className="flex items-center gap-2.5">
                              <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                              </svg>
                              <span>Admin Console</span>
                            </span>
                            <span className="rounded-full bg-stone-100 text-stone-700 dark:bg-white/10 dark:text-stone-300 border border-stone-200 dark:border-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                              Staff
                            </span>
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-1 dark:border-white/5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            handleSignOut();
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 transition text-left cursor-pointer"
                        >
                          <svg className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-xs transition-all duration-150 active:scale-95 cursor-pointer px-5 py-2 text-xs sm:text-sm"
                  >
                    <span>Sign In</span>
                    <span className="font-bold text-xs">→</span>
                  </Link>
                </div>
              )
            )}

            {/* MOBILE HAMBURGER BUTTON (md:hidden) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-stone-100 dark:hover:bg-white/10 transition cursor-pointer shadow-2xs"
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
            className="fixed inset-0 bg-black/75 transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white dark:bg-[#16120f] border-l border-slate-200 dark:border-white/10 p-5 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              
              {/* Drawer Top / User info */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white/10 dark:text-white font-bold text-sm shadow-xs">
                    {user ? (
                      userInitial
                    ) : (
                      <svg className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-stone-100 truncate">
                      {user ? displayName : "Guest"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-stone-400 truncate">
                      {user ? user.email : "Local session"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:text-stone-400 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-stone-500 px-3 py-1">
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
                          ? "bg-stone-200/80 text-stone-900 shadow-sm font-bold dark:bg-white/10 dark:text-white"
                          : "text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-white/5 font-semibold"
                      }`}
                    >
                      <span className={isActive ? "text-amber-600 dark:text-amber-500" : "text-stone-400 dark:text-stone-500"}>
                        {link.icon}
                      </span>
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Special Shortcuts */}
              <div className="pt-2 space-y-2 border-t border-slate-200 dark:border-white/10">
                <Link
                  href="/settings"
                  className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-stone-200 dark:hover:bg-white/5 transition"
                >
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                  className="flex w-full items-center justify-between rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 px-4 py-3 text-sm font-bold shadow-xs cursor-pointer transition"
                >
                  <span className="flex items-center gap-2">
                    <span>Pro Membership</span>
                  </span>
                  <span className="text-xs uppercase tracking-wider bg-stone-950/20 text-stone-950 px-2 py-0.5 rounded-md font-bold">
                    {userSettings.subscriptionTier === "pro" ? "Active" : "Upgrade"}
                  </span>
                </button>

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 px-3.5 py-3 text-sm font-semibold text-stone-200 transition"
                  >
                    <span className="flex items-center gap-2.5">
                      <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                      </svg>
                      <span>Admin Console</span>
                    </span>
                    <span className="rounded-md bg-white/10 text-stone-300 px-2 py-0.5 text-[10px] font-bold uppercase">
                      Staff
                    </span>
                  </Link>
                )}
              </div>

            </div>

            {/* Bottom Sign In / Sign Out */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/10">
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
                <div className="w-full">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-3 text-xs sm:text-sm shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <span>Sign In</span>
                    <span className="font-bold text-xs">→</span>
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR (FIXED ON SCREEN BOTTOM FOR INSTANT 1-THUMB NAVIGATION) */}
      <div className="print:hidden md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#130f0c]/95 backdrop-blur-xl border-t border-stone-200/90 dark:border-white/10 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_25px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-1 px-3 rounded-2xl transition duration-150 cursor-pointer ${
                  isActive
                    ? "bg-stone-100 text-amber-600 dark:bg-white/10 dark:text-amber-500 font-bold"
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
