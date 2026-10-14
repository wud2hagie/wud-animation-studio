import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-admin";

// GET /api/users — list all users (admin only)
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const users = await db.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ users });
}

// POST /api/users — add a new user (admin only)
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { email, name, password, role } = await req.json();
  if (!email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email: email.trim() } });
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 });
  }

  const user = await db.user.create({
    data: {
      email: email.trim(),
      name: name?.trim() || null,
      password: password.trim(),
      role: role === "admin" ? "admin" : "user",
    },
  });

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    message: "User created successfully",
  });
}

// DELETE /api/users — delete a user (admin only)
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  await db.user.delete({ where: { id: userId } });
  return NextResponse.json({ message: "User deleted" });
}
