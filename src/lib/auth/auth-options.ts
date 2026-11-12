import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Bootstrap credentials must be explicitly configured in the deployment environment.
// Never ship a predictable fallback administrator account.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export type UserRole = "admin" | "editor" | "viewer";

interface StoredUser {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  role: UserRole;
  permissions: string[];
  createdAt: string;
}

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ["manage_users", "generate", "download", "post", "image_gen", "voice_gen", "title_gen", "delete_history"],
  editor: ["generate", "download", "post", "image_gen", "voice_gen", "title_gen", "delete_history"],
  viewer: ["view", "download"],
};

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

function verifyPassword(password: string, encoded: string): boolean {
  const [scheme, saltHex, hashHex] = encoded.split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;

  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    if (salt.length !== 16 || expected.length !== 64) return false;
    const actual = scryptSync(password, salt, expected.length, {
      N: 16384,
      r: 8,
      p: 1,
      maxmem: 64 * 1024 * 1024,
    });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// This store is intentionally process-local for now. It is not durable or
// suitable for multi-instance/serverless deployments; use a persistent DB before
// enabling public multi-user registration in production.
const users: StoredUser[] =
  ADMIN_EMAIL && ADMIN_PASSWORD && ADMIN_PASSWORD.length >= 16
    ? [{
        id: "admin-default",
        email: ADMIN_EMAIL,
        name: "Admin",
        passwordHash: hashPassword(ADMIN_PASSWORD),
        role: "admin",
        permissions: ROLE_PERMISSIONS.admin,
        createdAt: new Date().toISOString(),
      }]
    : [];

export function getUsers() {
  return users.map(({ passwordHash, ...user }) => user);
}

export function addUser(email: string, name: string, password: string, role: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error("User already exists");
  }
  if (password.length < 12) throw new Error("Password must be at least 12 characters");
  const userRole = (["admin", "editor", "viewer"].includes(role) ? role : "viewer") as UserRole;
  const user: StoredUser = {
    id: randomUUID(),
    email: normalizedEmail,
    name: name || null,
    passwordHash: hashPassword(password),
    role: userRole,
    permissions: ROLE_PERMISSIONS[userRole],
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return user;
}

export function deleteUser(id: string) {
  const idx = users.findIndex((user) => user.id === id);
  if (idx === -1) throw new Error("User not found");
  if (users[idx].id === "admin-default") throw new Error("Cannot delete default admin");
  users.splice(idx, 1);
}

export function changePassword(id: string, oldPassword: string, newPassword: string) {
  const user = users.find((candidate) => candidate.id === id);
  if (!user) throw new Error("User not found");
  if (!verifyPassword(oldPassword, user.passwordHash)) {
    throw new Error("Current password is incorrect");
  }
  if (newPassword.length < 12) throw new Error("New password must be at least 12 characters");
  user.passwordHash = hashPassword(newPassword);
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export function hasPermission(userEmail: string, permission: string): boolean {
  const user = users.find((candidate) => candidate.email === userEmail.trim().toLowerCase());
  if (!user) return false;
  return user.permissions.includes(permission) || user.role === "admin";
}

export function getUserByEmail(email: string) {
  const user = users.find((candidate) => candidate.email === email.trim().toLowerCase());
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  providers: [
    CredentialsProvider({
      name: "Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.trim().toLowerCase();
        const user = users.find((candidate) => candidate.email === email);
        if (!user || !verifyPassword(credentials.password, user.passwordHash)) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
        const storedUser = users.find((candidate) => candidate.email === (user as any).email);
        token.permissions = storedUser?.permissions || [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = (token as any).role;
        (session.user as any).id = (token as any).id;
        (session.user as any).permissions = (token as any).permissions;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/?login=1" },
};
