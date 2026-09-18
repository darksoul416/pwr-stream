import { NextRequest, NextResponse } from "next/server";
import { createUser } from "../[nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const user = await createUser(email, password, name);

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (e: any) {
    const status = e.message.includes("already exists") ? 409 : 500;
    return NextResponse.json({ error: e.message || "Something went wrong" }, { status });
  }
}
