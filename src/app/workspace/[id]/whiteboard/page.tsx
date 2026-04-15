"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { ExcalidrawWrapper } from "@/components/excalidraw-wrapper";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icons } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StateMessage } from "@/components/ui/state-message";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function WorkspaceWhiteboardPage() {
  const { data: session, isPending } = authClient.useSession();
  const { showToast } = useToast();
  const params = useParams<{ id: string }>();
  const workspaceId = params.id as Id<"workspaces">;

  const workspace = useQuery(
    api.workspaces.getById,
    session ? { workspaceId } : "skip",
  );
  const whiteboardState = useQuery(
    api.whiteboards.get,
    session ? { workspaceId } : "skip",
  );
  const saveWhiteboard = useMutation(api.whiteboards.save);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

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
      try {
        setSaveState("saving");
        await saveWhiteboard({ workspaceId, sceneData });
        setSaveState("saved");
        setLastSavedAt(Date.now());
      } catch (error) {
        setSaveState("error");
        showToast({
          message: error instanceof Error ? error.message : "Failed to save whiteboard.",
          variant: "error",
        });
      }
    },
    [canEdit, saveWhiteboard, showToast, workspaceId],
  );

  if (isPending) {
    return (
      <main className="app-container space-y-4">
        <Skeleton className="h-10 w-60" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-[560px] w-full" />
      </main>
    );
  }

  if (!session) {
    return (
      <main className="app-container space-y-4">
        <PageHeader
          description="Sign in to access workspace whiteboards."
          title="Workspace Whiteboard"
        />
        <EmptyState
          action={
            <Button asChild>
              <Link href="/">
                Go to sign in
                <Icons.forward />
              </Link>
            </Button>
          }
          description="Whiteboard data is available after authentication."
          icon={Icons.note}
          title="Sign in required"
        />
      </main>
    );
  }

  if (whiteboardState === undefined) {
    return (
      <main className="app-container space-y-4">
        <Skeleton className="h-10 w-60" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-[560px] w-full" />
      </main>
    );
  }

  if (whiteboardState === null) {
    return (
      <main className="app-container space-y-4">
        <PageHeader
          description="Your workspace access has changed."
          title="Whiteboard unavailable"
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
          description="You no longer have permission to open this workspace whiteboard."
          icon={Icons.alert}
          title="Access removed"
        />
      </main>
    );
  }

  return (
    <main className="app-container space-y-5">
      <PageHeader
        actions={
          <Button asChild size="sm" variant="secondary">
            <Link href={`/workspace/${workspaceId}`}>
              <Icons.back />
              Back to Workspace
            </Link>
          </Button>
        }
        description={`Workspace: ${workspace?.name ?? "Loading..."}`}
        title="Workspace Whiteboard"
      />

      <Card>
        <CardHeader>
          <CardTitle>Canvas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <span>Status:</span>
            <span className="font-medium text-zinc-900">{statusLabel}</span>
            {lastSavedAt ? (
              <span className="text-zinc-500">
                • Last saved {new Date(lastSavedAt).toLocaleTimeString()}
              </span>
            ) : null}
          </div>
          {!canEdit ? (
            <StateMessage variant="warning">
              You are a viewer in this workspace. Whiteboard editing is disabled.
            </StateMessage>
          ) : (
            <StateMessage variant="info">
              Live sync is enabled. Changes from collaborators appear automatically.
            </StateMessage>
          )}
          <ExcalidrawWrapper
            sceneData={whiteboardState.whiteboard?.sceneData ?? null}
            onChange={onSceneChange}
            readOnly={!canEdit}
          />
        </CardContent>
      </Card>
    </main>
  );
}
