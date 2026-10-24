import React, { useEffect, useState, useRef } from "react"
import { motion, useInView } from "motion/react"
import { Info, ArrowUpRight } from "lucide-react"

export interface GaugeProps {
  score?: number
  maxScore?: number
  delta?: string
  title?: string
  subtitle?: string
  description?: string
  onAction?: () => void
  actionLabel?: string
}

export function Gauge({
  score = 86,
  maxScore = 100,
  delta = "+3",
  title = "Sales performance",
  subtitle = "of 100 points",
  description = "Both channels beat last month. Online did most of the lifting.",
  onAction,
  actionLabel = "Improve your score",
}: GaugeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.4 })
  const [animatedScore, setAnimatedScore] = useState(0)
  const [progress, setProgress] = useState(0) // 0 to 1

  const percentage = Math.min(Math.max(score / maxScore, 0), 1)

  useEffect(() => {
    if (!isInView) return

    let startTime: number | null = null
    const duration = 1100 // 1100ms ease-out

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const p = Math.min((timestamp - startTime) / duration, 1)
      // cubic-bezier(.22, 1, .36, 1) approximation
      const eased = 1 - Math.pow(1 - p, 3)

      setProgress(eased * percentage)
      setAnimatedScore(Math.round(eased * score))

      if (p < 1) {
        requestAnimationFrame(step)
      } else {
        setProgress(percentage)
        setAnimatedScore(score)
      }
    }

    const frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [isInView, score, percentage])

  // Semicircle geometry
  // Center: (150, 130), Radius: 100, Angle: 180 deg to 0 deg
  const cx = 150
  const cy = 130
  const r = 90
  const arcLength = Math.PI * r // semicircle circumference ~ 282.74

  // Knob position calculation based on progress
  // Angle starts at Math.PI (left, 180 deg) and goes to 0 (right)
  const currentAngle = Math.PI - progress * Math.PI
  const knobX = cx + r * Math.cos(currentAngle)
  const knobY = cy - r * Math.sin(currentAngle)

  // 40 radial ticks
  const totalTicks = 40
  const activeTicksCount = Math.floor(progress * totalTicks)

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="lumen-card p-6 flex flex-col justify-between select-none"
      style={{
        borderRadius: "var(--card-radius, 20px)",
        boxShadow: "inset 0 0 0 1px var(--line)",
      }}
    >
      <div>
        {/* Card Header */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[13px] font-semibold text-[var(--text)]">{title}</span>
          <button type="button" className="opacity-50 hover:opacity-100 transition-opacity" title={title}>
            <Info className="w-3.5 h-3.5 text-[var(--muted)]" />
          </button>
        </div>

        {/* Semicircle Gauge Visualization */}
        <div className="relative w-full flex items-center justify-center pt-2">
          <svg viewBox="0 0 300 160" className="w-full max-w-[280px] overflow-visible">
            {/* Background Arc */}
            <path
              d="M 60,130 A 90,90 0 0,1 240,130"
              fill="none"
              stroke="var(--well)"
              strokeWidth="12"
              strokeLinecap="round"
            />

            {/* 40 Radial Ticks */}
            {Array.from({ length: totalTicks }).map((_, i) => {
              const tickFraction = i / (totalTicks - 1)
              const tickAngle = Math.PI - tickFraction * Math.PI
              const innerR = 70
              const outerR = 76
              const x1 = cx + innerR * Math.cos(tickAngle)
              const y1 = cy - innerR * Math.sin(tickAngle)
              const x2 = cx + outerR * Math.cos(tickAngle)
              const y2 = cy - outerR * Math.sin(tickAngle)

              const isActive = i <= activeTicksCount

              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isActive ? "var(--text)" : "var(--line-2)"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="transition-colors duration-150"
                  style={{
                    opacity: isActive ? 0.9 : 0.35,
                  }}
                />
              )
            })}

            {/* Active Sweeping Gradient Arc */}
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="var(--text)" stopOpacity="1" />
              </linearGradient>
            </defs>

            <path
              d="M 60,130 A 90,90 0 0,1 240,130"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={arcLength}
              strokeDashoffset={arcLength * (1 - progress)}
            />

            {/* Glowing Knob riding the end of the arc */}
            {progress > 0.01 && (
              <g transform={`translate(${knobX}, ${knobY})`}>
                <circle r="9" fill="var(--surface)" stroke="var(--text)" strokeWidth="3.5" />
                <circle r="4" fill="var(--text)" />
              </g>
            )}

            {/* Central Score readout */}
            <g transform="translate(150, 115)">
              <text
                textAnchor="middle"
                className="font-bold font-['Manrope'] tabular-nums tracking-tight"
                fill="var(--text)"
                fontSize="38"
                dy="0"
              >
                {animatedScore}
              </text>
            </g>
          </svg>

          {/* Delta badge overlaid below number */}
          <div className="absolute bottom-2 flex flex-col items-center">
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-[rgba(11,122,92,0.15)] text-[var(--up)]">
                <ArrowUpRight className="w-3 h-3 stroke-[3]" />
                {delta}
              </span>
            </div>
            <span className="text-[11px] text-[var(--muted)] font-medium mt-0.5">{subtitle}</span>
          </div>
        </div>

        {/* Narrative section */}
        <div className="mt-5 space-y-1">
          <p className="text-[13px] font-semibold text-[var(--text)]">Ahead of plan</p>
          <p className="text-[12px] text-[var(--muted)] leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Bottom Link */}
      <div className="pt-4 mt-4 border-t border-[var(--line)]">
        <button
          type="button"
          onClick={onAction}
          className="text-[12px] font-medium text-[var(--text)] hover:underline cursor-pointer"
        >
          {actionLabel}
        </button>
      </div>
    </motion.div>
  )
}
