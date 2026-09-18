"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup" | "reset";
}

export function AuthModal({ open, onClose, initialMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup" | "reset" | "resetSent" | "resetForm">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError("");
    }
  }, [open, initialMode]);

  // Check URL hash for reset token
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const resetMatch = hash.match(/reset=([a-f0-9]+)/);
      if (resetMatch) {
        setResetToken(resetMatch[1]);
        setMode("resetForm");
        window.location.hash = "";
      }
    }
  }, []);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (res?.error) {
          setError(res.error);
        } else {
          onClose();
          window.location.reload();
        }
      } else if (mode === "signup") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Sign up failed");
        } else {
          // Auto-login after signup
          const loginRes = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });
          if (loginRes?.error) {
            setError("Account created! Please log in.");
            setMode("login");
          } else {
            onClose();
            window.location.reload();
          }
        }
      } else if (mode === "reset") {
        const res = await fetch("/api/auth/reset-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Reset failed");
        } else {
          setMode("resetSent");
          if (data.devResetUrl) {
            // In dev mode, show the reset link
            setError("");
          }
        }
      } else if (mode === "resetForm") {
        const res = await fetch("/api/auth/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: resetToken, password: newPassword }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Reset failed");
        } else {
          setMode("login");
          setError("Password reset! Please log in.");
          setPassword("");
        }
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const titles: Record<typeof mode, string> = {
    login: "Welcome Back",
    signup: "Create Account",
    reset: "Reset Password",
    resetSent: "Check Your Email",
    resetForm: "Set New Password",
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <h3 className="text-base font-bold pwr-gradient-text">
            {titles[mode]}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === "resetSent" ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                <Mail className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-sm text-foreground/80">
                If an account exists with <span className="font-bold">{email}</span>, a reset link has been sent.
              </p>
              <p className="text-[10px] text-muted-foreground">
                Check your inbox (and spam folder) for the reset link.
              </p>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-xs text-primary hover:underline"
              >
                ← Back to login
              </button>
            </div>
          ) : (
            <>
              {/* Name field (signup only) */}
              {mode === "signup" && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
              {mode !== "resetForm" && (
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
              )}

              {/* Password field */}
              {mode === "login" || mode === "signup" ? (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
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
              ) : null}

              {/* New password field (reset form) */}
              {mode === "resetForm" && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 6 chars)"
                    required
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
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                  loading && "opacity-60 cursor-not-allowed"
                )}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === "login" && "Log In"}
                {mode === "signup" && "Create Account"}
                {mode === "reset" && "Send Reset Link"}
                {mode === "resetForm" && "Set New Password"}
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
                {mode === "resetForm" && (
                  <button
                    type="button"
                    onClick={() => { setMode("login"); setError(""); }}
                    className="text-xs text-muted-foreground hover:text-primary block w-full"
                  >
                    ← Back to login
                  </button>
                )}
              </div>
            </>
          )}
        </form>

        <div className="border-t border-border/40 p-3 text-center">
          <p className="text-[10px] text-muted-foreground">
            By continuing, you agree to our terms. We don&apos;t share your data.
          </p>
        </div>
      </div>
    </div>
  );
}
