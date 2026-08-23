import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://wvcfkpgdtrrieryilbkz.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2Y2ZrcGdkdHJyaWVyeWlsYmt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNDU1NzUsImV4cCI6MjEwMjYyMTU3NX0.A2i1onDu95J5fchP4DChmbTI_dhL7_23fvlEcH_qW30";

export async function POST(req: Request) {
  try {
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
      const origin = req.headers.get("origin") || req.headers.get("referer") || "http://localhost:3000";
      const cleanOrigin = origin.replace(/\/$/, "");

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${cleanOrigin}/reset-password`,
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
