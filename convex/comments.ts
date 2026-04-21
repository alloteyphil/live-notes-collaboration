import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,})/gi;

const requireIdentity = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  return identity;
};

const requireMembership = async (
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
  const membership = memberships.sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;
  if (!membership) {
    throw new Error("Forbidden");
  }
  return membership;
};

const extractMentionEmails = (content: string) => {
  const matches = content.match(emailRegex) ?? [];
  return [...new Set(matches.map((email) => email.trim().toLowerCase()))];
};

export const listByNote = query({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const note = await ctx.db.get(args.noteId);
    if (!note) return [];
    await requireMembership(ctx, note.workspaceId, identity.tokenIdentifier);

    const comments = await ctx.db
      .query("noteComments")
      .withIndex("by_note_id_and_created_at", (q) => q.eq("noteId", args.noteId))
      .take(200);

    return comments.map((comment) => ({
      _id: comment._id,
      content: comment.content,
      status: comment.status,
      authorDisplayName: comment.authorDisplayName,
      authorEmail: comment.authorEmail ?? null,
      mentionEmails: comment.mentionEmails,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      resolvedAt: comment.resolvedAt ?? null,
    }));
  },
});

export const create = mutation({
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
    await requireMembership(ctx, note.workspaceId, identity.tokenIdentifier);

    const trimmedContent = args.content.trim();
    if (!trimmedContent) {
      throw new Error("Comment content is required");
    }

    const mentionEmails = extractMentionEmails(trimmedContent);
    const now = Date.now();
    const commentId = await ctx.db.insert("noteComments", {
      noteId: args.noteId,
      workspaceId: note.workspaceId,
      authorTokenIdentifier: identity.tokenIdentifier,
      authorDisplayName: identity.name ?? identity.email ?? "Unknown member",
      authorEmail: identity.email ?? undefined,
      content: trimmedContent,
      mentionEmails,
      status: "open",
      createdAt: now,
      updatedAt: now,
    });

    for (const email of mentionEmails) {
      const member = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_workspace_id_and_user_email", (q) =>
          q.eq("workspaceId", note.workspaceId).eq("userEmail", email),
        )
        .unique();
      if (!member || member.tokenIdentifier === identity.tokenIdentifier) {
        continue;
      }

      await ctx.db.insert("notifications", {
        tokenIdentifier: member.tokenIdentifier,
        type: "mention",
        title: "You were mentioned in a comment",
        body: `${identity.name ?? identity.email ?? "A teammate"} mentioned you: "${trimmedContent.slice(0, 80)}"`,
        workspaceId: note.workspaceId,
        noteId: note._id,
        commentId,
        isRead: false,
        createdAt: now,
      });
    }

    return commentId;
  },
});

export const resolve = mutation({
  args: {
    commentId: v.id("noteComments"),
    resolved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }
    await requireMembership(ctx, comment.workspaceId, identity.tokenIdentifier);
    await ctx.db.patch(args.commentId, {
      status: args.resolved ? "resolved" : "open",
      resolvedByTokenIdentifier: args.resolved ? identity.tokenIdentifier : undefined,
      resolvedAt: args.resolved ? Date.now() : undefined,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});
