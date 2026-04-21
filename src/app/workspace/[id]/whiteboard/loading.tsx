import { AppRouteState } from "@/components/app-route-state";

export default function WhiteboardLoading() {
  return (
    <AppRouteState
      kind="loading"
      title="Loading whiteboard"
      description="Fetching the latest board state for your workspace."
      backHref="/dashboard"
      backLabel="Back to dashboard"
    />
  );
}
