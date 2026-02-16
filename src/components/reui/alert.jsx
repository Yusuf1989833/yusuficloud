"use client";

import { cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full text-sm border grid has-[>svg]:grid-cols-[calc(var(--spacing)*3)_1fr] grid-cols-[0_1fr] gap-y-0.5 items-center [&>svg:not([class*=size-])]:size-4 has-[>[data-slot=alert-title]+[data-slot=alert-description]]:[&_[data-slot=alert-action]]:sm:row-end-3 has-[>[data-slot=alert-title]+[data-slot=alert-description]]:items-start has-[>[data-slot=alert-title]+[data-slot=alert-description]]:[&_svg]:translate-y-0.5 rounded-lg px-4 py-3 has-[>svg]:gap-x-3",
  {
    variants: {
      variant: {
        default: "border-border bg-background text-foreground [&>svg]:text-foreground",
        destructive: "border-destructive/30 bg-destructive/4 text-destructive-foreground [&>svg]:text-destructive",
        success: "border-green-500/30 bg-green-500/10 text-green-800 dark:text-green-200 [&>svg]:text-green-600 dark:[&>svg]:text-green-400",
        warning: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200 [&>svg]:text-amber-600",
        info: "border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-blue-200 [&>svg]:text-blue-600",
        invert: "border-border bg-muted text-muted-foreground [&>svg]:text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Alert({ className, variant, asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant, className }))}
      {...props}
    />
  );
}

function AlertTitle({ className, asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : "h5";
  return (
    <Comp
      data-slot="alert-title"
      className={cn("font-medium leading-none tracking-tight", className)}
      {...props}
    />
  );
}

function AlertDescription({ className, asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp
      data-slot="alert-description"
      className={cn("text-sm [&_p]:leading-relaxed", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, alertVariants };
