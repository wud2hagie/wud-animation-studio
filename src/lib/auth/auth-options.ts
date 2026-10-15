import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Environment-based admin credentials (no database needed — works on Netlify)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@wud.studio";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Permission levels: admin > editor > viewer
// - admin: can manage users, generate, download, post
// - editor: can generate, download, post
// - viewer: can view generated content only
export type UserRole = "admin" | "editor" | "viewer";

interface StoredUser {
  id: string;
  email: string;
  name: string | null;
  password: string;
  role: UserRole;
  permissions: string[];
  createdAt: string;
}

// Default permissions per role
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ["manage_users", "generate", "download", "post", "image_gen", "voice_gen", "title_gen", "delete_history"],
  editor: ["generate", "download", "post", "image_gen", "voice_gen", "title_gen", "delete_history"],
  viewer: ["view", "download"],
};

// In-memory user store (persists during the server lifecycle)
const users: StoredUser[] = [
  {
    id: "admin-default",
    email: ADMIN_EMAIL,
    name: "Admin",
    password: ADMIN_PASSWORD,
    role: "admin",
    permissions: ROLE_PERMISSIONS.admin,
    createdAt: new Date().toISOString(),
  },
];

export function getUsers() {
  return users.map(({ password, ...u }) => u);
}

export function addUser(email: string, name: string, password: string, role: string) {
  const existing = users.find((u) => u.email === email);
  if (existing) throw new Error("User already exists");
  const userRole = (["admin", "editor", "viewer"].includes(role) ? role : "viewer") as UserRole;
  const user: StoredUser = {
    id: `user-${Date.now()}`,
    email,
    name: name || null,
    password,
    role: userRole,
    permissions: ROLE_PERMISSIONS[userRole],
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return user;
}

export function deleteUser(id: string) {
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error("User not found");
  if (users[idx].id === "admin-default") throw new Error("Cannot delete default admin");
  users.splice(idx, 1);
}

export function changePassword(id: string, oldPassword: string, newPassword: string) {
  const user = users.find((u) => u.id === id);
  if (!user) throw new Error("User not found");
  if (user.password !== oldPassword) throw new Error("Current password is incorrect");
  if (newPassword.length < 4) throw new Error("Password must be at least 4 characters");
  user.password = newPassword;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export function hasPermission(userEmail: string, permission: string): boolean {
  const user = users.find((u) => u.email === userEmail);
  if (!user) return false;
  return user.permissions.includes(permission) || user.role === "admin";
}

export function getUserByEmail(email: string) {
  const user = users.find((u) => u.email === email);
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
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
        const user = users.find((u) => u.email === credentials.email);
        if (!user) return null;
        if (user.password !== credentials.password) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
        const storedUser = users.find((u) => u.email === (user as any).email);
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
