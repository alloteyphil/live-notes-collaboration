# Roadmap

## Phase 0: Foundation

- [x] Initialize Next.js + TypeScript project.
- [x] Install and configure Convex.
- [x] Configure Clerk + Convex integration (migrated from Better Auth).
- [x] Add base layout and landing page.

## Phase 1: Auth and Workspace

- [x] Sign in/sign up/sign out flows.
- [x] Workspace list page.
- [x] Create workspace mutation and UI.
- [x] Workspace member list and invite UI.
- [x] Invite claim flow on dashboard load.

## Phase 2: Notes CRUD

- [x] Convex schema for workspaces, members, notes.
- [x] List notes by workspace.
- [x] Create note from workspace page.
- [x] Note detail page routing.

## Phase 3: Editor and Autosave

- [x] Note editor page (`/note/[id]`).
- [x] Low-latency autosave for title and content.
- [x] Save status indicators.
- [x] Keyboard shortcut save (Cmd/Ctrl+S).
- [x] Blur-triggered immediate save.

## Phase 4: Collaboration and Hardening

- [x] Presence indicators by note.
- [x] Typing indicator and collaborator identity chips.
- [x] Role matrix hardening for member mutations (remove member, role changes).
- [x] Revoke pending invites (owner-only).
- [x] Retry and error UX for save failures.
- [x] Pagination for large workspace/note sets.

## Phase 5: Portfolio Polish

- [x] Component library pass (buttons, inputs, cards).
- [x] UI consistency uplift across core routes (shared shell, icons, state surfaces).
- [ ] README case study and architecture diagram.
- [ ] Demo video/GIF.
- [ ] Deploy and capture production URL.

## Phase 6: Future Features

- [x] Realtime whiteboard per workspace (MVP via Excalidraw embed).
- [ ] Workspace screen share for live collaboration sessions (deferred).
