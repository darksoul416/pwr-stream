import { createBrowserClient as createClientOrig } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Supabase client for browser (client-side).
 * Returns a mock client if env vars aren't set (during build or before config).
 */
export function createClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL === "https://your-project.supabase.co") {
    // Return a no-op mock client during build or when not configured
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ data: {}, error: { message: "Supabase not configured" } }),
        signUp: async () => ({ data: {}, error: { message: "Supabase not configured" } }),
        signOut: async () => ({ error: null }),
        resetPasswordForEmail: async () => ({ data: {}, error: { message: "Supabase not configured" } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
    } as any;
  }

  if (!cachedClient) {
    cachedClient = createClientOrig(SUPABASE_URL, SUPABASE_KEY);
  }
  return cachedClient;
}
