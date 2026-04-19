"use client";

import Link from "next/link";
import { FormEvent, useEffect } from "react";
import { ChevronRight, FolderOpen, Loader2, Plus, Search, X } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleBadge } from "@/components/role-badge";
import { cn } from "@/lib/utils";

type WorkspaceRow = Doc<"workspaces"> & {
  role: "owner" | "editor" | "viewer";
};

export type WorkspacesPaginationStatus =
  | "LoadingFirstPage"
  | "CanLoadMore"
  | "LoadingMore"
  | "Exhausted";

interface DashboardSidebarProps {
  workspaces: ReadonlyArray<WorkspaceRow>;
  filteredWorkspaces: ReadonlyArray<WorkspaceRow>;
  status: WorkspacesPaginationStatus;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  workspaceName: string;
  onWorkspaceNameChange: (value: string) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  isCreating: boolean;
  canInteract: boolean;
  onLoadMore: () => void;
  isLoading: boolean;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

export function DashboardSidebar(props: DashboardSidebarProps) {
  const { mobileOpen, onMobileOpenChange } = props;

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
          <SidebarInner {...props} variant="desktop" />
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
            "absolute inset-y-0 left-0 w-[min(320px,85vw)] border-r border-border bg-card shadow-xl transition-transform duration-200 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
          role="dialog"
          aria-label="Workspaces"
        >
          <SidebarInner {...props} variant="mobile" />
        </div>
      </div>
    </>
  );
}

interface SidebarInnerProps extends DashboardSidebarProps {
  variant: "desktop" | "mobile";
}

function SidebarInner({
  workspaces,
  filteredWorkspaces,
  status,
  searchQuery,
  onSearchChange,
  workspaceName,
  onWorkspaceNameChange,
  onCreate,
  isCreating,
  canInteract,
  onLoadMore,
  isLoading,
  onMobileOpenChange,
  variant,
}: Omit<SidebarInnerProps, "mobileOpen">) {
  const handleClose = () => onMobileOpenChange(false);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-4">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-card-foreground">Workspaces</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {workspaces.length}
          </span>
        </div>
        {variant === "mobile" ? (
          <Button variant="ghost" size="icon-sm" onClick={handleClose} aria-label="Close sidebar">
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <form onSubmit={onCreate} className="space-y-2 border-b border-border px-4 py-4">
        <label htmlFor={`create-workspace-${variant}`} className="text-xs font-medium text-muted-foreground">
          New workspace
        </label>
        <div className="flex gap-2">
          <Input
            id={`create-workspace-${variant}`}
            placeholder="Workspace name"
            value={workspaceName}
            onChange={(event) => onWorkspaceNameChange(event.target.value)}
            disabled={!canInteract || isCreating}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!canInteract || isCreating || !workspaceName.trim()}
            aria-label="Create workspace"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search workspaces..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div
        className={cn(
          "flex-1 overflow-y-auto",
          variant === "desktop" ? "max-h-[calc(100vh-22rem)]" : "max-h-[calc(100vh-16rem)]",
        )}
      >
        {isLoading || status === "LoadingFirstPage" ? (
          <div className="space-y-1 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-md px-2 py-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No workspaces yet. Create one above to get started.
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No workspaces match &quot;{searchQuery}&quot;.
          </div>
        ) : (
          <ul className="space-y-0.5 p-2">
            {filteredWorkspaces.map((workspace) => (
              <li key={workspace._id}>
                <Link
                  href={`/workspace/${workspace._id}`}
                  onClick={() => onMobileOpenChange(false)}
                  className="group flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <FolderOpen className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-card-foreground">
                        {workspace.name}
                      </span>
                    </div>
                    <div className="mt-0.5">
                      <RoleBadge role={workspace.role} showIcon={false} />
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {status === "CanLoadMore" ? (
        <div className="border-t border-border p-3">
          <Button variant="outline" size="sm" className="w-full" onClick={onLoadMore}>
            Load more
          </Button>
        </div>
      ) : null}
      {status === "LoadingMore" ? (
        <div className="flex items-center justify-center border-t border-border p-3 text-xs text-muted-foreground">
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          Loading more...
        </div>
      ) : null}
    </div>
  );
}
