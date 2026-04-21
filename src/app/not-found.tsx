import { AppRouteState } from "@/components/app-route-state";

export default function NotFound() {
  return (
    <AppRouteState
      kind="notFound"
      title="Page not found"
      description="This page does not exist or has been moved."
      backHref="/"
      backLabel="Go home"
    />
  );
}
