"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";
import { useToast } from "../../components/ui/ToastProvider";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const { success: showToastSuccess, error: showToastError } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Check and listen for recovery session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        // If session exists or recovery token is present in hash
        if (data?.session) {
          setIsCheckingSession(false);
          return;
        }

        // Check if hash has access_token or type=recovery
        if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
          setIsCheckingSession(false);
          return;
        }

        // Otherwise give Supabase a brief moment to process the hash
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === "PASSWORD_RECOVERY" || session) {
              setIsCheckingSession(false);
            }
          }
        );

        setTimeout(() => setIsCheckingSession(false), 1200);

        return () => {
          authListener?.subscription?.unsubscribe();
        };
      } catch {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [supabase]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;
      
      setIsSuccess(true);
      showToastSuccess("Password updated successfully! 🎉");

      setTimeout(() => {
        router.push("/saved");
      }, 1500);
    } catch (err: unknown) {
      const e = err as { message?: string };
      const msg = e.message || "Failed to update password. The link may have expired.";
      setError(msg);
      showToastError(msg);
    } finally {
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
            {/* Header (NO background container boxes behind icons!) */}
            <div className="text-center space-y-1.5 pb-2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">
                Recipe Collector Security
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#fff8ef]">
                Choose New Password
              </h1>
              <p className="text-xs text-stone-400">
                Create a strong password to secure your cookbook account.
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs sm:text-sm font-medium text-red-300 animate-in fade-in">
                <div className="mt-0.5 shrink-0">
                  <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <span>{error}</span>
              </div>
            )}

            {/* Success state */}
            {isSuccess ? (
              <div className="mt-6 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-3 animate-in zoom-in-95">
                <div className="text-3xl">✓</div>
                <h3 className="text-lg font-extrabold text-emerald-300">
                  Password Updated!
                </h3>
                <p className="text-xs text-stone-300">
                  Your password has been changed successfully. Redirecting you to your cookbook...
                </p>
                <div className="pt-2">
                  <Link
                    href="/saved"
                    className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 px-5 py-2.5 text-xs font-bold text-stone-950 transition"
                  >
                    <span>Go to Cookbook</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword} className="mt-6 space-y-4">
                
                {/* NEW PASSWORD */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300">
                    New Password
                  </label>
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
                      placeholder="At least 6 characters"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-10 pr-11 text-sm text-stone-100 placeholder-stone-500 outline-none transition duration-200 focus:border-amber-400 focus:bg-black/60 focus:ring-2 focus:ring-amber-400/20"
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

                {/* CONFIRM PASSWORD */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300">
                    Confirm New Password
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
                      placeholder="Repeat your password"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-10 pr-4 text-sm text-stone-100 placeholder-stone-500 outline-none transition duration-200 focus:border-amber-400 focus:bg-black/60 focus:ring-2 focus:ring-amber-400/20"
                    />
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 py-3.5 text-sm font-extrabold text-stone-950 shadow-lg shadow-amber-500/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-950 border-t-transparent" />
                      <span>Updating password...</span>
                    </>
                  ) : (
                    <span>Save New Password ➔</span>
                  )}
                </button>

                {/* BACK TO LOGIN */}
                <div className="mt-6 text-center border-t border-white/5 pt-4">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-400 transition"
                  >
                    <span>←</span>
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </form>
            )}

          </div>
        </div>

      </div>
    </main>
  );
}
