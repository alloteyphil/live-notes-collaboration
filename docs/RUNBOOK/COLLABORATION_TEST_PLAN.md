# Collaboration Test Plan

Use this checklist after major collaboration changes.

## Setup

- Run `npx convex dev`.
- Run `npm run dev`.
- Use two browser sessions (or incognito + normal).
- Create two user accounts with different emails.

## Scenario A: Invite and join workspace

- [ ] User A creates workspace.
- [ ] User A invites User B as `editor`.
- [ ] User B signs in and opens `/dashboard`.
- [ ] User B sees invited workspace after auto-claim.

## Scenario B: Note editing visibility

- [ ] User A creates a note.
- [ ] User B opens same note.
- [ ] User A types and pauses.
- [ ] User B sees content updates quickly.

## Scenario C: Presence and typing

- [ ] Both users are on same note.
- [ ] Collaborator chips show both identities.
- [ ] `(You)` marker appears for current user.
- [ ] Typing indicator appears when the other user types.

## Scenario D: Permissions

- [ ] Viewer account can open note and read.
- [ ] Viewer account cannot modify title/content.
- [ ] Non-owner cannot invite additional members.

## Expected outcomes

- Collaboration feels near-realtime for normal typing cadence.
- Presence list and typing status remain accurate after tab close/reopen.
- No unauthorized mutation succeeds.
