"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useConvexAuth, useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useClerk, useUser } from "@clerk/nextjs";
import { ContentCard } from "@/components/content-card";
import { EmptyState } from "@/components/empty-state";
import { NavHeader } from "@/components/nav-header";
import { PageHeader } from "@/components/page-header";
import { RoleBadge } from "@/components/role-badge";
import { StatusBanner } from "@/components/status-banner";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, FolderOpen, Loader2, Plus, Search } from "lucide-react";

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const { isLoading: isConvexAuthLoading, isAuthenticated: isConvexAuthenticated } = useConvexAuth();
  const isPending = !isLoaded;
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "";
  const session = useMemo(
    () => (isSignedIn ? { user: { email: userEmail } } : null),
    [isSignedIn, userEmail],
  );
  const canRunProtectedQueries = Boolean(session) && isConvexAuthenticated;
  const sessionPending = isPending || (Boolean(session) && isConvexAuthLoading);
  const { showToast } = useToast();
  const {
    results: workspaces,
    status: workspacePaginationStatus,
    loadMore: loadMoreWorkspaces,
  } = usePaginatedQuery(api.workspaces.listPaginated, canRunProtectedQueries ? {} : "skip", {
    initialNumItems: 12,
  });
  const pendingInvites = useQuery(
    api.workspaces.listMyPendingInvites,
    canRunProtectedQueries ? {} : "skip",
  );
  const createWorkspace = useMutation(api.workspaces.create);
  const claimInvites = useMutation(api.workspaces.claimInvites);

  const [workspaceName, setWorkspaceName] = useState("");
  const [feedback, setFeedback] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const claimInFlightRef = useRef(false);
  const lastClaimAttemptRef = useRef<string>("");

  useEffect(() => {
    if (!canRunProtectedQueries) {
      claimInFlightRef.current = false;
      lastClaimAttemptRef.current = "";
      return;
    }
    if (pendingInvites === undefined || pendingInvites.length === 0) return;

    const inviteFingerprint = pendingInvites
      .map((invite) => invite._id)
      .sort()
      .join(",");
    if (inviteFingerprint === lastClaimAttemptRef.current) return;
    if (claimInFlightRef.current) return;

    claimInFlightRef.current = true;
    lastClaimAttemptRef.current = inviteFingerprint;

    void claimInvites()
      .then((result) => {
        if (result.claimed > 0) {
          setFeedback(`You joined ${result.claimed} invited workspace(s).`);
          showToast({
            message: `Invite accepted: joined ${result.claimed} workspace(s).`,
            variant: "success",
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        claimInFlightRef.current = false;
      });
  }, [canRunProtectedQueries, claimInvites, pendingInvites, showToast]);

  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter((workspace) =>
      workspace.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, workspaces]);

  const emptyStateTitle = useMemo(() => {
    if (workspacePaginationStatus === "LoadingFirstPage") return "";
    if (workspaces.length === 0) return "No workspaces yet";
    if (filteredWorkspaces.length === 0) return "No workspaces found";
    return "";
  }, [filteredWorkspaces.length, workspacePaginationStatus, workspaces.length]);

  const onCreateWorkspace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = workspaceName.trim();
    if (!trimmedName) {
      setFeedback("Workspace name is required.");
      return;
    }
    setIsCreating(true);
    setFeedback("");
    try {
      await createWorkspace({ name: trimmedName });
      setWorkspaceName("");
      setFeedback(`Workspace "${trimmedName}" created successfully`);
      showToast({ message: "Workspace created.", variant: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create workspace.";
      setFeedback(message);
      showToast({ message, variant: "error" });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavHeader
        isSignedIn={Boolean(session)}
        sessionPending={sessionPending}
        userEmail={session?.user.email}
        onSignOut={async () => {
          await signOut({ redirectUrl: "/" });
        }}
      />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="space-y-8">
          <PageHeader
            title="Dashboard"
            description={
              session
                ? `Signed in as ${session.user.email}`
                : "Manage your workspaces and collaborate with your team."
            }
          />

          {!session && !sessionPending ? (
            <ContentCard title="Authentication required">
              <EmptyState
                icon={FolderOpen}
                title="Sign in required"
                description="Your workspace list is available once you sign in."
                action={
                  <Button asChild>
                    <Link href="/sign-in">Go to sign in</Link>
                  </Button>
                }
              />
            </ContentCard>
          ) : null}

          {feedback ? (
            <StatusBanner
              variant={feedback.toLowerCase().includes("created") ? "success" : "muted"}
              message={feedback}
              onDismiss={() => setFeedback("")}
            />
          ) : null}

          <ContentCard
            title="Create Workspace"
            description="Start a new workspace to organize notes and invite collaborators."
          >
            <form onSubmit={onCreateWorkspace} className="flex gap-3">
              <Input
                id="create-workspace-name"
                placeholder="Workspace name"
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
                disabled={!canRunProtectedQueries || isCreating}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!canRunProtectedQueries || isCreating || !workspaceName.trim()}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create
                  </>
                )}
              </Button>
            </form>
          </ContentCard>

          <ContentCard
            title="Your Workspaces"
            description={`${workspaces.length} workspace${workspaces.length !== 1 ? "s" : ""}`}
            action={
              workspaces.length > 0 ? (
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search workspaces..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="pl-9"
                  />
                </div>
              ) : null
            }
            contentClassName="p-0"
          >
            {isPending || workspacePaginationStatus === "LoadingFirstPage" ? (
              <div className="divide-y divide-border">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : emptyStateTitle ? (
              <div className="p-6">
                <EmptyState
                  icon={FolderOpen}
                  title={emptyStateTitle}
                  description={
                    searchQuery
                      ? `No workspaces match "${searchQuery}". Try a different search.`
                      : "Create your first workspace to start organizing notes and collaborating."
                  }
                  action={
                    !searchQuery ? (
                      <Button onClick={() => document.getElementById("create-workspace-name")?.focus()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Workspace
                      </Button>
                    ) : null
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredWorkspaces.map((workspace) => (
                  <Link
                    href={`/workspace/${workspace._id}`}
                    key={workspace._id}
                    className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                      <FolderOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-medium text-card-foreground">{workspace.name}</h3>
                        <RoleBadge role={workspace.role} showIcon={false} />
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            )}

            {workspacePaginationStatus === "CanLoadMore" ? (
              <div className="flex items-center justify-between border-t border-border px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredWorkspaces.length} of {workspaces.length} workspaces
                </p>
                <Button variant="outline" size="sm" onClick={() => loadMoreWorkspaces(12)}>
                  Load more
                </Button>
              </div>
            ) : null}
            {workspacePaginationStatus === "LoadingMore" ? (
              <div className="px-6 pb-4">
                <StatusBanner variant="info" message="Loading more workspaces..." />
              </div>
            ) : null}
            {workspacePaginationStatus === "Exhausted" && workspaces.length > 0 ? (
              <div className="px-6 pb-4">
                <StatusBanner
                  variant="muted"
                  message="You have reached the end of your workspace list."
                />
              </div>
            ) : null}
          </ContentCard>
        </div>
      </main>
    </div>
  );
}
