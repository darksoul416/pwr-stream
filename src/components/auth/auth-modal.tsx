"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";
import { X, Mail, Lock, User as UserIcon, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { createPortal } from "react-dom";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup" | "reset";
}

export function AuthModal({ open, onClose, initialMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup" | "reset" | "resetSent" | "verifyEmail">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError("");
      setInfo("");
    }
  }, [open, initialMode]);

  // Check if user is already logged in
  useEffect(() => {
    if (!open) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        onClose();
        window.location.reload();
      }
    });
  }, [open, supabase, onClose]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        onClose();
        window.location.reload();
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase, onClose]);

  // Handle email verification redirect (hash fragment)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          window.location.hash = "";
          onClose();
          window.location.reload();
        }
      });
    }
  }, [supabase, onClose]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Auth state listener will handle redirect
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name || email.split("@")[0] } },
        });
        if (error) throw error;
        if (data.user && !data.session) {
          // Email confirmation required
          setMode("verifyEmail");
          setInfo("Check your email for a verification link to complete signup.");
        }
        // If session is returned, auth listener handles redirect
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMode("resetSent");
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [mode, email, password, name, supabase]);

  if (!mounted || !open) return null;

  const titles: Record<string, string> = {
    login: "Welcome Back",
    signup: "Create Account",
    reset: "Reset Password",
    resetSent: "Check Your Email",
    verifyEmail: "Verify Your Email",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <h3 className="text-base font-bold pwr-gradient-text">{titles[mode]}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {mode === "resetSent" ? (
          <div className="text-center py-8 px-4 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
              <Mail className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-sm text-foreground/80">
              If an account exists with <span className="font-bold">{email}</span>, a reset link has been sent.
            </p>
            <p className="text-[10px] text-muted-foreground">Check your inbox and spam folder.</p>
            <button onClick={() => setMode("login")} className="text-xs text-primary hover:underline">
              ← Back to login
            </button>
          </div>
        ) : mode === "verifyEmail" ? (
          <div className="text-center py-8 px-4 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-sm text-foreground/80">{info}</p>
            <p className="text-[10px] text-muted-foreground">
              After verifying, you can log in.
            </p>
            <button onClick={() => setMode("login")} className="text-xs text-primary hover:underline">
              ← Back to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Name field (signup only) */}
            {mode === "signup" && (
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-secondary/50 border border-border/60 text-sm focus:outline-none focus:border-primary/60"
                />
              </div>
            )}

            {/* Email field */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-secondary/50 border border-border/60 text-sm focus:outline-none focus:border-primary/60"
              />
            </div>

            {/* Password field */}
            {mode !== "reset" && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 6 chars)"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-secondary/50 border border-border/60 text-sm focus:outline-none focus:border-primary/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "login" && "Log In"}
              {mode === "signup" && "Create Account"}
              {mode === "reset" && "Send Reset Link"}
            </button>

            {/* Mode switches */}
            <div className="text-center pt-2 space-y-1.5">
              {mode === "login" && (
                <>
                  <button
                    type="button"
                    onClick={() => { setMode("signup"); setError(""); }}
                    className="text-xs text-muted-foreground hover:text-primary block w-full"
                  >
                    Don&apos;t have an account? <span className="text-primary font-semibold">Sign up</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode("reset"); setError(""); }}
                    className="text-xs text-muted-foreground hover:text-primary block w-full"
                  >
                    Forgot password?
                  </button>
                </>
              )}
              {mode === "signup" && (
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(""); }}
                  className="text-xs text-muted-foreground hover:text-primary block w-full"
                >
                  Already have an account? <span className="text-primary font-semibold">Log in</span>
                </button>
              )}
              {mode === "reset" && (
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(""); }}
                  className="text-xs text-muted-foreground hover:text-primary block w-full"
                >
                  ← Back to login
                </button>
              )}
            </div>
          </form>
        )}

        <div className="border-t border-border/40 p-3 text-center">
          <p className="text-[10px] text-muted-foreground">
            By continuing, you agree to our terms. We don&apos;t share your data.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
