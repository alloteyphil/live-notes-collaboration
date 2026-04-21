"use client";

import { AppRouteState } from "@/components/app-route-state";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <AppRouteState
          title="Something went wrong"
          description={
            error.digest
              ? "The app hit an unexpected issue. You can retry now or return home."
              : error.message || "The app hit an unexpected issue."
          }
          onReset={reset}
          backHref="/"
          backLabel="Go home"
        />
      </body>
    </html>
  );
}
