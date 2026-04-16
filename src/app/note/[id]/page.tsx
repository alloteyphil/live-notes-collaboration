"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { NavHeader } from "@/components/nav-header";
import { PresenceAvatars } from "@/components/presence-avatars";
import { SaveStatus } from "@/components/save-status";
import { StatusBanner } from "@/components/status-banner";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Clock, Lock, MessageSquare, RefreshCw, Trash2, Undo2, Users } from "lucide-react";

type SaveState = "idle" | "typing" | "saving" | "saved" | "error";
const AUTOSAVE_DEBOUNCE_MS = 220;
const RETRY_BASE_DELAY_MS = 1000;
const RETRY_MAX_DELAY_MS = 15000;

export default function NoteEditorPage() {
  const { data: session, isPending } = authClient.useSession();
  const { showToast } = useToast();
  const params = useParams<{ id: string }>();
  const noteId = params.id as Id<"notes">;

  const note = useQuery(api.notes.getById, session ? { noteId } : "skip");
  const activeCollaborators = useQuery(api.presence.listByNote, session ? { noteId } : "skip");
  const updateTitle = useMutation(api.notes.updateTitle);
  const updateContent = useMutation(api.notes.updateContent);
  const archiveNote = useMutation(api.notes.archive);
  const deleteNote = useMutation(api.notes.remove);
  const createComment = useMutation(api.comments.create);
  const resolveComment = useMutation(api.comments.resolve);
  const restoreRevision = useMutation(api.notes.restoreRevision);
  const heartbeat = useMutation(api.presence.heartbeat);
  const leavePresence = useMutation(api.presence.leave);
  const comments = useQuery(api.comments.listByNote, session ? { noteId } : "skip");
  const {
    results: revisions,
    status: revisionsStatus,
    loadMore: loadMoreRevisions,
  } = usePaginatedQuery(
    api.notes.listRevisions,
    session ? { noteId } : "skip",
    { initialNumItems: 8 },
  );

  const [titleInput, setTitleInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const [titleDirty, setTitleDirty] = useState(false);
  const [contentDirty, setContentDirty] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [retryNeeded, setRetryNeeded] = useState(false);
  const [isOnline, setIsOnline] = useState(() =>
    typeof window === "undefined" ? true : window.navigator.onLine,
  );
  const [cursorPosition, setCursorPosition] = useState<number | undefined>(undefined);
  const [commentDraft, setCommentDraft] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isRestoringRevisionId, setIsRestoringRevisionId] = useState<string | null>(null);

  const lastSyncedRef = useRef({ title: "", content: "" });
  const previousCanEditRef = useRef<boolean | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorPositionRef = useRef<number | undefined>(undefined);
  const isTypingRef = useRef(false);

  const title = titleInput;
  const content = contentInput;
  const canEdit = note?.canEdit ?? false;
  const canEditThisNote = canEdit && !(note?.isArchived ?? false);
  const hasUnsavedChanges = titleDirty || contentDirty;
  const effectiveLastSavedAt = lastSavedAt ?? note?.updatedAt ?? null;

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
    if (!note || !canEditThisNote || (!titleDirty && !contentDirty)) return;
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
    canEditThisNote,
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
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    void flushSave();
  }, [flushSave]);

  useEffect(() => {
    if (!note) return;
    const firstSync = lastSyncedRef.current.title === "" && lastSyncedRef.current.content === "";
    if (firstSync) {
      queueMicrotask(() => {
        setTitleInput(note.title);
        setContentInput(note.content);
      });
      lastSyncedRef.current = { title: note.title, content: note.content };
      return;
    }
    if (!titleDirty && !contentDirty) {
      const remoteChanged =
        note.title !== lastSyncedRef.current.title || note.content !== lastSyncedRef.current.content;
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
    if (previousCanEdit === null) return;
    if (previousCanEdit && !note.canEdit) {
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
      queueMicrotask(() => {
        setSaveStatus("idle");
        setFeedback("Your edit access has been restored.");
      });
    }
  }, [note]);

  useEffect(() => {
    cursorPositionRef.current = cursorPosition;
  }, [cursorPosition]);

  useEffect(() => {
    isTypingRef.current = isTyping;
  }, [isTyping]);

  useEffect(() => {
    if (!retryNeeded || !canEditThisNote || !note || (!titleDirty && !contentDirty)) return;
    if (!isOnline) return;
    const delay = Math.min(RETRY_BASE_DELAY_MS * 2 ** Math.max(retryAttempt - 1, 0), RETRY_MAX_DELAY_MS);
    retryTimerRef.current = setTimeout(() => void flushSave(), delay);
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [canEditThisNote, contentDirty, flushSave, isOnline, note, retryAttempt, retryNeeded, titleDirty]);

  useEffect(() => {
    if (!note) return;
    if (!titleDirty && !contentDirty) return;
    saveTimerRef.current = setTimeout(() => void flushSave(), AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [contentDirty, flushSave, note, titleDirty]);

  useEffect(() => {
    const onSaveShortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "s") return;
      event.preventDefault();
      if (canEditThisNote) flushSaveNow();
    };
    window.addEventListener("keydown", onSaveShortcut);
    return () => window.removeEventListener("keydown", onSaveShortcut);
  }, [canEditThisNote, flushSaveNow]);

  useEffect(() => {
    if (!session || !note) return;
    const sendHeartbeat = () => {
      void heartbeat({
        noteId,
        cursorPosition: cursorPositionRef.current,
        isTyping: canEditThisNote ? isTypingRef.current : false,
      });
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 10000);
    return () => {
      clearInterval(interval);
      void leavePresence({ noteId });
    };
  }, [canEditThisNote, heartbeat, leavePresence, note, noteId, session]);

  const onArchiveToggle = async () => {
    if (!note) return;
    try {
      await archiveNote({ noteId, archived: !note.isArchived });
      showToast({
        message: note.isArchived ? "Note unarchived." : "Note archived.",
        variant: "success",
      });
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : "Failed to update archive.",
        variant: "error",
      });
    }
  };

  const onDelete = async () => {
    if (!note) return;
    try {
      await deleteNote({ noteId });
      showToast({ message: "Note deleted.", variant: "success" });
      window.location.href = "/dashboard";
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : "Failed to delete note.",
        variant: "error",
      });
    }
  };

  const onCreateComment = async () => {
    const content = commentDraft.trim();
    if (!content) return;
    setIsSubmittingComment(true);
    try {
      await createComment({ noteId, content });
      setCommentDraft("");
      showToast({ message: "Comment added.", variant: "success" });
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : "Failed to add comment.",
        variant: "error",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const onResolveComment = async (commentId: Id<"noteComments">, resolved: boolean) => {
    try {
      await resolveComment({ commentId, resolved: !resolved });
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : "Failed to update comment.",
        variant: "error",
      });
    }
  };

  const onRestoreRevision = async (revisionId: Id<"noteRevisions">) => {
    setIsRestoringRevisionId(revisionId);
    try {
      await restoreRevision({ noteId, revisionId });
      showToast({ message: "Revision restored.", variant: "success" });
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : "Failed to restore revision.",
        variant: "error",
      });
    } finally {
      setIsRestoringRevisionId(null);
    }
  };

  const markTyping = useCallback(() => {
    setIsTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => setIsTyping(false), 1500);
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  const typingCollaborators =
    activeCollaborators?.filter(
      (collaborator) => collaborator.isTyping && collaborator.userEmail !== (session?.user.email ?? null),
    ) ?? [];

  const collaborators =
    activeCollaborators?.map((collaborator) => ({
      id: collaborator._id,
      name: collaborator.displayName,
      email: collaborator.userEmail ?? "email not available",
      isTyping: collaborator.isTyping,
      isCurrentUser: collaborator.userEmail === session?.user.email,
    })) ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavHeader
        isSignedIn={Boolean(session)}
        sessionPending={isPending}
        userEmail={session?.user.email}
        onSignOut={async () => {
          await authClient.signOut();
        }}
      />

      <main className="flex flex-1 flex-col">
        <div className="sticky top-14 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground hover:text-foreground">
                <Link href="/dashboard">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <div className="flex items-center gap-4">
                {note ? (
                  <div className="flex items-center gap-2">
                    {note.isArchived ? <Badge variant="warning">Archived</Badge> : null}
                    {canEdit ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => void onArchiveToggle()}>
                          {note.isArchived ? <Undo2 className="mr-1 h-4 w-4" /> : null}
                          {note.isArchived ? "Unarchive" : "Archive"}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => void onDelete()}>
                          <Trash2 className="mr-1 h-4 w-4" />
                          Delete
                        </Button>
                      </>
                    ) : null}
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <PresenceAvatars collaborators={collaborators} maxVisible={3} />
                  <span className="hidden text-sm text-muted-foreground sm:inline">
                    <Users className="mr-1 inline h-4 w-4" />
                    {collaborators.length} online
                  </span>
                </div>
                <SaveStatus
                  state={
                    !isOnline
                      ? "offline"
                      : retryNeeded
                        ? "retrying"
                        : saveStatus === "saving"
                          ? "saving"
                          : saveStatus === "saved"
                            ? "saved"
                            : saveStatus === "error"
                              ? "error"
                              : saveStatus === "typing"
                                ? "typing"
                                : "idle"
                  }
                  lastSaved={effectiveLastSavedAt ? new Date(effectiveLastSavedAt) : null}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-4xl space-y-4 px-4 pt-6 sm:px-6">
          {!session && !isPending ? (
            <StatusBanner variant="warning" message="Sign in to edit and collaborate on notes." />
          ) : null}
          {note === null ? (
            <StatusBanner variant="error" message="You no longer have access to this note." />
          ) : null}
          {!isOnline ? (
            <StatusBanner
              variant="warning"
              title="Connection lost"
              message="Your changes will be saved when the connection is restored."
            />
          ) : null}
          {!canEditThisNote && note ? (
            <StatusBanner
              variant="info"
              message={
                note.isArchived
                  ? "This note is archived. Unarchive to continue editing."
                  : "You're viewing this note in read-only mode. Contact owner to request edit access."
              }
            />
          ) : null}
          {saveStatus === "error" ? (
            <StatusBanner variant="error" title="Unable to save" message={feedback || "Save failed"} />
          ) : null}
        </div>

        <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6">
          {isPending || note === undefined ? (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">Loading note...</div>
          ) : note ? (
            <>
            <div className="rounded-xl border border-border bg-card shadow-sm">
              {typingCollaborators.length > 0 ? (
                <div className="flex items-center gap-2 border-b border-border px-6 py-3 text-sm text-muted-foreground">
                  <span className="flex h-2 w-2 animate-pulse rounded-full bg-primary" />
                  {typingCollaborators.map((c) => c.displayName).join(", ")}{" "}
                  {typingCollaborators.length === 1 ? "is" : "are"} typing...
                </div>
              ) : null}
              <div className="border-b border-border px-6 py-4">
                <Input
                  value={title}
                  onChange={(event) => {
                    if (!canEditThisNote) return;
                    setTitleInput(event.target.value);
                    setTitleDirty(true);
                    setSaveStatus("typing");
                    markTyping();
                  }}
                  onBlur={() => {
                    if (canEditThisNote) flushSaveNow();
                  }}
                  placeholder="Untitled note"
                  disabled={!canEditThisNote}
                  className={cn(
                    "border-0 bg-transparent p-0 text-2xl font-semibold placeholder:text-muted-foreground/50 focus-visible:ring-0",
                    !canEditThisNote ? "cursor-not-allowed opacity-70" : undefined,
                  )}
                />
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last edited{" "}
                    {effectiveLastSavedAt ? new Date(effectiveLastSavedAt).toLocaleTimeString() : "Not saved yet"}
                  </span>
                  {!canEditThisNote ? (
                    <span className="flex items-center gap-1 text-warning">
                      <Lock className="h-3 w-3" />
                      Read only
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="px-6 py-4">
                <Textarea
                  value={content}
                  onChange={(event) => {
                    if (!canEditThisNote) return;
                    setContentInput(event.target.value);
                    setContentDirty(true);
                    setSaveStatus("typing");
                    setCursorPosition(event.target.selectionStart);
                    markTyping();
                  }}
                  onBlur={() => {
                    if (canEditThisNote) flushSaveNow();
                  }}
                  onClick={(event) => setCursorPosition(event.currentTarget.selectionStart)}
                  onKeyUp={(event) => setCursorPosition(event.currentTarget.selectionStart)}
                  onSelect={(event) => setCursorPosition(event.currentTarget.selectionStart)}
                  placeholder="Start writing..."
                  disabled={!canEditThisNote}
                  className={cn(
                    "min-h-[50vh] resize-none border-0 bg-transparent p-0 font-mono text-base leading-relaxed placeholder:text-muted-foreground/50 focus-visible:ring-0",
                    !canEditThisNote ? "cursor-not-allowed opacity-70" : undefined,
                  )}
                />
              </div>
              <div className="flex items-center justify-between border-t border-border px-6 py-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>{content.split(/\s+/).filter(Boolean).length} words</span>
                  <span>{content.length} characters</span>
                </div>
                <div className="flex items-center gap-2">
                  {saveStatus === "error" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={flushSaveNow}
                      className="h-7 text-xs text-destructive hover:text-destructive"
                    >
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Retry save
                    </Button>
                  ) : null}
                  {saveStatus === "saved" && !hasUnsavedChanges ? (
                    <span className="text-success">All changes saved</span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-6">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-card-foreground">Comments</h3>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mb-3 flex gap-2">
                  <Input
                    placeholder="Add a comment. Mention teammates with @email.com"
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    disabled={!session || isSubmittingComment}
                  />
                  <Button
                    onClick={() => void onCreateComment()}
                    disabled={!session || isSubmittingComment || !commentDraft.trim()}
                  >
                    Add
                  </Button>
                </div>
                {comments && comments.length > 0 ? (
                  <div className="space-y-2">
                    {comments.map((comment) => (
                      <div key={comment._id} className="rounded-md border border-border p-3">
                        <div className="mb-1 flex items-center justify-between">
                          <p className="text-xs font-medium text-muted-foreground">
                            {comment.authorDisplayName} •{" "}
                            {new Date(comment.createdAt).toLocaleString()}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void onResolveComment(comment._id, comment.status === "resolved")}
                          >
                            {comment.status === "resolved" ? "Reopen" : "Resolve"}
                          </Button>
                        </div>
                        <p className="text-sm text-card-foreground">{comment.content}</p>
                        {comment.mentionEmails.length > 0 ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Mentions: {comment.mentionEmails.join(", ")}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No comments yet.</p>
                )}
              </div>

              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-card-foreground">Version history</h3>
                {revisions.length > 0 ? (
                  <div className="space-y-2">
                    {revisions.map((revision) => (
                      <div key={revision._id} className="flex items-center justify-between rounded-md border border-border p-3">
                        <div>
                          <p className="text-sm font-medium text-card-foreground">
                            {new Date(revision.createdAt).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {revision.reason ?? "autosave snapshot"}
                          </p>
                        </div>
                        {canEdit ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isRestoringRevisionId === revision._id}
                            onClick={() => void onRestoreRevision(revision._id)}
                          >
                            Restore
                          </Button>
                        ) : null}
                      </div>
                    ))}
                    {revisionsStatus === "CanLoadMore" ? (
                      <Button variant="ghost" size="sm" onClick={() => loadMoreRevisions(8)}>
                        Load more revisions
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No revisions yet.</p>
                )}
              </div>
            </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
