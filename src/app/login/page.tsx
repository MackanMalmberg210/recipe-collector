"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot_password">("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("mode") === "signup") {
        setMode("signup");
      } else if (params.get("mode") === "reset" || params.get("mode") === "forgot_password") {
        setMode("forgot_password");
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setMessage({ text: "Please enter your email address.", type: "error" });
      setLoading(false);
      return;
    }

    // 1. FORGOT PASSWORD FLOW
    if (mode === "forgot_password") {
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "forgot_password",
            email: cleanEmail,
          }),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          setMessage({ text: data.error || "Failed to send reset link.", type: "error" });
          setLoading(false);
          return;
        }

        setMessage({
          text: `Password recovery email sent to ${cleanEmail}! ✉️ Check your inbox to set a new password.`,
          type: "success",
        });
        setLoading(false);
      } catch (err: unknown) {
        const e = err as { message?: string };
        setMessage({
          text: e.message || "Failed to request password reset.",
          type: "error",
        });
        setLoading(false);
      }
      return;
    }

    // 2. SIGN UP / SIGN IN FLOW
    if (password.length < 6) {
      setMessage({ text: "Password must be at least 6 characters.", type: "error" });
      setLoading(false);
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setMessage({ text: "Passwords do not match.", type: "error" });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode,
          email: cleanEmail,
          password,
          displayName: displayName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setMessage({ text: data.error || "Authentication failed.", type: "error" });
        setLoading(false);
        return;
      }

      if (data.session) {
        try {
          const supabase = createClient();
          await supabase.auth.setSession(data.session);
        } catch {}
      }

      setMessage({
        text: data.message || "Success! Redirecting to Kitchen...",
        type: "success",
      });

      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setMessage({
        text: e.message || "Network request failed. Please check connection.",
        type: "error",
      });
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-[calc(100vh-73px)] w-full items-center justify-center overflow-hidden bg-[#0a0908] px-4 py-8 lg:px-8">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-emerald-600/15 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[600px] w-[600px] rounded-full bg-amber-500/10 blur-[140px]" />
        <div className="absolute left-1/3 top-1/2 h-[300px] w-[300px] -translate-y-1/2 rounded-full bg-orange-600/8 blur-[100px]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-12">
        
        {/* LEFT COLUMN: Visual Brand Showcase */}
        <div className="hidden lg:col-span-6 lg:flex lg:flex-col lg:justify-center">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-300 backdrop-blur-md self-start">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Recipe Collector Cloud
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white xl:text-5xl xl:leading-[1.15]">
            Your kitchen. Your recipes. <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-emerald-400 bg-clip-text text-transparent">
              Completely clutter-free.
            </span>
          </h1>

          <p className="mt-4 text-base leading-relaxed text-stone-300 xl:text-lg">
            Connect to your personal culinary workspace, collect your favorites from across the web, and plan meals based on what is in your pantry.
          </p>

          {/* Key Value Props */}
          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-4 rounded-2xl border border-white/5 bg-stone-900/40 p-3.5 backdrop-blur-md transition hover:border-white/10 hover:bg-stone-900/60">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-100">Instant Recipe Web Import</h3>
                <p className="text-xs text-stone-400 mt-0.5">Paste any link — we strip ads and life stories to keep only ingredients and cooking steps.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-white/5 bg-stone-900/40 p-3.5 backdrop-blur-md transition hover:border-white/10 hover:bg-stone-900/60">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-100">Pantry Matcher &amp; Smart Groceries</h3>
                <p className="text-xs text-stone-400 mt-0.5">Find recipes tailored to leftovers on hand and generate weekly grocery checklists automatically.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-white/5 bg-stone-900/40 p-3.5 backdrop-blur-md transition hover:border-white/10 hover:bg-stone-900/60">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-100">Secure Cloud Synchronization</h3>
                <p className="text-xs text-stone-400 mt-0.5">Your private recipes, meal plans, and ratings are securely backed up and synced across all devices.</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Clean Auth Card */}
        <div className="lg:col-span-6 w-full max-w-lg mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-stone-900/90 p-6 sm:p-9 shadow-[0_20px_70px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
            {/* Top decorative gradient line */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-orange-500" />

            {/* Card Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  {mode === "login"
                    ? "Sign In"
                    : mode === "signup"
                    ? "Create Account"
                    : "Reset Password"}
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  {mode === "login"
                    ? "Enter your account credentials below"
                    : mode === "signup"
                    ? "Fill out the details below to create your free account"
                    : "Enter your account email to receive a password recovery link"}
                </p>
              </div>
            </div>

            {/* Segmented Mode Switcher */}
            {mode !== "forgot_password" ? (
              <div className="mt-6 grid grid-cols-2 rounded-2xl border border-white/8 bg-stone-950/80 p-1.5 z-10 relative">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setMessage(null);
                  }}
                  className={`relative rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                    mode === "login"
                      ? "bg-amber-500 text-stone-950 shadow-md font-black"
                      : "text-stone-400 hover:text-stone-200"
                  }`}
                >
                  Sign In
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setMessage(null);
                  }}
                  className={`relative rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                    mode === "signup"
                      ? "bg-amber-500 text-stone-950 shadow-md font-black"
                      : "text-stone-400 hover:text-stone-200"
                  }`}
                >
                  Create Account
                </button>
              </div>
            ) : (
              <div className="mt-4 flex items-center justify-between border-b border-white/8 pb-3">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setMessage(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition cursor-pointer"
                >
                  <span>←</span>
                  <span>Back to Sign In</span>
                </button>
              </div>
            )}

            {/* Feedback message banner */}
            {message && (
              <div
                className={`mt-6 flex items-start gap-3 rounded-2xl border p-4 text-xs sm:text-sm font-medium transition-all ${
                  message.type === "error"
                    ? "border-red-500/30 bg-red-500/10 text-red-300"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {message.type === "error" ? (
                    <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span>{message.text}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              
              {/* DISPLAY NAME (SIGN UP ONLY) */}
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300">
                    Your Name / Chef Name
                  </label>
                  <div className="relative mt-1.5">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-500">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Gordon"
                      className="w-full rounded-2xl border border-white/10 bg-stone-950/70 py-3 pl-10 pr-4 text-sm text-stone-100 placeholder-stone-500 outline-none transition duration-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                    />
                  </div>
                </div>
              )}

              {/* EMAIL */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300">
                  Email Address
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-white/10 bg-stone-950/70 py-3 pl-10 pr-4 text-sm text-stone-100 placeholder-stone-500 outline-none transition duration-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* PASSWORD (NOT IN FORGOT PASSWORD MODE) */}
              {mode !== "forgot_password" && (
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300">
                      Password
                    </label>

                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode("forgot_password");
                          setMessage(null);
                        }}
                        className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>

                  <div className="relative mt-1.5">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-500">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full rounded-2xl border border-white/10 bg-stone-950/70 py-3 pl-10 pr-11 text-sm text-stone-100 placeholder-stone-500 outline-none transition duration-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400 hover:text-white transition cursor-pointer"
                      title={showPassword ? "Hide password" : "Show password"}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.025 10.025 0 013.68-.823c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m-6.09-3.21a3 3 0 11-4.243-4.243" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* CONFIRM PASSWORD (SIGN UP ONLY) */}
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300">
                    Confirm Password
                  </label>
                  <div className="relative mt-1.5">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-500">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full rounded-2xl border border-white/10 bg-stone-950/70 py-3 pl-10 pr-4 text-sm text-stone-100 placeholder-stone-500 outline-none transition duration-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="group relative mt-4 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-amber-500 hover:bg-amber-600 py-3.5 text-sm font-extrabold text-stone-950 shadow-lg shadow-amber-400/25 transition duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin text-stone-950" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Processing...</span>
                  </span>
                ) : mode === "login" ? (
                  <span>Sign In to Kitchen</span>
                ) : mode === "signup" ? (
                  <span>Create Free Account ✨</span>
                ) : (
                  <span>Send Recovery Email ✉️</span>
                )}
              </button>
            </form>

            {/* Alternativ länk längst ner för att växla läge */}
            {mode !== "forgot_password" ? (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "login" ? "signup" : "login");
                    setMessage(null);
                  }}
                  className="text-xs text-stone-400 hover:text-amber-300 transition cursor-pointer underline underline-offset-4"
                >
                  {mode === "login"
                    ? "Don't have an account? Create one for free →"
                    : "Already have an account? Sign in here →"}
                </button>
              </div>
            ) : null}

            {/* Back to Home */}
            <div className="mt-6 border-t border-white/5 pt-4 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-amber-400 transition"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to overview</span>
              </Link>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}