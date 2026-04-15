"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef } from "react";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawProps,
} from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false },
);

type ExcalidrawWrapperProps = {
  sceneData: string | null;
  onChange: (sceneData: string) => void;
  readOnly?: boolean;
  debounceMs?: number;
};

const DEFAULT_SCENE = "{}";
type ExcalidrawOnChange = NonNullable<ExcalidrawProps["onChange"]>;
type ExcalidrawApiLike = {
  updateScene: (scene: unknown) => void;
};
type ParsedScene = {
  elements?: unknown;
  appState?: Record<string, unknown>;
  files?: unknown;
};

const toPersistedScene = (
  elements: unknown,
  appState: AppState,
  files: BinaryFiles,
) => {
  return {
    elements,
    files,
    // Persist only stable app state values to avoid save loops.
    appState: {
      theme: appState.theme,
      viewBackgroundColor: appState.viewBackgroundColor,
      name: appState.name ?? null,
      gridSize: appState.gridSize ?? null,
    },
  };
};

const normalizeSceneData = (rawSceneData: string | null) => {
  if (!rawSceneData) return undefined;
  try {
    const parsed = JSON.parse(rawSceneData) as ParsedScene;
    if (!parsed || typeof parsed !== "object") {
      return undefined;
    }

    const normalizedAppState = parsed.appState
      ? {
          ...parsed.appState,
          // Excalidraw expects collaborators to be a Map, not a plain object.
          collaborators:
            parsed.appState.collaborators instanceof Map
              ? parsed.appState.collaborators
              : new Map(),
        }
      : undefined;

    return {
      ...parsed,
      appState: normalizedAppState,
    } as ExcalidrawProps["initialData"];
  } catch {
    return undefined;
  }
};

export function ExcalidrawWrapper({
  debounceMs = 600,
  sceneData,
  onChange,
  readOnly = false,
}: ExcalidrawWrapperProps) {
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const excalidrawApiRef = useRef<ExcalidrawApiLike | null>(null);
  const lastServerSceneDataRef = useRef(sceneData ?? DEFAULT_SCENE);
  const lastLocalSceneDataRef = useRef(sceneData ?? DEFAULT_SCENE);

  const parsedInitialData = useMemo(() => {
    return normalizeSceneData(sceneData);
  }, [sceneData]);

  useEffect(() => {
    const nextServerSceneData = sceneData ?? DEFAULT_SCENE;
    if (nextServerSceneData === lastServerSceneDataRef.current) {
      return;
    }
    lastServerSceneDataRef.current = nextServerSceneData;
    if (nextServerSceneData === lastLocalSceneDataRef.current) {
      return;
    }

    try {
      const parsed = normalizeSceneData(nextServerSceneData);
      if (!parsed) {
        return;
      }
      excalidrawApiRef.current?.updateScene(parsed);
      lastLocalSceneDataRef.current = nextServerSceneData;
    } catch {
      // Ignore invalid persisted scene payloads.
    }
  }, [sceneData]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const scheduleSave: ExcalidrawOnChange = (
    elements,
    appState: AppState,
    files: BinaryFiles,
  ) => {
    if (readOnly) return;
    const nextSceneData = JSON.stringify(
      toPersistedScene(elements, appState, files),
    );
    lastLocalSceneDataRef.current = nextSceneData;
    if (nextSceneData === lastServerSceneDataRef.current) {
      return;
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onChange(nextSceneData);
    }, debounceMs);
  };

  return (
    <div className="h-[calc(100vh-14rem)] min-h-[560px] w-full overflow-hidden rounded-lg border border-zinc-200">
      <Excalidraw
        excalidrawAPI={(api) => {
          excalidrawApiRef.current = api as ExcalidrawApiLike;
        }}
        initialData={parsedInitialData}
        onChange={scheduleSave}
        viewModeEnabled={readOnly}
      />
    </div>
  );
}
