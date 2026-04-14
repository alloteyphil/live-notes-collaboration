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
    createdAt: v.number(),
  })
    .index("by_workspace_id_and_token_identifier", [
      "workspaceId",
      "tokenIdentifier",
    ])
    .index("by_token_identifier", ["tokenIdentifier"]),

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
});
