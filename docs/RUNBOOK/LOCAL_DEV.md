# Local Development

## Prerequisites

- Node.js 20+
- npm
- Convex account and project linked via `npx convex dev`

## Environment Sources

This project uses two env sources:

- Next.js local env (`.env.local`)
- Convex deployment env (`npx convex env ...`)

## Required `.env.local`

```env
CONVEX_DEPLOYMENT=<your deployment id>
NEXT_PUBLIC_CONVEX_URL=<your convex cloud url>
NEXT_PUBLIC_CONVEX_SITE_URL=<your convex site url ending in .convex.site>
```

## Required Convex env

Set these once:

```bash
npx convex env set BETTER_AUTH_SECRET "<strong-random-secret>"
npx convex env set SITE_URL "http://localhost:3000"
```

## Optional Convex env (recommended for admin tooling)

To allow `clearAppData` admin reset in `convex/admin.ts`, configure admin emails:

```bash
npx convex env set ADMIN_EMAILS "admin1@example.com,admin2@example.com"
```

If `ADMIN_EMAILS` is not configured, destructive reset is intentionally blocked.

Verify:

```bash
npx convex env list
```

## Run app

Terminal 1:

```bash
npx convex dev
```

Terminal 2:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Typical flow

1. Sign up/sign in on home page.
2. Open dashboard.
3. Create workspace.
4. Open workspace and create note.
5. Open note and test autosave.
