"use client";

import { AppRouteState } from "@/components/app-route-state";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppRouteState
      title="Unable to load dashboard"
      description={error.message || "Dashboard data could not be loaded."}
      onReset={reset}
      backHref="/"
      backLabel="Back to home"
    />
  );
}
