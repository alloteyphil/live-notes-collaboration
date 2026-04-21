# Local Development

## Prerequisites

- Node.js 20+
- npm
- Convex account and project linked via `npx convex dev`
- Clerk account with a development application created at
  [dashboard.clerk.com](https://dashboard.clerk.com/)

## Environment Sources

This project uses two env sources:

- Next.js local env (`.env.local`)
- Convex deployment env (`npx convex env ...`)

## Required `.env.local`

```env
CONVEX_DEPLOYMENT=<your deployment id>
NEXT_PUBLIC_CONVEX_URL=<your convex cloud url>

# Clerk (from the Clerk dashboard → API Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional: canonical public URL for workspace invite links (defaults to window.location.origin in the browser)
# NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Required Convex env

Set once so Convex validates Clerk JWTs. Get the Frontend API URL from
`https://dashboard.clerk.com/apps/setup/convex` after activating the Convex
integration:

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://<your-clerk-frontend-api>"
```

## Optional Convex env (recommended for admin tooling)

To allow `clearAppData` admin reset in `convex/admin.ts`, configure admin
emails (these must match the primary email of the signed-in Clerk user):

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

## Run tests

Unit/integration:

```bash
npm run test
```

Coverage:

```bash
npm run test:coverage
```

E2E smoke (Playwright):

```bash
npx playwright install chromium
npm run test:e2e
```

Optional authenticated E2E smoke targets:

```bash
PLAYWRIGHT_SMOKE_WORKSPACE_PATH=/workspace/<id> \
PLAYWRIGHT_SMOKE_NOTE_PATH=/note/<id> \
npm run test:e2e
```

## Typical flow

1. Click "Create account" on the home page and complete Clerk sign-up.
2. Land on the dashboard after authentication.
3. Create a workspace.
4. Open the workspace and create a note.
5. Open the note and test autosave.
