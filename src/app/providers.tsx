"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ThemeRoot } from "@/components/theme-root";
import { ToastProvider } from "@/components/toast-provider";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

function MissingConvexEnv() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg rounded-xl border border-destructive/40 bg-card p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-foreground">Missing configuration</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          `NEXT_PUBLIC_CONVEX_URL` is not set. Add it in your environment variables and reload the app.
        </p>
      </div>
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  if (!convex) {
    return (
      <ClerkProvider>
        <ThemeRoot>
          <ToastProvider>
            <MissingConvexEnv />
          </ToastProvider>
        </ThemeRoot>
      </ClerkProvider>
    );
  }

  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ThemeRoot>
          <ToastProvider>{children}</ToastProvider>
        </ThemeRoot>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
