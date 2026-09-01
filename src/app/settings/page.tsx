"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { useToast } from "../../components/ui/ToastProvider";
import ConfirmModal from "../../components/ui/ConfirmModal";
import AuthModal from "../../components/auth/AuthModal";
import ChefProModal from "../../components/subscription/ChefProModal";
import {
  getStoredUserSettings,
  saveUserSettings,
  type UserSettings,
  type DietaryPreference,
} from "../../lib/settings";
import type { User } from "@supabase/supabase-js";

const DIETARY_OPTIONS: { id: DietaryPreference; label: string; icon: string; desc: string }[] = [
  { id: "vegetarian", label: "Vegetarian", icon: "🌱", desc: "No meat or poultry" },
  { id: "vegan", label: "Vegan", icon: "🌿", desc: "100% plant-based, no dairy/eggs" },
  { id: "gluten_free", label: "Gluten-Free", icon: "🌾", desc: "Wheat & gluten free" },
  { id: "dairy_free", label: "Dairy-Free", icon: "🥛", desc: "Lactose & dairy free" },
  { id: "nut_free", label: "Nut-Free", icon: "🥜", desc: "No peanuts or tree nuts" },
  { id: "high_protein", label: "High Protein", icon: "🥩", desc: "Focus on protein-rich meals" },
  { id: "low_carb", label: "Low Carb / Keto", icon: "🥑", desc: "Low sugar & low carbs" },
  { id: "pescatarian", label: "Pescatarian", icon: "🐟", desc: "Fish & seafood allowed" },
];

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusParam = searchParams.get("focus");
  const { success, error, info } = useToast();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(getStoredUserSettings());
  const [hasHydrated, setHasHydrated] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<"dark" | "light">("dark");
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);

  // Modals & triggers
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<"login" | "signup">("login");
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  
  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState("");

  // Cooking defaults
  const [keepScreenAwake, setKeepScreenAwake] = useState(true);
  const [timerSound, setTimerSound] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        setDisplayName(user.user_metadata?.display_name || user.email?.split("@")[0] || "");
      }
    };

    fetchUser();
    setSettings(getStoredUserSettings());

    // Load theme
    const isLight = document.documentElement.classList.contains("light");
    setCurrentTheme(isLight ? "light" : "dark");
    setHasHydrated(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setDisplayName(session.user.user_metadata?.display_name || session.user.email?.split("@")[0] || "");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Smooth scroll down from top + glowing pulsating highlight animation
  useEffect(() => {
    const targetId = focusParam || (typeof window !== "undefined" ? window.location.hash.replace("#", "") : null);
    if (!targetId) return;

    // 1. Instantly reset scroll to top so user sees the page header first
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    // 2. Wait 350ms, then smoothly glide down to the target card
    const timer = setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedSection(targetId);

        // 3. Clear pulsating glow after 3.5 seconds
        setTimeout(() => {
          setHighlightedSection((curr) => (curr === targetId ? null : curr));
        }, 3500);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [focusParam]);

  const getHighlightClass = (sectionId: string) => {
    if (highlightedSection === sectionId) {
      return "ring-4 ring-amber-400 ring-offset-4 ring-offset-[#f7f4ed] dark:ring-offset-[#110d0b] shadow-[0_0_50px_rgba(251,191,36,0.5)] scale-[1.01] animate-pulse duration-500";
    }
    return "transition-all duration-300";
  };

  // Theme switch handler
  const handleThemeChange = (theme: "dark" | "light") => {
    setCurrentTheme(theme);
    localStorage.setItem("recipe_theme", theme);
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
  };

  // Quietly update settings with smooth auto-save badge
  const updateSettings = (partial: Partial<UserSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    saveUserSettings(updated);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1800);
  };

  const toggleDietaryPreference = (pref: DietaryPreference) => {
    const exists = settings.dietaryPreferences.includes(pref);
    const updated = exists
      ? settings.dietaryPreferences.filter((p) => p !== pref)
      : [...settings.dietaryPreferences, pref];
    updateSettings({ dietaryPreferences: updated });
  };

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) return;
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { display_name: displayName.trim() },
      });
      if (updateError) throw updateError;
      setIsEditingName(false);
      success("Profile name updated.");
    } catch {
      error("Failed to update profile name.");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      error("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      error("Passwords do not match.");
      return;
    }

    setPasswordChangeLoading(true);
    try {
      const { error: pwdError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (pwdError) throw pwdError;

      setPasswordSuccessMessage("Password changed successfully.");
      setNewPassword("");
      setConfirmNewPassword("");
      success("Password updated.");
    } catch (err: any) {
      error(err?.message || "Failed to update password.");
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setDisplayName("");
      success("Signed out successfully.");
    } catch {
      error("Failed to sign out.");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      setIsDeleteAccountModalOpen(false);
      setUser(null);
      info("Account data deleted.");
      router.push("/");
    } catch {
      error("Failed to delete account.");
    }
  };

  const shownName = displayName || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Guest Chef";

  return (
    <main className="min-h-screen bg-[#f7f4ed] text-[#1f1b18] transition-colors duration-300 dark:bg-[#110d0b] dark:text-stone-100 px-4 py-8 sm:px-6 xl:px-10">
      <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1820px] space-y-8">
        
        {/* TOP HEADER WITH AUTO-SAVE BADGE */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e2dcd0] dark:border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Account &amp; Culinary Preferences</span>
            </div>
            <h1 className="mt-1.5 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1c1815] dark:text-[#fff8ef]">
              Profile &amp; Settings
            </h1>
            <p className="text-sm font-medium text-[#5c534a] dark:text-stone-300 mt-1">
              Personalize your cooking experience, measurement units, dietary filters, and membership.
            </p>
          </div>

          {/* VISUAL AUTO-SAVE BADGE */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold transition-all duration-300 ${
              justSaved
                ? "border-emerald-600/30 bg-emerald-100/80 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300 scale-105"
                : "border-[#dbd4c5] bg-white text-[#4a4239] shadow-xs dark:border-white/10 dark:bg-white/5 dark:text-stone-300"
            }`}>
              <span className={`h-2 w-2 rounded-full ${justSaved ? "bg-emerald-600 animate-ping" : "bg-[#8c8275] dark:bg-stone-500"}`} />
              <span>{justSaved ? "Changes Saved ✓" : "Auto-saving enabled"}</span>
            </span>
          </div>
        </header>

        {/* RESPONSIVE LAYOUT: 1-Column on Split-screen (< xl:), 2-Columns on Ultrawide & Large Desktop (>= xl:) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: IDENTITY & VIP MEMBERSHIP (xl:col-span-5 2xl:col-span-4) */}
          <div className="xl:col-span-5 2xl:col-span-4 space-y-6 xl:sticky xl:top-24">
            
            {/* CLEAN CHEF IDENTITY CARD */}
            <section
              id="account"
              className={`rounded-3xl border border-[#e4ded2] bg-white p-6 sm:p-7 shadow-[0_4px_24px_rgba(40,30,20,0.04)] dark:border-white/10 dark:bg-[#16120f] dark:shadow-none space-y-6 ${getHighlightClass("account")}`}
            >
              
              {/* TOP HEADER */}
              <div className="flex items-center justify-between border-b border-[#eee8dc] dark:border-white/8 pb-4">
                <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Chef Identity &amp; Studio
                </span>
                <span className={`rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-wider ${
                  settings.subscriptionTier === "pro"
                    ? "bg-amber-500 text-stone-950"
                    : "bg-[#f2ece0] text-[#3d362e] dark:bg-white/10 dark:text-stone-200"
                }`}>
                  {settings.subscriptionTier === "pro" ? "👑 Chef Pro" : "Free Plan"}
                </span>
              </div>

              {/* AVATAR + NAME + EMAIL */}
              <div className="flex items-center gap-4">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 text-2xl font-black shrink-0 shadow-md shadow-amber-500/25">
                  {user ? (
                    shownName.charAt(0).toUpperCase()
                  ) : (
                    <svg className="h-8 w-8 text-stone-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                  {settings.subscriptionTier === "pro" && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-300 text-[10px] shadow-sm">
                      👑
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-[#1c1815] dark:text-[#fff8ef] truncate">
                      {shownName}
                    </h2>
                    {user && (
                      <button
                        type="button"
                        onClick={() => setIsEditingName(!isEditingName)}
                        className="flex h-7 w-7 items-center justify-center rounded-xl border border-[#d8d0c2] text-[#6e6356] hover:text-amber-700 hover:border-amber-500 dark:border-white/10 dark:text-stone-400 dark:hover:text-amber-300 transition cursor-pointer"
                        title="Edit name"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="text-xs font-medium text-[#6e6356] dark:text-stone-400 truncate mt-0.5">
                    {user ? user.email : "Guest session (saved locally)"}
                  </p>
                </div>
              </div>

              {/* EDIT NAME FORM */}
              {isEditingName && (
                <div className="flex flex-col gap-2 pt-2 border-t border-[#eee8dc] dark:border-white/5">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-xl border border-amber-500 bg-[#faf7f2] px-3.5 py-2 text-sm font-bold text-[#1c1815] dark:border-white/10 dark:bg-[#201813] dark:text-[#fff8ef] focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveDisplayName}
                      className="rounded-xl bg-amber-500 px-4 py-1.5 text-xs font-black text-stone-950 hover:bg-amber-600 transition cursor-pointer"
                    >
                      Save Name
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="rounded-xl border border-[#d8d0c2] px-3 py-1.5 text-xs font-bold text-[#5c534a] hover:text-[#1c1815] dark:border-white/10 dark:text-stone-400 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="space-y-2.5 pt-2 border-t border-[#eee8dc] dark:border-white/5">
                {user ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingPassword(!isChangingPassword);
                        setPasswordSuccessMessage("");
                      }}
                      className="w-full group flex items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-stone-100 hover:bg-amber-400 hover:border-amber-500 hover:text-stone-950 py-2.5 px-4 text-xs font-bold text-stone-900 dark:border-white/12 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-amber-400/20 dark:hover:border-amber-400/50 dark:hover:text-amber-300 transition-all duration-200 hover:shadow-md hover:shadow-amber-400/15 active:scale-[0.99] cursor-pointer"
                    >
                      <svg className="h-4 w-4 text-stone-600 group-hover:text-stone-950 dark:text-stone-400 dark:group-hover:text-amber-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>{isChangingPassword ? "Close Password Form" : "Change Password"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full group flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/70 hover:bg-rose-500 hover:border-rose-500 hover:text-white py-2.5 px-4 text-xs font-bold text-rose-800 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500 dark:hover:border-rose-500 dark:hover:text-white transition-all duration-200 hover:shadow-sm hover:shadow-rose-500/20 active:scale-[0.99] cursor-pointer"
                    >
                      <svg className="h-4 w-4 text-rose-700 group-hover:text-white dark:text-rose-400 dark:group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/login"
                      className="w-full rounded-2xl bg-amber-500 py-3 text-xs sm:text-sm font-black text-stone-950 hover:bg-amber-600 transition shadow-md shadow-amber-400/20 cursor-pointer text-center block"
                    >
                      Sign In to Account
                    </Link>
                    <Link
                      href="/login?mode=signup"
                      className="w-full rounded-2xl border border-[#d8d0c2] bg-white py-2.5 text-xs font-bold text-[#2e2720] hover:bg-[#faf7f2] dark:border-white/10 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-white/10 transition cursor-pointer text-center block"
                    >
                      Create Free Account
                    </Link>
                  </div>
                )}
              </div>

              {/* INLINE PASSWORD FORM */}
              {isChangingPassword && user && (
                <div className="rounded-2xl border border-[#dbd4c5] bg-[#faf7f2] p-4 dark:border-white/8 dark:bg-[#201813] space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between border-b border-[#e2dcd0] dark:border-white/8 pb-2">
                    <h3 className="text-xs font-bold text-[#1c1815] dark:text-[#fff8ef]">Update Password</h3>
                    <button
                      type="button"
                      onClick={() => setIsChangingPassword(false)}
                      className="text-xs text-[#756a5c] hover:text-[#1c1815] dark:hover:text-white cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {passwordSuccessMessage ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 p-3 text-center space-y-2 dark:bg-emerald-500/15">
                      <div className="text-xl">✓</div>
                      <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        {passwordSuccessMessage}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordSuccessMessage("");
                        }}
                        className="mt-1 rounded-xl bg-emerald-700 text-white px-4 py-1 text-xs font-bold hover:bg-emerald-800 transition cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleUpdatePassword} className="space-y-2.5">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#4a4239] dark:text-stone-300 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          required
                          minLength={6}
                          className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2 text-xs text-[#1c1815] dark:border-white/10 dark:bg-[#16120f] dark:text-stone-100 placeholder-stone-400 focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#4a4239] dark:text-stone-300 mb-1">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Confirm password"
                          required
                          minLength={6}
                          className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2 text-xs text-[#1c1815] dark:border-white/10 dark:bg-[#16120f] dark:text-stone-100 placeholder-stone-400 focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={passwordChangeLoading}
                          className="w-full rounded-xl bg-amber-500 py-2 text-xs font-bold text-stone-950 hover:bg-amber-600 transition cursor-pointer disabled:opacity-50"
                        >
                          {passwordChangeLoading ? "Saving..." : "Save Password"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </section>

            {/* PRESTIGIOUS CHEF PRO VIP CARD */}
            <section
              id="membership"
              className={`relative overflow-hidden rounded-3xl border border-stone-200/90 dark:border-white/10 bg-[#181310] p-6 sm:p-7 shadow-sm text-white ${getHighlightClass("membership")}`}
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none text-7xl">👑</div>
              
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-400/25 mb-3">
                  <span>👑</span>
                  <span>Chef Pro Membership</span>
                </div>
                
                <h3 className="text-xl font-black text-[#fff8ef] tracking-tight">
                  Unlock Full Culinary Power
                </h3>
                <p className="mt-1.5 text-xs text-stone-300 leading-relaxed">
                  Infinite cloud sync, multi-aisle grocery hub, AI substitutions, and camera vision scanning.
                </p>

                <div className="mt-4 space-y-2 text-xs text-stone-200">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold">✓</span>
                    <span>Unlimited Cloud Sync across all devices</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold">✓</span>
                    <span>AI Ingredient Substitution Engine</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold">✓</span>
                    <span>Camera &amp; Vision Scanner</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-white/10">
                  <div>
                    <span className="text-xl font-black text-[#fff8ef]">$4.99</span>
                    <span className="text-xs text-stone-400">/mo</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsProModalOpen(true)}
                    className="rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-2.5 text-xs font-black text-stone-950 hover:from-amber-300 hover:to-amber-200 transition shadow-md shadow-amber-400/30 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {settings.subscriptionTier === "pro" ? "Manage Pro" : "Start Free Trial 👑"}
                  </button>
                </div>
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN: PREFERENCES, STANDARDS & DANGER ZONE (xl:col-span-7 2xl:col-span-8 space-y-8) */}
          <div className="xl:col-span-7 2xl:col-span-8 space-y-8">
            
            {/* 1. APPEARANCE & THEME SETTING */}
            <section
              id="appearance"
              className={`rounded-3xl border border-[#e4ded2] bg-white p-6 sm:p-8 shadow-[0_4px_24px_rgba(40,30,20,0.04)] dark:border-white/10 dark:bg-[#16120f] dark:shadow-none space-y-5 ${getHighlightClass("appearance")}`}
            >
              <div className="border-b border-[#eee8dc] dark:border-white/8 pb-4">
                <h2 className="text-lg font-bold text-[#1c1815] dark:text-[#fff8ef]">
                  Studio Appearance
                </h2>
                <p className="text-xs sm:text-sm font-medium text-[#5c534a] dark:text-stone-400 mt-0.5">
                  Choose your preferred visual theme for day and night cooking sessions.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleThemeChange("light")}
                  className={`flex flex-col items-start rounded-2xl p-5 border text-left transition cursor-pointer ${
                    currentTheme === "light"
                      ? "border-amber-600 bg-amber-50 text-[#1c1815] font-bold ring-2 ring-amber-500/20 dark:border-amber-400 dark:bg-amber-400/15 dark:text-amber-300"
                      : "border-[#dcd5c7] bg-[#faf7f2] text-[#4a4239] hover:bg-[#f2ece0] dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/8"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-base font-extrabold">☀️ Day Studio (Linen)</span>
                    {currentTheme === "light" && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-stone-950 text-xs font-black">✓</span>
                    )}
                  </div>
                  <span className="text-xs text-[#6e6356] dark:text-stone-400 mt-2 font-medium">Warm organic canvas &amp; rich espresso ink</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange("dark")}
                  className={`flex flex-col items-start rounded-2xl p-5 border text-left transition cursor-pointer ${
                    currentTheme === "dark"
                      ? "border-amber-600 bg-amber-50 text-[#1c1815] font-bold ring-2 ring-amber-500/20 dark:border-amber-400 dark:bg-amber-400/15 dark:text-amber-300"
                      : "border-[#dcd5c7] bg-[#faf7f2] text-[#4a4239] hover:bg-[#f2ece0] dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/8"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-base font-extrabold">🌙 Midnight (Cast Iron)</span>
                    {currentTheme === "dark" && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-stone-950 text-xs font-black">✓</span>
                    )}
                  </div>
                  <span className="text-xs text-[#6e6356] dark:text-stone-400 mt-2 font-medium">Deep cast-iron and amber glow for relaxed evenings</span>
                </button>
              </div>
            </section>

            {/* 2. CULINARY MEASUREMENT STANDARDS */}
            <section
              id="standards"
              className={`rounded-3xl border border-[#e4ded2] bg-white p-6 sm:p-8 shadow-[0_4px_24px_rgba(40,30,20,0.04)] dark:border-white/10 dark:bg-[#16120f] dark:shadow-none space-y-6 ${getHighlightClass("standards")}`}
            >
              <div className="border-b border-[#eee8dc] dark:border-white/8 pb-4">
                <h2 className="text-lg font-bold text-[#1c1815] dark:text-[#fff8ef]">
                  Measurement Standards &amp; Servings
                </h2>
                <p className="text-xs sm:text-sm font-medium text-[#5c534a] dark:text-stone-400 mt-0.5">
                  Select how units are calculated across all ingredients and scale default recipe yields.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* UNIT SYSTEM */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4a4239] dark:text-stone-300">
                    Measurement System
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => updateSettings({ unitSystem: "metric" })}
                      className={`flex flex-col items-start rounded-2xl p-4 border text-left transition cursor-pointer ${
                        settings.unitSystem === "metric"
                          ? "border-amber-600 bg-amber-50 text-[#1c1815] font-bold ring-2 ring-amber-500/20 dark:border-amber-400 dark:bg-amber-400/15 dark:text-amber-300"
                          : "border-[#dcd5c7] bg-[#faf7f2] text-[#4a4239] hover:bg-[#f2ece0] dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/8"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-base font-extrabold">⚖️ Metric</span>
                        {settings.unitSystem === "metric" && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-stone-950 text-xs font-black">✓</span>
                        )}
                      </div>
                      <span className="text-xs text-[#6e6356] dark:text-stone-400 mt-2 font-medium">Grams (g), Milliliters (ml), Deciliters (dl), kg</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateSettings({ unitSystem: "imperial" })}
                      className={`flex flex-col items-start rounded-2xl p-4 border text-left transition cursor-pointer ${
                        settings.unitSystem === "imperial"
                          ? "border-amber-600 bg-amber-50 text-[#1c1815] font-bold ring-2 ring-amber-500/20 dark:border-amber-400 dark:bg-amber-400/15 dark:text-amber-300"
                          : "border-[#dcd5c7] bg-[#faf7f2] text-[#4a4239] hover:bg-[#f2ece0] dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/8"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-base font-extrabold">🇺🇸 Imperial</span>
                        {settings.unitSystem === "imperial" && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-stone-950 text-xs font-black">✓</span>
                        )}
                      </div>
                      <span className="text-xs text-[#6e6356] dark:text-stone-400 mt-2 font-medium">Ounces (oz), Pounds (lb), Cups, Tbsp, Tsp</span>
                    </button>
                  </div>
                </div>

                {/* TACTILE SERVINGS STEPPER */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4a4239] dark:text-stone-300">
                    Default Recipe Servings
                  </label>
                  <div className="flex items-center justify-between rounded-2xl border border-[#dcd5c7] bg-[#faf7f2] p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="text-left">
                      <span className="block text-base font-extrabold text-[#1c1815] dark:text-[#fff8ef]">
                        {settings.defaultServings} servings
                      </span>
                      <span className="text-xs font-medium text-[#6e6356] dark:text-stone-400">
                        Cook Mode &amp; ingredients scale automatically
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (settings.defaultServings > 1) {
                            updateSettings({ defaultServings: settings.defaultServings - 1 });
                          }
                        }}
                        disabled={settings.defaultServings <= 1}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#cfc7b7] bg-white text-lg font-bold text-[#2e2720] hover:bg-[#f0eae0] transition disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-white/15 cursor-pointer shadow-xs"
                      >
                        −
                      </button>

                      <span className="w-10 text-center text-lg font-black text-amber-700 dark:text-amber-400">
                        {settings.defaultServings}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          if (settings.defaultServings < 16) {
                            updateSettings({ defaultServings: settings.defaultServings + 1 });
                          }
                        }}
                        disabled={settings.defaultServings >= 16}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#cfc7b7] bg-white text-lg font-bold text-[#2e2720] hover:bg-[#f0eae0] transition disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-white/15 cursor-pointer shadow-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. DIETARY PREFERENCES & STRICT FILTERING */}
            <section
              id="dietary"
              className={`rounded-3xl border border-[#e4ded2] bg-white p-6 sm:p-8 shadow-[0_4px_24px_rgba(40,30,20,0.04)] dark:border-white/10 dark:bg-[#16120f] dark:shadow-none space-y-5 ${getHighlightClass("dietary")}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#eee8dc] dark:border-white/8 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#1c1815] dark:text-[#fff8ef]">
                    Dietary Preferences &amp; Allergens
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-[#5c534a] dark:text-stone-400 mt-0.5">
                    Select your diet to personalize recommendations across the app.
                  </p>
                </div>

                {/* USER-FRIENDLY DIETARY FILTER TOGGLE */}
                <label className="inline-flex items-center gap-2.5 rounded-2xl border border-[#dcd5c7] bg-[#faf7f2] px-4 py-2 text-xs font-bold text-[#2e2720] dark:border-white/10 dark:bg-white/5 dark:text-stone-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.strictDietaryFilter}
                    onChange={(e) => updateSettings({ strictDietaryFilter: e.target.checked })}
                    className="h-4 w-4 rounded accent-amber-500 cursor-pointer"
                  />
                  <span>Hide recipes that don&apos;t match my diet</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {DIETARY_OPTIONS.map((option) => {
                  const isSelected = settings.dietaryPreferences.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleDietaryPreference(option.id)}
                      className={`flex flex-col items-start rounded-2xl p-4 border text-left transition cursor-pointer ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50 text-[#1c1815] font-bold ring-2 ring-emerald-500/20 dark:border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : "border-[#dcd5c7] bg-[#faf7f2] text-[#4a4239] hover:bg-[#f2ece0] dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/8"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xl">{option.icon}</span>
                        <span className={`text-xs font-black ${isSelected ? "text-emerald-800 dark:text-emerald-400" : "text-[#8c8275] dark:text-stone-400"}`}>
                          {isSelected ? "✓ Active" : "+ Add"}
                        </span>
                      </div>
                      <span className="mt-2 text-sm font-bold text-[#1c1815] dark:text-stone-100">{option.label}</span>
                      <span className="text-xs text-[#6e6356] dark:text-stone-400 mt-0.5 font-medium">{option.desc}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 4. SMART COOKING & ASSISTANT DEFAULTS */}
            <section
              id="cooking"
              className={`rounded-3xl border border-[#e4ded2] bg-white p-6 sm:p-8 shadow-[0_4px_24px_rgba(40,30,20,0.04)] dark:border-white/10 dark:bg-[#16120f] dark:shadow-none space-y-5 ${getHighlightClass("cooking")}`}
            >
              <div className="border-b border-[#eee8dc] dark:border-white/8 pb-4">
                <h2 className="text-lg font-bold text-[#1c1815] dark:text-[#fff8ef]">
                  Cooking Studio &amp; Timers
                </h2>
                <p className="text-xs sm:text-sm font-medium text-[#5c534a] dark:text-stone-400 mt-0.5">
                  Configure real-time cooking mode behaviors and assistive features.
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between rounded-2xl border border-[#dcd5c7] bg-[#faf7f2] p-4 dark:border-white/8 dark:bg-white/5 cursor-pointer">
                  <div className="text-left">
                    <span className="block text-sm font-bold text-[#1c1815] dark:text-[#fff8ef]">
                      Keep screen awake during Cook Mode
                    </span>
                    <span className="text-xs font-medium text-[#6e6356] dark:text-stone-400">
                      Prevents phone or laptop screen from locking while your hands are busy
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={keepScreenAwake}
                    onChange={(e) => setKeepScreenAwake(e.target.checked)}
                    className="h-5 w-5 rounded accent-amber-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between rounded-2xl border border-[#dcd5c7] bg-[#faf7f2] p-4 dark:border-white/8 dark:bg-white/5 cursor-pointer">
                  <div className="text-left">
                    <span className="block text-sm font-bold text-[#1c1815] dark:text-[#fff8ef]">
                      Gentle kitchen chime on timer completion
                    </span>
                    <span className="text-xs font-medium text-[#6e6356] dark:text-stone-400">
                      Plays audio tone when step timer alerts are reached
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={timerSound}
                    onChange={(e) => setTimerSound(e.target.checked)}
                    className="h-5 w-5 rounded accent-amber-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between rounded-2xl border border-[#dcd5c7] bg-[#faf7f2] p-4 dark:border-white/8 dark:bg-white/5 cursor-pointer">
                  <div className="text-left pr-4">
                    <span className="block text-sm font-bold text-[#1c1815] dark:text-[#fff8ef]">
                      Auto-add low pantry staples to shopping list
                    </span>
                    <span className="text-xs font-medium text-[#6e6356] dark:text-stone-400">
                      When you mark a pantry staple as out of stock, it is automatically added to your active shopping list
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoAddLowPantryToList}
                    onChange={(e) => updateSettings({ autoAddLowPantryToList: e.target.checked })}
                    className="h-5 w-5 rounded accent-amber-500 cursor-pointer shrink-0"
                  />
                </label>
              </div>
            </section>

            {/* 5. REFINED DANGER ZONE WITH COUNTDOWN SAFETY */}
            {user && (
              <section className="rounded-3xl border border-rose-200 bg-white p-6 sm:p-8 shadow-[0_4px_24px_rgba(40,30,20,0.04)] dark:border-rose-500/20 dark:bg-rose-950/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-rose-900 dark:text-rose-300">
                      Delete Account
                    </h2>
                    <p className="text-xs sm:text-sm font-medium text-[#5c534a] dark:text-stone-400 mt-0.5">
                      Permanently wipe your account, saved recipes, meal plans, and all personal cloud data.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDeleteAccountModalOpen(true)}
                    className="rounded-2xl bg-rose-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-rose-700 transition shadow-sm cursor-pointer shrink-0"
                  >
                    Delete Account
                  </button>
                </div>
              </section>
            )}

          </div>

        </div>

      </div>

      {/* CONFIRM MODAL WITH 4-SECOND SAFETY COUNTDOWN */}
      <ConfirmModal
        isOpen={isDeleteAccountModalOpen}
        title="Are you sure you want to delete your account?"
        description="This action is permanent and cannot be undone. All your saved recipes, meal plans, and account data will be wiped."
        confirmLabel="Delete Account Permanently"
        cancelLabel="Cancel"
        isDestructive
        countdownSeconds={4}
        onConfirm={handleDeleteAccount}
        onCancel={() => setIsDeleteAccountModalOpen(false)}
      />

      {/* CHEF PRO UPGRADE MODAL OVERLAY */}
      <ChefProModal
        isOpen={isProModalOpen}
        onClose={() => {
          setIsProModalOpen(false);
          setSettings(getStoredUserSettings());
        }}
      />

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authInitialMode}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </main>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f7f4ed] dark:bg-[#110d0b]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
