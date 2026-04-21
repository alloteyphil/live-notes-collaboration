"use client";

import { AppRouteState } from "@/components/app-route-state";

export default function DashboardError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void _error;
  return (
    <AppRouteState
      title="Unable to load dashboard"
      description="Dashboard data could not be loaded."
      onReset={reset}
      backHref="/"
      backLabel="Back to home"
    />
  );
}
