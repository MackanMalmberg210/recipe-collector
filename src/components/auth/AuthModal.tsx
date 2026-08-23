"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup" | "forgot_password";
};

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot_password">(initialMode);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setMode(initialMode);
    setMessage(null);
  }, [initialMode, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const e = err as { message?: string };
      setMessage({ text: e.message || `Failed to sign in with ${provider}.`, type: "error" });
      setLoading(false);
    }
  };

  const handleSendMagicLink = async () => {
    if (!email.trim()) {
      setMessage({ text: "Please enter your email address first.", type: "error" });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (otpError) throw otpError;
      setMessage({
        text: `Sign-in link sent to ${email}! ✉️ Click the link in your inbox to sign in.`,
        type: "success",
      });
    } catch (err: unknown) {
      const e = err as { message?: string };
      setMessage({ text: e.message || "Failed to send sign-in link.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (mode === "forgot_password") {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMessage({
          text: `Password reset link sent to ${email}! ✉️ Check your inbox.`,
          type: "success",
        });
      } catch (err: unknown) {
        const e = err as { message?: string };
        setMessage({ text: e.message || "Failed to send password reset link.", type: "error" });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage({
          text: error.message.includes("Invalid login credentials")
            ? "Invalid email or password. Please verify your credentials."
            : error.message,
          type: "error",
        });
        setLoading(false);
      } else {
        const name = data.user?.user_metadata?.display_name || data.user?.email || "Chef";
        setMessage({
          text: `Welcome back, ${name}!`,
          type: "success",
        });
        setTimeout(() => {
          onClose();
          router.refresh();
        }, 600);
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName.trim() || email.split("@")[0],
          },
        },
      });

      if (error) {
        setMessage({ text: error.message, type: "error" });
        setLoading(false);
      } else {
        const name = displayName.trim() || data.user?.email;
        setMessage({
          text: `Account created for ${name}!`,
          type: "success",
        });
        setTimeout(() => {
          onClose();
          router.refresh();
        }, 800);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      {/* Dark backdrop blur */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-4xl border border-white/12 bg-[#141210] p-6 shadow-[0_25px_70px_rgba(0,0,0,0.8)] transition-all duration-300 sm:p-8 my-auto">
        {/* Subtle top glow */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-transparent" />

        {/* Close button (X) */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-stone-400 transition hover:bg-white/10 hover:text-white cursor-pointer"
          aria-label="Close modal"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
            <span>🍳</span>
            <span>Recipe Vault</span>
          </div>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-[#fff8ef]">
            {mode === "login"
              ? "Sign In to Your Kitchen"
              : mode === "signup"
              ? "Create Free Account"
              : "Reset Password"}
          </h2>
          <p className="mt-1 text-xs text-stone-400">
            {mode === "login"
              ? "Access your saved recipes, meal plans, and customized cookbooks."
              : mode === "signup"
              ? "Save recipes clutter-free and sync seamlessly across your devices."
              : "Enter your email address and we'll send you a link to reset your password."}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        {mode !== "forgot_password" && (
          <div className="mt-5 grid grid-cols-2 rounded-2xl border border-white/8 bg-stone-950 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setMessage(null);
              }}
              className={`rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
                mode === "login"
                  ? "bg-amber-500 text-stone-950 shadow-md"
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
              className={`rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
                mode === "signup"
                  ? "bg-amber-500 text-stone-950 shadow-md"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* SOCIAL LOGINS */}
        {mode !== "forgot_password" && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleOAuthSignIn("google")}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-2.5 px-3 text-xs font-bold text-stone-200 hover:bg-white/10 hover:border-white/20 transition cursor-pointer"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.8l3.7-2.9z" />
                <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z" />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuthSignIn("github")}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-2.5 px-3 text-xs font-bold text-stone-200 hover:bg-white/10 hover:border-white/20 transition cursor-pointer"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </button>
          </div>
        )}

        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative bg-[#141210] px-3 text-[10px] uppercase tracking-wider text-stone-500 font-bold">
            Or with email
          </span>
        </div>

        {/* Status feedback message */}
        {message && (
          <div
            className={`mb-4 rounded-xl border p-3 text-xs font-medium ${
              message.type === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-300"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "signup" && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Your Name / Chef Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Marcus Karlsson"
                className="mt-1 w-full rounded-2xl border border-white/10 bg-[#201813] py-2.5 px-4 text-sm text-stone-100 placeholder-stone-600 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#201813] py-2.5 px-4 text-sm text-stone-100 placeholder-stone-600 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {mode !== "forgot_password" && (
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  Password
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot_password");
                      setMessage(null);
                    }}
                    className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="w-full rounded-2xl border border-white/10 bg-[#201813] py-2.5 pl-4 pr-10 text-sm text-stone-100 placeholder-stone-600 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-white cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 py-3 text-xs sm:text-sm font-bold text-stone-950 shadow-md shadow-amber-400/20 transition hover:from-amber-300 hover:to-amber-200 disabled:opacity-50 cursor-pointer"
          >
            {loading
              ? "Processing..."
              : mode === "login"
              ? "Sign In"
              : mode === "signup"
              ? "Create Account"
              : "Send Password Reset Link ✉️"}
          </button>

          {mode === "login" && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleSendMagicLink}
                disabled={loading}
                className="text-xs text-stone-400 hover:text-amber-300 underline cursor-pointer"
              >
                Sign in with email link instead (no password needed)
              </button>
            </div>
          )}

          {mode === "forgot_password" && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setMessage(null);
                }}
                className="text-xs text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                ← Back to Sign In
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
