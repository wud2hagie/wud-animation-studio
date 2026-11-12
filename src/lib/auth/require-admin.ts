import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";
import { getUserByEmail, hasPermission } from "./auth-options";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { ok: false as const, status: 401, message: "Login required" };
  // Re-check the live user registry rather than trusting a possibly stale JWT role claim.
  const user = getUserByEmail(session.user.email);
  if (!user) return { ok: false as const, status: 401, message: "Account is no longer active" };
  if (user.role !== "admin") return { ok: false as const, status: 403, message: "Admin access required" };
  return { ok: true as const, email: user.email };
}

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { ok: false as const, status: 401, message: "Login required" };
  const user = getUserByEmail(session.user.email);
  if (!user) return { ok: false as const, status: 401, message: "Account is no longer active" };
  return { ok: true as const, email: user.email };
}

export async function requirePermission(permission: string) {
  const auth = await requireUser();
  if (!auth.ok) return auth;
  if (!hasPermission(auth.email, permission)) {
    return { ok: false as const, status: 403, message: "Permission required" };
  }
  return auth;
}
