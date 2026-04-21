import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
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
const isNotNull = <T>(value: T | null): value is T => value !== null;

const randomInviteToken = (): string => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

const uniqueClaimToken = async (ctx: MutationCtx): Promise<string> => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const token = randomInviteToken();
    const existing = await ctx.db
      .query("workspaceInvites")
      .withIndex("by_claim_token", (q) => q.eq("claimToken", token))
      .first();
    if (!existing) {
      return token;
    }
  }
  throw new Error("Could not allocate invite link");
};

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

const ensureWorkspaceMembership = async (
  ctx: MutationCtx,
  args: {
    workspaceId: Id<"workspaces">;
    tokenIdentifier: string;
    role: "owner" | "editor" | "viewer";
    displayName?: string;
    userEmail?: string;
  },
) => {
  const existing = await requireWorkspaceMembership(
    ctx,
    args.workspaceId,
    args.tokenIdentifier,
  );
  if (existing) return existing;

  await ctx.db.insert("workspaceMembers", {
    workspaceId: args.workspaceId,
    tokenIdentifier: args.tokenIdentifier,
    role: args.role,
    displayName: args.displayName,
    userEmail: args.userEmail,
    createdAt: Date.now(),
  });

  return requireWorkspaceMembership(ctx, args.workspaceId, args.tokenIdentifier);
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
      .filter(isNotNull);
  },
});

export const listPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .paginate(args.paginationOpts);

    const workspaces = await Promise.all(
      memberships.page.map((membership) => ctx.db.get(membership.workspaceId)),
    );

    return {
      ...memberships,
      page: memberships.page
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
        .filter(isNotNull),
    };
  },
});

export const getById = query({
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
    if (!membership) {
      return null;
    }

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      return null;
    }

    return {
      ...workspace,
      role: membership.role,
    };
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
        await ensureWorkspaceMembership(ctx, {
          workspaceId: invite.workspaceId,
          tokenIdentifier: identity.tokenIdentifier,
          role: invite.role,
          displayName: identity.name ?? undefined,
          userEmail: email,
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

    const claimToken = await uniqueClaimToken(ctx);

    await ctx.db.insert("workspaceInvites", {
      workspaceId: args.workspaceId,
      invitedEmail,
      role: args.role,
      status: "pending",
      invitedByTokenIdentifier: identity.tokenIdentifier,
      createdAt: Date.now(),
      claimToken,
    });

    return { ok: true };
  },
});

/** Public preview for invite landing pages (no auth). */
export const getInvitePreviewByToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmed = args.token.trim();
    if (!trimmed) {
      return null;
    }
    const invite = await ctx.db
      .query("workspaceInvites")
      .withIndex("by_claim_token", (q) => q.eq("claimToken", trimmed))
      .first();
    if (!invite || invite.status !== "pending") {
      return null;
    }
    const workspace = await ctx.db.get(invite.workspaceId);
    if (!workspace) {
      return null;
    }
    return {
      workspaceName: workspace.name,
      invitedEmail: invite.invitedEmail,
      role: invite.role,
    };
  },
});

export const claimInviteByToken = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const email = identity.email ? normalizeEmail(identity.email) : null;
    if (!email) {
      throw new Error("Your account must have an email to accept this invite");
    }

    const trimmed = args.token.trim();
    if (!trimmed) {
      throw new Error("Invite link is invalid");
    }

    const invite = await ctx.db
      .query("workspaceInvites")
      .withIndex("by_claim_token", (q) => q.eq("claimToken", trimmed))
      .first();

    if (!invite || invite.status !== "pending") {
      throw new Error("This invite is no longer valid");
    }

    if (normalizeEmail(invite.invitedEmail) !== email) {
      throw new Error(
        `Sign in as ${invite.invitedEmail} to accept this invite. You are signed in as ${email}.`,
      );
    }

    await ensureWorkspaceMembership(ctx, {
      workspaceId: invite.workspaceId,
      tokenIdentifier: identity.tokenIdentifier,
      role: invite.role,
      displayName: identity.name ?? undefined,
      userEmail: email,
    });

    await ctx.db.patch(invite._id, {
      status: "accepted",
      acceptedByTokenIdentifier: identity.tokenIdentifier,
      acceptedAt: Date.now(),
    });

    return { workspaceId: invite.workspaceId };
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

    const acceptedInvites = await ctx.db
      .query("workspaceInvites")
      .withIndex("by_workspace_id_and_status", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("status", "accepted"),
      )
      .take(100);

    const memberByToken = new Map(
      workspaceMembers.map((member) => [member.tokenIdentifier, member] as const),
    );

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
        claimToken: invite.claimToken ?? null,
      })),
      acceptedInvites: acceptedInvites
        .map((invite) => ({
          _id: invite._id,
          invitedEmail: invite.invitedEmail,
          role: invite.role,
          createdAt: invite.createdAt,
          acceptedAt: invite.acceptedAt ?? null,
          acceptedByDisplayName: invite.acceptedByTokenIdentifier
            ? memberByToken.get(invite.acceptedByTokenIdentifier)?.displayName ??
              memberByToken.get(invite.acceptedByTokenIdentifier)?.userEmail ??
              `Member ${invite.acceptedByTokenIdentifier.slice(0, 6)}`
            : null,
        }))
        .sort((a, b) => (b.acceptedAt ?? 0) - (a.acceptedAt ?? 0))
        .slice(0, 20),
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

/** Current owner becomes editor; target must already be an editor. */
export const transferOwnership = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    newOwnerTokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const workspace = await requireWorkspaceOwner(ctx, args.workspaceId, identity.tokenIdentifier);

    if (args.newOwnerTokenIdentifier === identity.tokenIdentifier) {
      throw new Error("You are already the owner of this workspace");
    }

    const newOwnerMembership = await requireWorkspaceMembership(
      ctx,
      args.workspaceId,
      args.newOwnerTokenIdentifier,
    );
    if (!newOwnerMembership) {
      throw new Error("Member not found");
    }
    if (newOwnerMembership.role !== "editor") {
      throw new Error("Transfer ownership is only available to members with the editor role");
    }

    const currentOwnerMembership = await requireWorkspaceMembership(
      ctx,
      args.workspaceId,
      identity.tokenIdentifier,
    );
    if (!currentOwnerMembership || currentOwnerMembership.role !== "owner") {
      throw new Error("Forbidden");
    }

    await ctx.db.patch(workspace._id, {
      ownerTokenIdentifier: args.newOwnerTokenIdentifier,
      updatedAt: Date.now(),
    });

    await ctx.db.patch(currentOwnerMembership._id, {
      role: "editor",
    });

    await ctx.db.patch(newOwnerMembership._id, {
      role: "owner",
    });

    return { ok: true };
  },
});
