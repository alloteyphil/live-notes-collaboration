"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ThemeRoot } from "@/components/theme-root";
import { ToastProvider } from "@/components/toast-provider";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: React.ReactNode }) {
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
