import { createBrowserClient as createClientOrig } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

// Supabase public keys (safe to expose — protected by RLS)
// Get your own at https://supabase.com
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vydfhnefwwwtkretjzyn.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZGZobmVmd3d3dGtyZXRqenluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NTY5NjQsImV4cCI6MjEwNTMzMjk2NH0.-0gj3muw2e7dp-r6xbXB5kN2hdfzUaUdgHN4_g5Z4oQ";

export function createClient(): SupabaseClient {
  if (!cachedClient) {
    cachedClient = createClientOrig(SUPABASE_URL, SUPABASE_KEY);
  }
  return cachedClient;
}
