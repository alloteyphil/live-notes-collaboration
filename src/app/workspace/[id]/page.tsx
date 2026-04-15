"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/components/toast-provider";

export default function WorkspaceDetailPage() {
  const { data: session, isPending } = authClient.useSession();
  const { showToast } = useToast();
  const params = useParams<{ id: string }>();
  const workspaceId = params.id as Id<"workspaces">;

  const workspaces = useQuery(api.workspaces.list, session ? {} : "skip");
  const notes = useQuery(
    api.notes.listByWorkspace,
    session ? { workspaceId, includeArchived: false } : "skip",
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

  const workspace = useMemo(
    () => workspaces?.find((item) => item._id === workspaceId),
    [workspaces, workspaceId],
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
      const message = error instanceof Error ? error.message : "Failed to send invite.";
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
    return <main className="mx-auto mt-10 w-full max-w-3xl px-4">Loading session...</main>;
  }

  if (!session) {
    return (
      <main className="mx-auto mt-10 w-full max-w-3xl space-y-4 px-4">
        <h1 className="text-2xl font-semibold">Workspace</h1>
        <p className="text-sm text-zinc-600">You need to sign in to view notes.</p>
        <Link className="text-sm font-medium text-blue-600 hover:underline" href="/">
          Go to sign in
        </Link>
      </main>
    );
  }

  if (memberState === null) {
    return (
      <main className="mx-auto mt-10 w-full max-w-3xl space-y-4 px-4">
        <h1 className="text-2xl font-semibold">Workspace access removed</h1>
        <p className="text-sm text-zinc-600">
          You no longer have access to this workspace. Return to your dashboard to continue.
        </p>
        <Link className="text-sm font-medium text-blue-600 hover:underline" href="/dashboard">
          Back to Dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto mt-10 w-full max-w-3xl space-y-6 px-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{workspace?.name ?? "Workspace"}</h1>
          <p className="text-sm text-zinc-600">Create and view notes in this workspace.</p>
        </div>
        <Link className="text-sm font-medium text-blue-600 hover:underline" href="/dashboard">
          Back to Dashboard
        </Link>
      </header>

      <section className="rounded-lg border border-zinc-200 p-4">
        <h2 className="mb-3 text-lg font-medium">Members</h2>
        {memberState === undefined ? (
          <p className="text-sm text-zinc-600">Loading members...</p>
        ) : (
          <div className="space-y-4">
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
                      <button
                        className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={updatingMemberToken === member.tokenIdentifier}
                        onClick={() => void onRemoveMember(member.tokenIdentifier)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs uppercase text-zinc-500">{member.role}</span>
                  )}
                </li>
              ))}
            </ul>
            {memberFeedback ? <p className="text-sm text-zinc-600">{memberFeedback}</p> : null}

            {memberState.currentUserRole === "owner" ? (
              <form className="space-y-2 rounded-md border border-zinc-200 p-3" onSubmit={onInviteMember}>
                <h3 className="text-sm font-medium">Invite member</h3>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder="teammate@email.com"
                    type="email"
                    value={inviteEmail}
                  />
                  <select
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
                    onChange={(event) => setInviteRole(event.target.value as "editor" | "viewer")}
                    value={inviteRole}
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isInviting}
                    type="submit"
                  >
                    {isInviting ? "Inviting..." : "Invite"}
                  </button>
                </div>
                {inviteFeedback ? <p className="text-sm text-zinc-600">{inviteFeedback}</p> : null}
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
                        <span className="ml-2 text-xs uppercase text-zinc-500">{invite.role}</span>
                      </div>
                      {memberState.currentUserRole === "owner" ? (
                        <button
                          className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={updatingInviteId === invite._id}
                          onClick={() => void onRevokeInvite(invite._id)}
                          type="button"
                        >
                          {updatingInviteId === invite._id ? "Revoking..." : "Revoke"}
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 p-4">
        <h2 className="mb-3 text-lg font-medium">Create Note</h2>
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={onCreateNote}>
          <input
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
            onChange={(event) => setNoteTitle(event.target.value)}
            placeholder="Meeting notes"
            value={noteTitle}
          />
          <button
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isCreating}
            type="submit"
          >
            {isCreating ? "Creating..." : "Create"}
          </button>
        </form>
        {feedback ? <p className="mt-2 text-sm text-zinc-600">{feedback}</p> : null}
      </section>

      <section className="rounded-lg border border-zinc-200 p-4">
        <h2 className="mb-3 text-lg font-medium">Notes</h2>
        {notes === undefined ? (
          <p className="text-sm text-zinc-600">Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-zinc-600">No notes yet. Create your first note.</p>
        ) : (
          <ul className="space-y-2">
            {notes.map((note) => (
              <li className="rounded-md border border-zinc-200 px-3 py-2" key={note._id}>
                <Link className="font-medium text-blue-600 hover:underline" href={`/note/${note._id}`}>
                  {note.title}
                </Link>
                <p className="text-xs text-zinc-500">
                  Updated {new Date(note.updatedAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
