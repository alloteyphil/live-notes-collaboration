"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { FileText } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { ContentCard } from "@/components/content-card";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentNotesCardProps {
  enabled: boolean;
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

export function RecentNotesCard({ enabled }: RecentNotesCardProps) {
  const recent = useQuery(
    api.notes.listRecentAcrossWorkspaces,
    enabled ? { limit: 10 } : "skip",
  );

  const isLoading = enabled && recent === undefined;

  return (
    <ContentCard
      title="Recent notes"
      description="Latest activity across all your workspaces"
      contentClassName="p-0"
    >
      {isLoading ? (
        <div className="divide-y divide-border">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <Skeleton className="h-9 w-9 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      ) : !recent || recent.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={FileText}
            title="No recent notes yet"
            description="Create a note inside any workspace and it will show up here."
          />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {recent.map((note) => (
            <li key={note._id}>
              <Link
                href={`/note/${note._id}`}
                className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50 sm:px-6"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-card-foreground">
                    {note.title || "Untitled note"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{note.workspaceName}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeTime(note.updatedAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ContentCard>
  );
}
