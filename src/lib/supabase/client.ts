import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

let clientInstance: SupabaseClient | null = null;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export function createClient(): SupabaseClient {
  if (clientInstance) return clientInstance;

  try {
    clientInstance = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
      },
    });
    return clientInstance;
  } catch (err) {
    console.warn("Error creating Supabase client:", err);
    return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
}