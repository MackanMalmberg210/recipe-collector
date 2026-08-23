import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

let clientInstance: SupabaseClient | null = null;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://wvcfkpgdtrrieryilbkz.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2Y2ZrcGdkdHJyaWVyeWlsYmt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNDU1NzUsImV4cCI6MjEwMjYyMTU3NX0.A2i1onDu95J5fchP4DChmbTI_dhL7_23fvlEcH_qW30";

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