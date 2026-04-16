"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Collaborator {
  id: string;
  name: string;
  email: string;
  isTyping?: boolean;
  isCurrentUser?: boolean;
}

interface PresenceAvatarsProps {
  collaborators: Collaborator[];
  maxVisible?: number;
  className?: string;
}

function getTypingLabel(collaborators: Collaborator[]): string {
  const typingCollaborators = collaborators.filter(
    (collaborator) => collaborator.isTyping && !collaborator.isCurrentUser,
  );

  if (typingCollaborators.length === 0) return "";

  const displayName = (name: string) => name.trim().split(" ")[0] || name;

  if (typingCollaborators.length === 1) {
    return `${displayName(typingCollaborators[0].name)} is typing...`;
  }

  if (typingCollaborators.length === 2) {
    return `${displayName(typingCollaborators[0].name)} and ${displayName(
      typingCollaborators[1].name,
    )} are typing...`;
  }

  return `${displayName(typingCollaborators[0].name)} and ${
    typingCollaborators.length - 1
  } others are typing...`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ["bg-primary/80", "bg-info/80", "bg-success/80", "bg-warning/80", "bg-chart-1/80", "bg-chart-2/80"];
  return colors[Math.abs(hash) % colors.length];
}

export function PresenceAvatars({
  collaborators,
  maxVisible = 4,
  className,
}: PresenceAvatarsProps) {
  const visible = collaborators.slice(0, maxVisible);
  const overflow = collaborators.length - maxVisible;
  const typingLabel = getTypingLabel(collaborators);

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex items-center", className)}>
        <div className="flex -space-x-2">
          {visible.map((collab) => (
            <Tooltip key={collab.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar
                    className={cn(
                      "h-8 w-8 border-2 border-background ring-0",
                      collab.isCurrentUser ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : undefined,
                    )}
                  >
                    <AvatarFallback
                      className={cn("text-xs font-medium text-white", getColorFromString(collab.email))}
                    >
                      {getInitials(collab.name)}
                    </AvatarFallback>
                  </Avatar>
                  {collab.isTyping ? (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
                    </span>
                  ) : null}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <p className="font-medium">
                  {collab.name}
                  {collab.isCurrentUser ? " (you)" : ""}
                </p>
                <p className="text-muted-foreground">{collab.email}</p>
                {collab.isTyping ? <p className="mt-1 text-primary">Typing...</p> : null}
              </TooltipContent>
            </Tooltip>
          ))}
          {overflow > 0 ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
                    +{overflow}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <p>
                  {overflow} more collaborator{overflow !== 1 ? "s" : ""}
                </p>
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        <span
          className={cn(
            "ml-3 inline-flex min-h-4 items-center text-xs text-muted-foreground",
            typingLabel ? "animate-pulse" : undefined,
          )}
        >
          {typingLabel || "\u00A0"}
        </span>
      </div>
    </TooltipProvider>
  );
}
