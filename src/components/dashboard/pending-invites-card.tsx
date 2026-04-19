"use client";

import { Loader2, MailOpen } from "lucide-react";
import { ContentCard } from "@/components/content-card";
import { RoleBadge } from "@/components/role-badge";

type PendingInvite = {
  _id: string;
  workspaceId: string;
  role: "editor" | "viewer";
  createdAt: number;
};

interface PendingInvitesCardProps {
  invites: ReadonlyArray<PendingInvite>;
}

export function PendingInvitesCard({ invites }: PendingInvitesCardProps) {
  if (invites.length === 0) return null;

  return (
    <ContentCard
      title="Pending invites"
      description="These workspace invites are being auto-claimed."
      contentClassName="p-0"
    >
      <ul className="divide-y divide-border">
        {invites.map((invite) => (
          <li key={invite._id} className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-info/10 text-info">
              <MailOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-card-foreground">
                Workspace invite
              </p>
              <p className="text-xs text-muted-foreground">
                Auto-claiming... it will appear in your workspaces shortly.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <RoleBadge role={invite.role} showIcon={false} />
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            </div>
          </li>
        ))}
      </ul>
    </ContentCard>
  );
}
