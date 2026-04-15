# API and Realtime Events

## Conventions

- Read operations are Convex queries.
- Write operations are Convex mutations.
- Subscription updates are pushed automatically by Convex.

## Auth

- `auth.getCurrentUser`
  - Type: query
  - Returns current authenticated user profile.

## Workspaces

- `workspace.list`
  - Type: query
  - Returns workspaces for current user.

- `workspace.create`
  - Type: mutation
  - Input: `{ name: string }`
  - Returns created workspace id.

- `workspace.addMember`
  - Type: mutation
  - Input: `{ workspaceId: string, email: string, role: "editor" | "viewer" }`
  - Owner only.

## Notes

- `notes.listByWorkspace`
  - Type: query
  - Input: `{ workspaceId: string, includeArchived?: boolean }`
  - Returns paginated notes metadata.

- `notes.getById`
  - Type: query
  - Input: `{ noteId: string }`
  - Returns full note document.

- `notes.create`
  - Type: mutation
  - Input: `{ workspaceId: string, title: string }`
  - Returns new note id.

- `notes.updateTitle`
  - Type: mutation
  - Input: `{ noteId: string, title: string }`

- `notes.updateContent`
  - Type: mutation
  - Input: `{ noteId: string, content: string }`
  - Called with debounce from client.

- `notes.archive`
  - Type: mutation
  - Input: `{ noteId: string }`

- `notes.restore`
  - Type: mutation
  - Input: `{ noteId: string }`

## Presence

- `presence.heartbeat`
  - Type: mutation
  - Input: `{ noteId: string, cursorPosition?: number }`
  - Updates active user state.

- `presence.listByNote`
  - Type: query
  - Input: `{ noteId: string }`
  - Returns active collaborators.

## Realtime Channels (Conceptual)

- Note document channel: updates to title/content/metadata.
- Presence channel: active collaborators and cursor locations.
- Workspace list channel: note counts and latest timestamps.
