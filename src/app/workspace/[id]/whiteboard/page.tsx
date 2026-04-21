"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { ExcalidrawWrapper } from "@/components/excalidraw-wrapper";
import { NavHeader } from "@/components/nav-header";
import { PageHeader } from "@/components/page-header";
import { SaveStatus } from "@/components/save-status";
import { StatusBanner } from "@/components/status-banner";
import { useClerk, useUser } from "@clerk/nextjs";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function WorkspaceWhiteboardPage() {
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

  const workspace = useQuery(api.workspaces.getById, canRunProtectedQueries ? { workspaceId } : "skip");
  const whiteboardState = useQuery(
    api.whiteboards.get,
    canRunProtectedQueries ? { workspaceId } : "skip",
  );
  const saveWhiteboard = useMutation(api.whiteboards.save);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const saveInFlightRef = useRef(false);
  const queuedSceneDataRef = useRef<string | null>(null);
  const lastSavedSceneDataRef = useRef<string | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canEdit = whiteboardState?.canEdit ?? false;
  const statusLabel = useMemo(() => {
    if (!canEdit && whiteboardState) return "Read-only";
    if (saveState === "saving") return "Saving...";
    if (saveState === "saved") return "Saved";
    if (saveState === "error") return "Save failed";
    return "Idle";
  }, [canEdit, saveState, whiteboardState]);

  useEffect(() => {
    (
      window as unknown as Window & {
        EXCALIDRAW_ASSET_PATH: string;
      }
    ).EXCALIDRAW_ASSET_PATH = `${window.location.origin}/`;
  }, []);

  const onSceneChange = useCallback(
    async (sceneData: string) => {
      if (!canEdit) return;
      if (sceneData === lastSavedSceneDataRef.current) return;
      if (saveInFlightRef.current) {
        queuedSceneDataRef.current = sceneData;
        return;
      }
      saveInFlightRef.current = true;
      let sceneToSave: string | null = sceneData;
      while (sceneToSave) {
        try {
          setSaveState("saving");
          await saveWhiteboard({ workspaceId, sceneData: sceneToSave });
          lastSavedSceneDataRef.current = sceneToSave;
          setSaveState("saved");
          setLastSavedAt(Date.now());
          sceneToSave = queuedSceneDataRef.current;
          queuedSceneDataRef.current = null;
          if (sceneToSave === lastSavedSceneDataRef.current) {
            sceneToSave = null;
          }
        } catch (error) {
          setSaveState("error");
          queuedSceneDataRef.current = sceneToSave;
          showToast({
            message: error instanceof Error ? error.message : "Failed to save whiteboard.",
            variant: "error",
          });
          if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current);
          }
          retryTimerRef.current = setTimeout(() => {
            saveInFlightRef.current = false;
            const queued = queuedSceneDataRef.current;
            if (!queued) return;
            queuedSceneDataRef.current = null;
            void (async () => {
              try {
                setSaveState("saving");
                await saveWhiteboard({ workspaceId, sceneData: queued });
                lastSavedSceneDataRef.current = queued;
                setSaveState("saved");
                setLastSavedAt(Date.now());
              } catch (retryError) {
                queuedSceneDataRef.current = queued;
                setSaveState("error");
                showToast({
                  message:
                    retryError instanceof Error
                      ? retryError.message
                      : "Retry failed while saving whiteboard.",
                  variant: "error",
                });
              }
            })();
          }, 1500);
          break;
        }
      }
      saveInFlightRef.current = false;
    },
    [canEdit, saveWhiteboard, showToast, workspaceId],
  );

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

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
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <PageHeader
              title="Whiteboard"
              description={workspace?.name ?? "Workspace"}
              backHref={`/workspace/${workspaceId}`}
              backLabel="Workspace"
            />
            <SaveStatus
              state={
                !canEdit && whiteboardState
                  ? "offline"
                  : saveState === "saving"
                    ? "saving"
                    : saveState === "saved"
                      ? "saved"
                      : saveState === "error"
                        ? "error"
                        : "idle"
              }
              lastSaved={lastSavedAt ? new Date(lastSavedAt) : null}
            />
          </div>

          {!session && !sessionPending ? (
            <StatusBanner
              variant="warning"
              message="Sign in to access workspace whiteboards."
              className="mb-4"
            />
          ) : null}
          {whiteboardState === null ? (
            <StatusBanner
              variant="error"
              message="You no longer have permission to open this workspace whiteboard."
              className="mb-4"
            />
          ) : null}
          {!canEdit && whiteboardState ? (
            <StatusBanner
              variant="info"
              message="You're viewing this whiteboard in read-only mode. Editing is disabled."
              className="mb-4"
            />
          ) : null}
          {canEdit ? (
            <StatusBanner
              variant="success"
              message="Live sync enabled. Your changes are synced in real-time with collaborators."
              className="mb-4"
            />
          ) : null}

          {isPending || whiteboardState === undefined ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-[60vh] w-full" />
            </div>
          ) : whiteboardState ? (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-2">
                <p className="text-sm text-muted-foreground">
                  Status: <span className="font-medium text-foreground">{statusLabel}</span>
                  {lastSavedAt ? ` • Last saved ${new Date(lastSavedAt).toLocaleTimeString()}` : ""}
                </p>
                <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                  <Link href={`/workspace/${workspaceId}`}>Back to workspace</Link>
                </Button>
              </div>
              <div className="h-[60vh] min-h-[400px] overflow-hidden bg-white">
                <ExcalidrawWrapper
                  sceneData={whiteboardState.whiteboard?.sceneData ?? null}
                  onChange={onSceneChange}
                  readOnly={!canEdit}
                />
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
