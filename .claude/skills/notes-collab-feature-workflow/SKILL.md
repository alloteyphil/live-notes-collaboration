---
name: notes-collab-feature-workflow
description: Implements features in dashboard, workspace, note editor, comments, presence, and whiteboard for this notes app. Use when adding or modifying collaborative behavior, permissions, autosave, invites, or member role flows.
---
# Notes Collaboration Feature Workflow

## Scope

Use this workflow for edits across:

- Dashboard: `src/app/dashboard/page.tsx`
- Workspace: `src/app/workspace/[id]/page.tsx`
- Note editor: `src/app/note/[id]/page.tsx`
- Whiteboard: `src/app/workspace/[id]/whiteboard/page.tsx`
- Convex modules: `convex/workspaces.ts`, `convex/notes.ts`, `convex/comments.ts`, `convex/presence.ts`, `convex/whiteboards.ts`

## Core Invariants

1. Auth-linked ownership must use `identity.tokenIdentifier`.
2. Never accept user identifiers from client for authorization decisions.
3. Viewer role is read-only; editor/owner can mutate content.
4. Keep query results bounded (`paginate` or `take`), not unbounded `collect`.
5. Presence and autosave should degrade safely under network issues.

## Preferred Change Order

1. Update Convex schema/functions first (validators + auth checks).
2. Update generated API with `npx convex dev` (or ensure generated types are current).
3. Update UI hooks/components.
4. Update docs and run checks.

## Permission Pattern

- In Convex functions:
  - `const identity = await ctx.auth.getUserIdentity();`
  - Throw `Unauthorized` if null.
  - Resolve membership by `workspaceId + tokenIdentifier`.
  - Throw `Forbidden` when role lacks permission.

## UI Query Pattern

For protected queries in client pages:

- Use Clerk state for session info.
- Use Convex auth state for readiness.
- Skip protected queries until Convex auth is authenticated.

## Manual Scenarios To Preserve

- Workspace creation and list pagination.
- Invite send/revoke and auto-claim.
- Note create/archive/delete.
- Note autosave and revision restore.
- Comments resolve/reopen with mention behavior.
- Presence typing indicator and collaborator list.
- Whiteboard save/read-only behavior by role.
