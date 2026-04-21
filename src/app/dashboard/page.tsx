"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useConvexAuth, useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useClerk, useUser } from "@clerk/nextjs";
import { ContentCard } from "@/components/content-card";
import { EmptyState } from "@/components/empty-state";
import { NavHeader } from "@/components/nav-header";
import { StatusBanner } from "@/components/status-banner";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { PendingInvitesCard } from "@/components/dashboard/pending-invites-card";
import { RecentNotesCard } from "@/components/dashboard/recent-notes-card";
import { FolderOpen, LayoutGrid, Mail, Menu, Sparkles } from "lucide-react";

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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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
      .catch((error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Could not auto-claim pending invites. Try refreshing.";
        setFeedback(message);
        showToast({
          message,
          variant: "error",
        });
      })
      .finally(() => {
        claimInFlightRef.current = false;
      });
  }, [canRunProtectedQueries, claimInvites, pendingInvites, showToast]);

  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter((workspace) =>
      workspace.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, workspaces]);

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

  const emailPrefix = userEmail.split("@")[0] || "there";
  const workspacesCount = workspaces.length;
  const pendingInvitesCount = pendingInvites?.length ?? 0;

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

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
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
        ) : (
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <DashboardSidebar
              workspaces={workspaces}
              filteredWorkspaces={filteredWorkspaces}
              status={workspacePaginationStatus}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              workspaceName={workspaceName}
              onWorkspaceNameChange={setWorkspaceName}
              onCreate={onCreateWorkspace}
              isCreating={isCreating}
              canInteract={canRunProtectedQueries}
              onLoadMore={() => loadMoreWorkspaces(12)}
              isLoading={sessionPending}
              mobileOpen={mobileSidebarOpen}
              onMobileOpenChange={setMobileSidebarOpen}
            />

            <section className="min-w-0 space-y-6">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5" />
                      Dashboard
                    </p>
                    <h1 className="truncate text-2xl font-semibold text-foreground sm:text-3xl">
                      Welcome back, {emailPrefix}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Here is what is happening across your workspaces.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => setMobileSidebarOpen(true)}
                  >
                    <Menu className="mr-1.5 h-4 w-4" />
                    Workspaces
                  </Button>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <StatTile
                    icon={<LayoutGrid className="h-4 w-4" />}
                    label="Workspaces"
                    value={workspacesCount}
                  />
                  <StatTile
                    icon={<Mail className="h-4 w-4" />}
                    label="Pending invites"
                    value={pendingInvitesCount}
                  />
                  <StatTile
                    icon={<FolderOpen className="h-4 w-4" />}
                    label="Filtered"
                    value={filteredWorkspaces.length}
                    hint={searchQuery ? `matching "${searchQuery}"` : undefined}
                  />
                </div>
              </div>

              {feedback ? (
                <StatusBanner
                  variant={feedback.toLowerCase().includes("created") ? "success" : "muted"}
                  message={feedback}
                  onDismiss={() => setFeedback("")}
                />
              ) : null}

              {pendingInvites && pendingInvites.length > 0 ? (
                <PendingInvitesCard invites={pendingInvites} />
              ) : null}

              <RecentNotesCard enabled={canRunProtectedQueries} />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
}

function StatTile({ icon, label, value, hint }: StatTileProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold text-foreground">{value}</p>
        {hint ? <p className="truncate text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}
