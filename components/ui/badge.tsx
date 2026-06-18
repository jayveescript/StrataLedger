import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:     "bg-brand-info/10 text-brand-info",
        secondary:   "bg-slate-100 text-slate-700",
        destructive: "bg-brand-error/10 text-brand-error",
        success:     "bg-brand-success/10 text-brand-success",
        warning:     "bg-brand-warning/10 text-brand-warning",
        outline:     "border border-slate-200 text-slate-700",
        paid:        "bg-brand-success/10 text-brand-success",
        overdue:     "bg-brand-error/10 text-brand-error",
        unpaid:      "bg-brand-warning/10 text-brand-warning",
        partial:     "bg-brand-info/10 text-brand-info",
        high:        "bg-brand-error/10 text-brand-error",
        medium:      "bg-brand-warning/10 text-brand-warning",
        low:         "bg-brand-success/10 text-brand-success",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
