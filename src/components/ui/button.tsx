"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-zinc-900 text-white hover:bg-zinc-800",
        secondary: "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50",
        danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
        ghost: "bg-transparent text-zinc-700 hover:bg-zinc-100",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-10 px-6 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    isLoading?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { asChild = false, children, className, isLoading = false, size, type = "button", variant, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const content = isLoading && !asChild ? (
      <>
        <Loader2 className="animate-spin" />
        {children}
      </>
    ) : (
      children
    );

    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={isLoading || props.disabled}
        ref={ref}
        type={type}
        {...props}
      >
        {content}
      </Comp>
    );
  },
);

Button.displayName = "Button";

export { buttonVariants };
