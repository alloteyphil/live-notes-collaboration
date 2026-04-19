"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useConvexAuth, useMutation, usePaginatedQuery, useQuery } from "convex/react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { NavHeader } from "@/components/nav-header";
import { StatusBanner } from "@/components/status-banner";
import { Button } from "@/components/ui/button";
import { useClerk, useUser } from "@clerk/nextjs";
import { useToast } from "@/components/toast-provider";
import { NoteToolbar } from "@/components/note/note-toolbar";
import { NoteEditorSurface } from "@/components/note/note-editor-surface";
import { CommentsDrawer } from "@/components/note/comments-drawer";
import { RevisionsDrawer } from "@/components/note/revisions-drawer";

type SaveState = "idle" | "typing" | "saving" | "saved" | "error";
type Drawer = "comments" | "revisions" | null;
const AUTOSAVE_DEBOUNCE_MS = 220;
const RETRY_BASE_DELAY_MS = 1000;
const RETRY_MAX_DELAY_MS = 15000;

function buildTypingLabel(displayNames: string[]): string {
  if (displayNames.length === 0) return "";
  if (displayNames.length === 1) return `${displayNames[0]} is typing...`;
  if (displayNames.length === 2) return `${displayNames[0]} and ${displayNames[1]} are typing...`;
  return `${displayNames[0]} and ${displayNames.length - 1} others are typing...`;
}

type EditorFindMatch = { field: "title" | "content"; start: number; end: number };

function collectEditorFindMatches(titleText: string, body: string, rawQuery: string): EditorFindMatch[] {
  const needle = rawQuery.trim();
  if (!needle) return [];
  const lowerTitle = titleText.toLowerCase();
  const lowerBody = body.toLowerCase();
  const n = needle.toLowerCase();
  const out: EditorFindMatch[] = [];
  let pos = 0;
  while (pos < lowerTitle.length) {
    const i = lowerTitle.indexOf(n, pos);
    if (i === -1) break;
    out.push({ field: "title", start: i, end: i + needle.length });
    pos = i + Math.max(1, n.length);
  }
  pos = 0;
  while (pos < lowerBody.length) {
    const i = lowerBody.indexOf(n, pos);
    if (i === -1) break;
    out.push({ field: "content", start: i, end: i + needle.length });
    pos = i + Math.max(1, n.length);
  }
  return out;
}

