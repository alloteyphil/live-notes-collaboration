import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const STALE_AFTER_MS = 45_000;
const TYPING_STALE_AFTER_MS = 12_000;

const requireIdentity = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  return identity;
};

const requireWorkspaceMembership = async (
  ctx: QueryCtx | MutationCtx,
  noteId: Id<"notes">,
  tokenIdentifier: string,
) => {
  const note = await ctx.db.get(noteId);
  if (!note) {
    throw new Error("Note not found");
  }

  const membership = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_workspace_id_and_token_identifier", (q) =>
      q.eq("workspaceId", note.workspaceId).eq("tokenIdentifier", tokenIdentifier),
    )
    .take(5);
  const activeMembership = membership.sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;

  if (!activeMembership) {
    throw new Error("Forbidden");
  }

  return note;
};

export const heartbeat = mutation({
  args: {
    noteId: v.id("notes"),
    cursorPosition: v.optional(v.number()),
    isTyping: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    await requireWorkspaceMembership(ctx, args.noteId, identity.tokenIdentifier);

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_note_id_and_token_identifier", (q) =>
        q.eq("noteId", args.noteId).eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    const displayName = identity.name ?? identity.email ?? "Collaborator";
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        cursorPosition: args.cursorPosition,
        displayName,
        userEmail: identity.email ?? undefined,
        isTyping: args.isTyping ?? false,
        lastTypedAt: args.isTyping ? now : existing.lastTypedAt,
        lastSeenAt: now,
      });
      return existing._id;
    }

    return ctx.db.insert("presence", {
      noteId: args.noteId,
      tokenIdentifier: identity.tokenIdentifier,
      displayName,
      userEmail: identity.email ?? undefined,
      cursorPosition: args.cursorPosition,
      isTyping: args.isTyping ?? false,
      lastTypedAt: args.isTyping ? now : undefined,
      lastSeenAt: now,
    });
  },
});

export const leave = mutation({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_note_id_and_token_identifier", (q) =>
        q.eq("noteId", args.noteId).eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const listByNote = query({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    try {
      await requireWorkspaceMembership(ctx, args.noteId, identity.tokenIdentifier);
    } catch {
      return [];
    }

    const now = Date.now();
    const candidates = await ctx.db
      .query("presence")
      .withIndex("by_note_id_and_last_seen_at", (q) => q.eq("noteId", args.noteId))
      .order("desc")
      .take(25);

    return candidates
      .filter((item) => now - item.lastSeenAt <= STALE_AFTER_MS)
      .map((item) => ({
        _id: item._id,
        isCurrentUser: item.tokenIdentifier === identity.tokenIdentifier,
        displayName: item.displayName,
        userEmail: item.userEmail ?? null,
        cursorPosition: item.cursorPosition ?? null,
        isTyping:
          !!item.isTyping &&
          typeof item.lastTypedAt === "number" &&
          now - item.lastTypedAt <= TYPING_STALE_AFTER_MS,
        lastSeenAt: item.lastSeenAt,
      }));
  },
});
