import { AppRouteState } from "@/components/app-route-state";

export default function DashboardLoading() {
  return (
    <AppRouteState
      kind="loading"
      title="Loading dashboard"
      description="Fetching your workspaces, invites, and activity."
      backHref="/"
      backLabel="Back to home"
    />
  );
}
