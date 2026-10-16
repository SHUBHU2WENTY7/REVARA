import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 shadow-indigo-500/20 active:translate-y-px",
        destructive:
          "bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 active:translate-y-px",
        outline:
          "border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:text-white text-slate-300",
        secondary:
          "bg-slate-800 text-slate-200 hover:bg-slate-700/80 hover:text-white",
        ghost: "hover:bg-white/[0.06] text-slate-400 hover:text-slate-200",
        link: "text-indigo-400 underline-offset-4 hover:underline",
        emerald:
          "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 active:translate-y-px",
        amber:
          "bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 active:translate-y-px",
        gradient:
          "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold shadow-md shadow-indigo-500/25 hover:from-indigo-400 hover:to-cyan-400 active:translate-y-px",
      },
      size: {
        default: "h-9 px-3.5 py-2",
        sm: "h-7 rounded-md px-2.5 text-[11px]",
        lg: "h-10 rounded-lg px-5 text-sm",
        icon: "h-8 w-8 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
