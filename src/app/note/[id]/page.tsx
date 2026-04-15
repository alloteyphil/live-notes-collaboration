"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { authClient } from "@/lib/auth-client";

type SaveStatus = "idle" | "typing" | "saving" | "saved" | "error";

export default function NoteEditorPage() {
  const { data: session, isPending } = authClient.useSession();
  const params = useParams<{ id: string }>();
  const noteId = params.id as Id<"notes">;

  const note = useQuery(api.notes.getById, session ? { noteId } : "skip");
  const updateTitle = useMutation(api.notes.updateTitle);
  const updateContent = useMutation(api.notes.updateContent);

  const [titleInput, setTitleInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const [titleDirty, setTitleDirty] = useState(false);
  const [contentDirty, setContentDirty] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const lastSyncedRef = useRef({ title: "", content: "" });
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const title = titleDirty ? titleInput : note?.title ?? "";
  const content = contentDirty ? contentInput : note?.content ?? "";
  const hasUnsavedChanges = titleDirty || contentDirty;
  const effectiveLastSavedAt = lastSavedAt ?? note?.updatedAt ?? null;
  const formattedLastSavedAt = useMemo(() => {
    if (!effectiveLastSavedAt) return "Not saved yet";
    return new Date(effectiveLastSavedAt).toLocaleTimeString();
  }, [effectiveLastSavedAt]);

  const flushSave = useCallback(async () => {
    if (!note || (!titleDirty && !contentDirty)) return;
    try {
      setSaveStatus("saving");
      if (titleDirty) {
        await updateTitle({ noteId, title });
      }
      if (contentDirty) {
        await updateContent({ noteId, content });
      }
      lastSyncedRef.current = { title, content };
      setTitleDirty(false);
      setContentDirty(false);
      setLastSavedAt(Date.now());
      setSaveStatus("saved");
      setFeedback("All changes saved.");
    } catch (error) {
      setSaveStatus("error");
      setFeedback(error instanceof Error ? error.message : "Failed to save note.");
    }
  }, [content, contentDirty, note, noteId, title, titleDirty, updateContent, updateTitle]);

  useEffect(() => {
    if (!note) return;
    if (!titleDirty && !contentDirty) {
      if (lastSyncedRef.current.title === "" && lastSyncedRef.current.content === "") {
        lastSyncedRef.current = { title: note.title, content: note.content };
      }
      return;
    }
    saveTimerRef.current = setTimeout(() => {
      void flushSave();
    }, 700);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [contentDirty, flushSave, note, titleDirty]);

  useEffect(() => {
    const onSaveShortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "s") {
        return;
      }
      event.preventDefault();
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      void flushSave();
    };
    window.addEventListener("keydown", onSaveShortcut);
    return () => window.removeEventListener("keydown", onSaveShortcut);
  }, [flushSave]);

  if (isPending) {
    return <main className="mx-auto mt-10 w-full max-w-4xl px-4">Loading session...</main>;
  }

  if (!session) {
    return (
      <main className="mx-auto mt-10 w-full max-w-4xl space-y-4 px-4">
        <h1 className="text-2xl font-semibold">Note Editor</h1>
        <p className="text-sm text-zinc-600">You need to sign in to edit notes.</p>
        <Link className="text-sm font-medium text-blue-600 hover:underline" href="/">
          Go to sign in
        </Link>
      </main>
    );
  }

  if (note === undefined) {
    return <main className="mx-auto mt-10 w-full max-w-4xl px-4">Loading note...</main>;
  }

  return (
    <main className="mx-auto mt-10 w-full max-w-4xl space-y-5 px-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link className="text-sm font-medium text-blue-600 hover:underline" href="/dashboard">
          Back to Dashboard
        </Link>
        <p className="text-sm text-zinc-600">
          Status:{" "}
          <span className="font-medium text-zinc-800">
            {saveStatus === "idle" && "Idle"}
            {saveStatus === "typing" && "Typing..."}
            {saveStatus === "saving" && "Saving..."}
            {saveStatus === "saved" && "Saved"}
            {saveStatus === "error" && "Save error"}
          </span>
        </p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <label className="mb-2 block text-xs font-medium uppercase text-zinc-500">Title</label>
        <input
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-lg font-semibold outline-none ring-zinc-400 focus:ring-2"
          onChange={(event) => {
            setTitleInput(event.target.value);
            setTitleDirty(true);
            setSaveStatus("typing");
          }}
          placeholder="Untitled note"
          value={title}
        />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <label className="mb-2 block text-xs font-medium uppercase text-zinc-500">Content</label>
        <textarea
          className="min-h-[360px] w-full resize-y rounded-md border border-zinc-300 px-3 py-2 text-sm leading-6 outline-none ring-zinc-400 focus:ring-2"
          onChange={(event) => {
            setContentInput(event.target.value);
            setContentDirty(true);
            setSaveStatus("typing");
          }}
          placeholder="Start writing your note..."
          value={content}
        />
      </section>

      {feedback ? <p className="text-sm text-zinc-600">{feedback}</p> : null}
      <p className="text-xs text-zinc-500">
        Last saved: {formattedLastSavedAt} {hasUnsavedChanges ? "• Unsaved changes" : ""}
      </p>
    </main>
  );
}
