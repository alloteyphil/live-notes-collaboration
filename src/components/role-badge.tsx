import { Crown, Eye, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "owner" | "editor" | "viewer";

interface RoleBadgeProps {
  role: Role;
  showIcon?: boolean;
  className?: string;
}

const roleConfig: Record<Role, { label: string; icon: React.ElementType; style: string }> = {
  owner: {
    label: "Owner",
    icon: Crown,
    style: "bg-primary/10 text-primary border-primary/20",
  },
  editor: {
    label: "Editor",
    icon: Pencil,
    style: "bg-info/10 text-info border-info/20",
  },
  viewer: {
    label: "Viewer",
    icon: Eye,
    style: "bg-muted text-muted-foreground border-border",
  },
};

export function RoleBadge({ role, showIcon = true, className }: RoleBadgeProps) {
  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
        config.style,
        className,
      )}
    >
      {showIcon ? <Icon className="h-3 w-3" aria-hidden="true" /> : null}
      {config.label}
    </span>
  );
}
