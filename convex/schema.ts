import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  workspaces: defineTable({
    name: v.string(),
    ownerTokenIdentifier: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner_token_identifier", ["ownerTokenIdentifier"]),

  workspaceMembers: defineTable({
    workspaceId: v.id("workspaces"),
    tokenIdentifier: v.string(),
    role: v.union(v.literal("owner"), v.literal("editor"), v.literal("viewer")),
    displayName: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_workspace_id_and_token_identifier", [
      "workspaceId",
      "tokenIdentifier",
    ])
    .index("by_token_identifier", ["tokenIdentifier"]),

  workspaceInvites: defineTable({
    workspaceId: v.id("workspaces"),
    invitedEmail: v.string(),
    role: v.union(v.literal("editor"), v.literal("viewer")),
    status: v.union(v.literal("pending"), v.literal("accepted")),
    invitedByTokenIdentifier: v.string(),
    acceptedByTokenIdentifier: v.optional(v.string()),
    createdAt: v.number(),
    acceptedAt: v.optional(v.number()),
  })
    .index("by_workspace_id_and_invited_email", ["workspaceId", "invitedEmail"])
    .index("by_workspace_id_and_status", ["workspaceId", "status"])
    .index("by_invited_email_and_status", ["invitedEmail", "status"]),

  notes: defineTable({
    workspaceId: v.id("workspaces"),
    title: v.string(),
    content: v.string(),
    isArchived: v.boolean(),
    createdByTokenIdentifier: v.string(),
    updatedByTokenIdentifier: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace_id_and_updated_at", ["workspaceId", "updatedAt"])
    .index("by_workspace_id_and_is_archived", ["workspaceId", "isArchived"]),

  presence: defineTable({
    noteId: v.id("notes"),
    tokenIdentifier: v.string(),
    displayName: v.string(),
    userEmail: v.optional(v.string()),
    cursorPosition: v.optional(v.number()),
    isTyping: v.optional(v.boolean()),
    lastTypedAt: v.optional(v.number()),
    lastSeenAt: v.number(),
  })
    .index("by_note_id_and_last_seen_at", ["noteId", "lastSeenAt"])
    .index("by_note_id_and_token_identifier", ["noteId", "tokenIdentifier"]),
});
