"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { useConvexAuth, useMutation, usePaginatedQuery, useQuery } from "convex/react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Archive,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  Mail,
  Paintbrush,
  Plus,
  Send,
  Trash2,
  Undo2,
  UserPlus,
  X,
} from "lucide-react";

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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

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

  const onCreateFromTemplate = async () => {
    if (!selectedTemplateId) {
      return;
    }
    setIsCreating(true);
    setFeedback("");
    try {
      const isDefaultTemplate = selectedTemplateId.startsWith("default:");
      await createFromTemplate({
        workspaceId,
        templateId: isDefaultTemplate
          ? undefined
          : (selectedTemplateId as Id<"noteTemplates">),
        defaultTemplateTitle: isDefaultTemplate
          ? selectedTemplateId.replace("default:", "")
          : undefined,
      });
      setSelectedTemplateId("");
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
            title={workspace?.name ?? "Workspace"}
            description="Create notes, manage members, and handle invites."
            backHref="/dashboard"
            backLabel="Dashboard"
            actions={
              memberState ? <RoleBadge role={memberState.currentUserRole} /> : null
            }
          />

          {isPending || memberState === undefined ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
          ) : null}

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
          ) : null}

          {memberState === null ? (
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
          ) : null}

          {memberFeedback ? (
            <StatusBanner
              variant={memberFeedback.includes("updated") || memberFeedback.includes("removed") ? "success" : "error"}
              message={memberFeedback}
              onDismiss={() => setMemberFeedback("")}
            />
          ) : null}
          {inviteFeedback ? (
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

          {memberState ? (
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-8">
                <ContentCard title="Whiteboard" description="Sketch ideas together in real-time">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                        <Paintbrush className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">Collaborative Canvas</p>
                        <p className="text-sm text-muted-foreground">
                          {memberState.currentUserRole === "viewer" ? "View only" : "Edit together"}
                        </p>
                      </div>
                    </div>
                    <Button asChild>
                      <Link href={`/workspace/${workspaceId}/whiteboard`}>
                        Open
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </ContentCard>

                <ContentCard
                  title="Notes"
                  description={`${notes.length} note${notes.length !== 1 ? "s" : ""} in this workspace`}
                  action={
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Search notes..."
                        value={noteSearch}
                        onChange={(event) => setNoteSearch(event.target.value)}
                        className="h-8 w-48"
                      />
                      <Button
                        variant={includeArchived ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setIncludeArchived((value) => !value)}
                      >
                        {includeArchived ? "Hide archived" : "Show archived"}
                      </Button>
                    </div>
                  }
                  contentClassName="p-0"
                >
                  <form onSubmit={onCreateNote} className="flex gap-3 border-b border-border p-4">
                    <Input
                      id="new-note-title"
                      placeholder="Note title"
                      value={noteTitle}
                      onChange={(event) => setNoteTitle(event.target.value)}
                      disabled={memberState.currentUserRole === "viewer" || isCreating}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={
                        memberState.currentUserRole === "viewer" || isCreating || !noteTitle.trim()
                      }
                    >
                      {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                    </Button>
                  </form>
                  {memberState.currentUserRole !== "viewer" ? (
                    <div className="flex items-center gap-3 border-b border-border p-4">
                      <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                        <SelectTrigger className="w-72">
                          <SelectValue placeholder="Create from template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {(templates ?? []).map((template) => (
                            <SelectItem key={template._id} value={template._id}>
                              {template.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void onCreateFromTemplate()}
                        disabled={!selectedTemplateId || isCreating}
                      >
                        Use template
                      </Button>
                    </div>
                  ) : null}
                  {noteSearch.trim() ? (
                    <div className="border-b border-border p-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Search results
                      </p>
                      {searchNotes && searchNotes.length > 0 ? (
                        <div className="space-y-2">
                          {searchNotes.map((result) => (
                            <Link
                              key={result._id}
                              href={`/note/${result._id}`}
                              className="block rounded-md border border-border px-3 py-2 hover:bg-accent/40"
                            >
                              <p className="text-sm font-medium text-card-foreground">{result.title}</p>
                              <p className="text-xs text-muted-foreground">{result.snippet || "No preview available"}</p>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No notes found.</p>
                      )}
                    </div>
                  ) : null}
                  {notesPaginationStatus === "LoadingFirstPage" ? (
                    <div className="space-y-2 p-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : notes.length === 0 ? (
                    <div className="p-6">
                      <EmptyState
                        icon={FileText}
                        title="No notes yet"
                        description="Create your first note to start documenting."
                        action={
                          memberState.currentUserRole !== "viewer" ? (
                            <Button onClick={() => document.getElementById("new-note-title")?.focus()}>
                              <Plus className="mr-2 h-4 w-4" />
                              Create Note
                            </Button>
                          ) : null
                        }
                      />
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {notes.map((note) => (
                        <div key={note._id} className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-accent/50">
                          <Link
                            href={`/note/${note._id}`}
                            className="flex min-w-0 flex-1 items-center gap-4"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="truncate font-medium text-card-foreground">
                                {note.title}
                              </h4>
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                Updated {new Date(note.updatedAt).toLocaleString()}
                                {note.isArchived ? " • Archived" : ""}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                          </Link>
                          {memberState.currentUserRole !== "viewer" ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => void onToggleArchive(note._id, note.isArchived)}
                                title={note.isArchived ? "Unarchive note" : "Archive note"}
                              >
                                {note.isArchived ? (
                                  <Undo2 className="h-4 w-4" />
                                ) : (
                                  <Archive className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => void onDeleteNote(note._id)}
                                title="Delete note"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                  {notesPaginationStatus === "CanLoadMore" ? (
                    <div className="border-t border-border px-6 py-4">
                      <Button variant="outline" size="sm" onClick={() => loadMoreNotes(20)}>
                        Load more
                      </Button>
                    </div>
                  ) : null}
                </ContentCard>
                {feedback ? (
                  <StatusBanner
                    variant={feedback.includes("created") ? "success" : "error"}
                    message={feedback}
                    onDismiss={() => setFeedback("")}
                  />
                ) : null}
              </div>

              <div className="space-y-8">
                <ContentCard
                  title="Members"
                  description={`${memberState.members.length} member${memberState.members.length !== 1 ? "s" : ""}`}
                  contentClassName="space-y-6"
                >
                  <div className="space-y-3">
                    {memberState.members.map((member) => (
                      <div key={member._id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                          {member.displayName.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-card-foreground">{member.displayName}</p>
                          <p className="truncate text-xs text-muted-foreground">{member.userEmail ?? "No email available"}</p>
                        </div>
                        {memberState.currentUserRole === "owner" && member.role !== "owner" ? (
                          <div className="flex items-center gap-2">
                            <Select
                              value={member.role}
                              onValueChange={(value) =>
                                void onUpdateMemberRole(member.tokenIdentifier, value as "editor" | "viewer")
                              }
                              disabled={updatingMemberToken === member.tokenIdentifier}
                            >
                              <SelectTrigger className="h-8 w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => void onRemoveMember(member.tokenIdentifier)}
                              disabled={updatingMemberToken === member.tokenIdentifier}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <RoleBadge role={member.role} />
                        )}
                      </div>
                    ))}
                  </div>

                  {memberState.currentUserRole === "owner" ? (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4 text-muted-foreground" />
                          <Label className="text-sm font-medium">Invite new member</Label>
                        </div>
                        <form onSubmit={onInviteMember} className="space-y-3">
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                type="email"
                                placeholder="Email address"
                                value={inviteEmail}
                                onChange={(event) => setInviteEmail(event.target.value)}
                                disabled={isInviting}
                                className="pl-9"
                              />
                            </div>
                            <Select
                              value={inviteRole}
                              onValueChange={(value) => setInviteRole(value as "editor" | "viewer")}
                              disabled={isInviting}
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button type="submit" disabled={isInviting || !inviteEmail.trim()} className="w-full">
                            {isInviting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="mr-2 h-4 w-4" />
                                Send Invite
                              </>
                            )}
                          </Button>
                        </form>
                      </div>
                    </>
                  ) : null}

                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">Pending Invites</Label>
                    {memberState.pendingInvites.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No pending invites.</p>
                    ) : (
                      memberState.pendingInvites.map((invite) => (
                        <div
                          key={invite._id}
                          className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-card-foreground">{invite.invitedEmail}</p>
                          </div>
                          <RoleBadge role={invite.role} showIcon={false} />
                          {memberState.currentUserRole === "owner" ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => void onRevokeInvite(invite._id)}
                              disabled={updatingInviteId === invite._id}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>

                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">Invite History</Label>
                    {memberState.acceptedInvites.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No accepted invites yet.</p>
                    ) : (
                      memberState.acceptedInvites.map((invite) => (
                        <div key={invite._id} className="flex items-center gap-3 rounded-lg border border-border p-3 opacity-60">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/10">
                            <Check className="h-4 w-4 text-success" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-card-foreground">{invite.invitedEmail}</p>
                            <p className="text-xs text-muted-foreground">
                              Accepted by {invite.acceptedByDisplayName ?? "Unknown member"}
                            </p>
                          </div>
                          <span className="text-xs font-medium text-success">Joined</span>
                        </div>
                      ))
                    )}
                  </div>
                </ContentCard>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
