"use client";

import { AppRouteState } from "@/components/app-route-state";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppRouteState
      title="Workspace failed to load"
      description={error.message || "We couldn't load this workspace right now."}
      onReset={reset}
      backHref="/dashboard"
      backLabel="Back to dashboard"
    />
  );
}
