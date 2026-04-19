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
    .index("by_workspace_id_and_user_email", ["workspaceId", "userEmail"])
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
    /** Secret token for shareable invite links (optional for legacy rows). */
    claimToken: v.optional(v.string()),
  })
    .index("by_workspace_id_and_invited_email", ["workspaceId", "invitedEmail"])
    .index("by_workspace_id_and_status", ["workspaceId", "status"])
    .index("by_invited_email_and_status", ["invitedEmail", "status"])
    .index("by_claim_token", ["claimToken"]),

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
    .index("by_workspace_id_and_is_archived", ["workspaceId", "isArchived"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["workspaceId", "isArchived"],
    }),

  noteRevisions: defineTable({
    noteId: v.id("notes"),
    workspaceId: v.id("workspaces"),
    title: v.string(),
    content: v.string(),
    createdByTokenIdentifier: v.string(),
    createdAt: v.number(),
    reason: v.optional(v.string()),
  }).index("by_note_id_and_created_at", ["noteId", "createdAt"]),

  noteComments: defineTable({
    noteId: v.id("notes"),
    workspaceId: v.id("workspaces"),
    authorTokenIdentifier: v.string(),
    authorDisplayName: v.string(),
    authorEmail: v.optional(v.string()),
    content: v.string(),
    mentionEmails: v.array(v.string()),
    status: v.union(v.literal("open"), v.literal("resolved")),
    resolvedByTokenIdentifier: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_note_id_and_created_at", ["noteId", "createdAt"])
    .index("by_note_id_and_status", ["noteId", "status"]),

  notifications: defineTable({
    tokenIdentifier: v.string(),
    type: v.union(v.literal("mention"), v.literal("comment")),
    title: v.string(),
    body: v.string(),
    workspaceId: v.id("workspaces"),
    noteId: v.optional(v.id("notes")),
    commentId: v.optional(v.id("noteComments")),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_token_identifier_and_is_read", ["tokenIdentifier", "isRead"])
    .index("by_token_identifier_and_created_at", ["tokenIdentifier", "createdAt"])
    .index("by_note_id", ["noteId"]),

  noteTemplates: defineTable({
    scope: v.union(v.literal("global"), v.literal("workspace")),
    workspaceId: v.optional(v.id("workspaces")),
    title: v.string(),
    content: v.string(),
    createdByTokenIdentifier: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_scope_and_created_at", ["scope", "createdAt"])
    .index("by_workspace_id_and_created_at", ["workspaceId", "createdAt"]),

  whiteboards: defineTable({
    workspaceId: v.id("workspaces"),
    sceneData: v.string(),
    updatedByTokenIdentifier: v.string(),
    updatedAt: v.number(),
  }).index("by_workspace_id", ["workspaceId"]),

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
