import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface StickyBannerProps {
  variant?: "rose" | "amber" | "indigo" | "emerald"
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  dismissible?: boolean
  className?: string
}

export function StickyBanner({
  variant = "amber",
  title,
  description,
  actionLabel,
  onAction,
  dismissible = true,
  className,
}: StickyBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  const variantStyles = {
    rose: {
      container: "bg-rose-500/10 border-rose-500/25 text-rose-300",
      icon: <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />,
      actionBtn: "bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border-rose-500/30",
    },
    amber: {
      container: "bg-amber-500/10 border-amber-500/25 text-amber-300",
      icon: <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />,
      actionBtn: "bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-500/30",
    },
    indigo: {
      container: "bg-indigo-500/10 border-indigo-500/25 text-indigo-300",
      icon: <Info className="h-4 w-4 text-indigo-400 shrink-0" />,
      actionBtn: "bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border-indigo-500/30",
    },
    emerald: {
      container: "bg-emerald-500/10 border-emerald-500/25 text-emerald-300",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />,
      actionBtn: "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-500/30",
    },
  }[variant]

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        aria-label="System operational alert"
        className={cn(
          "w-full border-b px-4 py-2.5 flex items-center justify-between text-xs transition-colors backdrop-blur-md sticky top-0 z-40",
          variantStyles.container,
          className
        )}
      >
        <div className="flex items-center gap-2.5 max-w-5xl">
          {variantStyles.icon}
          <div className="flex flex-wrap items-center gap-x-2">
            <span className="font-semibold text-white">{title}</span>
            {description && <span className="opacity-90">{description}</span>}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer",
                variantStyles.actionBtn
              )}
            >
              {actionLabel}
            </button>
          )}
          {dismissible && (
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Dismiss banner"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}
