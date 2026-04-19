"use client";

import Link from "next/link";
import {
  ChevronLeft,
  History,
  MessageSquare,
  Trash2,
  Undo2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PresenceAvatars } from "@/components/presence-avatars";
import { SaveStatus, SaveStatusState } from "@/components/save-status";
import { cn } from "@/lib/utils";

type Collaborator = {
  id: string;
  name: string;
  email: string;
  isTyping: boolean;
  isCurrentUser: boolean;
};

interface NoteToolbarProps {
  workspaceId?: string | null;
  workspaceName?: string | null;
  noteTitle?: string | null;
  isArchived: boolean;
  canEdit: boolean;
  onArchiveToggle: () => void;
  onDelete: () => void;
  onOpenComments: () => void;
  onOpenRevisions: () => void;
  commentsCount: number;
  revisionsCount: number;
  collaborators: ReadonlyArray<Collaborator>;
  saveState: SaveStatusState;
  lastSaved: Date | null;
}

export function NoteToolbar({
  workspaceId,
  workspaceName,
  noteTitle,
  isArchived,
  canEdit,
  onArchiveToggle,
  onDelete,
  onOpenComments,
  onOpenRevisions,
  commentsCount,
  revisionsCount,
  collaborators,
  saveState,
  lastSaved,
}: NoteToolbarProps) {
  const backHref = workspaceId ? `/workspace/${workspaceId}` : "/dashboard";
  const backLabel = workspaceName ?? "Dashboard";
  const onlineCount = collaborators.length;

  return (
    <div className="supports-backdrop-filter:bg-background/80 sticky top-14 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto w-full max-w-4xl px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="-ml-2 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <Link href={backHref}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                <span className="max-w-[140px] truncate">{backLabel}</span>
              </Link>
            </Button>
            {noteTitle ? (
              <div className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                <span className="text-muted-foreground/50">/</span>
                <span className="truncate font-medium text-foreground">
                  {noteTitle}
                </span>
              </div>
            ) : null}
            {isArchived ? <Badge variant="warning">Archived</Badge> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SaveStatus state={saveState} lastSaved={lastSaved} />
            <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <PresenceAvatars collaborators={collaborators} maxVisible={3} />
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {onlineCount}
              </span>
            </div>
            <ToolbarIconButton
              icon={<MessageSquare className="h-4 w-4" />}
              label="Comments"
              count={commentsCount}
              onClick={onOpenComments}
            />
            <ToolbarIconButton
              icon={<History className="h-4 w-4" />}
              label="History"
              count={revisionsCount}
              onClick={onOpenRevisions}
            />
            {canEdit ? (
              <>
                <Button variant="outline" size="sm" onClick={onArchiveToggle}>
                  {isArchived ? <Undo2 className="mr-1 h-4 w-4" /> : null}
                  {isArchived ? "Unarchive" : "Archive"}
                </Button>
                <Button variant="destructive" size="sm" onClick={onDelete}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ToolbarIconButtonProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  onClick: () => void;
}

function ToolbarIconButton({ icon, label, count, onClick }: ToolbarIconButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn("gap-1.5")}
      aria-label={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {count > 0 ? (
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
          {count}
        </span>
      ) : null}
    </Button>
  );
}
