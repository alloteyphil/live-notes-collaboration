---
name: notes-clerk-convex-auth
description: Implements and debugs Clerk + Convex authentication in this notes app. Use when changing sign-in/sign-up, middleware, Convex auth config, unauthorized errors, token readiness issues, or environment variables like CLERK_JWT_ISSUER_DOMAIN.
---
# Notes Clerk + Convex Auth

## Use This Skill For

- Clerk setup or migration work.
- Convex `Unauthorized` errors after successful sign-in.
- Route protection updates in App Router.
- Env/config drift between local and production.

## Project Auth Baseline

- Client provider: `src/app/providers.tsx` uses `ClerkProvider` + `ConvexProviderWithClerk`.
- Route protection: `src/middleware.ts` with public routes `/`, `/sign-in`, `/sign-up`.
- Convex JWT config: `convex/auth.config.ts` with `CLERK_JWT_ISSUER_DOMAIN` and `applicationID: "convex"`.

## Implementation Rules

1. Keep Clerk hosted pages under:
   - `src/app/sign-in/[[...sign-in]]/page.tsx`
   - `src/app/sign-up/[[...sign-up]]/page.tsx`
2. For protected Convex queries in React pages, gate on Convex auth readiness:
   - use `useConvexAuth()` and require `isAuthenticated`.
   - do not gate only on `useUser().isSignedIn`; that can race and cause `Unauthorized`.
3. Keep sign-out via Clerk: `signOut({ redirectUrl: "/" })`.
4. Keep Convex identity checks server-side with `ctx.auth.getUserIdentity()`.

## Unauthorized Debug Checklist

Run these checks in order:

1. Confirm Convex env:
   - `npx convex env list`
   - `CLERK_JWT_ISSUER_DOMAIN` must match Clerk Frontend API URL (`https://...clerk.accounts.dev`).
2. Confirm provider wiring in `src/app/providers.tsx`.
3. Confirm middleware protection/public routes in `src/middleware.ts`.
4. Ensure protected UI queries are skipped until Convex auth is authenticated.
5. Sign out and sign back in to refresh token.
6. Restart local processes: `npx convex dev` and `npm run dev`.

## Required Env

- Next.js:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `NEXT_PUBLIC_CONVEX_URL`
- Convex:
  - `CLERK_JWT_ISSUER_DOMAIN`

## Validation

After auth changes:

- `npx tsc --noEmit`
- `npm run lint`
- Manual:
  - sign up
  - sign in
  - sign out
  - open protected routes (`/dashboard`, `/workspace/[id]`, `/note/[id]`)
