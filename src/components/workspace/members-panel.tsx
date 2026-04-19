"use client";

import { FormEvent } from "react";
import { Loader2, Mail, Send, Trash2, UserPlus } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContentCard } from "@/components/content-card";
import { RoleBadge } from "@/components/role-badge";

type Role = "owner" | "editor" | "viewer";

type Member = {
  _id: Id<"workspaceMembers">;
  tokenIdentifier: string;
  role: Role;
  displayName: string;
  userEmail: string | null;
};

interface MembersPanelProps {
  members: ReadonlyArray<Member>;
  currentUserRole: Role;
  updatingMemberToken: string | null;
  onUpdateMemberRole: (memberTokenIdentifier: string, role: "editor" | "viewer") => void;
  onRemoveMember: (memberTokenIdentifier: string) => void;
  inviteEmail: string;
  onInviteEmailChange: (value: string) => void;
  inviteRole: "editor" | "viewer";
  onInviteRoleChange: (value: "editor" | "viewer") => void;
  onInvite: (event: FormEvent<HTMLFormElement>) => void;
  isInviting: boolean;
}

export function MembersPanel({
  members,
  currentUserRole,
  updatingMemberToken,
  onUpdateMemberRole,
  onRemoveMember,
  inviteEmail,
  onInviteEmailChange,
  inviteRole,
  onInviteRoleChange,
  onInvite,
  isInviting,
}: MembersPanelProps) {
  const isOwner = currentUserRole === "owner";

  return (
    <div className="space-y-6">
      {isOwner ? (
        <ContentCard
          title="Invite new member"
          description="Share access to this workspace by email"
        >
          <form onSubmit={onInvite} className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={inviteEmail}
                  onChange={(event) => onInviteEmailChange(event.target.value)}
                  disabled={isInviting}
                  className="pl-9"
                />
              </div>
              <Select
                value={inviteRole}
                onValueChange={(value) => onInviteRoleChange(value as "editor" | "viewer")}
                disabled={isInviting}
              >
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              disabled={isInviting || !inviteEmail.trim()}
              className="w-full sm:w-auto"
            >
              {isInviting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send invite
                </>
              )}
            </Button>
          </form>
        </ContentCard>
      ) : null}

      <ContentCard
        title="Members"
        description={`${members.length} member${members.length !== 1 ? "s" : ""} in this workspace`}
        contentClassName="p-0"
      >
        {members.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No members yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {members.map((member) => (
              <li
                key={member._id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-6"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {member.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-card-foreground">
                      {member.displayName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.userEmail ?? "No email available"}
                    </p>
                  </div>
                </div>
                {isOwner && member.role !== "owner" ? (
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Select
                      value={member.role}
                      onValueChange={(value) =>
                        onUpdateMemberRole(member.tokenIdentifier, value as "editor" | "viewer")
                      }
                      disabled={updatingMemberToken === member.tokenIdentifier}
                    >
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveMember(member.tokenIdentifier)}
                      disabled={updatingMemberToken === member.tokenIdentifier}
                      aria-label={`Remove ${member.displayName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <RoleBadge role={member.role} />
                )}
              </li>
            ))}
          </ul>
        )}
      </ContentCard>

      {!isOwner ? (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          <UserPlus className="h-4 w-4" />
          Only workspace owners can invite or manage members.
        </div>
      ) : null}
    </div>
  );
}
