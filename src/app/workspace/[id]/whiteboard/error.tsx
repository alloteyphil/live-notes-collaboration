"use client";

import { AppRouteState } from "@/components/app-route-state";

export default function WhiteboardError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void _error;
  return (
    <AppRouteState
      title="Whiteboard unavailable"
      description="The whiteboard could not be opened."
      onReset={reset}
      backHref="/dashboard"
      backLabel="Back to dashboard"
    />
  );
}
