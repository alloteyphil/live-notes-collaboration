# Troubleshooting

## Better Auth default secret error

Error example:

`You are using the default secret. Please set BETTER_AUTH_SECRET...`

Fix:

```bash
npx convex env set BETTER_AUTH_SECRET "<strong-random-secret>"
npx convex env set SITE_URL "http://localhost:3000"
npx convex env list
```

Restart `npx convex dev`.

## Auth works locally but Convex functions return Unauthorized

Checklist:

- `convex/auth.config.ts` exists and is valid.
- App is wrapped with `ConvexBetterAuthProvider`.
- Better Auth route exists at `src/app/api/auth/[...all]/route.ts`.
- `NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_CONVEX_SITE_URL` are correct.

## Type errors after adding new Convex functions

- Run `npx convex dev` to regenerate `convex/_generated/*`.
- Re-run `npx tsc --noEmit`.

## Can’t access workspace or note routes

- Make sure you are signed in.
- Verify membership in `workspaceMembers`.
- Use links from `/dashboard` instead of typing ids manually.
