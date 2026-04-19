"use client";

import Link from "next/link";
import { ChevronLeft, FileText, Mail, Menu, Paintbrush, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/role-badge";

type Role = "owner" | "editor" | "viewer";

interface WorkspaceHeroProps {
  name: string;
  role: Role;
  notesCount: number;
  membersCount: number;
  pendingInvitesCount: number;
  whiteboardHref: string;
  onOpenNotesSidebar: () => void;
  onNewNote?: () => void;
  canCreateNote: boolean;
}

export function WorkspaceHero({
  name,
  role,
  notesCount,
  membersCount,
  pendingInvitesCount,
  whiteboardHref,
  onOpenNotesSidebar,
  onNewNote,
  canCreateNote,
}: WorkspaceHeroProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="-ml-2 w-fit text-muted-foreground hover:text-foreground"
        >
          <Link href="/dashboard">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <RoleBadge role={role} />
            </div>
            <h1 className="truncate text-2xl font-semibold text-foreground sm:text-3xl">
              {name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Create notes, manage members, and handle invites.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="lg:hidden" onClick={onOpenNotesSidebar}>
              <Menu className="mr-1.5 h-4 w-4" />
              Notes
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={whiteboardHref}>
                <Paintbrush className="mr-1.5 h-4 w-4" />
                Whiteboard
              </Link>
            </Button>
            {canCreateNote && onNewNote ? (
              <Button size="sm" onClick={onNewNote}>
                <Plus className="mr-1.5 h-4 w-4" />
                New note
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile icon={<FileText className="h-4 w-4" />} label="Notes" value={notesCount} />
          <StatTile icon={<Users className="h-4 w-4" />} label="Members" value={membersCount} />
          <StatTile
            icon={<Mail className="h-4 w-4" />}
            label="Pending invites"
            value={pendingInvitesCount}
          />
        </div>
      </div>
    </div>
  );
}

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

function StatTile({ icon, label, value }: StatTileProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
