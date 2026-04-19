---
name: notes-release-verification
description: Runs release-safe verification for this notes app after code changes. Use when finishing feature/auth work to execute lint/type checks and targeted collaboration smoke tests before handoff.
---
# Notes Release Verification

## Command Checklist

Run in this order:

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build` (use safe env stubs if secrets are absent)

If Convex function signatures changed:

4. `npx convex dev` (or `npx convex codegen` when applicable)

## Auth + Convex Smoke Tests

Validate manually:

- `/sign-up` creates an account.
- `/sign-in` logs in successfully.
- `/dashboard` loads without `Unauthorized`.
- `/workspace/[id]` opens for members only.
- `/note/[id]` honors role-based edit/read-only behavior.
- `/workspace/[id]/whiteboard` honors role-based edit/read-only behavior.
- Sign out returns to public experience.

## Collaboration Smoke Tests

Use two sessions:

- Invite flow: owner invites, recipient logs in, invite auto-claims.
- Note collaboration: edits visible in near real time.
- Presence: collaborator and typing indicators update.

## Failure Triage

- `Unauthorized` after login:
  - verify Convex env `CLERK_JWT_ISSUER_DOMAIN`
  - verify `ConvexProviderWithClerk` wiring
  - verify protected queries are gated on `useConvexAuth().isAuthenticated`
- Type errors in generated API:
  - run `npx convex dev`
- Build-only route errors:
  - clear stale `.next` and rebuild.
