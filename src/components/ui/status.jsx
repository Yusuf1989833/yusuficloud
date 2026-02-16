import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full border px-2.5 py-1 font-medium text-xs transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-muted text-muted-foreground [&_[data-slot=status-indicator]]:bg-muted-foreground",
        success:
          "border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400 [&_[data-slot=status-indicator]]:bg-green-600 [&_[data-slot=status-indicator]]:dark:bg-green-400",
        error:
          "border-destructive/20 bg-destructive/10 text-destructive [&_[data-slot=status-indicator]]:bg-destructive",
        // Warning variant: text #ff8904, bg #f54a00
        warning:
          "border-[#f54a00]/20 bg-[#f54a00]/10 text-[#ff8904] [&_[data-slot=status-indicator]]:bg-[#ff8904] [&_[data-slot=status-label]]:text-[#ff8904]",
        // Info variant: RGB(81, 162, 255) = #51A2FF
        info: "border-[#51A2FF]/20 bg-[#51A2FF]/10 text-[#51A2FF] [&_[data-slot=status-indicator]]:bg-[#51A2FF] [&_[data-slot=status-label]]:text-[#51A2FF]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Status(props) {
  const { className, variant = "default", asChild, ...rootProps } = props;

  const RootPrimitive = asChild ? Slot : "div";

  return (
    <RootPrimitive
      data-slot="status"
      data-variant={variant}
      {...rootProps}
      className={cn(statusVariants({ variant }), className)} />
  );
}

function StatusIndicator(props) {
  const { className, ...indicatorProps } = props;

  return (
    <div
      data-slot="status-indicator"
      {...indicatorProps}
      className={cn(
        "relative flex size-2 shrink-0 rounded-full",
        "before:absolute before:inset-0 before:animate-ping before:rounded-full before:bg-inherit",
        "after:absolute after:inset-[2px] after:rounded-full after:bg-inherit",
        className
      )} />
  );
}

function StatusLabel(props) {
  const { className, ...labelProps } = props;

  return (
    <div
      data-slot="status-label"
      {...labelProps}
      className={cn("leading-none", className)} />
  );
}

export {
  Status,
  StatusIndicator,
  StatusLabel,
  //
  statusVariants,
};
