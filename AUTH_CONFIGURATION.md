# Authentication configuration

This application uses NextAuth.js v4 with the Credentials provider and JWT sessions.

## Required deployment environment

Configure these variables in the hosting provider's secret/environment settings. Do not commit real values to Git.

- `ADMIN_EMAIL`: bootstrap administrator email address.
- `ADMIN_PASSWORD`: unique bootstrap administrator password with at least 16 characters.
- `NEXTAUTH_SECRET`: cryptographically random secret used by NextAuth to sign/encrypt session tokens. Generate one with `openssl rand -base64 32`.
- `NEXTAUTH_URL`: canonical public application URL (for example, `https://studio.example.com`).

If the administrator email/password are absent or the password is shorter than 16 characters, the bootstrap administrator is not created and credential sign-in fails closed. There is no built-in default password.

## Request and session flow

1. The browser submits email and password to NextAuth's Credentials provider through `/api/auth/[...nextauth]`.
2. `authorize()` normalizes the email and verifies the password against a salted scrypt hash.
3. On success, NextAuth creates a JWT session. The application adds the user ID, role and permission list to the token and exposes those claims on the server session.
4. Protected API routes call `requireUser()`, `requirePermission()` or `requireAdmin()`. Each guard checks the current process-local user registry; permission checks do not rely only on the role/permission values copied into the JWT at sign-in.
5. The session lifetime is currently seven days. This is a JWT session, not an OAuth access/refresh-token flow.

## Protected API permissions

- Video generation and rendering: `generate`
- Image generation: `image_gen`
- Voice generation: `voice_gen`
- Title generation: `title_gen`
- User administration: `manage_users` through admin-only routes

Unauthenticated requests receive 401 responses; authenticated users without the required permission receive 403 responses.

## Important deployment limitation

The user registry is still process-local memory. Additional users and password changes are lost when a server process restarts and are not shared between serverless instances. The request guards re-check the current in-process record, so deleted users or changed permissions are rejected on that instance; however, different instances can still hold different registry state, and the JWT itself remains valid until expiry.

**Do not treat multi-user administration as production-ready until the registry is moved to a persistent database, account mutations are made transactionally, and role changes/password resets can revoke or rotate sessions.** The Prisma schema currently present in this repository is not wired into this authentication module.

## Operational security

- Use HTTPS in production and set a strong, unique `NEXTAUTH_SECRET`.
- Never put credentials in source code, client-side environment variables, screenshots or logs.
- Rotate any credentials that may previously have used the old built-in fallback.
- After configuring secrets, test sign-in, sign-out, unauthenticated API access, non-admin access to admin routes, and password change behavior in the deployed environment.
