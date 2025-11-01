import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        success: "bg-success/10 text-success border-success/20 hover:bg-success/15",
        warning: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/15",
        error: "bg-error/10 text-error border-error/20 hover:bg-error/15",
        info: "bg-info/10 text-info border-info/20 hover:bg-info/15",
        default: "bg-muted text-muted-foreground border-muted-foreground/20 hover:bg-muted/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {}

function StatusBadge({ className, variant, ...props }: StatusBadgeProps) {
  return (
    <div className={cn(statusBadgeVariants({ variant }), className)} {...props} />
  );
}

export { StatusBadge, statusBadgeVariants };
