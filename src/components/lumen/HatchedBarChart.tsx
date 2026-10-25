import React, { useState, useRef, useMemo } from "react"
import { motion, useInView } from "motion/react"
import { Info } from "lucide-react"

export interface MonthData {
  month: string // "Jan", "Feb", etc.
  revenue: number
  orders: number
  vsLastYear: string
  isForecast?: boolean
}

export interface HatchedBarChartProps {
  data?: MonthData[]
  currencySymbol?: string
  totalYearRevenue?: string
  year?: number
  onYearChange?: (year: number) => void
}

const DEFAULT_DATA: MonthData[] = [
  { month: "Jan", revenue: 14200, orders: 210, vsLastYear: "+12.4%" },
  { month: "Feb", revenue: 18500, orders: 280, vsLastYear: "+14.1%" },
  { month: "Mar", revenue: 22000, orders: 340, vsLastYear: "+18.2%" },
  { month: "Apr", revenue: 26100, orders: 410, vsLastYear: "+21.0%" },
  { month: "May", revenue: 31000, orders: 460, vsLastYear: "+24.5%" },
  { month: "Jun", revenue: 38200, orders: 530, vsLastYear: "+28.1%" },
  { month: "Jul", revenue: 34500, orders: 490, vsLastYear: "+22.4%" },
  { month: "Aug", revenue: 33100, orders: 470, vsLastYear: "+19.8%" },
  { month: "Sep", revenue: 36800, orders: 512, vsLastYear: "+25.3%" },
  { month: "Oct", revenue: 39500, orders: 556, vsLastYear: "+29.5%" }, // current selected
  { month: "Nov", revenue: 44000, orders: 620, vsLastYear: "+32.0%", isForecast: true },
  { month: "Dec", revenue: 52000, orders: 740, vsLastYear: "+38.4%", isForecast: true },
]

