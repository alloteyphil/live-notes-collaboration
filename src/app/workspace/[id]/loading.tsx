import { AppRouteState } from "@/components/app-route-state";

export default function WorkspaceLoading() {
  return (
    <AppRouteState
      kind="loading"
      title="Loading workspace"
      description="Syncing members, notes, and templates."
      backHref="/dashboard"
      backLabel="Back to dashboard"
    />
  );
}
