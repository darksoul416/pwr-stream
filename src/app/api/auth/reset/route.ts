import { NextRequest, NextResponse } from "next/server";
import { updateUserPassword } from "../[nextauth]/route";

declare global {
  var __resetTokens: Map<string, { email: string; expiry: number }> | undefined;
}

function getResetTokens() {
  if (!global.__resetTokens) global.__resetTokens = new Map();
  return global.__resetTokens;
}

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const tokens = getResetTokens();
    const resetData = tokens.get(token);

    if (!resetData || resetData.expiry < Date.now()) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    await updateUserPassword(resetData.email, password);
    tokens.delete(token); // Use once

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Something went wrong" }, { status: 500 });
  }
}
