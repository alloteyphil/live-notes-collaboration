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
        <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-6">
          <div className="space-y-0.5">
            {title ? <h3 className="font-semibold text-card-foreground">{title}</h3> : null}
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {action ? <div className="w-full sm:w-auto sm:shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={cn("p-4 sm:p-6", contentClassName)}>{children}</div>
    </div>
  );
}
