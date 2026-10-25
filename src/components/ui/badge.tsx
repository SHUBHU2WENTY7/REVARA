import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium font-tabular transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
        secondary:
          "border border-transparent bg-slate-800 text-slate-300 border-slate-700",
        destructive:
          "border border-rose-500/30 bg-rose-500/15 text-rose-400",
        outline: "text-slate-300 border border-white/10",
        emerald:
          "border border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
        amber:
          "border border-amber-500/30 bg-amber-500/15 text-amber-400",
        cyan:
          "border border-cyan-500/30 bg-cyan-500/15 text-cyan-400",
        violet:
          "border border-violet-500/30 bg-violet-500/15 text-violet-400",
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
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
