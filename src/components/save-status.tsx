"use client";

import { AlertCircle, Check, Cloud, CloudOff, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export type SaveStatusState =
  | "idle"
  | "typing"
  | "saving"
  | "saved"
  | "error"
  | "offline"
  | "retrying";

type SaveState = SaveStatusState;

interface SaveStatusProps {
  state: SaveState;
  lastSaved?: Date | null;
  className?: string;
}

const stateConfig: Record<
  SaveState,
  { icon: React.ElementType; label: string; style: string; animate?: boolean }
> = {
  idle: { icon: Cloud, label: "Ready", style: "text-muted-foreground" },
  typing: { icon: Loader2, label: "Editing...", style: "text-muted-foreground", animate: true },
  saving: { icon: Loader2, label: "Saving...", style: "text-primary", animate: true },
  saved: { icon: Check, label: "Saved", style: "text-success" },
  error: { icon: AlertCircle, label: "Save failed", style: "text-destructive" },
  offline: { icon: CloudOff, label: "Offline", style: "text-warning" },
  retrying: { icon: RefreshCw, label: "Retrying...", style: "text-warning", animate: true },
};

function formatLastSaved(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 10) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

export function SaveStatus({ state, lastSaved, className }: SaveStatusProps) {
  const config = stateConfig[state];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <Icon
        className={cn("h-4 w-4", config.style, config.animate ? "animate-spin" : undefined)}
        aria-hidden="true"
      />
      <span className={cn("font-medium", config.style)}>{config.label}</span>
      {state === "saved" && lastSaved ? (
        <span className="text-muted-foreground">{formatLastSaved(lastSaved)}</span>
      ) : null}
    </div>
  );
}
