import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { ok: false as const, status: 401, message: "Login required" };
  const role = (session.user as any).role;
  if (role !== "admin") return { ok: false as const, status: 403, message: "Admin access required" };
  return { ok: true as const, email: session.user.email };
}

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { ok: false as const, status: 401, message: "Login required" };
  return { ok: true as const, email: session.user.email };
}
