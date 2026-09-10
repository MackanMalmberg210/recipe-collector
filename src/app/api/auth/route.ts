import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp } from "../../../lib/security/rateLimiter";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function getSafeRedirectBaseUrl(req: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const origin = req.headers.get("origin");
  if (origin) {
    try {
      const parsed = new URL(origin);
      if (
        parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1" ||
        parsed.hostname.endsWith(".vercel.app")
      ) {
        return parsed.origin;
      }
    } catch {}
  }

  return "http://localhost:3000";
}

export async function POST(req: Request) {
  try {
    // Rate limit: max 12 auth attempts per minute per IP to prevent brute-forcing
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`auth:${clientIp}`, 12, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many authentication attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.` },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: "Server authentication is temporarily unavailable due to missing configuration." },
        { status: 500 }
      );
    }

    const { action, email, password, displayName } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    // 1. FORGOT PASSWORD / RECOVERY EMAIL
    if (action === "forgot_password" || action === "reset_password_request") {
      const safeOrigin = getSafeRedirectBaseUrl(req);

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${safeOrigin}/reset-password`,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: "Password recovery email sent! Please check your inbox.",
      });
    }

    if (!password) {
      return NextResponse.json(
        { error: "Password is required." },
        { status: 400 }
      );
    }

    // 2. SIGN UP
    if (action === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName?.trim() || email.split("@")[0],
          },
        },
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        session: data.session,
        user: data.user,
        message: "Account created successfully!",
      });
    }

    // 3. SIGN IN
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return NextResponse.json(
        {
          error: error.message.includes("Invalid login credentials")
            ? "Invalid email or password. Please verify your credentials."
            : error.message,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      session: data.session,
      user: data.user,
      message: `Welcome back, ${data.user?.user_metadata?.display_name || data.user?.email}!`,
    });
  } catch (err: unknown) {
    const e = err as { message?: string };
    return NextResponse.json(
      { error: e.message || "An unexpected error occurred during authentication." },
      { status: 500 }
    );
  }
}
