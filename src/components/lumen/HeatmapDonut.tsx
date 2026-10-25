import React, { useState, useRef } from "react"
import { motion, useInView } from "motion/react"
import { Info } from "lucide-react"

export interface HeatmapDonutProps {
  onSelectCategory?: (category: string) => void
}

interface Segment {
  name: string
  value: number
  color: string
  percentage: number
}

const DONUT_SEGMENTS: Segment[] = [
  { name: "Online Direct", value: 48, color: "var(--c1)", percentage: 48 },
  { name: "In-store Retail", value: 27, color: "var(--c2)", percentage: 27 },
  { name: "Trade-In Credits", value: 15, color: "var(--c3)", percentage: 15 },
  { name: "Wholesale", value: 10, color: "var(--c4)", percentage: 10 },
]

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const HOURS = ["9am", "12pm", "3pm", "6pm", "9pm"]

// 7 columns of 5 hourly rounded cells
const HEATMAP_MATRIX = [
  [12, 28, 45, 60, 30],
  [15, 34, 52, 70, 42],
  [18, 40, 68, 85, 55],
  [22, 45, 75, 92, 60], // Hot cell at Fri 6pm (92)
  [30, 65, 88, 98, 75], // Peak Fri/Sat
  [25, 60, 80, 90, 70],
  [14, 30, 50, 65, 35],
]

