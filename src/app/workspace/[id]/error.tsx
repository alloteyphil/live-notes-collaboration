"use client";

import { AppRouteState } from "@/components/app-route-state";

export default function WorkspaceError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void _error;
  return (
    <AppRouteState
      title="Workspace failed to load"
      description="We couldn't load this workspace right now."
      onReset={reset}
      backHref="/dashboard"
      backLabel="Back to dashboard"
    />
  );
}
