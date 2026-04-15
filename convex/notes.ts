import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const requireIdentity = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  return identity;
};

const getMembership = async (
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">,
  tokenIdentifier: string,
) => {
  return ctx.db
    .query("workspaceMembers")
    .withIndex("by_workspace_id_and_token_identifier", (q) =>
      q.eq("workspaceId", workspaceId).eq("tokenIdentifier", tokenIdentifier),
    )
    .unique();
};

export const listByWorkspace = query({
  args: {
    workspaceId: v.id("workspaces"),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const membership = await getMembership(
      ctx,
      args.workspaceId,
      identity.tokenIdentifier,
    );

    if (!membership) {
      throw new Error("Forbidden");
    }

    if (args.includeArchived) {
      return ctx.db
        .query("notes")
        .withIndex("by_workspace_id_and_updated_at", (q) =>
          q.eq("workspaceId", args.workspaceId),
        )
        .order("desc")
        .take(50);
    }

    return ctx.db
      .query("notes")
      .withIndex("by_workspace_id_and_is_archived", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("isArchived", false),
      )
      .take(50);
  },
});

export const getById = query({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw new Error("Note not found");
    }

    const membership = await getMembership(
      ctx,
      note.workspaceId,
      identity.tokenIdentifier,
    );
    if (!membership) {
      throw new Error("Forbidden");
    }

    return note;
  },
});

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const membership = await getMembership(
      ctx,
      args.workspaceId,
      identity.tokenIdentifier,
    );

    if (!membership || membership.role === "viewer") {
      throw new Error("Forbidden");
    }

    const now = Date.now();
    return ctx.db.insert("notes", {
      workspaceId: args.workspaceId,
      title: args.title.trim(),
      content: "",
      isArchived: false,
      createdByTokenIdentifier: identity.tokenIdentifier,
      updatedByTokenIdentifier: identity.tokenIdentifier,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateTitle = mutation({
  args: {
    noteId: v.id("notes"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw new Error("Note not found");
    }

    const membership = await getMembership(
      ctx,
      note.workspaceId,
      identity.tokenIdentifier,
    );
    if (!membership || membership.role === "viewer") {
      throw new Error("Forbidden");
    }

    await ctx.db.patch(args.noteId, {
      title: args.title.trim(),
      updatedByTokenIdentifier: identity.tokenIdentifier,
      updatedAt: Date.now(),
    });
  },
});

export const updateContent = mutation({
  args: {
    noteId: v.id("notes"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw new Error("Note not found");
    }

    const membership = await getMembership(
      ctx,
      note.workspaceId,
      identity.tokenIdentifier,
    );
    if (!membership || membership.role === "viewer") {
      throw new Error("Forbidden");
    }

    await ctx.db.patch(args.noteId, {
      content: args.content,
      updatedByTokenIdentifier: identity.tokenIdentifier,
      updatedAt: Date.now(),
    });
  },
});
