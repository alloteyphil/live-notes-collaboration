import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
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

const requireMembership = async (
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">,
  tokenIdentifier: string,
) => {
  const membership = await getMembership(ctx, workspaceId, tokenIdentifier);
  if (!membership) {
    throw new Error("Forbidden");
  }
  return membership;
};

const requireEditorMembership = async (
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">,
  tokenIdentifier: string,
) => {
  const membership = await requireMembership(ctx, workspaceId, tokenIdentifier);
  if (membership.role === "viewer") {
    throw new Error("Forbidden");
  }
  return membership;
};

const addRevision = async (
  ctx: MutationCtx,
  args: {
    noteId: Id<"notes">;
    workspaceId: Id<"workspaces">;
    title: string;
    content: string;
    createdByTokenIdentifier: string;
    reason: string;
  },
) => {
  await ctx.db.insert("noteRevisions", {
    noteId: args.noteId,
    workspaceId: args.workspaceId,
    title: args.title,
    content: args.content,
    createdByTokenIdentifier: args.createdByTokenIdentifier,
    createdAt: Date.now(),
    reason: args.reason,
  });
};

const defaultTemplates: Array<{ title: string; content: string }> = [
  {
    title: "Meeting Notes",
    content:
      "# Meeting Notes\n\n## Agenda\n-\n\n## Discussion\n-\n\n## Decisions\n-\n\n## Action Items\n- [ ]",
  },
  {
    title: "Product Requirement Doc",
    content:
      "# PRD\n\n## Problem\n\n## Goals\n\n## Non-goals\n\n## User Stories\n\n## Scope\n\n## Metrics\n",
  },
  {
    title: "Sprint Retrospective",
    content:
      "# Sprint Retro\n\n## Went well\n-\n\n## Needs improvement\n-\n\n## Action plan\n- [ ]",
  },
];

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

    if (!membership) return [];

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

export const listByWorkspacePaginated = query({
  args: {
    workspaceId: v.id("workspaces"),
    includeArchived: v.optional(v.boolean()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const membership = await getMembership(
      ctx,
      args.workspaceId,
      identity.tokenIdentifier,
    );

    if (!membership) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
        splitCursor: null,
        pageStatus: null,
      };
    }

    if (args.includeArchived) {
      return ctx.db
        .query("notes")
        .withIndex("by_workspace_id_and_updated_at", (q) =>
          q.eq("workspaceId", args.workspaceId),
        )
        .order("desc")
        .paginate(args.paginationOpts);
    }

    return ctx.db
      .query("notes")
      .withIndex("by_workspace_id_and_is_archived", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("isArchived", false),
      )
      .paginate(args.paginationOpts);
  },
});

export const listRecentAcrossWorkspaces = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const rawLimit = args.limit ?? 10;
    const limit = Math.max(1, Math.min(25, rawLimit));
    const perWorkspace = Math.max(3, Math.min(10, limit));

    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .take(50);

    if (memberships.length === 0) return [];

    const notesPerWorkspace = await Promise.all(
      memberships.map((membership) =>
        ctx.db
          .query("notes")
          .withIndex("by_workspace_id_and_updated_at", (q) =>
            q.eq("workspaceId", membership.workspaceId),
          )
          .order("desc")
          .take(perWorkspace),
      ),
    );

    const workspaces = await Promise.all(
      memberships.map((membership) => ctx.db.get(membership.workspaceId)),
    );

    type RecentNote = {
      _id: Id<"notes">;
      title: string;
      workspaceId: Id<"workspaces">;
      workspaceName: string;
      updatedAt: number;
      role: "owner" | "editor" | "viewer";
    };

    const combined: Array<RecentNote> = [];
    for (let i = 0; i < memberships.length; i += 1) {
      const membership = memberships[i];
      const workspace = workspaces[i];
      if (!workspace) continue;
      const notes = notesPerWorkspace[i];
      for (const note of notes) {
        if (note.isArchived) continue;
        combined.push({
          _id: note._id,
          title: note.title,
          workspaceId: note.workspaceId,
          workspaceName: workspace.name,
          updatedAt: note.updatedAt,
          role: membership.role,
        });
      }
    }

    combined.sort((a, b) => b.updatedAt - a.updatedAt);
    return combined.slice(0, limit);
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
      return null;
    }

    const membership = await getMembership(
      ctx,
      note.workspaceId,
      identity.tokenIdentifier,
    );
    if (!membership) return null;

    return {
      ...note,
      currentUserRole: membership.role,
      canEdit: membership.role !== "viewer",
    };
  },
});

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    await requireEditorMembership(ctx, args.workspaceId, identity.tokenIdentifier);

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

