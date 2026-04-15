"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { authClient } from "@/lib/auth-client";
import { api } from "../../../convex/_generated/api";
import { useToast } from "@/components/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icons } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StateMessage } from "@/components/ui/state-message";

export default function DashboardPage() {
  const { data: session, isPending } = authClient.useSession();
  const { showToast } = useToast();
  const {
    results: workspaces,
    status: workspacePaginationStatus,
    loadMore: loadMoreWorkspaces,
  } = usePaginatedQuery(
    api.workspaces.listPaginated,
    session ? {} : "skip",
    { initialNumItems: 12 },
  );
  const pendingInvites = useQuery(api.workspaces.listMyPendingInvites, session ? {} : "skip");
  const createWorkspace = useMutation(api.workspaces.create);
  const claimInvites = useMutation(api.workspaces.claimInvites);

  const [workspaceName, setWorkspaceName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const claimInFlightRef = useRef(false);
  const lastClaimAttemptRef = useRef<string>("");

  useEffect(() => {
    if (!session) {
      claimInFlightRef.current = false;
      lastClaimAttemptRef.current = "";
      return;
    }

    if (pendingInvites === undefined || pendingInvites.length === 0) {
      return;
    }

    const inviteFingerprint = pendingInvites.map((invite) => invite._id).sort().join(",");
    if (inviteFingerprint === lastClaimAttemptRef.current) {
      return;
    }

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
      .catch(() => {
        // Keep dashboard usable even if invite claim fails.
      })
      .finally(() => {
        claimInFlightRef.current = false;
      });
  }, [claimInvites, pendingInvites, session, showToast]);

  const emptyStateMessage = useMemo(() => {
    if (workspacePaginationStatus === "LoadingFirstPage") return "Loading workspaces...";
    if (workspaces.length === 0) return "No workspaces yet. Create your first one.";
    return "";
  }, [workspacePaginationStatus, workspaces]);

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
      setFeedback("Workspace created.");
      showToast({ message: "Workspace created.", variant: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create workspace.";
      setFeedback(message);
      showToast({ message, variant: "error" });
    } finally {
      setIsCreating(false);
    }
  };

  if (isPending) {
    return (
      <main className="app-container space-y-4">
        <Skeleton className="h-10 w-60" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
      </main>
    );
  }

  if (!session) {
    return (
      <main className="app-container space-y-4">
        <PageHeader description="You need an account session to continue." title="Dashboard" />
        <EmptyState
          action={
            <Button asChild>
              <Link href="/">
                Go to sign in
                <Icons.forward />
              </Link>
            </Button>
          }
          description="Your workspace list is available once you sign in."
          icon={Icons.dashboard}
          title="Sign in required"
        />
      </main>
    );
  }

  return (
    <main className="app-container space-y-6">
      <PageHeader
        actions={
          <Button asChild size="sm" variant="secondary">
            <Link href="/">
              Auth Home
              <Icons.forward />
            </Link>
          </Button>
        }
        description={`Signed in as ${session.user.email}`}
        title="Workspace Dashboard"
      />

      <Card>
        <CardHeader>
          <CardTitle>Create Workspace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={onCreateWorkspace}>
            <Input
              id="create-workspace-name"
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="My Team Notes"
              value={workspaceName}
            />
            <Button disabled={isCreating} isLoading={isCreating} type="submit">
              <Icons.plus />
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </form>
          {feedback ? (
            <StateMessage variant={feedback.includes("created") ? "success" : "muted"}>
              {feedback}
            </StateMessage>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Workspaces</CardTitle>
        </CardHeader>
        {workspacePaginationStatus === "LoadingFirstPage" ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : emptyStateMessage ? (
          <EmptyState
            action={
              <Button onClick={() => document.getElementById("create-workspace-name")?.focus()} size="sm">
                <Icons.plus />
                Create workspace
              </Button>
            }
            description="Start by creating a workspace for your team notes."
            icon={Icons.folder}
            title="No workspaces yet"
          />
        ) : (
          <div className="space-y-3">
            <ul className="space-y-2">
              {workspaces.map((workspace) => (
                <li
                  className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2"
                  key={workspace._id}
                >
                  <div>
                    <p className="font-medium">{workspace.name}</p>
                    <Badge className="mt-1 capitalize" variant="muted">
                      {workspace.role}
                    </Badge>
                  </div>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/workspace/${workspace._id}`}>
                      Open
                      <Icons.forward />
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
            {workspacePaginationStatus === "CanLoadMore" ? (
              <Button onClick={() => loadMoreWorkspaces(12)} variant="secondary">
                <Icons.folder />
                Load more
              </Button>
            ) : null}
            {workspacePaginationStatus === "LoadingMore" ? (
              <StateMessage variant="info">Loading more workspaces...</StateMessage>
            ) : null}
            {workspacePaginationStatus === "Exhausted" ? (
              <StateMessage variant="muted">
                You have reached the end of your workspace list.
              </StateMessage>
            ) : null}
          </div>
        )}
      </Card>
    </main>
  );
}
