import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireUser } from "@/lib/auth/require-admin";
import { getUsers, addUser, deleteUser, changePassword, hasPermission, getUserByEmail } from "@/lib/auth/auth-options";

// GET /api/users — list all users (admin only)
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  return NextResponse.json({ users: getUsers() });
}

// POST /api/users — add a new user (admin only) OR change password (any logged-in user)
export async function POST(req: NextRequest) {
  const body = await req.json();

  // If changing password (has oldPassword + newPassword, no email)
  if (body.oldPassword && body.newPassword && !body.email) {
    const auth = await requireUser();
    if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
    try {
      const user = getUserByEmail(auth.email);
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      const updated = changePassword(user.id, body.oldPassword, body.newPassword);
      return NextResponse.json({ user: updated, message: "Password changed successfully" });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
  }

  // Otherwise, adding a new user (admin only)
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { email, name, password, role } = body;
  if (!email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  try {
    const user = addUser(email.trim(), name?.trim() || "", password.trim(), role || "viewer");
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

// PATCH /api/users — check permission (used by client)
export async function PATCH(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { permission } = await req.json();
  if (!permission) return NextResponse.json({ error: "Permission required" }, { status: 400 });

  const allowed = hasPermission(auth.email, permission);
  return NextResponse.json({ allowed, permission, email: auth.email });
}
