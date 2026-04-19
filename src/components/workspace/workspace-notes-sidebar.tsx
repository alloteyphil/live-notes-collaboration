"use client";

import Link from "next/link";
import {
  FormEvent,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { FileText, Loader2, Plus, Search, X } from "lucide-react";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { NoteRow } from "@/components/workspace/note-row";
import { cn } from "@/lib/utils";

type NoteDoc = Doc<"notes">;

type SearchResult = {
  _id: Id<"notes">;
  title: string;
  snippet?: string;
};

export type NotesPaginationStatus =
  | "LoadingFirstPage"
  | "CanLoadMore"
  | "LoadingMore"
  | "Exhausted";

export interface WorkspaceNotesSidebarHandle {
  focusCreateInput: () => void;
}

interface WorkspaceNotesSidebarProps {
  notes: ReadonlyArray<NoteDoc>;
  status: NotesPaginationStatus;
  includeArchived: boolean;
  onToggleArchived: (value: boolean) => void;
  search: string;
  onSearchChange: (value: string) => void;
  searchResults?: ReadonlyArray<SearchResult>;
  noteTitle: string;
  onNoteTitleChange: (value: string) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  isCreating: boolean;
  canCreate: boolean;
  canManage: boolean;
  onToggleArchive: (noteId: Id<"notes">, archived: boolean) => void;
  onDelete: (noteId: Id<"notes">) => void;
  onLoadMore: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

export const WorkspaceNotesSidebar = forwardRef<
  WorkspaceNotesSidebarHandle,
  WorkspaceNotesSidebarProps
>(function WorkspaceNotesSidebar(props, ref) {
  const { mobileOpen, onMobileOpenChange } = props;
  const desktopCreateInputRef = useRef<HTMLInputElement | null>(null);
  const mobileCreateInputRef = useRef<HTMLInputElement | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      focusCreateInput: () => {
        const isDesktop =
          typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
        if (isDesktop) {
          desktopCreateInputRef.current?.focus();
          desktopCreateInputRef.current?.select();
          return;
        }
        onMobileOpenChange(true);
        requestAnimationFrame(() => {
          mobileCreateInputRef.current?.focus();
          mobileCreateInputRef.current?.select();
        });
      },
    }),
    [onMobileOpenChange],
  );

  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen]);

  return (
    <>
      <aside className="hidden lg:block">
        <div className="sticky top-20 rounded-xl border border-border bg-card shadow-sm">
          <SidebarInner {...props} variant="desktop" createInputRef={desktopCreateInputRef} />
        </div>
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => onMobileOpenChange(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-[min(340px,85vw)] border-r border-border bg-card shadow-xl transition-transform duration-200 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
          role="dialog"
          aria-label="Notes"
        >
          <SidebarInner {...props} variant="mobile" createInputRef={mobileCreateInputRef} />
        </div>
      </div>
    </>
  );
});

interface SidebarInnerProps extends WorkspaceNotesSidebarProps {
  variant: "desktop" | "mobile";
  createInputRef: React.RefObject<HTMLInputElement | null>;
}

