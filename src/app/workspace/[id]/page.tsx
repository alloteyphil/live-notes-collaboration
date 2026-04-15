"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";

export default function WorkspaceDetailPage() {
  const { data: session, isPending } = authClient.useSession();
  const params = useParams<{ id: string }>();
  const workspaceId = params.id as Id<"workspaces">;

  const workspaces = useQuery(api.workspaces.list, session ? {} : "skip");
  const notes = useQuery(
    api.notes.listByWorkspace,
    session ? { workspaceId, includeArchived: false } : "skip",
  );
  const createNote = useMutation(api.notes.create);

  const [noteTitle, setNoteTitle] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isCreating, setIsCreating] = useState(false);

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
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to create note.");
    } finally {
      setIsCreating(false);
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
