"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
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
  const { data: session, isPending } = authClient.useSession();
  const { showToast } = useToast();
  const params = useParams<{ id: string }>();
  const workspaceId = params.id as Id<"workspaces">;

  const workspace = useQuery(
    api.workspaces.getById,
    session ? { workspaceId } : "skip",
  );
  const {
    results: notes,
    status: notesPaginationStatus,
    loadMore: loadMoreNotes,
  } = usePaginatedQuery(
    api.notes.listByWorkspacePaginated,
    session ? { workspaceId, includeArchived: false } : "skip",
    { initialNumItems: 20 },
  );
  const memberState = useQuery(api.workspaces.listMembers, session ? { workspaceId } : "skip");
  const createNote = useMutation(api.notes.create);
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
      setInviteFeedback("Invite sent.");
      showToast({ message: "Invite sent.", variant: "success" });
    } catch (error) {
      const message = getInviteErrorMessage(error);
      setInviteFeedback(message);
      showToast({ message, variant: "error" });
    } finally {
      setIsInviting(false);
    }
  };

  const onUpdateMemberRole = async (
    memberTokenIdentifier: string,
    role: "editor" | "viewer",
  ) => {
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

  if (isPending) {
    return (
      <main className="app-container space-y-4">
        <Skeleton className="h-10 w-52" />
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-72 w-full" />
      </main>
    );
  }

  if (!session) {
    return (
      <main className="app-container space-y-4">
        <PageHeader description="You need a signed-in account to access workspace notes." title="Workspace" />
        <EmptyState
          action={
            <Button asChild>
              <Link href="/">
                Go to sign in
                <Icons.forward />
              </Link>
            </Button>
          }
          description="Authentication is required before workspace data is available."
          icon={Icons.users}
          title="Sign in required"
        />
      </main>
    );
  }

  if (memberState === null) {
    return (
      <main className="app-container space-y-4">
        <PageHeader
          description="Your membership was removed or your permissions changed."
          title="Workspace access removed"
        />
        <EmptyState
          action={
            <Button asChild variant="secondary">
              <Link href="/dashboard">
                <Icons.back />
                Back to Dashboard
              </Link>
            </Button>
          }
          description="Return to your dashboard and choose another workspace."
          icon={Icons.alert}
          title="You no longer have access"
        />
      </main>
    );
  }

  return (
    <main className="app-container space-y-6">
      <PageHeader
        actions={
          <Button asChild size="sm" variant="secondary">
            <Link href="/dashboard">
              <Icons.back />
              Back to Dashboard
            </Link>
          </Button>
        }
        description="Create notes, manage members, and handle invites."
        title={workspace?.name ?? "Workspace"}
      />

      <Card>
        <CardHeader>
          <CardTitle>Whiteboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-zinc-600">
            Sketch ideas and collaborate visually in this workspace.
          </p>
          <Button asChild>
            <Link href={`/workspace/${workspaceId}/whiteboard`}>
              <Icons.note />
              Open whiteboard
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        {memberState === undefined ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {memberState.members.map((member) => (
                <li
                  className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2"
                  key={member._id}
                >
                  <div>
                    <p className="font-medium">{member.displayName}</p>
                    <p className="text-xs text-zinc-500">{member.userEmail ?? "No email available"}</p>
                  </div>
                  {memberState.currentUserRole === "owner" && member.role !== "owner" ? (
                    <div className="flex items-center gap-2">
                      <select
                        className="rounded-md border border-zinc-300 px-2 py-1 text-xs outline-none ring-zinc-400 focus:ring-2"
                        disabled={updatingMemberToken === member.tokenIdentifier}
                        onChange={(event) =>
                          void onUpdateMemberRole(
                            member.tokenIdentifier,
                            event.target.value as "editor" | "viewer",
                          )
                        }
                        value={member.role}
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <Button
                        disabled={updatingMemberToken === member.tokenIdentifier}
                        onClick={() => void onRemoveMember(member.tokenIdentifier)}
                        size="sm"
                        type="button"
                        variant="danger"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Badge className="capitalize" variant="muted">
                      {member.role}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
            {memberFeedback ? (
              <StateMessage variant={memberFeedback.includes("updated") ? "success" : "muted"}>
                {memberFeedback}
              </StateMessage>
            ) : null}

            {memberState.currentUserRole === "owner" ? (
              <form className="space-y-2 rounded-md border border-zinc-200 p-3" onSubmit={onInviteMember}>
                <h3 className="text-sm font-medium">Invite member</h3>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder="teammate@email.com"
                    type="email"
                    value={inviteEmail}
                  />
                  <select
                    className="app-select"
                    onChange={(event) => setInviteRole(event.target.value as "editor" | "viewer")}
                    value={inviteRole}
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <Button disabled={isInviting} isLoading={isInviting} type="submit">
                    <Icons.invite />
                    {isInviting ? "Inviting..." : "Invite"}
                  </Button>
                </div>
                {inviteFeedback ? (
                  <StateMessage
                    variant={
                      inviteFeedback.includes("sent") || inviteFeedback.includes("revoked")
                        ? "success"
                        : inviteFeedback.includes("required") || inviteFeedback.includes("pending")
                          ? "warning"
                          : "error"
                    }
                  >
                    {inviteFeedback}
                  </StateMessage>
                ) : null}
              </form>
            ) : (
              <p className="text-sm text-zinc-600">Only workspace owners can invite members.</p>
            )}

            <div>
              <h3 className="mb-2 text-sm font-medium">Pending invites</h3>
              {memberState.pendingInvites.length === 0 ? (
                <p className="text-sm text-zinc-600">No pending invites.</p>
              ) : (
                <ul className="space-y-2">
                  {memberState.pendingInvites.map((invite) => (
                    <li
                      className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-sm"
                      key={invite._id}
                    >
                      <div>
                        <span>{invite.invitedEmail}</span>
                        <Badge className="ml-2 capitalize" variant="muted">
                          {invite.role}
                        </Badge>
                      </div>
                      {memberState.currentUserRole === "owner" ? (
                        <Button
                          disabled={updatingInviteId === invite._id}
                          onClick={() => void onRevokeInvite(invite._id)}
                          size="sm"
                          type="button"
                          variant="danger"
                        >
                          {updatingInviteId === invite._id ? "Revoking..." : "Revoke"}
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium">Accepted invite history</h3>
              {memberState.acceptedInvites.length === 0 ? (
                <EmptyState
                  className="py-4"
                  description="Accepted invites will appear here for audit visibility."
                  icon={Icons.users}
                  title="No accepted invites yet"
                />
              ) : (
                <ul className="space-y-2">
                  {memberState.acceptedInvites.map((invite) => (
                    <li
                      className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-sm"
                      key={invite._id}
                    >
                      <div>
                        <p className="font-medium">{invite.invitedEmail}</p>
                        <p className="text-xs text-zinc-500">
                          Accepted by {invite.acceptedByDisplayName ?? "Unknown member"}
                          {invite.acceptedAt ? ` • ${new Date(invite.acceptedAt).toLocaleString()}` : ""}
                        </p>
                      </div>
                      <Badge className="capitalize" variant="muted">
                        {invite.role}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create Note</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={onCreateNote}>
            <Input
              id="new-note-title"
              onChange={(event) => setNoteTitle(event.target.value)}
              placeholder="Meeting notes"
              value={noteTitle}
            />
            <Button disabled={isCreating} isLoading={isCreating} type="submit">
              <Icons.plus />
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </form>
          {feedback ? (
            <StateMessage variant={feedback.includes("created") ? "success" : "error"}>
              {feedback}
            </StateMessage>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        {notesPaginationStatus === "LoadingFirstPage" ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : notes.length === 0 ? (
          <EmptyState
            action={
              <Button onClick={() => document.getElementById("new-note-title")?.focus()} size="sm">
                <Icons.plus />
                Create first note
              </Button>
            }
            description="Notes in this workspace will appear here."
            icon={Icons.note}
            title="No notes yet"
          />
        ) : (
          <div className="space-y-3">
            <ul className="space-y-2">
              {notes.map((note) => (
                <li className="rounded-md border border-zinc-200 px-3 py-2" key={note._id}>
                  <Button asChild className="h-auto p-0 text-left font-medium" variant="ghost">
                    <Link href={`/note/${note._id}`}>{note.title}</Link>
                  </Button>
                  <p className="text-xs text-zinc-500">
                    Updated {new Date(note.updatedAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
            {notesPaginationStatus === "CanLoadMore" ? (
              <Button onClick={() => loadMoreNotes(20)} variant="secondary">
                Load more
              </Button>
            ) : null}
            {notesPaginationStatus === "LoadingMore" ? (
              <StateMessage variant="info">Loading more notes...</StateMessage>
            ) : null}
            {notesPaginationStatus === "Exhausted" && notes.length > 0 ? (
              <StateMessage variant="muted">You have reached the end of the note list.</StateMessage>
            ) : null}
          </div>
        )}
      </Card>
    </main>
  );
}
