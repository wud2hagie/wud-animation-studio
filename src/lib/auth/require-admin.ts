import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";
import { db } from "@/lib/db";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { ok: false as const, status: 401, message: "Login required" };
  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.role !== "admin") return { ok: false as const, status: 403, message: "Admin access required" };
  return { ok: true as const, email: session.user.email };
}

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { ok: false as const, status: 401, message: "Login required" };
  return { ok: true as const, email: session.user.email };
}