function NoteEditorPageInner() {
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
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const noteId = params.id as Id<"notes">;
  const findQueryRaw = searchParams.get("q");
  const findQuery =
    findQueryRaw && findQueryRaw.trim().length > 0 ? findQueryRaw.trim() : null;
  const highlightCommentIdParam = searchParams.get("comment");
  const highlightCommentId =
    highlightCommentIdParam && highlightCommentIdParam.length > 0
      ? (highlightCommentIdParam as Id<"noteComments">)
      : null;

  const note = useQuery(api.notes.getById, canRunProtectedQueries ? { noteId } : "skip");
  const workspace = useQuery(
    api.workspaces.getById,
    canRunProtectedQueries && note ? { workspaceId: note.workspaceId } : "skip",
  );
  const activeCollaborators = useQuery(
    api.presence.listByNote,
    canRunProtectedQueries ? { noteId } : "skip",
  );
  const updateTitle = useMutation(api.notes.updateTitle);
  const updateContent = useMutation(api.notes.updateContent);
  const archiveNote = useMutation(api.notes.archive);
  const deleteNote = useMutation(api.notes.remove);
  const createComment = useMutation(api.comments.create);
  const resolveComment = useMutation(api.comments.resolve);
  const restoreRevision = useMutation(api.notes.restoreRevision);
  const heartbeat = useMutation(api.presence.heartbeat);
  const leavePresence = useMutation(api.presence.leave);
  const comments = useQuery(api.comments.listByNote, canRunProtectedQueries ? { noteId } : "skip");
  const {
    results: revisions,
    status: revisionsStatus,
    loadMore: loadMoreRevisions,
  } = usePaginatedQuery(
    api.notes.listRevisions,
    canRunProtectedQueries ? { noteId } : "skip",
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
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [findMatchIndex, setFindMatchIndex] = useState(0);
  const [findFocusBoot, setFindFocusBoot] = useState(0);
  const [forceWriteTabToken, setForceWriteTabToken] = useState(0);
  const [remoteFork, setRemoteFork] = useState<{
    updatedAt: number;
    title: string;
    content: string;
  } | null>(null);

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const lastSyncedRef = useRef({ title: "", content: "" });
  const lastSyncedUpdatedAtRef = useRef(0);
  const dismissedRemoteForkAtRef = useRef<number | null>(null);
  const previousCanEditRef = useRef<boolean | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorPositionRef = useRef<number | undefined>(undefined);
  const isTypingRef = useRef(false);
  const typingHeartbeatStateRef = useRef<boolean | null>(null);

  const title = titleInput;
  const content = contentInput;
  const canEdit = note?.canEdit ?? false;
  const canEditThisNote = canEdit && !(note?.isArchived ?? false);
  const hasUnsavedChanges = titleDirty || contentDirty;
  const effectiveLastSavedAt = lastSavedAt ?? note?.updatedAt ?? null;

  const findMatches = useMemo(
    () => (findQuery ? collectEditorFindMatches(title, content, findQuery) : []),
    [findQuery, title, content],
  );

  const clearFindQuery = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("q");
    const qs = next.toString();
    router.replace(qs ? `/note/${noteId}?${qs}` : `/note/${noteId}`);
  }, [router, searchParams, noteId]);

  useEffect(() => {
    setFindFocusBoot((value) => value + 1);
  }, [findQuery, noteId]);

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
        setFindFocusBoot((boot) => boot + 1);
      });
      lastSyncedRef.current = { title: note.title, content: note.content };
      lastSyncedUpdatedAtRef.current = note.updatedAt;
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
        lastSyncedUpdatedAtRef.current = note.updatedAt;
      }
    }
  }, [contentDirty, note, titleDirty]);

  useEffect(() => {
    if (!note || titleDirty || contentDirty) return;
    lastSyncedUpdatedAtRef.current = note.updatedAt;
  }, [note, titleDirty, contentDirty]);

  useEffect(() => {
    if (!note || (!titleDirty && !contentDirty)) return;
    const serverDrift =
      note.title !== lastSyncedRef.current.title || note.content !== lastSyncedRef.current.content;
    if (!serverDrift) return;
    if (note.updatedAt <= lastSyncedUpdatedAtRef.current) return;
    if (dismissedRemoteForkAtRef.current === note.updatedAt) return;
    setRemoteFork((prev) => {
      if (prev?.updatedAt === note.updatedAt) return prev;
      return { updatedAt: note.updatedAt, title: note.title, content: note.content };
    });
  }, [note, titleDirty, contentDirty]);

  useEffect(() => {
    if (findMatches.length === 0) {
      setFindMatchIndex(0);
      return;
    }
    setFindMatchIndex((index) => Math.min(index, findMatches.length - 1));
  }, [findMatches.length]);

  const titleLiveRef = useRef(title);
  const contentLiveRef = useRef(content);
  titleLiveRef.current = title;
  contentLiveRef.current = content;

  useEffect(() => {
    if (!findQuery) return;
    const matches = collectEditorFindMatches(
      titleLiveRef.current,
      contentLiveRef.current,
      findQuery,
    );
    if (matches.length === 0) return;
    const safeIndex = Math.min(findMatchIndex, matches.length - 1);
    const match = matches[safeIndex];
    if (!match) return;
    if (match.field === "content") {
      setForceWriteTabToken((token) => token + 1);
    }
    const timeoutId = window.setTimeout(() => {
      if (match.field === "content") {
        const el = contentTextareaRef.current;
        if (el) {
          el.focus();
          el.setSelectionRange(match.start, match.end);
        }
      } else {
        const el = titleInputRef.current;
        if (el) {
          el.focus();
          el.setSelectionRange(match.start, match.end);
        }
      }
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [findQuery, findMatchIndex, noteId, findFocusBoot]);

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

  const sendTypingHeartbeat = useCallback(
    (typing: boolean) => {
      if (!session || !note) return;
      void heartbeat({
        noteId,
        cursorPosition: cursorPositionRef.current,
        isTyping: canEditThisNote ? typing : false,
      });
    },
    [canEditThisNote, heartbeat, note, noteId, session],
  );

  useEffect(() => {
    if (!session || !note) {
      typingHeartbeatStateRef.current = null;
      return;
    }

    const nextTyping = canEditThisNote ? isTyping : false;
    if (typingHeartbeatStateRef.current === nextTyping) return;

    typingHeartbeatStateRef.current = nextTyping;
    sendTypingHeartbeat(nextTyping);
  }, [canEditThisNote, isTyping, note, sendTypingHeartbeat, session]);

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
    typingTimerRef.current = setTimeout(() => setIsTyping(false), 700);
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!highlightCommentId) return;
    setDrawer("comments");
  }, [highlightCommentId]);

  const typingCollaborators =
    activeCollaborators?.filter(
      (collaborator) => collaborator.isTyping && !collaborator.isCurrentUser,
    ) ?? [];
  const typingLabel = buildTypingLabel(typingCollaborators.map((collaborator) => collaborator.displayName));

  const collaborators =
    activeCollaborators?.map((collaborator) => ({
      id: collaborator._id,
      name: collaborator.displayName,
      email: collaborator.userEmail ?? "email not available",
      isTyping: collaborator.isTyping,
      isCurrentUser: collaborator.isCurrentUser,
    })) ?? [];

  const saveStatusUi = !isOnline
    ? ("offline" as const)
    : retryNeeded
      ? ("retrying" as const)
      : saveStatus;

  const commentsCount = comments?.length ?? 0;
  const revisionsCount = revisions.length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavHeader
        isSignedIn={Boolean(session)}
        sessionPending={sessionPending}
        userEmail={session?.user.email}
        onSignOut={async () => {
          await signOut({ redirectUrl: "/" });
        }}
      />

      <main className="flex flex-1 flex-col">
        <NoteToolbar
          workspaceId={note?.workspaceId ?? null}
          workspaceName={workspace?.name ?? null}
          noteTitle={note?.title ?? null}
          isArchived={note?.isArchived ?? false}
          canEdit={canEdit}
          onArchiveToggle={() => void onArchiveToggle()}
          onDelete={() => void onDelete()}
          onOpenComments={() => setDrawer("comments")}
          onOpenRevisions={() => setDrawer("revisions")}
          commentsCount={commentsCount}
          revisionsCount={revisionsCount}
          collaborators={collaborators}
          saveState={saveStatusUi}
          lastSaved={effectiveLastSavedAt ? new Date(effectiveLastSavedAt) : null}
        />

        <div className="mx-auto w-full max-w-3xl space-y-3 px-4 pt-4 sm:px-6">
          {!session && !sessionPending ? (
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
          {remoteFork && note ? (
            <StatusBanner
              variant="warning"
              title="This note was updated elsewhere"
              message="Someone saved a newer version while you have unsaved edits. Reload to replace your draft with their version, or dismiss to keep editing (your save may overwrite their changes)."
              actions={
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTitleInput(remoteFork.title);
                      setContentInput(remoteFork.content);
                      lastSyncedRef.current = {
                        title: remoteFork.title,
                        content: remoteFork.content,
                      };
                      lastSyncedUpdatedAtRef.current = remoteFork.updatedAt;
                      setTitleDirty(false);
                      setContentDirty(false);
                      setRemoteFork(null);
                      dismissedRemoteForkAtRef.current = null;
                      setSaveStatus("idle");
                      setFeedback("Loaded the latest version from the server.");
                    }}
                  >
                    Reload latest
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      dismissedRemoteForkAtRef.current = remoteFork.updatedAt;
                      setRemoteFork(null);
                    }}
                  >
                    Dismiss
                  </Button>
                </>
              }
              onDismiss={() => {
                dismissedRemoteForkAtRef.current = remoteFork.updatedAt;
                setRemoteFork(null);
              }}
            />
          ) : null}
          {findQuery && note ? (
            findMatches.length === 0 ? (
              <StatusBanner
                variant="muted"
                title="No matches in this note"
                message={`Nothing in the title or body matches "${findQuery}".`}
                actions={
                  <Button type="button" size="sm" variant="outline" onClick={clearFindQuery}>
                    Clear search
                  </Button>
                }
              />
            ) : (
              <StatusBanner
                variant="info"
                title="Search in note"
                message={`Match ${findMatchIndex + 1} of ${findMatches.length} for "${findQuery}".`}
                actions={
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setFindMatchIndex((index) =>
                          findMatches.length === 0
                            ? 0
                            : (index - 1 + findMatches.length) % findMatches.length,
                        )
                      }
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setFindMatchIndex((index) =>
                          findMatches.length === 0 ? 0 : (index + 1) % findMatches.length,
                        )
                      }
                    >
                      Next
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={clearFindQuery}>
                      Clear
                    </Button>
                  </>
                }
              />
            )
          ) : null}
        </div>

        <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:py-10">
          {isPending || note === undefined ? (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-sm text-muted-foreground">
              Loading note...
            </div>
          ) : note ? (
            <NoteEditorSurface
              ref={contentTextareaRef}
              titleInputRef={titleInputRef}
              forceWriteTabToken={forceWriteTabToken}
              title={title}
              content={content}
              onTitleChange={(value) => {
                setTitleInput(value);
                setTitleDirty(true);
                setSaveStatus("typing");
                markTyping();
              }}
              onContentChange={(value, selectionStart) => {
                setContentInput(value);
                setContentDirty(true);
                setSaveStatus("typing");
                setCursorPosition(selectionStart);
                markTyping();
              }}
              onBlur={() => {
                if (canEditThisNote) {
                  setIsTyping(false);
                  flushSaveNow();
                }
              }}
              onCursorPositionChange={(position) => setCursorPosition(position)}
              canEditThisNote={canEditThisNote}
              isArchived={note.isArchived}
              typingLabel={typingLabel}
              effectiveLastSavedAt={effectiveLastSavedAt}
              hasUnsavedChanges={hasUnsavedChanges}
              saveStatus={saveStatus}
              onRetrySave={flushSaveNow}
            />
          ) : null}
        </div>
      </main>

      <CommentsDrawer
        open={drawer === "comments"}
        onOpenChange={(open) => setDrawer(open ? "comments" : null)}
        highlightCommentId={highlightCommentId}
        comments={comments ?? undefined}
        canComment={Boolean(session)}
        commentDraft={commentDraft}
        onCommentDraftChange={setCommentDraft}
        isSubmitting={isSubmittingComment}
        onSubmit={() => void onCreateComment()}
        onToggleResolve={(commentId, resolved) => void onResolveComment(commentId, resolved)}
      />

      <RevisionsDrawer
        open={drawer === "revisions"}
        onOpenChange={(open) => setDrawer(open ? "revisions" : null)}
        revisions={revisions}
        status={revisionsStatus}
        onLoadMore={() => loadMoreRevisions(8)}
        canRestore={canEdit}
        isRestoringRevisionId={isRestoringRevisionId}
        onRestore={(id) => void onRestoreRevision(id)}
      />
    </div>
  );
}

export default function NoteEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
          Loading note…
        </div>
      }
    >
      <NoteEditorPageInner />
    </Suspense>
  );
}
