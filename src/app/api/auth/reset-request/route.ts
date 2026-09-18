import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if email exists or not
      return NextResponse.json({
        success: true,
        message: "If an account exists, a reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry: expiry,
      },
    });

    // In production: send email with reset link
    // For now: return the token (dev mode) or log it
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/#reset=${resetToken}`;

    console.log("[password-reset] Reset link for ${email}: ${resetUrl}");

    // If Resend API is configured, send the email
    if (process.env.RESEND_API_KEY) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Netflix Clone <noreply@netflixclone.app>",
            to: [email],
            subject: "Password Reset - Netflix Clone",
            html: `
              <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
                <h2 style="color: #7c3aed;">Netflix Clone — Password Reset</h2>
                <p>You requested a password reset for your Netflix Clone account.</p>
                <p>Click the button below to set a new password:</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">Reset Password</a>
                <p style="color: #666; font-size: 12px;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        console.error("[password-reset] Failed to send email:", emailErr);
      }
    }

    // In dev mode, return the reset URL so we can test
    const isDev = !process.env.RESEND_API_KEY;
    return NextResponse.json({
      success: true,
      message: "If an account exists, a reset link has been sent.",
      ...(isDev ? { devResetUrl: resetUrl } : {}),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
