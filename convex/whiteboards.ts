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
  const memberships = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_workspace_id_and_token_identifier", (q) =>
      q.eq("workspaceId", workspaceId).eq("tokenIdentifier", tokenIdentifier),
    )
    .take(5);
  return memberships.sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;
};

const getWhiteboardsByWorkspace = async (
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">,
) => {
  return ctx.db
    .query("whiteboards")
    .withIndex("by_workspace_id", (q) => q.eq("workspaceId", workspaceId))
    .take(5);
};

export const get = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const membership = await getMembership(
      ctx,
      args.workspaceId,
      identity.tokenIdentifier,
    );
    if (!membership) {
      return null;
    }

    const whiteboards = await getWhiteboardsByWorkspace(ctx, args.workspaceId);
    const whiteboard = whiteboards.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;

    return {
      whiteboard,
      currentUserRole: membership.role,
      canEdit: membership.role !== "viewer",
    };
  },
});

export const save = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    sceneData: v.string(),
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
    const existingRows = await getWhiteboardsByWorkspace(ctx, args.workspaceId);
    const sortedRows = existingRows.sort((a, b) => b.updatedAt - a.updatedAt);
    const existing = sortedRows[0];
    const duplicates = sortedRows.slice(1);

    if (existing) {
      if (existing.sceneData === args.sceneData) {
        if (duplicates.length > 0) {
          await Promise.all(duplicates.map((row) => ctx.db.delete(row._id)));
        }
        return existing._id;
      }
      await ctx.db.patch(existing._id, {
        sceneData: args.sceneData,
        updatedByTokenIdentifier: identity.tokenIdentifier,
        updatedAt: now,
      });
      if (duplicates.length > 0) {
        await Promise.all(duplicates.map((row) => ctx.db.delete(row._id)));
      }
      return existing._id;
    }

    return ctx.db.insert("whiteboards", {
      workspaceId: args.workspaceId,
      sceneData: args.sceneData,
      updatedByTokenIdentifier: identity.tokenIdentifier,
      updatedAt: now,
    });
  },
});
