"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase-client";

/**
 * Handles Supabase auth redirect callbacks.
 * When a user clicks an email verification or password reset link,
 * Supabase redirects to /auth/callback with the session in the URL hash.
 * This component processes that hash and redirects to home.
 */
export function AuthCallbackHandler() {
  const supabase = createClient();

  useEffect(() => {
    // Check if we have a hash fragment from Supabase redirect
    if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          // Clear the hash and reload to home
          window.location.hash = "";
          window.location.href = "/";
        }
      });
    }
  }, [supabase]);

  return null;
}
