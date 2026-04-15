# Roadmap

## Phase 0: Foundation

- [x] Initialize Next.js + TypeScript project.
- [x] Install and configure Convex.
- [x] Configure Better Auth + Convex integration.
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
- [ ] Role matrix hardening for all mutations (remove member, role changes).
- [ ] Retry and error UX for save failures.
- [ ] Pagination for large workspace/note sets.

## Phase 5: Portfolio Polish

- [ ] Component library pass (buttons, inputs, cards).
- [ ] README case study and architecture diagram.
- [ ] Demo video/GIF.
- [ ] Deploy and capture production URL.
