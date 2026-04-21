"use client";

import Link from "next/link";
import { AlertTriangle, FileWarning, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type AppRouteStateProps = {
  title: string;
  description: string;
  kind?: "error" | "notFound" | "loading";
  resetLabel?: string;
  onReset?: () => void;
  backHref?: string;
  backLabel?: string;
};

export function AppRouteState({
  title,
  description,
  kind = "error",
  resetLabel = "Try again",
  onReset,
  backHref = "/dashboard",
  backLabel = "Back to dashboard",
}: AppRouteStateProps) {
  const icon =
    kind === "notFound" ? (
      <FileWarning className="h-6 w-6" />
    ) : kind === "loading" ? (
      <RefreshCw className="h-6 w-6 animate-spin" />
    ) : (
      <AlertTriangle className="h-6 w-6" />
    );

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {onReset ? (
            <Button type="button" onClick={onReset}>
              {resetLabel}
            </Button>
          ) : null}
          <Button asChild variant={onReset ? "outline" : "default"}>
            <Link href={backHref}>
              <Home className="mr-1.5 h-4 w-4" />
              {backLabel}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
