import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for browser (client-side)
 * Uses NEXT_PUBLIC_ env vars so they're available in the browser
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}
