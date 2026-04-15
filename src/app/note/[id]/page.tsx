"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/components/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icons } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StateMessage } from "@/components/ui/state-message";
import { Textarea } from "@/components/ui/textarea";

type SaveStatus = "idle" | "typing" | "saving" | "saved" | "error";
const AUTOSAVE_DEBOUNCE_MS = 220;
const RETRY_BASE_DELAY_MS = 1_000;
const RETRY_MAX_DELAY_MS = 15_000;

const avatarClasses = [
  "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-violet-100 text-violet-700 border-violet-200",
];

const getAvatarClass = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % avatarClasses.length;
  }
  return avatarClasses[hash];
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};

export default function NoteEditorPage() {
  const { data: session, isPending } = authClient.useSession();
  const { showToast } = useToast();
  const params = useParams<{ id: string }>();
  const noteId = params.id as Id<"notes">;

  const note = useQuery(api.notes.getById, session ? { noteId } : "skip");
  const activeCollaborators = useQuery(api.presence.listByNote, session ? { noteId } : "skip");
  const updateTitle = useMutation(api.notes.updateTitle);
  const updateContent = useMutation(api.notes.updateContent);
  const heartbeat = useMutation(api.presence.heartbeat);
  const leavePresence = useMutation(api.presence.leave);

  const [titleInput, setTitleInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const [titleDirty, setTitleDirty] = useState(false);
  const [contentDirty, setContentDirty] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [retryNeeded, setRetryNeeded] = useState(false);
  const [isOnline, setIsOnline] = useState(() =>
    typeof window === "undefined" ? true : window.navigator.onLine,
  );

  const lastSyncedRef = useRef({ title: "", content: "" });
  const previousCanEditRef = useRef<boolean | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasShownOfflineToastRef = useRef(false);
  const cursorPositionRef = useRef<number | undefined>(undefined);
  const isTypingRef = useRef(false);
  const [cursorPosition, setCursorPosition] = useState<number | undefined>(undefined);

  const title = titleInput;
  const content = contentInput;
  const canEdit = note?.canEdit ?? false;
  const hasUnsavedChanges = titleDirty || contentDirty;
  const effectiveLastSavedAt = lastSavedAt ?? note?.updatedAt ?? null;
  const formattedLastSavedAt = useMemo(() => {
    if (!effectiveLastSavedAt) return "Not saved yet";
    return new Date(effectiveLastSavedAt).toLocaleTimeString();
  }, [effectiveLastSavedAt]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const flushSave = useCallback(async () => {
    if (!note || !canEdit || (!titleDirty && !contentDirty)) return;
    if (!isOnline) {
      setSaveStatus("error");
      setRetryNeeded(true);
      setFeedback("You are offline. Changes will retry when connection is restored.");
      return;
    }
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
      if (retryNeeded || retryAttempt > 0) {
        showToast({ message: "Connection restored. Note saved.", variant: "success" });
      }
      setRetryNeeded(false);
      setRetryAttempt(0);
      setFeedback("All changes saved.");
    } catch (error) {
      setSaveStatus("error");
      setRetryNeeded(true);
      setRetryAttempt((current) => current + 1);
      const message = error instanceof Error ? error.message : "Failed to save note.";
      setFeedback(message);
      if (retryAttempt === 0) {
        showToast({ message: "Save failed. Retrying automatically...", variant: "error" });
      }
    }
  }, [
    canEdit,
    content,
    contentDirty,
    isOnline,
    note,
    noteId,
    retryAttempt,
    retryNeeded,
    showToast,
    title,
    titleDirty,
    updateContent,
    updateTitle,
  ]);

  const flushSaveNow = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
    }
    void flushSave();
  }, [flushSave]);

  useEffect(() => {
    if (!note) return;

    const firstSync =
      lastSyncedRef.current.title === "" && lastSyncedRef.current.content === "";
    if (firstSync) {
      queueMicrotask(() => {
        setTitleInput(note.title);
        setContentInput(note.content);
      });
      lastSyncedRef.current = { title: note.title, content: note.content };
      return;
    }

    // Pull remote updates only when user has no unsaved local edits.
    if (!titleDirty && !contentDirty) {
      const remoteChanged =
        note.title !== lastSyncedRef.current.title ||
        note.content !== lastSyncedRef.current.content;
      if (remoteChanged) {
        queueMicrotask(() => {
          setTitleInput(note.title);
          setContentInput(note.content);
        });
        lastSyncedRef.current = { title: note.title, content: note.content };
      }
    }
  }, [contentDirty, note, titleDirty]);

  useEffect(() => {
    if (!note) return;

    const previousCanEdit = previousCanEditRef.current;
    previousCanEditRef.current = note.canEdit;

    // Skip transition messaging on initial load.
    if (previousCanEdit === null) return;

    if (previousCanEdit && !note.canEdit) {
      // Role changed to viewer while user was on this screen.
      queueMicrotask(() => {
        setTitleInput(note.title);
        setContentInput(note.content);
        setTitleDirty(false);
        setContentDirty(false);
        setIsTyping(false);
        setRetryNeeded(false);
        setRetryAttempt(0);
        setSaveStatus("idle");
        setFeedback("Your role changed to viewer. Editing is now disabled.");
      });
      return;
    }

    if (!previousCanEdit && note.canEdit) {
      // Role changed back to editor; unlock and clear stale read-only status.
      queueMicrotask(() => {
        setSaveStatus("idle");
        setFeedback("Your edit access has been restored.");
      });
    }
  }, [note]);

  const statusLabel = !canEdit
    ? "Read-only"
    : !isOnline
      ? "Offline"
      : retryNeeded
        ? `Retrying (${retryAttempt})`
    : saveStatus === "typing"
      ? "Typing..."
      : saveStatus === "saving"
        ? "Saving..."
        : saveStatus === "saved"
          ? "Saved"
          : saveStatus === "error"
            ? "Save error"
            : "Idle";

  useEffect(() => {
    cursorPositionRef.current = cursorPosition;
  }, [cursorPosition]);

  useEffect(() => {
    isTypingRef.current = isTyping;
  }, [isTyping]);

  useEffect(() => {
    if (!canEdit) return;
    if (!isOnline) {
      if (!hasShownOfflineToastRef.current) {
        hasShownOfflineToastRef.current = true;
        showToast({
          message: "You are offline. We will retry saves when connection returns.",
          variant: "info",
        });
      }
      return;
    }
    hasShownOfflineToastRef.current = false;
  }, [canEdit, isOnline, showToast]);

  useEffect(() => {
    if (!retryNeeded || !canEdit || !note || (!titleDirty && !contentDirty)) {
      return;
    }
    if (!isOnline) return;

    const delay = Math.min(
      RETRY_BASE_DELAY_MS * 2 ** Math.max(retryAttempt - 1, 0),
      RETRY_MAX_DELAY_MS,
    );

    retryTimerRef.current = setTimeout(() => {
      void flushSave();
    }, delay);

    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [canEdit, contentDirty, flushSave, isOnline, note, retryAttempt, retryNeeded, titleDirty]);

  useEffect(() => {
    if (!note) return;
    if (!titleDirty && !contentDirty) {
      return;
    }
    saveTimerRef.current = setTimeout(() => {
      void flushSave();
    }, AUTOSAVE_DEBOUNCE_MS);

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
      if (canEdit) {
        flushSaveNow();
      }
    };
    window.addEventListener("keydown", onSaveShortcut);
    return () => window.removeEventListener("keydown", onSaveShortcut);
  }, [canEdit, flushSaveNow]);

  useEffect(() => {
    if (!session || !note) return;

    const sendHeartbeat = () => {
      void heartbeat({
        noteId,
        cursorPosition: cursorPositionRef.current,
        isTyping: canEdit ? isTypingRef.current : false,
      });
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 10_000);
    return () => {
      clearInterval(interval);
      void leavePresence({ noteId });
    };
  }, [canEdit, heartbeat, leavePresence, note, noteId, session]);

  const markTyping = useCallback(() => {
    setIsTyping(true);
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1_500);
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  const typingCollaborators =
    activeCollaborators?.filter(
      (collaborator) =>
        collaborator.isTyping && collaborator.userEmail !== (session?.user.email ?? null),
    ) ?? [];

  if (isPending) {
    return (
      <main className="app-container space-y-4">
        <Skeleton className="h-10 w-60" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </main>
    );
  }

  if (!session) {
    return (
      <main className="app-container space-y-4">
        <PageHeader description="Sign in to edit and collaborate on notes." title="Note Editor" />
        <EmptyState
          action={
            <Link className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline" href="/">
              Go to sign in
              <Icons.forward className="h-4 w-4" />
            </Link>
          }
          description="Your notes and collaborator presence will appear once authenticated."
          icon={Icons.note}
          title="Sign in required"
        />
      </main>
    );
  }

  if (note === undefined) {
    return (
      <main className="app-container space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </main>
    );
  }

  if (note === null) {
    return (
      <main className="app-container space-y-4">
        <PageHeader description="Your permissions changed for this note." title="Note access removed" />
        <EmptyState
          action={
            <Link
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
              href="/dashboard"
            >
              <Icons.back className="h-4 w-4" />
              Back to Dashboard
            </Link>
          }
          description="Return to your dashboard to continue in a workspace you can access."
          icon={Icons.alert}
          title="Access revoked"
        />
      </main>
    );
  }

  return (
    <main className="app-container space-y-5">
      <PageHeader
        actions={
          <Link className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline" href="/dashboard">
            <Icons.back className="h-4 w-4" />
            Back to Dashboard
          </Link>
        }
        description={`Active collaborators: ${activeCollaborators?.length ?? 0}`}
        title={note.title || "Untitled Note"}
      />

      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-600">Status</span>
        <Badge
          className="normal-case"
          variant={!isOnline ? "warning" : saveStatus === "error" ? "danger" : "default"}
        >
          {statusLabel}
        </Badge>
      </div>

      {!isOnline ? (
        <StateMessage variant="warning">
          Connection lost. Editing continues locally and saves will retry automatically.
        </StateMessage>
      ) : null}

      <Card className="rounded-xl shadow-sm">
        <CardHeader className="mb-2">
          <CardTitle className="text-sm text-zinc-700">Collaborators in this note</CardTitle>
        </CardHeader>
        {activeCollaborators === undefined ? (
          <p className="text-sm text-zinc-500">Loading collaborators...</p>
        ) : activeCollaborators.length === 0 ? (
          <p className="text-sm text-zinc-500">Only you are here right now.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {activeCollaborators.map((collaborator) => {
              const isCurrentUser = collaborator.userEmail === session.user.email;
              const avatarClass = getAvatarClass(collaborator.userEmail ?? collaborator.displayName);
              return (
                <li
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs ${avatarClass}`}
                  key={collaborator._id}
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/70 text-[10px] font-semibold">
                    {getInitials(collaborator.displayName)}
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="font-medium">
                      {collaborator.displayName}
                      {isCurrentUser ? " (You)" : ""}
                      {collaborator.isTyping ? " • typing" : ""}
                    </span>
                    <span className="text-[10px] opacity-80">
                      {collaborator.userEmail ?? "email not available"}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {typingCollaborators.length > 0 ? (
          <p className="mt-2 text-xs text-zinc-500">
            {typingCollaborators.map((collaborator) => collaborator.displayName).join(", ")}{" "}
            {typingCollaborators.length > 1 ? "are" : "is"} typing...
          </p>
        ) : null}
      </Card>

      <Card className="rounded-xl shadow-sm">
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="note-title">Title</Label>
            <Input
              className="mt-2 text-lg font-semibold"
              disabled={!canEdit}
              id="note-title"
              onBlur={() => {
                if (canEdit) flushSaveNow();
              }}
              onChange={(event) => {
                if (!canEdit) return;
                setTitleInput(event.target.value);
                setTitleDirty(true);
                setSaveStatus("typing");
                markTyping();
              }}
              placeholder="Untitled note"
              value={title}
            />
          </div>

          <div>
            <Label htmlFor="note-content">Content</Label>
            <Textarea
              className="mt-2 min-h-[420px] leading-6"
              disabled={!canEdit}
              id="note-content"
              onBlur={() => {
                if (canEdit) flushSaveNow();
              }}
              onChange={(event) => {
                if (!canEdit) return;
                setContentInput(event.target.value);
                setContentDirty(true);
                setSaveStatus("typing");
                setCursorPosition(event.target.selectionStart);
                markTyping();
              }}
              onClick={(event) => setCursorPosition(event.currentTarget.selectionStart)}
              onKeyUp={(event) => setCursorPosition(event.currentTarget.selectionStart)}
              onSelect={(event) => setCursorPosition(event.currentTarget.selectionStart)}
              placeholder="Start writing your note..."
              value={content}
            />
          </div>
        </CardContent>
      </Card>

      {feedback ? (
        <StateMessage variant={saveStatus === "error" ? "error" : "muted"}>{feedback}</StateMessage>
      ) : null}
      <p className="text-xs text-zinc-500">
        Last saved: {formattedLastSavedAt} {hasUnsavedChanges ? "• Unsaved changes" : ""}
      </p>
    </main>
  );
}