function SidebarInner({
  notes,
  status,
  includeArchived,
  onToggleArchived,
  search,
  onSearchChange,
  searchResults,
  noteTitle,
  onNoteTitleChange,
  onCreate,
  isCreating,
  canCreate,
  canManage,
  onToggleArchive,
  onDelete,
  onLoadMore,
  onMobileOpenChange,
  variant,
  createInputRef,
}: Omit<SidebarInnerProps, "mobileOpen">) {
  const handleClose = () => onMobileOpenChange(false);
  const searchTrimmed = search.trim();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-4">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-card-foreground">Notes</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {notes.length}
          </span>
        </div>
        {variant === "mobile" ? (
          <Button variant="ghost" size="icon-sm" onClick={handleClose} aria-label="Close sidebar">
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {canCreate ? (
        <form onSubmit={onCreate} className="space-y-2 border-b border-border px-4 py-4">
          <label
            htmlFor={`new-note-title-${variant}`}
            className="text-xs font-medium text-muted-foreground"
          >
            New note
          </label>
          <div className="flex flex-col gap-2">
            <Input
              ref={createInputRef}
              id={`new-note-title-${variant}`}
              placeholder="Note title"
              value={noteTitle}
              onChange={(event) => onNoteTitleChange(event.target.value)}
              disabled={!canCreate || isCreating}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!canCreate || isCreating || !noteTitle.trim()}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create note
                </>
              )}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="space-y-3 px-4 py-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-9"
          />
        </div>
        <div className="inline-flex w-full rounded-md border border-border bg-muted/30 p-0.5">
          <button
            type="button"
            onClick={() => onToggleArchived(false)}
            className={cn(
              "flex-1 rounded-sm px-2 py-1 text-xs font-medium transition-colors",
              !includeArchived
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => onToggleArchived(true)}
            className={cn(
              "flex-1 rounded-sm px-2 py-1 text-xs font-medium transition-colors",
              includeArchived
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            All
          </button>
        </div>
      </div>

      <div
        className={cn(
          "flex-1 overflow-y-auto",
          variant === "desktop" ? "max-h-[calc(100vh-26rem)]" : "max-h-[calc(100vh-20rem)]",
        )}
      >
        {searchTrimmed ? (
          <SearchResultsList
            results={searchResults}
            searchTerm={searchTrimmed}
            onNavigate={() => onMobileOpenChange(false)}
          />
        ) : status === "LoadingFirstPage" ? (
          <div className="space-y-1 p-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2 rounded-md px-2 py-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-4/5" />
                  <Skeleton className="h-3 w-2/5" />
                </div>
              </div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-card-foreground">No notes yet</p>
            <p className="text-xs text-muted-foreground">
              {canCreate ? "Create your first note above." : "Members can create notes here."}
            </p>
          </div>
        ) : (
          <ul className="space-y-0.5 p-2">
            {notes.map((note) => (
              <li key={note._id}>
                <NoteRow
                  noteId={note._id}
                  title={note.title}
                  updatedAt={note.updatedAt}
                  isArchived={note.isArchived}
                  canManage={canManage}
                  onToggleArchive={() => onToggleArchive(note._id, note.isArchived)}
                  onDelete={() => onDelete(note._id)}
                  onNavigate={() => onMobileOpenChange(false)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {!searchTrimmed && status === "CanLoadMore" ? (
        <div className="border-t border-border p-3">
          <Button variant="outline" size="sm" className="w-full" onClick={onLoadMore}>
            Load more
          </Button>
        </div>
      ) : null}
      {!searchTrimmed && status === "LoadingMore" ? (
        <div className="flex items-center justify-center border-t border-border p-3 text-xs text-muted-foreground">
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          Loading more...
        </div>
      ) : null}
    </div>
  );
}

interface SearchResultsListProps {
  results: ReadonlyArray<SearchResult> | undefined;
  searchTerm: string;
  onNavigate: () => void;
}

function SearchResultsList({ results, searchTerm, onNavigate }: SearchResultsListProps) {
  if (results === undefined) {
    return (
      <div className="space-y-1 p-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 rounded-md px-2 py-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        No notes match &quot;{searchTerm}&quot;.
      </div>
    );
  }

  return (
    <ul className="space-y-0.5 p-2">
      {results.map((result) => (
        <li key={result._id}>
          <Link
            href={`/note/${result._id}`}
            onClick={onNavigate}
            className="group flex items-start gap-2 rounded-md px-2 py-2 transition-colors hover:bg-accent"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-card-foreground">
                {result.title || "Untitled note"}
              </p>
              {result.snippet ? (
                <p className="line-clamp-2 text-xs text-muted-foreground">{result.snippet}</p>
              ) : null}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
