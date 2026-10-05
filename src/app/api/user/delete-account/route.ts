import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "../../../../lib/supabase/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function POST(req: Request) {
  try {
    let supabase;
    let currentUser = null;

    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      if (token && SUPABASE_URL && SUPABASE_ANON_KEY) {
        const clientWithToken = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
          auth: { persistSession: false },
        });

        const { data: { user }, error } = await clientWithToken.auth.getUser(token);
        if (!error && user) {
          currentUser = user;
          supabase = clientWithToken;
        }
      }
    }

    // Fallback to cookie-based session if header was not present or didn't resolve
    if (!currentUser || !supabase) {
      const serverClient = await createServerClient();
      const { data: { user }, error: authError } = await serverClient.auth.getUser();
      if (!authError && user) {
        currentUser = user;
        supabase = serverClient;
      }
    }

    if (!currentUser || !supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error: rpcError } = await supabase.rpc("delete_user_account");

    if (rpcError) {
      console.error("Error executing delete_user_account RPC:", rpcError);
      return NextResponse.json(
        { error: rpcError.message || "Failed to delete account" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Delete account error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
