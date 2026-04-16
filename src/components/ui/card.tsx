import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BaseProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: BaseProps) {
  return <section className={cn("rounded-xl border border-border bg-card shadow-sm", className)} {...props} />;
}

export function CardHeader({ className, ...props }: BaseProps) {
  return <div className={cn("mb-3 flex items-start justify-between gap-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: BaseProps) {
  return <h2 className={cn("text-lg font-semibold tracking-tight text-card-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: BaseProps) {
  return <div className={cn("space-y-3", className)} {...props} />;
}