export function HeatmapDonut({ onSelectCategory }: HeatmapDonutProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)
  const [hoveredCell, setHoveredCell] = useState<{ day: string; hour: string; val: number } | null>(null)

  return (
    <div ref={ref} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 7 Columns: Heatmap Activity */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={{ duration: 0.42, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
        className="lumen-card p-6 lg:col-span-7 flex flex-col justify-between select-none"
        style={{
          borderRadius: "var(--card-radius, 20px)",
          boxShadow: "inset 0 0 0 1px var(--line)",
        }}
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-[var(--text)]">Store Activity Heatmap</span>
              <button type="button" className="opacity-50 hover:opacity-100 transition-opacity" title="Hourly store volume">
                <Info className="w-3.5 h-3.5 text-[var(--muted)]" />
              </button>
            </div>
            <span className="text-[12px] text-[var(--muted)]">Peak at 6:00 PM Friday</span>
          </div>

          {/* Heatmap Grid */}
          <div className="space-y-2 mt-4">
            {/* Hour headers */}
            <div className="grid grid-cols-8 gap-2 text-[11px] font-mono text-[var(--faint)] text-center">
              <div />
              {HOURS.map((hr) => (
                <div key={hr} className="truncate">{hr}</div>
              ))}
              <div className="col-span-2 text-right pr-2">Peak</div>
            </div>

            {/* 7 Day rows */}
            {DAYS.map((day, colIdx) => (
              <div key={day} className="grid grid-cols-8 gap-2 items-center">
                <span className="text-[11px] font-medium text-[var(--muted)]">{day}</span>
                {HEATMAP_MATRIX[colIdx].map((val, rowIdx) => {
                  const isHot = val >= 95
                  const intensity = val / 100

                  return (
                    <motion.div
                      key={rowIdx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                      transition={{
                        duration: 0.3,
                        delay: (colIdx + rowIdx) * 0.018, // diagonal wave
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      onMouseEnter={() =>
                        setHoveredCell({ day, hour: HOURS[rowIdx], val })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`h-7 rounded-lg transition-transform duration-150 cursor-pointer relative ${
                        isHot ? "ring-2 ring-[var(--primary)] ring-offset-1 ring-offset-[var(--surface)]" : ""
                      }`}
                      style={{
                        backgroundColor: "var(--primary)",
                        opacity: Math.max(intensity, 0.12),
                      }}
                    />
                  )
                })}
                <div className="col-span-2 text-right pr-2 text-[11px] font-mono text-[var(--muted)]">
                  {Math.max(...HEATMAP_MATRIX[colIdx])} orders
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hovered cell info or legend */}
        <div className="pt-4 mt-4 border-t border-[var(--line)] flex items-center justify-between text-[11.5px] text-[var(--faint)]">
          <span>{hoveredCell ? `${hoveredCell.day} at ${hoveredCell.hour}: ${hoveredCell.val} shoppers/hr` : "Hover cells to view volume"}</span>
          <div className="flex items-center gap-1.5">
            <span>Low</span>
            <span className="w-2.5 h-2.5 rounded bg-[var(--primary)] opacity-20" />
            <span className="w-2.5 h-2.5 rounded bg-[var(--primary)] opacity-60" />
            <span className="w-2.5 h-2.5 rounded bg-[var(--primary)] opacity-100" />
            <span>High</span>
          </div>
        </div>
      </motion.div>

      {/* 5 Columns: Sales Channel Donut */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={{ duration: 0.42, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="lumen-card p-6 lg:col-span-5 flex flex-col justify-between select-none"
        style={{
          borderRadius: "var(--card-radius, 20px)",
          boxShadow: "inset 0 0 0 1px var(--line)",
        }}
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-[var(--text)]">Channel Attribution</span>
              <button type="button" className="opacity-50 hover:opacity-100 transition-opacity" title="Attribution breakdown">
                <Info className="w-3.5 h-3.5 text-[var(--muted)]" />
              </button>
            </div>
          </div>

          {/* Donut representation */}
          <div className="relative flex items-center justify-center my-3">
            <svg viewBox="0 0 160 160" className="w-40 h-40">
              {DONUT_SEGMENTS.map((seg, idx) => {
                // Circumference ~ 376.99 (radius 60)
                const c = 2 * Math.PI * 60
                const strokeDash = (seg.percentage / 100) * c
                const strokeOffset = DONUT_SEGMENTS.slice(0, idx).reduce(
                  (acc, s) => acc - (s.percentage / 100) * c,
                  0
                )
                const isDimmed = hoveredSegment && hoveredSegment !== seg.name

                return (
                  <motion.circle
                    key={seg.name}
                    cx="80"
                    cy="80"
                    r="60"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="18"
                    strokeDasharray={`${strokeDash} ${c - strokeDash}`}
                    strokeDashoffset={strokeOffset}
                    initial={{ strokeDashoffset: c }}
                    animate={isInView ? { strokeDashoffset: strokeOffset } : { strokeDashoffset: c }}
                    transition={{
                      duration: 0.8,
                      delay: idx * 0.08,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{
                      opacity: isDimmed ? 0.42 : 1,
                      transition: "opacity 200ms ease",
                    }}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredSegment(seg.name)}
                    onMouseLeave={() => setHoveredSegment(null)}
                  />
                )
              })}
            </svg>

            {/* Donut Hole Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[20px] font-bold font-['Manrope'] text-[var(--text)]">
                {hoveredSegment
                  ? `${DONUT_SEGMENTS.find((s) => s.name === hoveredSegment)?.percentage}%`
                  : "100%"}
              </span>
              <span className="text-[10px] text-[var(--muted)] font-medium">
                {hoveredSegment || "Gross Sales"}
              </span>
            </div>
          </div>

          {/* Interactive Legend that dims other segments to 42% on hover */}
          <div className="space-y-2 mt-4">
            {DONUT_SEGMENTS.map((seg) => {
              const isHovered = hoveredSegment === seg.name
              const isDimmed = hoveredSegment && !isHovered

              return (
                <div
                  key={seg.name}
                  onMouseEnter={() => setHoveredSegment(seg.name)}
                  onMouseLeave={() => setHoveredSegment(null)}
                  onClick={() => onSelectCategory?.(seg.name)}
                  className={`flex items-center justify-between p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                    isHovered ? "bg-[var(--well)]" : ""
                  }`}
                  style={{ opacity: isDimmed ? 0.42 : 1 }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="text-[12px] font-medium text-[var(--text)]">{seg.name}</span>
                  </div>
                  <span className="text-[12px] font-mono font-semibold text-[var(--text)]">
                    {seg.percentage}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--line)] text-right">
          <span className="text-[11px] text-[var(--faint)]">All revenue streams fully reconciled</span>
        </div>
      </motion.div>
    </div>
  )
}
