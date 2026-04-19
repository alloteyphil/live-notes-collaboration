"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { useConvexAuth, useMutation, usePaginatedQuery, useQuery } from "convex/react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { useClerk, useUser } from "@clerk/nextjs";
import { ContentCard } from "@/components/content-card";
import { EmptyState } from "@/components/empty-state";
import { NavHeader } from "@/components/nav-header";
import { StatusBanner } from "@/components/status-banner";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  WorkspaceNotesSidebar,
  type WorkspaceNotesSidebarHandle,
} from "@/components/workspace/workspace-notes-sidebar";
import { WorkspaceHero } from "@/components/workspace/workspace-hero";
import { OverviewPanel } from "@/components/workspace/overview-panel";
import { MembersPanel } from "@/components/workspace/members-panel";
import { InvitesSubPanel } from "@/components/workspace/invites-sub-panel";

const getInviteErrorMessage = (error: unknown) => {
  if (!(error instanceof Error)) return "Failed to send invite.";
  if (error.message.includes("pending invite already exists")) {
    return "This person already has a pending invite.";
  }
  if (error.message.includes("Forbidden")) {
    return "Only workspace owners can invite members.";
  }
  return error.message;
};

type WorkspaceTab = "overview" | "members" | "invites";

export default function WorkspaceDetailPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const { isLoading: isConvexAuthLoading, isAuthenticated: isConvexAuthenticated } = useConvexAuth();
  const isPending = !isLoaded;
  const session = isSignedIn
    ? { user: { email: user?.primaryEmailAddress?.emailAddress ?? "" } }
    : null;
  const canRunProtectedQueries = Boolean(session) && isConvexAuthenticated;
  const sessionPending = isPending || (Boolean(session) && isConvexAuthLoading);
  const { showToast } = useToast();
  const params = useParams<{ id: string }>();
  const workspaceId = params.id as Id<"workspaces">;
  const [includeArchived, setIncludeArchived] = useState(false);
  const [noteSearch, setNoteSearch] = useState("");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const sidebarRef = useRef<WorkspaceNotesSidebarHandle | null>(null);

  const workspace = useQuery(api.workspaces.getById, canRunProtectedQueries ? { workspaceId } : "skip");
  const {
    results: notes,
    status: notesPaginationStatus,
    loadMore: loadMoreNotes,
  } = usePaginatedQuery(
    api.notes.listByWorkspacePaginated,
    canRunProtectedQueries ? { workspaceId, includeArchived } : "skip",
    { initialNumItems: 20 },
  );
  const memberState = useQuery(
    api.workspaces.listMembers,
    canRunProtectedQueries ? { workspaceId } : "skip",
  );
  const createNote = useMutation(api.notes.create);
  const createFromTemplate = useMutation(api.notes.createFromTemplate);
  const archiveNote = useMutation(api.notes.archive);
  const deleteNote = useMutation(api.notes.remove);
  const inviteMember = useMutation(api.workspaces.inviteMember);
  const revokeInvite = useMutation(api.workspaces.revokeInvite);
  const updateMemberRole = useMutation(api.workspaces.updateMemberRole);
  const removeMember = useMutation(api.workspaces.removeMember);

  const [noteTitle, setNoteTitle] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [inviteFeedback, setInviteFeedback] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [memberFeedback, setMemberFeedback] = useState("");
  const [updatingMemberToken, setUpdatingMemberToken] = useState<string | null>(null);
  const [updatingInviteId, setUpdatingInviteId] = useState<Id<"workspaceInvites"> | null>(null);
  const searchNotes = useQuery(
    api.notes.searchNotes,
    canRunProtectedQueries && noteSearch.trim()
      ? { workspaceId, searchTerm: noteSearch.trim(), limit: 10 }
      : "skip",
  );
  const templates = useQuery(
    api.notes.listTemplates,
    canRunProtectedQueries ? { workspaceId } : "skip",
  );

  const onCreateNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = noteTitle.trim();
    if (!trimmedTitle) {
      setFeedback("Note title is required.");
      return;
    }

    setIsCreating(true);
    setFeedback("");
    try {
      await createNote({ workspaceId, title: trimmedTitle });
      setNoteTitle("");
      setFeedback("Note created.");
      showToast({ message: "Note created.", variant: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create note.";
      setFeedback(message);
      showToast({ message, variant: "error" });
    } finally {
      setIsCreating(false);
    }
  };

  const onUseTemplate = async (templateId: string) => {
    setIsCreating(true);
    setFeedback("");
    try {
      const isDefaultTemplate = templateId.startsWith("default:");
      await createFromTemplate({
        workspaceId,
        templateId: isDefaultTemplate
          ? undefined
          : (templateId as Id<"noteTemplates">),
        defaultTemplateTitle: isDefaultTemplate
          ? templateId.replace("default:", "")
          : undefined,
      });
      setFeedback("Note created from template.");
      showToast({ message: "Note created from template.", variant: "success" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create note from template.";
      setFeedback(message);
      showToast({ message, variant: "error" });
    } finally {
      setIsCreating(false);
    }
  };

  const onToggleArchive = async (noteId: Id<"notes">, archived: boolean) => {
    try {
      await archiveNote({ noteId, archived: !archived });
      showToast({
        message: archived ? "Note unarchived." : "Note archived.",
        variant: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update note archive.";
      setFeedback(message);
      showToast({ message, variant: "error" });
    }
  };

  const onDeleteNote = async (noteId: Id<"notes">) => {
    try {
      await deleteNote({ noteId });
      showToast({ message: "Note deleted.", variant: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete note.";
      setFeedback(message);
      showToast({ message, variant: "error" });
    }
  };

  const onInviteMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = inviteEmail.trim();
    if (!trimmedEmail) {
      setInviteFeedback("Invite email is required.");
      return;
    }
    setIsInviting(true);
    setInviteFeedback("");
    try {
      await inviteMember({ workspaceId, email: trimmedEmail, role: inviteRole });
      setInviteEmail("");
      setInviteFeedback(`Invite sent to ${trimmedEmail}`);
      showToast({ message: "Invite sent.", variant: "success" });
    } catch (error) {
      const message = getInviteErrorMessage(error);
      setInviteFeedback(message);
      showToast({ message, variant: "error" });
    } finally {
      setIsInviting(false);
    }
  };

  const onUpdateMemberRole = async (memberTokenIdentifier: string, role: "editor" | "viewer") => {
    setUpdatingMemberToken(memberTokenIdentifier);
    setMemberFeedback("");
    try {
      await updateMemberRole({ workspaceId, memberTokenIdentifier, role });
      setMemberFeedback("Member role updated.");
      showToast({ message: "Member role updated.", variant: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update member role.";
      setMemberFeedback(message);
      showToast({ message, variant: "error" });
    } finally {
      setUpdatingMemberToken(null);
    }
  };

  const onRemoveMember = async (memberTokenIdentifier: string) => {
    setUpdatingMemberToken(memberTokenIdentifier);
    setMemberFeedback("");
    try {
      await removeMember({ workspaceId, memberTokenIdentifier });
      setMemberFeedback("Member removed.");
      showToast({ message: "Member removed.", variant: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to remove member.";
      setMemberFeedback(message);
      showToast({ message, variant: "error" });
    } finally {
      setUpdatingMemberToken(null);
    }
  };

  const onRevokeInvite = async (inviteId: Id<"workspaceInvites">) => {
    setUpdatingInviteId(inviteId);
    setInviteFeedback("");
    try {
      await revokeInvite({ workspaceId, inviteId });
      setInviteFeedback("Invite revoked.");
      showToast({ message: "Invite revoked.", variant: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to revoke invite.";
      setInviteFeedback(message);
      showToast({ message, variant: "error" });
    } finally {
      setUpdatingInviteId(null);
    }
  };

  const focusSidebarCreate = () => {
    sidebarRef.current?.focusCreateInput();
  };

  const canManageNotes =
    memberState !== null && memberState !== undefined && memberState.currentUserRole !== "viewer";
  const canCreate = canManageNotes;
  const pendingInvitesCount = memberState?.pendingInvites.length ?? 0;

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
          <ContentCard>
            <EmptyState
              title="Sign in required"
              description="Authentication is required before workspace data is available."
              action={
                <Button asChild>
                  <Link href="/sign-in">Go to sign in</Link>
                </Button>
              }
            />
          </ContentCard>
        ) : memberState === null ? (
          <ContentCard>
            <EmptyState
              title="Access removed"
              description="You no longer have permission to open this workspace."
              action={
                <Button asChild variant="outline">
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
              }
            />
          </ContentCard>
        ) : memberState === undefined || isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <WorkspaceNotesSidebar
              ref={sidebarRef}
              notes={notes}
              status={notesPaginationStatus}
              includeArchived={includeArchived}
              onToggleArchived={setIncludeArchived}
              search={noteSearch}
              onSearchChange={setNoteSearch}
              searchResults={searchNotes ?? undefined}
              noteTitle={noteTitle}
              onNoteTitleChange={setNoteTitle}
              onCreate={onCreateNote}
              isCreating={isCreating}
              canCreate={canCreate}
              canManage={canManageNotes}
              onToggleArchive={onToggleArchive}
              onDelete={onDeleteNote}
              onLoadMore={() => loadMoreNotes(20)}
              mobileOpen={mobileSidebarOpen}
              onMobileOpenChange={setMobileSidebarOpen}
            />

            <section className="min-w-0 space-y-6">
              <WorkspaceHero
                name={workspace?.name ?? "Workspace"}
                role={memberState.currentUserRole}
                notesCount={notes.length}
                membersCount={memberState.members.length}
                pendingInvitesCount={pendingInvitesCount}
                whiteboardHref={`/workspace/${workspaceId}/whiteboard`}
                onOpenNotesSidebar={() => setMobileSidebarOpen(true)}
                onNewNote={focusSidebarCreate}
                canCreateNote={canCreate}
              />

              <TabsBar active={activeTab} onChange={setActiveTab} pendingInvitesCount={pendingInvitesCount} />

              {activeTab === "overview" && feedback ? (
                <StatusBanner
                  variant={feedback.toLowerCase().includes("created") ? "success" : "error"}
                  message={feedback}
                  onDismiss={() => setFeedback("")}
                />
              ) : null}
              {activeTab === "members" && memberFeedback ? (
                <StatusBanner
                  variant={
                    memberFeedback.includes("updated") || memberFeedback.includes("removed")
                      ? "success"
                      : "error"
                  }
                  message={memberFeedback}
                  onDismiss={() => setMemberFeedback("")}
                />
              ) : null}
              {(activeTab === "members" || activeTab === "invites") && inviteFeedback ? (
                <StatusBanner
                  variant={
                    inviteFeedback.includes("sent") || inviteFeedback.includes("revoked")
                      ? "success"
                      : inviteFeedback.includes("required") || inviteFeedback.includes("pending")
                        ? "warning"
                        : "error"
                  }
                  message={inviteFeedback}
                  onDismiss={() => setInviteFeedback("")}
                />
              ) : null}

              {activeTab === "overview" ? (
                <OverviewPanel
                  notes={notes}
                  canUseTemplates={canManageNotes}
                  templates={templates ?? undefined}
                  onUseTemplate={onUseTemplate}
                  isCreating={isCreating}
                  whiteboardHref={`/workspace/${workspaceId}/whiteboard`}
                  onSeeAllNotes={() => setMobileSidebarOpen(true)}
                  onFocusCreate={focusSidebarCreate}
                  canCreateNote={canCreate}
                />
              ) : null}

              {activeTab === "members" ? (
                <MembersPanel
                  members={memberState.members}
                  currentUserRole={memberState.currentUserRole}
                  updatingMemberToken={updatingMemberToken}
                  onUpdateMemberRole={onUpdateMemberRole}
                  onRemoveMember={onRemoveMember}
                  inviteEmail={inviteEmail}
                  onInviteEmailChange={setInviteEmail}
                  inviteRole={inviteRole}
                  onInviteRoleChange={setInviteRole}
                  onInvite={onInviteMember}
                  isInviting={isInviting}
                />
              ) : null}

              {activeTab === "invites" ? (
                <InvitesSubPanel
                  pendingInvites={memberState.pendingInvites}
                  acceptedInvites={memberState.acceptedInvites}
                  currentUserRole={memberState.currentUserRole}
                  updatingInviteId={updatingInviteId}
                  onRevoke={onRevokeInvite}
                />
              ) : null}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

interface TabsBarProps {
  active: WorkspaceTab;
  onChange: (tab: WorkspaceTab) => void;
  pendingInvitesCount: number;
}

function TabsBar({ active, onChange, pendingInvitesCount }: TabsBarProps) {
  const tabs: Array<{ id: WorkspaceTab; label: string; count?: number }> = [
    { id: "overview", label: "Overview" },
    { id: "members", label: "Members" },
    { id: "invites", label: "Invites", count: pendingInvitesCount },
  ];

  return (
    <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1 shadow-sm">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {tab.label}
            {tab.count && tab.count > 0 ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
