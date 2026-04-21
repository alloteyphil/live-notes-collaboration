import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const ADMIN_RESET_CONFIRMATION = "RESET_ALL_APP_DATA";
const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter((email) => email.length > 0);

export const clearAppData = mutation({
  args: {
    confirmation: v.string(),
    phase: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    if (adminEmails.length === 0) {
      throw new Error("Admin reset is not configured");
    }
    if (!identity.email || !adminEmails.includes(identity.email.toLowerCase())) {
      throw new Error("Forbidden");
    }

    if (args.confirmation !== ADMIN_RESET_CONFIRMATION) {
      throw new Error("Confirmation text mismatch");
    }

    const tables = [
      "presence",
      "notifications",
      "noteComments",
      "noteRevisions",
      "noteTemplates",
      "workspaceInvites",
      "workspaceMembers",
      "notes",
      "whiteboards",
      "workspaces",
    ] as const;

    const currentPhase = args.phase ?? 0;
    if (currentPhase >= tables.length) {
      return { ok: true, done: true };
    }

    const deleteBatchFromTable = async <
      T extends
        | "presence"
        | "notifications"
        | "noteComments"
        | "noteRevisions"
        | "noteTemplates"
        | "workspaceInvites"
        | "workspaceMembers"
        | "notes"
        | "whiteboards"
        | "workspaces",
    >(
      table: T,
    ) => {
      const rows = await ctx.db.query(table).take(100);
      await Promise.all(rows.map((row) => ctx.db.delete(row._id)));
      return rows.length;
    };

    const table = tables[currentPhase];
    const deletedCount = await deleteBatchFromTable(table);
    const nextPhase = deletedCount === 0 ? currentPhase + 1 : currentPhase;

    if (nextPhase < tables.length) {
      await ctx.scheduler.runAfter(0, api.admin.clearAppData, {
        confirmation: ADMIN_RESET_CONFIRMATION,
        phase: nextPhase,
      });
      return { ok: true, done: false, phase: nextPhase, table };
    }

    return { ok: true, done: true };
  },
});
