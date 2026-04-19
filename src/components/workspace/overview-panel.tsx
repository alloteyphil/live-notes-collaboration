"use client";

import Link from "next/link";
import { ChevronRight, FileText, Paintbrush, Sparkles } from "lucide-react";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { ContentCard } from "@/components/content-card";
import { EmptyState } from "@/components/empty-state";

type NoteDoc = Doc<"notes">;

type TemplateOption = {
  _id: string;
  title: string;
};

interface OverviewPanelProps {
  notes: ReadonlyArray<NoteDoc>;
  canUseTemplates: boolean;
  templates: ReadonlyArray<TemplateOption> | undefined;
  onUseTemplate: (templateId: string) => void;
  isCreating: boolean;
  whiteboardHref: string;
  onSeeAllNotes: () => void;
  onFocusCreate: () => void;
  canCreateNote: boolean;
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

export function OverviewPanel({
  notes,
  canUseTemplates,
  templates,
  onUseTemplate,
  isCreating,
  whiteboardHref,
  onSeeAllNotes,
  onFocusCreate,
  canCreateNote,
}: OverviewPanelProps) {
  const recent = notes.filter((note) => !note.isArchived).slice(0, 5);
  const templateList = templates ?? [];

  return (
    <div className="space-y-6">
      <ContentCard
        title="Recent notes"
        description="The latest activity in this workspace"
        action={
          notes.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={onSeeAllNotes}>
              See all
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : null
        }
        contentClassName="p-0"
      >
        {recent.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={FileText}
              title="No notes yet"
              description={
                canCreateNote
                  ? "Create your first note to start documenting."
                  : "Members with editor access can create notes here."
              }
              action={
                canCreateNote ? (
                  <Button onClick={onFocusCreate}>Create Note</Button>
                ) : null
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((note) => (
              <li key={note._id}>
                <NotePreviewRow
                  id={note._id}
                  title={note.title}
                  updatedAt={note.updatedAt}
                  isArchived={note.isArchived}
                />
              </li>
            ))}
          </ul>
        )}
      </ContentCard>

      {canUseTemplates ? (
        <ContentCard
          title="Templates"
          description="Jumpstart a note with a shared structure"
          contentClassName="p-0"
        >
          {templateList.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No templates available yet.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {templateList.map((template) => (
                <li
                  key={template._id}
                  className="flex items-center gap-3 px-4 py-3 sm:px-6"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-card-foreground">
                      {template.title}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isCreating}
                    onClick={() => onUseTemplate(template._id)}
                  >
                    Use
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ContentCard>
      ) : null}

      <ContentCard
        title="Whiteboard"
        description="Sketch ideas together in real-time"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Paintbrush className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              Collaborate on a shared canvas for this workspace.
            </p>
          </div>
          <Button asChild>
            <Link href={whiteboardHref}>
              Open
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </ContentCard>
    </div>
  );
}

function NotePreviewRow({
  id,
  title,
  updatedAt,
  isArchived,
}: {
  id: Id<"notes">;
  title: string;
  updatedAt: number;
  isArchived: boolean;
}) {
  return (
    <Link
      href={`/note/${id}`}
      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50 sm:px-6"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
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
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
