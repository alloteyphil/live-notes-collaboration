# Live Collaboration Notes

A portfolio-focused realtime notes app built with:

- Next.js (App Router) + TypeScript
- Convex (backend + realtime)
- Better Auth integrated with Convex
- Tailwind CSS v4

## Project Structure

- `src/` - frontend routes and UI.
- `convex/` - schema and backend functions.
- `docs/` - product, architecture, and runbook documentation.

## Docs Index

- Product
  - `docs/PRODUCT/PRD.md`
  - `docs/PRODUCT/ROADMAP.md`
  - `docs/PRODUCT/IMPLEMENTATION_STATUS.md`
- Architecture
  - `docs/ARCH/ARCHITECTURE.md`
  - `docs/ARCH/DATA_MODEL.md`
  - `docs/ARCH/API_EVENTS.md`
  - `docs/ARCH/DECISIONS.md`
- Runbooks
  - `docs/RUNBOOK/LOCAL_DEV.md`
  - `docs/RUNBOOK/TROUBLESHOOTING.md`
  - `docs/RUNBOOK/COLLABORATION_TEST_PLAN.md`

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Set required Convex env:

```bash
npx convex env set BETTER_AUTH_SECRET "<strong-random-secret>"
npx convex env set SITE_URL "http://localhost:3000"
```

3. Run Convex:

```bash
npx convex dev
```

4. Run Next.js in another terminal:

```bash
npm run dev
```

5. Open `http://localhost:3000`.
