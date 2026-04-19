# Case study: Live Collaboration Notes

## Problem

Small teams and students need a lightweight place to capture meeting notes and class material together, with less setup than a full document suite and clearer collaboration signals than a static file share.

## Approach

The app combines **Next.js (App Router)** for routing and UI, **Convex** for data, auth-aware functions, and realtime subscriptions, and **Clerk** for hosted sign-in. Workspaces scope membership and roles (`owner`, `editor`, `viewer`). Notes autosave from the editor; presence and typing indicators show who is active on a note.

## Notable technical decisions

- **Autosave with debounce** instead of full CRDT merge keeps the editor simple while still feeling responsive; role changes and archive state are enforced server-side.
- **Convex search** powers workspace note search over content plus title matching.
- **Notifications** for `@email` mentions are stored per user and surfaced in a global inbox (nav bell) with deep links into the note and comments panel.
- **Invite links** use an unguessable token and a dedicated `/join/[token]` route; email matching prevents token sharing from granting access to the wrong account.
- **Whiteboard** uses Excalidraw with a persisted Convex document for the workspace scene.

## Outcomes

The stack demonstrates end-to-end TypeScript, realtime UX, and production-minded touches: pagination on large lists, revision history with restore, comment threads, template-based note creation, and runbooks for local development and troubleshooting.

## Links

- [Architecture overview](../ARCH/ARCHITECTURE.md)
- [Architecture diagram](../ARCH/ARCHITECTURE_DIAGRAM.md)
- [Implementation status](./IMPLEMENTATION_STATUS.md)
