---
name: notes-docs-sync
description: Keeps project docs aligned with code changes in this notes app. Use when auth, architecture, runbooks, or workflows change so README and docs stay current and deployment-safe.
---
# Notes Docs Sync

## Update Targets

When behavior changes, update the smallest relevant doc set:

- Setup/auth/env:
  - `README.md`
  - `docs/RUNBOOK/LOCAL_DEV.md`
  - `docs/RUNBOOK/TROUBLESHOOTING.md`
- Architecture/decisions:
  - `docs/ARCH/ARCHITECTURE.md`
  - `docs/ARCH/DECISIONS.md`
- Product status:
  - `docs/PRODUCT/IMPLEMENTATION_STATUS.md`
  - `docs/PRODUCT/ROADMAP.md`

## Required Sync Rules

1. Env vars in docs must match current code.
2. Auth provider references must be consistent (Clerk + Convex).
3. Runbook troubleshooting must include current failure modes.
4. If migration behavior changed (e.g., fresh start/no user migration), state it clearly.
5. Keep examples executable and copy/paste safe.

## Auth Docs Baseline

Current expected values:

- Next.js env:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `NEXT_PUBLIC_CONVEX_URL`
- Convex env:
  - `CLERK_JWT_ISSUER_DOMAIN`

## Completion Check

Before handoff:

- Verify docs mention current routes (`/sign-in`, `/sign-up`).
- Verify docs explain production vs development key differences.
- Verify troubleshooting includes Convex `Unauthorized` checklist.
