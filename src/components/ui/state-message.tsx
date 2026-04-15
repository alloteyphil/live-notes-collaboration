import { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const stateMessageVariants = cva("rounded-md border px-3 py-2 text-sm", {
  variants: {
    variant: {
      info: "border-blue-200 bg-blue-50 text-blue-800",
      success: "border-emerald-200 bg-emerald-50 text-emerald-800",
      warning: "border-amber-200 bg-amber-50 text-amber-800",
      error: "border-red-200 bg-red-50 text-red-800",
      muted: "border-zinc-200 bg-zinc-50 text-zinc-700",
    },
  },
  defaultVariants: {
    variant: "muted",
  },
});

type StateMessageProps = HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof stateMessageVariants>;

export function StateMessage({ className, variant, ...props }: StateMessageProps) {
  return <p className={cn(stateMessageVariants({ variant }), className)} {...props} />;
}
