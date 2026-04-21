"use client";

import { AppRouteState } from "@/components/app-route-state";

export default function WhiteboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppRouteState
      title="Whiteboard unavailable"
      description={error.message || "The whiteboard could not be opened."}
      onReset={reset}
      backHref="/dashboard"
      backLabel="Back to dashboard"
    />
  );
}
