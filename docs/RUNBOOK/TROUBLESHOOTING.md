# Troubleshooting

## Sign up doesn't create an account

All sign-up and sign-in flows now go through Clerk-hosted routes at `/sign-up`
and `/sign-in`. If account creation fails:

- Confirm `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are set in
  the Next.js environment (`.env.local` for dev, platform env for production).
- Verify the email is not already registered in the Clerk dashboard.
- Check Clerk's application settings for email/password being enabled and for
  any verification requirements (e.g. email code) that must be completed.
- If a signup succeeded on Clerk but Convex queries return Unauthorized, see
  "Convex returns Unauthorized" below.

## Convex returns Unauthorized after signing in

Checklist:

- `convex/auth.config.ts` exists and uses the Clerk issuer domain.
- `CLERK_JWT_ISSUER_DOMAIN` is set in the Convex deployment:
  ```bash
  npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://<your-clerk-frontend-api>"
  ```
- In the Clerk dashboard, the Convex integration is activated (JWT template
  named `convex` exists and includes `email`).
- The app is wrapped with `ClerkProvider` + `ConvexProviderWithClerk`.
- After changing `convex/auth.config.ts` or env vars, run `npx convex dev` so
  the backend picks up the new config.
- If the Clerk → Convex integration was just activated, sign out fully and
  sign back in to refresh the token.

## Type errors after adding new Convex functions

- Run `npx convex dev` to regenerate `convex/_generated/*`.
- Re-run `npx tsc --noEmit`.

## Can’t access workspace or note routes

- Make sure you are signed in (Clerk middleware protects everything except
  `/`, `/sign-in`, `/sign-up`, and `/join/*` invite links).
- Verify membership in `workspaceMembers`.
- Use links from `/dashboard` instead of typing ids manually.

## E2E tests fail with blocked Next.js dev origin

If Playwright (or another local tool) uses `127.0.0.1`, Next.js dev may block HMR/resource requests unless explicitly allowed.

- This repo allows `127.0.0.1` in `next.config.ts` via `allowedDevOrigins`.
- If you use a different origin locally, add it to `allowedDevOrigins` and restart `npm run dev`.
