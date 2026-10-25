import React, { useEffect, useState, useRef } from "react"
import { motion, useInView } from "motion/react"
import { Info, ArrowUpRight, ArrowDownRight } from "lucide-react"

export interface KpiCardProps {
  label: string
  infoText?: string
  value: string
  rawValue?: number
  prefix?: string
  suffix?: string
  delta?: string
  deltaType?: "up" | "down" | "neutral"
  deltaPeriod?: string
  seeMoreLabel?: string
  onSeeMore?: () => void
  miniViz?: "bars" | "sparkline" | "ring" | "equaliser"
  isInverted?: boolean
  className?: string
}

export function KpiCard({
  label,
  infoText,
  value,
  rawValue,
  prefix = "",
  suffix = "",
  delta,
  deltaType = "up",
  deltaPeriod = "vs last month",
  seeMoreLabel,
  onSeeMore,
  miniViz = "bars",
  isInverted = false,
  className = "",
}: KpiCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.4 })
  const [displayNum, setDisplayNum] = useState<number | null>(null)

  // Animated count-up numeral for numbers
  useEffect(() => {
    if (!isInView || rawValue === undefined) return

    let startTime: number | null = null
    const duration = 900 // 900ms ease-out

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      // Ease out cubic: 1 - Math.pow(1 - progress, 3)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setDisplayNum(Math.round(rawValue * easeOut))

      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        setDisplayNum(rawValue)
      }
    }

    const frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [isInView, rawValue])

  const formattedNumeral =
    rawValue !== undefined && displayNum !== null
      ? `${prefix}${displayNum.toLocaleString()}${suffix}`
      : value

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className={`lumen-card p-5 relative overflow-hidden flex flex-col justify-between select-none ${
        isInverted ? "kpi-card-inverted" : ""
      } ${className}`}
      style={{
        borderRadius: "var(--card-radius, 20px)",
        boxShadow: "inset 0 0 0 1px var(--line)",
      }}
    >
      {/* Top Header Row: Label & Info Icon */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <span
            className="text-[12px] font-medium tracking-tight"
            style={{
              color: isInverted ? "currentColor" : "var(--muted)",
              opacity: isInverted ? 0.75 : 1,
            }}
          >
            {label}
          </span>
          <button
            type="button"
            className="opacity-50 hover:opacity-100 transition-opacity"
            title={infoText || label}
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hero Numeral & Mini-Viz row */}
        <div className="flex items-center justify-between gap-3">
          <div
            className="text-[28px] lg:text-[34px] font-bold tracking-[-0.03em] tabular-nums font-['Manrope']"
            style={{
              color: isInverted ? "currentColor" : "var(--text)",
              lineHeight: 1.1,
            }}
          >
            {formattedNumeral}
          </div>

          {/* Mini-viz representation */}
          <div className="flex items-center justify-end">
            {miniViz === "bars" && (
              <div className="flex items-end gap-1 h-9 px-1">
                <span
                  className="w-2 rounded-full transition-all"
                  style={{
                    height: "45%",
                    background: isInverted ? "rgba(255,255,255,0.4)" : "var(--well)",
                  }}
                />
                <span
                  className="w-2 rounded-full transition-all"
                  style={{
                    height: "70%",
                    background: isInverted ? "rgba(255,255,255,0.6)" : "var(--well)",
                  }}
                />
                <span
                  className="w-2 rounded-full transition-all"
                  style={{
                    height: "100%",
                    background: isInverted ? "#FFFFFF" : "var(--primary)",
                  }}
                />
                <span
                  className="w-2 rounded-full transition-all"
                  style={{
                    height: "85%",
                    background: isInverted ? "#FFFFFF" : "var(--primary)",
                  }}
                />
              </div>
            )}

            {miniViz === "sparkline" && (
              <svg className="w-16 h-8 overflow-visible" viewBox="0 0 64 32">
                <defs>
                  <linearGradient id={`sparkGrad-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={isInverted ? "#FFFFFF" : "var(--primary)"}
                      stopOpacity="0.3"
                    />
                    <stop
                      offset="100%"
                      stopColor={isInverted ? "#FFFFFF" : "var(--primary)"}
                      stopOpacity="0.0"
                    />
                  </linearGradient>
                </defs>
                <path
                  d="M 2,24 Q 16,26 28,14 T 48,16 T 62,6 L 62,32 L 2,32 Z"
                  fill={`url(#sparkGrad-${label})`}
                />
                <path
                  d="M 2,24 Q 16,26 28,14 T 48,16 T 62,6"
                  fill="none"
                  stroke={isInverted ? "#FFFFFF" : "var(--primary)"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="62"
                  cy="6"
                  r="2.5"
                  fill={isInverted ? "#FFFFFF" : "var(--primary)"}
                />
              </svg>
            )}

            {miniViz === "ring" && (
              <div className="relative w-8 h-8 flex items-center justify-center">
                <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke={isInverted ? "rgba(255,255,255,0.2)" : "var(--well)"}
                    strokeWidth="3.5"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke={isInverted ? "#FFFFFF" : "var(--text)"}
                    strokeWidth="3.5"
                    strokeDasharray="88"
                    strokeDashoffset="24"
                    strokeLinecap="round"
                  />
                </svg>
                <span
                  className="absolute text-[8.5px] font-bold"
                  style={{ color: isInverted ? "currentColor" : "var(--text)" }}
                >
                  77%
                </span>
              </div>
            )}

            {miniViz === "equaliser" && (
              <div className="flex items-end gap-[3px] h-8">
                {[40, 60, 50, 75, 90, 100, 65, 80].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 rounded-full"
                    style={{
                      height: `${h}%`,
                      background: isInverted
                        ? i >= 5 ? "#FFFFFF" : "rgba(255,255,255,0.3)"
                        : i >= 5 ? "var(--primary)" : "var(--well)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delta row */}
        {delta && (
          <div className="flex items-center gap-2 mt-2">
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-semibold"
              style={{
                background:
                  deltaType === "up"
                    ? "rgba(11, 122, 92, 0.12)"
                    : deltaType === "down"
                    ? "rgba(194, 45, 52, 0.12)"
                    : "rgba(154, 91, 0, 0.12)",
                color:
                  deltaType === "up"
                    ? "var(--up)"
                    : deltaType === "down"
                    ? "var(--down)"
                    : "var(--warn)",
              }}
            >
              {deltaType === "up" ? (
                <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
              ) : deltaType === "down" ? (
                <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
              ) : null}
              {delta}
            </span>
            <span
              className="text-[11px]"
              style={{
                color: isInverted ? "currentColor" : "var(--faint)",
                opacity: isInverted ? 0.7 : 1,
              }}
            >
              {deltaPeriod}
            </span>
          </div>
        )}
      </div>

      {/* Bottom See More Link */}
      {seeMoreLabel && (
        <div
          className="pt-4 mt-3 border-t text-[11.5px] font-medium"
          style={{
            borderColor: isInverted ? "rgba(255,255,255,0.15)" : "var(--line)",
          }}
        >
          <button
            type="button"
            onClick={onSeeMore}
            className="hover:underline transition-all cursor-pointer font-medium"
            style={{
              color: isInverted ? "currentColor" : "var(--text)",
            }}
          >
            {seeMoreLabel}
          </button>
        </div>
      )}
    </motion.div>
  )
}