export function HatchedBarChart({
  data = DEFAULT_DATA,
  currencySymbol = "$",
  totalYearRevenue = "$300,000 so far this year",
  year = 2026,
  onYearChange,
}: HatchedBarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.3 })
  const [selectedYear, setSelectedYear] = useState(year)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(9) // default to Oct (index 9)

  const maxVal = 60000
  const avgVal = 30000

  const yTicks = [60000, 45000, 30000, 15000, 0]

  const activeItem = hoveredIndex !== null ? data[hoveredIndex] : data[9]

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="lumen-card p-6 select-none relative flex flex-col justify-between"
      style={{
        borderRadius: "var(--card-radius, 20px)",
        boxShadow: "inset 0 0 0 1px var(--line)",
      }}
    >
      {/* Header Row: Title & Year Switcher */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-[var(--text)]">Revenue</span>
          <button type="button" className="opacity-50 hover:opacity-100 transition-opacity" title="Revenue telemetry">
            <Info className="w-3.5 h-3.5 text-[var(--muted)]" />
          </button>
          <span className="text-[13px] text-[var(--muted)] ml-1 hidden sm:inline">
            {totalYearRevenue}
          </span>
        </div>

        {/* Year segmented toggle */}
        <div className="flex items-center p-1 rounded-full bg-[var(--well)] border border-[var(--line)]">
          {[2025, 2026].map((yr) => {
            const isSelected = selectedYear === yr
            return (
              <button
                key={yr}
                type="button"
                onClick={() => {
                  setSelectedYear(yr)
                  onYearChange?.(yr)
                }}
                className={`px-3 py-0.5 rounded-full text-[12px] font-medium transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-[var(--surface)] text-[var(--text)] shadow-sm font-semibold"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                {yr}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="relative w-full h-64 flex">
        {/* Y-Axis Labels */}
        <div className="flex flex-col justify-between h-48 text-[11px] font-mono text-[var(--faint)] pr-3 text-right w-10 shrink-0">
          {yTicks.map((tick) => (
            <span key={tick}>
              {tick === 0 ? "$0" : `$${tick / 1000}k`}
            </span>
          ))}
        </div>

        {/* Chart Stage */}
        <div className="relative flex-1 h-48 border-b border-[var(--line)]">
          {/* Horizontal Grid lines */}
          {yTicks.map((tick) => {
            const bottomPercent = (tick / maxVal) * 100
            return (
              <div
                key={tick}
                className="absolute left-0 right-0 border-b border-[var(--line)] pointer-events-none opacity-40"
                style={{ bottom: `${bottomPercent}%` }}
              />
            )
          })}

          {/* Dashed Average Line at $30k */}
          <div
            className="absolute left-0 right-0 border-b-2 border-dashed border-[var(--faint)] pointer-events-none opacity-60 z-0 flex justify-end pr-2"
            style={{ bottom: `${(avgVal / maxVal) * 100}%` }}
          >
            <span className="text-[10.5px] font-mono font-medium text-[var(--faint)] bg-[var(--surface)] px-1 -mt-2.5">
              avg $30k
            </span>
          </div>

          {/* 12 Capsule Columns */}
          <div className="absolute inset-0 flex items-end justify-between px-2 gap-2">
            {data.map((item, idx) => {
              const heightPercent = Math.min((item.revenue / maxVal) * 100, 100)
              const isHovered = hoveredIndex === idx
              const isSelected = idx === 9 // Oct is the active default

              return (
                <div
                  key={item.month}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  className="flex-1 h-full flex flex-col justify-end items-center relative group cursor-pointer"
                >
                  {/* The Capsule Bar */}
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
                    transition={{
                      duration: 0.52,
                      delay: idx * 0.04,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{
                      height: `${heightPercent}%`,
                      transformOrigin: "bottom",
                    }}
                    className={`w-full max-w-[28px] rounded-full relative transition-all duration-200 ${
                      item.isForecast
                        ? "border-2 border-dashed border-[var(--faint)] opacity-60 bg-[var(--well)]"
                        : isHovered || isSelected
                        ? "shadow-lg"
                        : "hatched-bar bg-[var(--well)]"
                    }`}
                  >
                    {/* Selected / Hovered Bar Gradient Fill & White Cap */}
                    {(isHovered || (hoveredIndex === null && isSelected)) && !item.isForecast && (
                      <div
                        className="absolute inset-0 rounded-full overflow-hidden"
                        style={{
                          background: "linear-gradient(180deg, var(--text) 0%, rgba(30,30,35,0.7) 100%)",
                        }}
                      >
                        {/* Glowing white cap at the top */}
                        <div className="w-full h-2 rounded-t-full bg-white opacity-90 shadow-sm" />
                      </div>
                    )}
                  </motion.div>
                </div>
              )
            })}
          </div>

          {/* Floating Tooltip Card */}
          {activeItem && hoveredIndex !== null && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16 }}
              className="absolute z-20 pointer-events-none rounded-xl p-3 shadow-xl backdrop-blur-md"
              style={{
                left: `${Math.min(Math.max((hoveredIndex / 11) * 88, 10), 75)}%`,
                bottom: `${Math.min((activeItem.revenue / maxVal) * 100 + 15, 80)}%`,
                background: "var(--ink)",
                color: "var(--on-ink)",
                minWidth: "140px",
                boxShadow: "0 16px 40px -12px rgba(0,0,0,.45)",
              }}
            >
              <p className="text-[11px] font-semibold opacity-75 mb-1.5">
                {activeItem.month} {selectedYear}
              </p>
              <div className="flex items-center justify-between text-[12px] mb-1">
                <span className="opacity-75">Revenue</span>
                <span className="font-bold font-mono">
                  {currencySymbol}
                  {activeItem.revenue.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-[12px] mb-1">
                <span className="opacity-75">Orders</span>
                <span className="font-bold font-mono">{activeItem.orders}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/10">
                <span className="opacity-75">vs last year</span>
                <span className="font-bold text-[var(--up)]">{activeItem.vsLastYear}</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* X-Axis Month Labels */}
      <div className="flex pl-10 pr-2 pt-2 justify-between">
        {data.map((item, idx) => (
          <span
            key={item.month}
            className={`text-[11px] font-medium transition-colors cursor-pointer ${
              hoveredIndex === idx || (hoveredIndex === null && idx === 9)
                ? "text-[var(--text)] font-bold"
                : "text-[var(--faint)]"
            }`}
          >
            {item.month}
          </span>
        ))}
      </div>
    </motion.div>
  )
}
