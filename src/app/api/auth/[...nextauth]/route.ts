import NextAuth from "next-auth";
import { authOptions, ensureAdminUser } from "@/lib/auth/auth-options";

// Ensure default admin exists on first load
ensureAdminUser().catch(() => {});

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
