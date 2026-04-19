# Architecture

## Stack

- Frontend: Next.js (App Router) + TypeScript
- Backend: Convex (queries, mutations, realtime subscriptions)
- State/Data Fetching: Convex React client
- Auth: Clerk (hosted) + Convex auth provider validating Clerk JWTs
- Styling: Tailwind CSS v4
- Hosting: Vercel (frontend) + Convex managed backend

## Why This Stack

- TypeScript end-to-end improves safety and developer speed.
- Convex provides real-time sync out of the box.
- Next.js offers production-ready routing and deployment ergonomics.
- Combined stack is modern and interview-friendly.

## High-Level Data Flow

1. User opens app and authenticates.
2. Next.js renders dashboard/editor UI.
3. UI reads notes through Convex queries.
4. User edits trigger Convex mutations.
5. Convex pushes updates to all subscribed clients in real time.
6. Presence state updates for active collaborators.

## Core Modules

- `src/app/`: routes and layout.
- `src/components/`: editor, note list, presence UI (planned extraction).
- `src/lib/`: utility functions and client config.
- `convex/`: backend schema, queries, and mutations.

## Realtime Strategy

- Store note documents in Convex.
- Subscribe clients to note updates by note id.
- Apply optimistic UI updates for low perceived latency.
- Use server timestamp fields for ordering and conflict handling.

## Security and Permissions

- All write operations require authenticated user.
- Permission checks in Convex functions:
  - owner can delete/share
  - collaborator can edit
  - viewer can read only
- Avoid exposing private notes via broad list queries.

## Scalability Notes

- Paginate note lists for large workspaces.
- Index by `workspaceId`, `updatedAt`, and ownership fields.
- Keep note content and metadata separated if documents become large.

## Observability

- Add client error boundaries.
- Log mutation failures with user-friendly retry messaging.
- Track key product metrics (note creations, active collaborators).
