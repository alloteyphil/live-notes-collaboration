# Implementation Tasks

## Phase 0: Foundation

- [ ] Initialize Next.js + TypeScript project.
- [ ] Install and configure Convex.
- [ ] Set environment variables for local development.
- [ ] Add basic layout and navigation shell.

## Phase 1: Auth and Workspace

- [ ] Implement auth provider and sign-in/out flows.
- [ ] Create user bootstrap logic in backend.
- [ ] Build workspace list page.
- [ ] Add create workspace action.

## Phase 2: Notes CRUD

- [ ] Define Convex schema for workspaces, members, notes.
- [ ] Implement note list query by workspace.
- [ ] Implement create/rename/archive note mutations.
- [ ] Build dashboard note list UI with loading/empty states.

## Phase 3: Live Collaboration

- [ ] Build note editor page.
- [ ] Wire realtime note subscriptions.
- [ ] Add debounced content autosave mutation.
- [ ] Add collaborator presence indicator.
- [ ] Handle optimistic updates and rollback on error.

## Phase 4: Permissions and Stability

- [ ] Add role-based guards in all backend mutations/queries.
- [ ] Add input validation and error messages.
- [ ] Add pagination for large note lists.
- [ ] Add retry and failure UX for transient network errors.

## Phase 5: Portfolio Polish

- [ ] Add polished landing page and feature walkthrough.
- [ ] Write architecture section in README.
- [ ] Record demo GIF/video.
- [ ] Add tests for critical queries/mutations.
- [ ] Deploy frontend and backend.

## Stretch Goals

- [ ] Full-text note search.
- [ ] Note version history timeline.
- [ ] Shareable invite links.
- [ ] Comment threads per note section.
