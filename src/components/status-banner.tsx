import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type BannerVariant = "info" | "success" | "warning" | "error" | "muted";

interface StatusBannerProps {
  variant?: BannerVariant;
  title?: string;
  message: string;
  /** Optional buttons or controls (e.g. Prev / Next, Reload). */
  actions?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const variantStyles: Record<
  BannerVariant,
  { bg: string; border: string; text: string; icon: string }
> = {
  info: {
    bg: "bg-info/10",
    border: "border-info/20",
    text: "text-info",
    icon: "text-info",
  },
  success: {
    bg: "bg-success/10",
    border: "border-success/20",
    text: "text-success",
    icon: "text-success",
  },
  warning: {
    bg: "bg-warning/10",
    border: "border-warning/30",
    text: "text-warning-foreground",
    icon: "text-warning",
  },
  error: {
    bg: "bg-destructive/10",
    border: "border-destructive/20",
    text: "text-destructive",
    icon: "text-destructive",
  },
  muted: {
    bg: "bg-muted",
    border: "border-border",
    text: "text-muted-foreground",
    icon: "text-muted-foreground",
  },
};

const variantIcons: Record<BannerVariant, React.ElementType> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  muted: Info,
};

export function StatusBanner({
  variant = "info",
  title,
  message,
  actions,
  onDismiss,
  className,
}: StatusBannerProps) {
  const styles = variantStyles[variant];
  const Icon = variantIcons[variant];

  return (
    <div
      className={cn("flex items-start gap-3 rounded-lg border p-4", styles.bg, styles.border, className)}
      role="alert"
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", styles.icon)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title ? <p className={cn("font-medium", styles.text)}>{title}</p> : null}
        <p className={cn("text-sm", title ? "mt-1 text-muted-foreground" : styles.text)}>{message}</p>
        {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {onDismiss ? (
        <button
          onClick={onDismiss}
          className="shrink-0 rounded-md p-1 transition-colors hover:bg-foreground/5"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      ) : null}
    </div>
  );
}
