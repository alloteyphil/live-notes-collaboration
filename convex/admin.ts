import { mutation } from "./_generated/server";
import { v } from "convex/values";

const ADMIN_RESET_CONFIRMATION = "RESET_ALL_APP_DATA";
const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter((email) => email.length > 0);

export const clearAppData = mutation({
  args: {
    confirmation: v.string(),
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

    const deleteAllFromTable = async <
      T extends
        | "presence"
        | "workspaceInvites"
        | "workspaceMembers"
        | "notes"
        | "whiteboards"
        | "workspaces",
    >(
      table: T,
    ) => {
      // Delete in bounded batches to stay transaction-safe.
      while (true) {
        const rows = await ctx.db.query(table).take(100);
        if (rows.length === 0) break;
        await Promise.all(rows.map((row) => ctx.db.delete(row._id)));
      }
    };

    await deleteAllFromTable("presence");
    await deleteAllFromTable("workspaceInvites");
    await deleteAllFromTable("workspaceMembers");
    await deleteAllFromTable("notes");
    await deleteAllFromTable("whiteboards");
    await deleteAllFromTable("workspaces");

    return { ok: true };
  },
});
