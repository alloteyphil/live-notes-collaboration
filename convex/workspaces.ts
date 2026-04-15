import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const inviteRoleValidator = v.union(v.literal("editor"), v.literal("viewer"));

const requireIdentity = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  return identity;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const requireWorkspaceMembership = async (
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

const requireWorkspaceOwner = async (
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">,
  tokenIdentifier: string,
) => {
  const workspace = await ctx.db.get(workspaceId);
  if (!workspace) {
    throw new Error("Workspace not found");
  }
  if (workspace.ownerTokenIdentifier !== tokenIdentifier) {
    throw new Error("Forbidden");
  }
  return workspace;
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
      displayName: identity.name ?? undefined,
      userEmail: identity.email ?? undefined,
      createdAt: now,
    });

    return workspaceId;
  },
});

export const claimInvites = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const email = identity.email ? normalizeEmail(identity.email) : null;
    if (!email) {
      return { claimed: 0 };
    }

    const invites = await ctx.db
      .query("workspaceInvites")
      .withIndex("by_invited_email_and_status", (q) =>
        q.eq("invitedEmail", email).eq("status", "pending"),
      )
      .take(50);

    let claimed = 0;
    for (const invite of invites) {
      const existingMembership = await requireWorkspaceMembership(
        ctx,
        invite.workspaceId,
        identity.tokenIdentifier,
      );
      if (!existingMembership) {
        await ctx.db.insert("workspaceMembers", {
          workspaceId: invite.workspaceId,
          tokenIdentifier: identity.tokenIdentifier,
          role: invite.role,
          displayName: identity.name ?? undefined,
          userEmail: email,
          createdAt: Date.now(),
        });
        claimed += 1;
      }

      await ctx.db.patch(invite._id, {
        status: "accepted",
        acceptedByTokenIdentifier: identity.tokenIdentifier,
        acceptedAt: Date.now(),
      });
    }

    return { claimed };
  },
});

export const listMyPendingInvites = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const email = identity.email ? normalizeEmail(identity.email) : null;
    if (!email) {
      return [];
    }

    const invites = await ctx.db
      .query("workspaceInvites")
      .withIndex("by_invited_email_and_status", (q) =>
        q.eq("invitedEmail", email).eq("status", "pending"),
      )
      .take(100);

    return invites.map((invite) => ({
      _id: invite._id,
      workspaceId: invite.workspaceId,
      role: invite.role,
      createdAt: invite.createdAt,
    }));
  },
});

export const inviteMember = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    email: v.string(),
    role: inviteRoleValidator,
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    await requireWorkspaceOwner(ctx, args.workspaceId, identity.tokenIdentifier);

    const invitedEmail = normalizeEmail(args.email);
    if (!invitedEmail) {
      throw new Error("Invite email is required");
    }

    const existingPendingInvites = await ctx.db
      .query("workspaceInvites")
      .withIndex("by_workspace_id_and_invited_email", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("invitedEmail", invitedEmail),
      )
      .take(20);

    if (existingPendingInvites.some((invite) => invite.status === "pending")) {
      throw new Error("A pending invite already exists for this email");
    }

    await ctx.db.insert("workspaceInvites", {
      workspaceId: args.workspaceId,
      invitedEmail,
      role: args.role,
      status: "pending",
      invitedByTokenIdentifier: identity.tokenIdentifier,
      createdAt: Date.now(),
    });

    return { ok: true };
  },
});

export const revokeInvite = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    inviteId: v.id("workspaceInvites"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    await requireWorkspaceOwner(ctx, args.workspaceId, identity.tokenIdentifier);

    const invite = await ctx.db.get(args.inviteId);
    if (!invite || invite.workspaceId !== args.workspaceId) {
      throw new Error("Invite not found");
    }
    if (invite.status !== "pending") {
      throw new Error("Only pending invites can be revoked");
    }

    await ctx.db.delete(args.inviteId);
    return { ok: true };
  },
});

export const listMembers = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const membership = await requireWorkspaceMembership(
      ctx,
      args.workspaceId,
      identity.tokenIdentifier,
    );
    if (!membership) return null;

    const workspaceMembers = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_id_and_token_identifier", (q) =>
        q.eq("workspaceId", args.workspaceId),
      )
      .take(100);

    const pendingInvites = await ctx.db
      .query("workspaceInvites")
      .withIndex("by_workspace_id_and_status", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("status", "pending"),
      )
      .take(100);

    return {
      currentUserRole: membership.role,
      currentUserTokenIdentifier: identity.tokenIdentifier,
      members: workspaceMembers.map((member) => ({
        _id: member._id,
        tokenIdentifier: member.tokenIdentifier,
        role: member.role,
        displayName:
          member.displayName ??
          member.userEmail ??
          `Member ${member.tokenIdentifier.slice(0, 6)}`,
        userEmail: member.userEmail ?? null,
        createdAt: member.createdAt,
      })),
      pendingInvites: pendingInvites.map((invite) => ({
        _id: invite._id,
        invitedEmail: invite.invitedEmail,
        role: invite.role,
        createdAt: invite.createdAt,
      })),
    };
  },
});

export const updateMemberRole = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    memberTokenIdentifier: v.string(),
    role: inviteRoleValidator,
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    await requireWorkspaceOwner(ctx, args.workspaceId, identity.tokenIdentifier);

    if (args.memberTokenIdentifier === identity.tokenIdentifier) {
      throw new Error("Owner cannot change their own role");
    }

    const targetMembership = await requireWorkspaceMembership(
      ctx,
      args.workspaceId,
      args.memberTokenIdentifier,
    );
    if (!targetMembership) {
      throw new Error("Member not found");
    }
    if (targetMembership.role === "owner") {
      throw new Error("Cannot change the owner role");
    }

    await ctx.db.patch(targetMembership._id, {
      role: args.role,
    });

    return { ok: true };
  },
});

export const removeMember = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    memberTokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    await requireWorkspaceOwner(ctx, args.workspaceId, identity.tokenIdentifier);

    if (args.memberTokenIdentifier === identity.tokenIdentifier) {
      throw new Error("Owner cannot remove themselves");
    }

    const targetMembership = await requireWorkspaceMembership(
      ctx,
      args.workspaceId,
      args.memberTokenIdentifier,
    );
    if (!targetMembership) {
      throw new Error("Member not found");
    }
    if (targetMembership.role === "owner") {
      throw new Error("Cannot remove the owner");
    }

    await ctx.db.delete(targetMembership._id);
    return { ok: true };
  },
});
