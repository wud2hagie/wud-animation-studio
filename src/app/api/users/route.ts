import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getUsers, addUser, deleteUser } from "@/lib/auth/auth-options";

// GET /api/users — list all users (admin only)
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  return NextResponse.json({ users: getUsers() });
}

// POST /api/users — add a new user (admin only)
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { email, name, password, role } = await req.json();
  if (!email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  try {
    const user = addUser(email.trim(), name?.trim() || "", password.trim(), role === "admin" ? "admin" : "user");
    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      message: "User created successfully",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

// DELETE /api/users — delete a user (admin only)
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  try {
    deleteUser(userId);
    return NextResponse.json({ message: "User deleted" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
