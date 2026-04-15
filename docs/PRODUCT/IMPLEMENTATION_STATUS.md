# Implementation Status

Last updated: 2026-04-14

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
- Invite claim flow runs from dashboard after invited user signs in.

## Notes and editor

- Create notes from workspace page.
- Open note editor route by note id.
- Low-latency autosave for title and content.
- Manual save shortcut (`Cmd/Ctrl+S`) and blur flush save.
- Save status + last saved metadata in editor.

## Realtime collaboration

- Presence tracking per note.
- Active collaborator list in note editor.
- Typing indicators for active collaborators.
- Identity chips with initials, display name, email, and `(You)` marker.

## UI and DX

- Tailwind CSS v4 configured.
- Lively landing page redesign.
- Core routes available:
  - `/`
  - `/dashboard`
  - `/workspace/[id]`
  - `/note/[id]`

## Known limitations

- No remove-member action yet.
- No owner transfer or role change UI yet.
- No invite email sending (invites are in-app and claimed on sign-in).
- Editor is low-latency autosave, not CRDT/OT true per-character merge.

## Suggested next milestones

1. Add member removal + role update actions (owner-only).
2. Add invite acceptance UX and invite history states.
3. Extract shared UI components (`Button`, `Input`, `Card`, `Badge`).
4. Add retry path for failed saves and global toast notifications.
5. Add test coverage for workspace invites and note permissions.
