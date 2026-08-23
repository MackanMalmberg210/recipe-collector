"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;
      setSuccess(true);
      setTimeout(() => {
        router.push("/settings");
      }, 2000);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#110d0b] text-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md overflow-hidden rounded-4xl border border-white/12 bg-[#16120f] p-6 sm:p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10 text-2xl border border-amber-400/20">
            🔑
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#fff8ef]">
            Set New Password
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Choose a strong password to secure your cookbook account.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-rose-300">
            {error}
          </div>
        )}

        {success ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/15 p-5 text-center space-y-2">
            <div className="text-2xl">✓</div>
            <h3 className="text-sm font-bold text-emerald-300">Password Updated!</h3>
            <p className="text-xs text-stone-300">
              Your password has been changed. Redirecting to your settings...
            </p>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="w-full rounded-2xl border border-white/12 bg-[#201813] px-4 py-3 text-sm text-stone-100 placeholder-stone-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Confirm password"
                className="w-full rounded-2xl border border-white/12 bg-[#201813] px-4 py-3 text-sm text-stone-100 placeholder-stone-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-amber-500 hover:bg-amber-600 py-3.5 text-xs sm:text-sm font-bold text-stone-950 hover:from-amber-300 hover:to-amber-200 transition shadow-lg shadow-amber-400/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Updating..." : "Save New Password"}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/settings"
                className="text-xs text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                ← Back to Settings
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
