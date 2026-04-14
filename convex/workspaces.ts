import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const requireIdentity = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  return identity;
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .take(50);

    const workspaces = await Promise.all(
      memberships.map((membership) => ctx.db.get(membership.workspaceId)),
    );

    return memberships
      .map((membership, index) => {
        const workspace = workspaces[index];
        if (!workspace) {
          return null;
        }
        return {
          ...workspace,
          role: membership.role,
        };
      })
      .filter((workspace) => workspace !== null);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const now = Date.now();

    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.name.trim(),
      ownerTokenIdentifier: identity.tokenIdentifier,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("workspaceMembers", {
      workspaceId,
      tokenIdentifier: identity.tokenIdentifier,
      role: "owner",
      createdAt: now,
    });

    return workspaceId;
  },
});
