"use client";

import { Check, Loader2, Mail, X } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { ContentCard } from "@/components/content-card";
import { RoleBadge } from "@/components/role-badge";

type Role = "owner" | "editor" | "viewer";

type PendingInvite = {
  _id: Id<"workspaceInvites">;
  invitedEmail: string;
  role: "editor" | "viewer";
  createdAt: number;
};

type AcceptedInvite = {
  _id: Id<"workspaceInvites">;
  invitedEmail: string;
  role: "editor" | "viewer";
  acceptedAt: number | null;
  acceptedByDisplayName: string | null;
};

interface InvitesSubPanelProps {
  pendingInvites: ReadonlyArray<PendingInvite>;
  acceptedInvites: ReadonlyArray<AcceptedInvite>;
  currentUserRole: Role;
  updatingInviteId: Id<"workspaceInvites"> | null;
  onRevoke: (inviteId: Id<"workspaceInvites">) => void;
}

export function InvitesSubPanel({
  pendingInvites,
  acceptedInvites,
  currentUserRole,
  updatingInviteId,
  onRevoke,
}: InvitesSubPanelProps) {
  const isOwner = currentUserRole === "owner";

  return (
    <div className="space-y-6">
      <ContentCard
        title="Pending invites"
        description={`${pendingInvites.length} invite${pendingInvites.length !== 1 ? "s" : ""} awaiting acceptance`}
        contentClassName="p-0"
      >
        {pendingInvites.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No pending invites.</div>
        ) : (
          <ul className="divide-y divide-border">
            {pendingInvites.map((invite) => (
              <li
                key={invite._id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-6"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-warning/10 text-warning">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-card-foreground">
                      {invite.invitedEmail}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Invited {new Date(invite.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <RoleBadge role={invite.role} showIcon={false} />
                  {isOwner ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => onRevoke(invite._id)}
                      disabled={updatingInviteId === invite._id}
                      aria-label={`Revoke invite for ${invite.invitedEmail}`}
                    >
                      {updatingInviteId === invite._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </ContentCard>

      <ContentCard
        title="Invite history"
        description="Recently accepted invites"
        contentClassName="p-0"
      >
        {acceptedInvites.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No accepted invites yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {acceptedInvites.map((invite) => (
              <li
                key={invite._id}
                className="flex items-center gap-3 px-4 py-4 sm:px-6"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-success/10 text-success">
                  <Check className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-card-foreground">
                    {invite.invitedEmail}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Accepted by {invite.acceptedByDisplayName ?? "Unknown member"}
                    {invite.acceptedAt
                      ? ` \u00B7 ${new Date(invite.acceptedAt).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                <RoleBadge role={invite.role} showIcon={false} />
              </li>
            ))}
          </ul>
        )}
      </ContentCard>
    </div>
  );
}
