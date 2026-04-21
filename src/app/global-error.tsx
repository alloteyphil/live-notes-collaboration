"use client";

import { AppRouteState } from "@/components/app-route-state";

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void _error;
  return (
    <html lang="en">
      <body>
        <AppRouteState
          title="Something went wrong"
          description="The app hit an unexpected issue. You can retry now or return home."
          onReset={reset}
          backHref="/"
          backLabel="Go home"
        />
      </body>
    </html>
  );
}
