"use client";

import Link from "next/link";
import { Archive, FileText, MoreHorizontal, Trash2, Undo2 } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NoteRowProps {
  noteId: Id<"notes">;
  title: string;
  updatedAt: number;
  isArchived: boolean;
  canManage: boolean;
  onToggleArchive?: () => void;
  onDelete?: () => void;
  onNavigate?: () => void;
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.max(1, Math.floor(diff / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function NoteRow({
  noteId,
  title,
  updatedAt,
  isArchived,
  canManage,
  onToggleArchive,
  onDelete,
  onNavigate,
}: NoteRowProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-2 transition-colors hover:bg-accent",
        isArchived ? "opacity-70" : undefined,
      )}
    >
      <Link
        href={`/note/${noteId}`}
        onClick={onNavigate}
        className="flex min-w-0 flex-1 items-center gap-2"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-card-foreground">
            {title || "Untitled note"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {formatRelativeTime(updatedAt)}
            {isArchived ? " \u00B7 Archived" : ""}
          </p>
        </div>
      </Link>
      {canManage ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
              aria-label="Note actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onToggleArchive} className="cursor-pointer">
              {isArchived ? (
                <>
                  <Undo2 className="mr-2 h-4 w-4" />
                  Unarchive
                </>
              ) : (
                <>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