export const createFromTemplate = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    templateId: v.optional(v.id("noteTemplates")),
    defaultTemplateTitle: v.optional(v.string()),
    customTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    await requireEditorMembership(ctx, args.workspaceId, identity.tokenIdentifier);

    let title = args.customTitle?.trim() || "";
    let content = "";

    if (args.templateId) {
      const template = await ctx.db.get(args.templateId);
      if (!template) {
        throw new Error("Template not found");
      }
      if (template.scope === "workspace" && template.workspaceId !== args.workspaceId) {
        throw new Error("Template not found");
      }
      title = title || template.title;
      content = template.content;
    } else if (args.defaultTemplateTitle) {
      const template = defaultTemplates.find(
        (item) => item.title === args.defaultTemplateTitle,
      );
      if (!template) {
        throw new Error("Template not found");
      }
      title = title || template.title;
      content = template.content;
    } else {
      throw new Error("Template is required");
    }

    const now = Date.now();
    return ctx.db.insert("notes", {
      workspaceId: args.workspaceId,
      title: title || "Untitled note",
      content,
      isArchived: false,
      createdByTokenIdentifier: identity.tokenIdentifier,
      updatedByTokenIdentifier: identity.tokenIdentifier,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const archive = mutation({
  args: {
    noteId: v.id("notes"),
    archived: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw new Error("Note not found");
    }
    await requireEditorMembership(ctx, note.workspaceId, identity.tokenIdentifier);

    if (note.isArchived === args.archived) {
      return { ok: true };
    }

    await addRevision(ctx, {
      noteId: note._id,
      workspaceId: note.workspaceId,
      title: note.title,
      content: note.content,
      createdByTokenIdentifier: identity.tokenIdentifier,
      reason: args.archived ? "archive" : "unarchive",
    });

    await ctx.db.patch(args.noteId, {
      isArchived: args.archived,
      updatedByTokenIdentifier: identity.tokenIdentifier,
      updatedAt: Date.now(),
    });

    return { ok: true };
  },
});

export const remove = mutation({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw new Error("Note not found");
    }
    await requireEditorMembership(ctx, note.workspaceId, identity.tokenIdentifier);

    const deleteInBatches = async <
      T extends "presence" | "noteComments" | "noteRevisions" | "notifications",
    >(
      table: T,
      ids: Array<Id<T>>,
    ) => {
      await Promise.all(ids.map((id) => ctx.db.delete(id)));
    };

    const presenceRows = await ctx.db
      .query("presence")
      .withIndex("by_note_id_and_last_seen_at", (q) => q.eq("noteId", args.noteId))
      .take(200);
    await deleteInBatches(
      "presence",
      presenceRows.map((row) => row._id),
    );

    const commentRows = await ctx.db
      .query("noteComments")
      .withIndex("by_note_id_and_created_at", (q) => q.eq("noteId", args.noteId))
      .take(500);
    await deleteInBatches(
      "noteComments",
      commentRows.map((row) => row._id),
    );

    const revisionRows = await ctx.db
      .query("noteRevisions")
      .withIndex("by_note_id_and_created_at", (q) => q.eq("noteId", args.noteId))
      .take(500);
    await deleteInBatches(
      "noteRevisions",
      revisionRows.map((row) => row._id),
    );

    const notificationRows = await ctx.db
      .query("notifications")
      .withIndex("by_note_id", (q) => q.eq("noteId", args.noteId))
      .take(500);
    await deleteInBatches(
      "notifications",
      notificationRows.map((row) => row._id),
    );

    await ctx.db.delete(args.noteId);
    return { ok: true };
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

    await requireEditorMembership(ctx, note.workspaceId, identity.tokenIdentifier);
    if (note.isArchived) {
      throw new Error("Cannot edit an archived note");
    }

    const trimmedTitle = args.title.trim();
    if (trimmedTitle === note.title) {
      return;
    }

    await addRevision(ctx, {
      noteId: note._id,
      workspaceId: note.workspaceId,
      title: note.title,
      content: note.content,
      createdByTokenIdentifier: identity.tokenIdentifier,
      reason: "title_update",
    });

    await ctx.db.patch(args.noteId, {
      title: trimmedTitle,
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

    await requireEditorMembership(ctx, note.workspaceId, identity.tokenIdentifier);
    if (note.isArchived) {
      throw new Error("Cannot edit an archived note");
    }
    if (args.content === note.content) {
      return;
    }

    await addRevision(ctx, {
      noteId: note._id,
      workspaceId: note.workspaceId,
      title: note.title,
      content: note.content,
      createdByTokenIdentifier: identity.tokenIdentifier,
      reason: "content_update",
    });

    await ctx.db.patch(args.noteId, {
      content: args.content,
      updatedByTokenIdentifier: identity.tokenIdentifier,
      updatedAt: Date.now(),
    });
  },
});

export const listRevisions = query({
  args: {
    noteId: v.id("notes"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
        splitCursor: null,
        pageStatus: null,
      };
    }
    await requireMembership(ctx, note.workspaceId, identity.tokenIdentifier);
    return ctx.db
      .query("noteRevisions")
      .withIndex("by_note_id_and_created_at", (q) => q.eq("noteId", args.noteId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const restoreRevision = mutation({
  args: {
    noteId: v.id("notes"),
    revisionId: v.id("noteRevisions"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw new Error("Note not found");
    }
    await requireEditorMembership(ctx, note.workspaceId, identity.tokenIdentifier);

    const revision = await ctx.db.get(args.revisionId);
    if (!revision || revision.noteId !== args.noteId) {
      throw new Error("Revision not found");
    }

    await addRevision(ctx, {
      noteId: note._id,
      workspaceId: note.workspaceId,
      title: note.title,
      content: note.content,
      createdByTokenIdentifier: identity.tokenIdentifier,
      reason: "restore_before_restore",
    });

    await ctx.db.patch(args.noteId, {
      title: revision.title,
      content: revision.content,
      isArchived: false,
      updatedByTokenIdentifier: identity.tokenIdentifier,
      updatedAt: Date.now(),
    });

    return { ok: true };
  },
});

export const searchNotes = query({
  args: {
    workspaceId: v.id("workspaces"),
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    await requireMembership(ctx, args.workspaceId, identity.tokenIdentifier);

    const term = args.searchTerm.trim();
    const boundedLimit = Math.min(Math.max(args.limit ?? 12, 1), 30);
    if (!term) return [];

    const contentMatches = await ctx.db
      .query("notes")
      .withSearchIndex("search_content", (q) =>
        q.search("content", term).eq("workspaceId", args.workspaceId).eq("isArchived", false),
      )
      .take(boundedLimit);

    const titleCandidates = await ctx.db
      .query("notes")
      .withIndex("by_workspace_id_and_is_archived", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("isArchived", false),
      )
      .take(100);

    const titleMatches = titleCandidates.filter((note) =>
      note.title.toLowerCase().includes(term.toLowerCase()),
    );

    const mergedById = new Map(
      [...contentMatches, ...titleMatches].map((note) => [note._id, note]),
    );

    return Array.from(mergedById.values())
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, boundedLimit)
      .map((note) => {
        const lowerContent = note.content.toLowerCase();
        const idx = lowerContent.indexOf(term.toLowerCase());
        const snippet =
          idx >= 0
            ? note.content.slice(Math.max(0, idx - 40), idx + term.length + 60).trim()
            : note.content.slice(0, 100).trim();
        return {
          _id: note._id,
          title: note.title,
          updatedAt: note.updatedAt,
          snippet,
        };
      });
  },
});

export const listTemplates = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    await requireMembership(ctx, args.workspaceId, identity.tokenIdentifier);

    const globalTemplates = await ctx.db
      .query("noteTemplates")
      .withIndex("by_scope_and_created_at", (q) => q.eq("scope", "global"))
      .take(30);

    const workspaceTemplates = await ctx.db
      .query("noteTemplates")
      .withIndex("by_workspace_id_and_created_at", (q) =>
        q.eq("workspaceId", args.workspaceId),
      )
      .take(50);

    const fallbackGlobal = defaultTemplates.map((template) => ({
      _id: `default:${template.title}`,
      title: template.title,
      content: template.content,
      scope: "global" as const,
      isDefault: true,
    }));

    return [
      ...fallbackGlobal,
      ...globalTemplates.map((template) => ({
        _id: template._id,
        title: template.title,
        content: template.content,
        scope: template.scope,
        isDefault: false,
      })),
      ...workspaceTemplates.map((template) => ({
        _id: template._id,
        title: template.title,
        content: template.content,
        scope: template.scope,
        isDefault: false,
      })),
    ];
  },
});

export const createTemplate = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    await requireEditorMembership(ctx, args.workspaceId, identity.tokenIdentifier);
    return ctx.db.insert("noteTemplates", {
      scope: "workspace",
      workspaceId: args.workspaceId,
      title: args.title.trim(),
      content: args.content,
      createdByTokenIdentifier: identity.tokenIdentifier,
      createdAt: Date.now(),
    });
  },
});
