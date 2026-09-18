import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { findUser } from "../[nextauth]/route";

// In-memory reset tokens (works for demo; use DB for production)
declare global {
  var __resetTokens: Map<string, { email: string; expiry: number }> | undefined;
}

function getResetTokens() {
  if (!global.__resetTokens) global.__resetTokens = new Map();
  return global.__resetTokens;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await findUser(email);
    
    // Don't reveal if email exists
    const message = "If an account exists, a reset link has been sent.";

    if (!user) {
      return NextResponse.json({ success: true, message });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = Date.now() + 60 * 60 * 1000; // 1 hour

    getResetTokens().set(token, { email: user.email, expiry });

    // Send email if Resend is configured
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/#reset=${token}`;

    if (process.env.RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Mobiman <noreply@mobiman.app>",
            to: [email],
            subject: "Password Reset - Mobiman",
            html: `
              <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
                <h2 style="color: #7c3aed;">🦸 Mobiman — Password Reset</h2>
                <p>You requested a password reset for your Mobiman account.</p>
                <p>Click the button below to set a new password:</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">Reset Password</a>
                <p style="color: #666; font-size: 12px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
              </div>
            `,
          }),
        });
      } catch (e) {
        console.error("[password-reset] Failed to send email:", e);
      }
    }

    // In dev mode (no Resend), return the reset URL
    const isDev = !process.env.RESEND_API_KEY;
    return NextResponse.json({
      success: true,
      message,
      ...(isDev ? { devResetUrl: resetUrl } : {}),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Something went wrong" }, { status: 500 });
  }
}
