import { AppRouteState } from "@/components/app-route-state";

export default function RootLoading() {
  return (
    <AppRouteState
      kind="loading"
      title="Loading PulseNotes"
      description="Preparing your workspace and syncing collaboration state."
      backHref="/"
      backLabel="Back to home"
    />
  );
}
