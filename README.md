# PulseNotes

A portfolio-focused realtime notes app built with:

- Next.js (App Router) + TypeScript
- Convex (backend + realtime)
- Clerk (hosted authentication) wired to Convex via `ConvexProviderWithClerk`
- Tailwind CSS v4

## Project Structure

- `src/` - frontend routes and UI.
- `convex/` - schema and backend functions.
- `docs/` - product, architecture, and runbook documentation.

## Latest Feature Additions

- Migrated authentication from Better Auth to Clerk (fresh-start, no user
  migration). Sign-up and sign-in now use Clerk-hosted routes at `/sign-up`
  and `/sign-in` to fix intermittent signup failures.
- Note lifecycle: archive, unarchive, and delete notes.
- Comment threads with resolve/reopen state.
- `@email` mention parsing in comments with backend notifications.
- **Notifications inbox** in the nav (read/unread, mark all read, deep links to notes and comments).
- Note revision history with restore flow.
- Workspace note search and template-based note creation.
- **Workspace Templates** tab: create, edit, and delete workspace-scoped templates.
- **Shareable invite links** (`/join/[token]`) with optional `redirect_url` on sign-in/sign-up; see `docs/RUNBOOK/INVITES.md`.
- **Transfer workspace ownership** to an existing editor (former owner becomes editor).
- **Markdown preview** in the note editor (Write / Preview).
- Hardened admin reset guardrails (`ADMIN_EMAILS` allowlist + whiteboard reset coverage).

## Portfolio

- **Case study:** [docs/PRODUCT/CASE_STUDY.md](docs/PRODUCT/CASE_STUDY.md)
- **Architecture diagram:** [docs/ARCH/ARCHITECTURE_DIAGRAM.md](docs/ARCH/ARCHITECTURE_DIAGRAM.md)
- **Demo checklist:** [docs/PRODUCT/DEMO.md](docs/PRODUCT/DEMO.md)
- **Production URL:** [https://pulse-notes.vercel.app/](https://pulse-notes.vercel.app/)

## Docs Index

- Product
  - `docs/PRODUCT/PRD.md`
  - `docs/PRODUCT/ROADMAP.md`
  - `docs/PRODUCT/IMPLEMENTATION_STATUS.md`
  - `docs/PRODUCT/CASE_STUDY.md`
  - `docs/PRODUCT/DEMO.md`
- Architecture
  - `docs/ARCH/ARCHITECTURE.md`
  - `docs/ARCH/ARCHITECTURE_DIAGRAM.md`
  - `docs/ARCH/DATA_MODEL.md`
  - `docs/ARCH/API_EVENTS.md`
  - `docs/ARCH/DECISIONS.md`
- Runbooks
  - `docs/RUNBOOK/LOCAL_DEV.md`
  - `docs/RUNBOOK/INVITES.md`
  - `docs/RUNBOOK/TROUBLESHOOTING.md`
  - `docs/RUNBOOK/COLLABORATION_TEST_PLAN.md`

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure Clerk:

   - Create a Clerk application at
     [dashboard.clerk.com](https://dashboard.clerk.com/apps/new).
   - Activate the Convex integration at
     `https://dashboard.clerk.com/apps/setup/convex` (this creates a JWT
     template named `convex` and returns a Frontend API URL).
   - Copy the publishable key, secret key, and Frontend API URL.

3. Set Next.js env in `.env.local` (dev) or your host (production):

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CONVEX_URL=https://<your-convex-deployment>.convex.cloud
# Optional but recommended in production: canonical site URL for copied invite links
# NEXT_PUBLIC_APP_URL=https://your-deployment.example
```

4. Set Convex env so it validates Clerk JWTs:

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://<your-clerk-frontend-api>"
```

5. Run Convex:

```bash
npx convex dev
```

6. Run Next.js in another terminal:

```bash
npm run dev
```

7. Open `http://localhost:3000` and click "Create account" or "Sign in".

## Production Notes

- Create a separate Clerk production instance; its publishable key, secret
  key, and Frontend API URL differ from development.
- Set the production `CLERK_JWT_ISSUER_DOMAIN` on the production Convex
  deployment (`npx convex env set --prod ...`) and the production Clerk keys
  on the host.
- Existing Better Auth users are intentionally not migrated; users will need
  to sign up again in Clerk.

## Testing

- Unit/integration tests:
  - `npm run test`
  - `npm run test:coverage`
- E2E smoke tests (Playwright):
  - Install browser once: `npx playwright install chromium`
  - Run: `npm run test:e2e`

Optional authenticated smoke paths:

- Set `PLAYWRIGHT_SMOKE_WORKSPACE_PATH` (example: `/workspace/<id>`)
- Set `PLAYWRIGHT_SMOKE_NOTE_PATH` (example: `/note/<id>`)

These two tests are skipped when env vars are not set.
