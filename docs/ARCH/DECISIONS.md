# Engineering Decisions

## ADR-001: Next.js App Router

- Status: accepted
- Decision: Use Next.js App Router for frontend routing and page composition.
- Why: Fast iteration, server/client boundary support, and strong ecosystem.

## ADR-002: Convex for backend and realtime

- Status: accepted
- Decision: Use Convex for schema, queries, mutations, and realtime subscriptions.
- Why: Reduces infrastructure complexity and accelerates collaborative features.

## ADR-003: Clerk for authentication

- Status: accepted (supersedes earlier Better Auth decision)
- Decision: Use Clerk (`@clerk/nextjs`) for hosted sign-in/sign-up, with Convex configured to validate Clerk JWTs via `CLERK_JWT_ISSUER_DOMAIN` and `ConvexProviderWithClerk` on the client.
- Why: Hosted auth flows are more reliable than a custom email/password form (fixes intermittent signup failures), while Convex continues to authorize requests using the Clerk-issued JWT's `tokenIdentifier` and `email`.

## ADR-004: Tailwind CSS v4 UI foundation

- Status: accepted
- Decision: Use Tailwind v4 for styling and component primitives.
- Why: High speed of implementation, design consistency, and easy refactors.

## ADR-005: Route-first MVP delivery

- Status: accepted
- Decision: Ship by vertical routes (`/dashboard`, `/workspace/[id]`, `/note/[id]`).
- Why: Ensures each milestone is demonstrable and testable end-to-end.
