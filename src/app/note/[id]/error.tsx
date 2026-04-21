"use client";

import { AppRouteState } from "@/components/app-route-state";

export default function NoteError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void _error;
  return (
    <AppRouteState
      title="Note failed to load"
      description="This note could not be loaded right now."
      onReset={reset}
      backHref="/dashboard"
      backLabel="Back to dashboard"
    />
  );
}
