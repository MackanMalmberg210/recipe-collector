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
    <main className="relative flex min-h-[calc(100vh-73px)] w-full items-center justify-center overflow-hidden bg-[#0c0907] px-4 py-12 text-stone-100 sm:px-6 lg:px-8">
      {/* Subtle Culinary Ambient Lighting */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[550px] w-[550px] rounded-full bg-amber-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-[450px] w-[450px] rounded-full bg-orange-600/8 blur-[150px]" />

      <div className="relative w-full max-w-md">
        
        {/* Main Card */}
        <div className="relative overflow-hidden rounded-4xl border border-white/10 bg-[#15110e]/95 p-7 sm:p-9 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5">
          
          <div className="relative z-10">
            {/* Header / Brand (NO background container boxes behind icons!) */}
            <div className="text-center space-y-1.5 pb-2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">
                Recipe Collector
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#fff8ef]">
                {mode === "login"
                  ? "Welcome Back"
                  : mode === "signup"
                  ? "Create Account"
                  : "Reset Password"}
              </h1>
              <p className="text-xs text-stone-400">
                {mode === "login"
                  ? "Sign in to access your cloud cookbook and meal plans"
                  : mode === "signup"
                  ? "Join free to organize your recipes, groceries & meal plans"
                  : "Enter your account email to receive a password reset link"}
              </p>
            </div>

            {/* Segmented Mode Switcher */}
            {mode !== "forgot_password" ? (
              <div className="mt-5 grid grid-cols-2 rounded-2xl border border-white/8 bg-black/40 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setMessage(null);
                  }}
                  className={`rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                    mode === "login"
                      ? "bg-amber-500 text-stone-950 shadow-sm font-extrabold"
                      : "text-stone-400 hover:text-white"
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
                  className={`rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                    mode === "signup"
                      ? "bg-amber-500 text-stone-950 shadow-sm font-extrabold"
                      : "text-stone-400 hover:text-white"
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
                className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 text-xs sm:text-sm font-medium transition-all animate-in fade-in ${
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
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              
              {/* DISPLAY NAME (SIGN UP ONLY) */}
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300">
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
                      placeholder="e.g. Marcus"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-10 pr-4 text-sm text-stone-100 placeholder-stone-500 outline-none transition duration-200 focus:border-amber-400 focus:bg-black/60 focus:ring-2 focus:ring-amber-400/20"
                    />
                  </div>
                </div>
              )}

              {/* EMAIL */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300">
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
                    className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-10 pr-4 text-sm text-stone-100 placeholder-stone-500 outline-none transition duration-200 focus:border-amber-400 focus:bg-black/60 focus:ring-2 focus:ring-amber-400/20"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* PASSWORD (NOT IN FORGOT PASSWORD MODE) */}
              {mode !== "forgot_password" && (
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-300">
                      Password
                    </label>

                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode("forgot_password");
                          setMessage(null);
                        }}
                        className="text-xs font-bold text-amber-400 hover:text-amber-300 transition cursor-pointer"
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
                      className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-10 pr-11 text-sm text-stone-100 placeholder-stone-500 outline-none transition duration-200 focus:border-amber-400 focus:bg-black/60 focus:ring-2 focus:ring-amber-400/20"
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300">
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
                      className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-10 pr-4 text-sm text-stone-100 placeholder-stone-500 outline-none transition duration-200 focus:border-amber-400 focus:bg-black/60 focus:ring-2 focus:ring-amber-400/20"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 py-3.5 text-sm font-extrabold text-stone-950 shadow-lg shadow-amber-500/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-950 border-t-transparent" />
                    <span>Processing...</span>
                  </>
                ) : mode === "login" ? (
                  <span>Sign In ➔</span>
                ) : mode === "signup" ? (
                  <span>Create Account ➔</span>
                ) : (
                  <span>Send Recovery Email ✉️</span>
                )}
              </button>
            </form>

            {/* Back to Home Link */}
            <div className="mt-6 text-center border-t border-white/5 pt-4">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-400 transition"
              >
                <span>←</span>
                <span>Back to Kitchen Hub</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}