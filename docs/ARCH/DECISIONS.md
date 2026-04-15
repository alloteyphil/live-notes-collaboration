# Engineering Decisions

## ADR-001: Next.js App Router

- Status: accepted
- Decision: Use Next.js App Router for frontend routing and page composition.
- Why: Fast iteration, server/client boundary support, and strong ecosystem.

## ADR-002: Convex for backend and realtime

- Status: accepted
- Decision: Use Convex for schema, queries, mutations, and realtime subscriptions.
- Why: Reduces infrastructure complexity and accelerates collaborative features.

## ADR-003: Better Auth integrated with Convex

- Status: accepted
- Decision: Use Better Auth with `@convex-dev/better-auth` component and JWT provider config.
- Why: Keeps auth and data authorization tightly integrated while preserving TypeScript ergonomics.

## ADR-004: Tailwind CSS v4 UI foundation

- Status: accepted
- Decision: Use Tailwind v4 for styling and component primitives.
- Why: High speed of implementation, design consistency, and easy refactors.

## ADR-005: Route-first MVP delivery

- Status: accepted
- Decision: Ship by vertical routes (`/dashboard`, `/workspace/[id]`, `/note/[id]`).
- Why: Ensures each milestone is demonstrable and testable end-to-end.
