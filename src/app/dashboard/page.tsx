"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { authClient } from "@/lib/auth-client";
import { api } from "../../../convex/_generated/api";

export default function DashboardPage() {
  const { data: session, isPending } = authClient.useSession();
  const workspaces = useQuery(api.workspaces.list, session ? {} : "skip");
  const createWorkspace = useMutation(api.workspaces.create);

  const [workspaceName, setWorkspaceName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const emptyStateMessage = useMemo(() => {
    if (workspaces === undefined) return "Loading workspaces...";
    if (workspaces.length === 0) return "No workspaces yet. Create your first one.";
    return "";
  }, [workspaces]);

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
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to create workspace.");
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
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-zinc-600">You need to sign in to view your dashboard.</p>
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
          <h1 className="text-2xl font-semibold">Workspace Dashboard</h1>
          <p className="text-sm text-zinc-600">Signed in as {session.user.email}</p>
        </div>
        <Link className="text-sm font-medium text-blue-600 hover:underline" href="/">
          Auth Home
        </Link>
      </header>

      <section className="rounded-lg border border-zinc-200 p-4">
        <h2 className="mb-3 text-lg font-medium">Create Workspace</h2>
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={onCreateWorkspace}>
          <input
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
            onChange={(event) => setWorkspaceName(event.target.value)}
            placeholder="My Team Notes"
            value={workspaceName}
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
        <h2 className="mb-3 text-lg font-medium">Your Workspaces</h2>
        {emptyStateMessage ? (
          <p className="text-sm text-zinc-600">{emptyStateMessage}</p>
        ) : (
          <ul className="space-y-2">
            {workspaces?.map((workspace) => (
              <li
                className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2"
                key={workspace._id}
              >
                <div>
                  <p className="font-medium">{workspace.name}</p>
                  <p className="text-xs uppercase text-zinc-500">{workspace.role}</p>
                </div>
                <Link
                  className="text-sm font-medium text-blue-600 hover:underline"
                  href={`/workspace/${workspace._id}`}
                >
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
