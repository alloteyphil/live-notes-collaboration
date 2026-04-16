import { cn } from "@/lib/utils";

interface ContentCardProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function ContentCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: ContentCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card shadow-sm", className)}>
      {title || description || action ? (
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div className="space-y-0.5">
            {title ? <h3 className="font-semibold text-card-foreground">{title}</h3> : null}
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={cn("p-6", contentClassName)}>{children}</div>
    </div>
  );
}
