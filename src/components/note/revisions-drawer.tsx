"use client";

import { History } from "lucide-react";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { NoteDrawer } from "@/components/note/note-drawer";

type Revision = Doc<"noteRevisions">;

interface RevisionsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revisions: ReadonlyArray<Revision>;
  status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";
  onLoadMore: () => void;
  canRestore: boolean;
  isRestoringRevisionId: string | null;
  onRestore: (revisionId: Id<"noteRevisions">) => void;
}

export function RevisionsDrawer({
  open,
  onOpenChange,
  revisions,
  status,
  onLoadMore,
  canRestore,
  isRestoringRevisionId,
  onRestore,
}: RevisionsDrawerProps) {
  return (
    <NoteDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Version history"
      description={`${revisions.length} saved ${revisions.length === 1 ? "revision" : "revisions"}`}
    >
      <div className="space-y-2 px-4 py-4 sm:px-6">
        {status === "LoadingFirstPage" ? (
          <p className="text-sm text-muted-foreground">Loading revisions...</p>
        ) : revisions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <History className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-card-foreground">No revisions yet</p>
            <p className="text-xs text-muted-foreground">
              Saved versions will appear here as you edit.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {revisions.map((revision) => (
              <li
                key={revision._id}
                className="flex flex-col gap-3 rounded-md border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-card-foreground">
                    {new Date(revision.createdAt).toLocaleString()}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {revision.reason ?? "autosave snapshot"}
                  </p>
                </div>
                {canRestore ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isRestoringRevisionId === revision._id}
                    onClick={() => onRestore(revision._id)}
                  >
                    {isRestoringRevisionId === revision._id ? "Restoring..." : "Restore"}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {status === "CanLoadMore" ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={onLoadMore}
          >
            Load more revisions
          </Button>
        ) : null}
        {status === "LoadingMore" ? (
          <p className="text-center text-xs text-muted-foreground">Loading...</p>
        ) : null}
      </div>
    </NoteDrawer>
  );
}
