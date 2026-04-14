# Data Model

## Entities

## User

- `id`: string
- `email`: string
- `name`: string
- `avatarUrl`: string | null
- `createdAt`: number

## Workspace

- `id`: string
- `name`: string
- `ownerId`: string (User.id)
- `createdAt`: number
- `updatedAt`: number

## WorkspaceMember

- `id`: string
- `workspaceId`: string
- `userId`: string
- `role`: "owner" | "editor" | "viewer"
- `createdAt`: number

## Note

- `id`: string
- `workspaceId`: string
- `title`: string
- `content`: string
- `createdBy`: string (User.id)
- `updatedBy`: string (User.id)
- `isArchived`: boolean
- `createdAt`: number
- `updatedAt`: number

## Presence (ephemeral)

- `noteId`: string
- `userId`: string
- `cursorPosition`: number | null
- `lastSeenAt`: number

## Relationships

- User has many WorkspaceMember records.
- Workspace has many members and many notes.
- Note belongs to one workspace.
- Presence belongs to a note and user session.

## Indexing Strategy

- `WorkspaceMember`: index by `userId`, `workspaceId`.
- `Note`: index by `workspaceId + updatedAt`.
- `Note`: index by `workspaceId + isArchived`.

## Permissions Rules

- Read note: user must be workspace member.
- Edit note: role must be owner/editor.
- Delete/archive note: owner/editor (configurable).
- Manage members: owner only.

## Validation Rules

- `title` length: 1 to 120 chars.
- `content` max length: set practical limit for MVP.
- Role value must match enum.
- Reject writes for non-members.
