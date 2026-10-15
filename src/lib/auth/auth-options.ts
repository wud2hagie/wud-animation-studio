import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Environment-based admin credentials (no database needed — works on Netlify)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@wud.studio";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// In-memory user store (persists during the server lifecycle)
interface StoredUser {
  id: string;
  email: string;
  name: string | null;
  password: string;
  role: string;
  createdAt: string;
}

const users: StoredUser[] = [
  {
    id: "admin-default",
    email: ADMIN_EMAIL,
    name: "Admin",
    password: ADMIN_PASSWORD,
    role: "admin",
    createdAt: new Date().toISOString(),
  },
];

export function getUsers() {
  return users.map(({ password, ...u }) => u);
}

export function addUser(email: string, name: string, password: string, role: string) {
  const existing = users.find((u) => u.email === email);
  if (existing) throw new Error("User already exists");
  const user: StoredUser = {
    id: `user-${Date.now()}`,
    email,
    name: name || null,
    password,
    role: role === "admin" ? "admin" : "user",
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
      if (user) { token.role = (user as any).role; token.id = (user as any).id; }
      return token;
    },
    async session({ session, token }) {
      if (session.user) { (session.user as any).role = (token as any).role; (session.user as any).id = (token as any).id; }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/?login=1" },
};
