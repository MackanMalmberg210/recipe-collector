import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createClient() {
    const cookieStore = await cookies(); // Retrieves next.js cookie-handler

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                // Retreives cookies (to see who's logged in)
                getAll() {
                    return cookieStore.getAll();
                },
                // Sets cookies (when user logs in, or when token needs to be refreshed)
                setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch (error) {
                        console.log(error);
                    }
                }
            }
        }
    );
}