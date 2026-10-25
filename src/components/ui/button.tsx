import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--ink)] text-[var(--on-ink)] hover:opacity-90 shadow-xs active:translate-y-px",
        destructive:
          "bg-rose-500/15 text-rose-500 border border-rose-500/30 hover:bg-rose-500/25 active:translate-y-px",
        outline:
          "border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--well)] text-[var(--text)] active:translate-y-px",
        secondary:
          "bg-[var(--well)] text-[var(--text)] hover:bg-[var(--surface-2)] border border-[var(--line)]",
        ghost: "hover:bg-[var(--well)] text-[var(--muted)] hover:text-[var(--text)]",
        link: "text-[var(--primary)] underline-offset-4 hover:underline",
        emerald:
          "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/25 active:translate-y-px",
        amber:
          "bg-amber-500/15 text-amber-500 border border-amber-500/30 hover:bg-amber-500/25 active:translate-y-px",
        gradient:
          "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-2)] text-white font-semibold shadow-xs hover:opacity-95 active:translate-y-px",
      },
      size: {
        default: "h-9 px-3.5 py-2",
        sm: "h-7 rounded-lg px-2.5 text-[11px]",
        lg: "h-10 rounded-xl px-5 text-sm",
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
