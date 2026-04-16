# Implementation Status

Last updated: 2026-04-16

## Completed so far

## Authentication

- Better Auth integrated with Convex.
- Sign up, sign in, and sign out are working in UI.
- Session-aware protected views on dashboard/workspace/note routes.

## Workspace management

- Create workspace flow implemented.
- Workspace list and open workspace navigation implemented.
- Member management view per workspace.
- Owner can invite members by email with role (`editor` / `viewer`).
- Invite claim flow runs reactively from dashboard while invited user is online.
- Owner can update member role, remove members, and revoke pending invites.

## Notes and editor

- Create notes from workspace page.
- Create notes from templates (default/global + workspace templates).
- Open note editor route by note id.
- Low-latency autosave for title and content.
- Manual save shortcut (`Cmd/Ctrl+S`) and blur flush save.
- Save status + last saved metadata in editor.
- Offline-aware retry path for failed saves with exponential backoff.
- Save failure and recovery toast feedback.
- Note lifecycle controls:
  - Archive / unarchive notes.
  - Delete notes (with related presence/comments/revisions cleanup).
- Version history and restore:
  - Revision snapshots are recorded on meaningful note changes.
  - Restore previous revision from note editor history panel.

## Realtime collaboration

- Presence tracking per note.
- Active collaborator list in note editor.
- Typing indicators for active collaborators.
- Identity chips with initials, display name, email, and `(You)` marker.
- Lightweight comments with resolve/reopen status.
- `@email` mention parsing from comments.
- Mention-driven notifications persisted in backend (read/unread model).

## Discovery and productivity

- Workspace note search (title + content snippets).
- Workspace notes view supports archived note visibility toggle.
- Template-assisted note creation flow exposed in workspace UI.

## UI and DX

- Tailwind CSS v4 configured.
- Lively landing page redesign.
- Shared UI primitives for:
  - `Button`, `Input`, `Textarea`
  - `Card`, `Badge`, `Label`, `Separator`
  - `Skeleton`, `EmptyState`, `StateMessage`, `PageHeader`
- `lucide-react` icon system standardized through `src/components/ui/icons.tsx`.
- Cursor pagination with `Load more` UX for:
  - `/dashboard` workspace list
  - `/workspace/[id]` notes list
- Core routes now follow a shared app shell and state-surface conventions.
- UI guardrails documented in `docs/PRODUCT/UI_DESIGN_SYSTEM.md`.
- Core routes available:
  - `/`
  - `/dashboard`
  - `/workspace/[id]`
  - `/note/[id]`
  - `/workspace/[id]/whiteboard`

## Whiteboard

- Per-workspace whiteboard route implemented at `/workspace/[id]/whiteboard`.
- Excalidraw embedded client-side with a Convex-backed persisted scene.
- Whiteboard scene is stored per workspace and autosaved with debounce.
- Whiteboard scene updates reactively across connected clients (no manual refresh required).
- Workspace `viewer` role can open the board in read-only mode.

## Security and admin hardening

- Destructive admin reset now requires authenticated user + admin email allowlist.
- Admin reset coverage includes `whiteboards` table in addition to notes/workspaces/presence/invites/members.

## Known limitations

- No owner transfer flow yet.
- No invite email sending (invites are in-app and claimed on sign-in).
- Editor is low-latency autosave, not CRDT/OT true per-character merge.
- Whiteboard has basic live scene sync only (no multi-cursor presence or conflict-aware merging yet).
- Screen share collaboration is deferred to a later phase.
- Comment system is lightweight and not inline-anchor/range-aware yet.
- Notifications are backend-complete but do not yet have a dedicated inbox UI in navigation.

## Suggested next milestones

1. Add notifications inbox UI (mark read, unread badge, deep links).
2. Add inline/range-anchored comments in note editor.
3. Add template management UI (create/edit/delete templates in workspace settings).
4. Add stronger note search ranking and highlight matches in editor.
5. Add test coverage for archive/delete/revision restore/comment mention flows.
6. Add realtime multi-user whiteboard synchronization (presence + conflict handling).
