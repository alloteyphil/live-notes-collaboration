# Live Collaboration Notes App PRD

## Product Overview

Build a web app where multiple users can create, edit, and organize notes together in real time. The project should be portfolio-ready, with clear architecture and production-minded decisions.

## Goals

- Ship a polished MVP that demonstrates real-time collaboration.
- Showcase strong full-stack engineering for CV and interviews.
- Keep architecture simple enough for fast iteration.

## Target Users

- Students collaborating on class notes.
- Small teams sharing meeting notes.
- Individuals wanting fast, cloud-synced notes.

## Core Features (MVP)

- User sign-in and session management.
- Workspace dashboard showing note list.
- Create, rename, delete, and archive notes.
- Rich text or markdown note editor.
- Real-time multi-user editing updates.
- Real-time presence indicators (who is viewing/editing).
- Auto-save and optimistic updates.

## Nice-to-Have Features (Post-MVP)

- Folder/tag organization.
- Full-text search.
- Note version history.
- Sharing links and role-based permissions.
- Comment threads.

## Non-Goals (Initial Release)

- Native mobile apps.
- End-to-end encryption.
- Offline-first sync conflict engine.
- Third-party integrations (Google Docs, Notion import).

## Success Metrics

- User can create account and first note in under 2 minutes.
- Live edits visible to other collaborators in less than 500 ms.
- 99% successful save operations in normal network conditions.
- Lighthouse performance score above 85 for dashboard/editor routes.

## Risks

- Real-time conflict handling can become complex.
- Auth and permissions may grow scope quickly.
- Rich text editing edge cases can consume time.

## Release Plan

- Phase 1: Auth, note CRUD, dashboard.
- Phase 2: Real-time editing and presence.
- Phase 3: Polish, tests, deployment, and docs.
