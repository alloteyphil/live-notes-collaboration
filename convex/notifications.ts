import { paginationOptsValidator } from "convex/server";
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

export const listMinePaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    return ctx.db
      .query("notifications")
      .withIndex("by_token_identifier_and_created_at", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_token_identifier_and_is_read", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier).eq("isRead", false),
      )
      .take(200);
    return unread.length;
  },
});

export const markRead = mutation({
  args: {
    notificationId: v.id("notifications"),
    isRead: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.tokenIdentifier !== identity.tokenIdentifier) {
      throw new Error("Notification not found");
    }
    await ctx.db.patch(args.notificationId, {
      isRead: args.isRead,
    });
    return { ok: true };
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_token_identifier_and_is_read", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier).eq("isRead", false),
      )
      .take(200);
    await Promise.all(unread.map((item) => ctx.db.patch(item._id, { isRead: true })));
    return { count: unread.length };
  },
});
