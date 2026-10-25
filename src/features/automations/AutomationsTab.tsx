import React, { useState } from "react"
import { motion } from "motion/react"
import {
  Zap,
  Mail,
  Clock,
  Filter,
  CheckCircle2,
  Tag,
  Plus,
  ArrowRight,
  ExternalLink,
} from "lucide-react"
import { KpiCard } from "@/components/lumen/KpiCard"

interface AutomationItem {
  id: string
  title: string
  description: string
  active: boolean
  nodes: { icon: "zap" | "mail" | "clock" | "filter" | "check" | "tag"; label?: string }[]
  runs30Days: string
  conversion: string
  edited: string
}

const AUTOMATIONS_DATA: AutomationItem[] = [
  {
    id: "1",
    title: "Abandoned cart",
    description: "Remind shoppers who leave items in their cart.",
    active: true,
    nodes: [
      { icon: "zap" },
      { icon: "mail" },
      { icon: "clock" },
      { icon: "filter" },
      { icon: "mail" },
    ],
    runs30Days: "1,284",
    conversion: "14.2%",
    edited: "3 days ago",
  },
  {
    id: "2",
    title: "Welcome series",
    description: "Three emails over a week for new subscribers.",
    active: true,
    nodes: [
      { icon: "zap" },
      { icon: "mail" },
      { icon: "clock" },
      { icon: "mail" },
      { icon: "clock" },
      { icon: "mail" },
    ],
    runs30Days: "940",
    conversion: "8.7%",
    edited: "12 days ago",
  },
  {
    id: "3",
    title: "Low stock alert",
    description: "Ping fulfilment and raise a purchase task.",
    active: true,
    nodes: [
      { icon: "zap" },
      { icon: "check" },
      { icon: "tag" },
    ],
    runs30Days: "23",
    conversion: "—",
    edited: "Sep 24",
  },
  {
    id: "4",
    title: "VIP thank-you",
    description: "A handwritten-style note after a 5th order.",
    active: false,
    nodes: [
      { icon: "zap" },
      { icon: "clock" },
      { icon: "mail" },
    ],
    runs30Days: "180",
    conversion: "21.4%",
    edited: "Oct 2",
  },
  {
    id: "5",
    title: "Review request",
    description: "Ask for a review a week after delivery.",
    active: true,
    nodes: [
      { icon: "zap" },
      { icon: "clock" },
      { icon: "mail" },
      { icon: "check" },
    ],
    runs30Days: "332",
    conversion: "18.0%",
    edited: "Oct 8",
  },
]

export function AutomationsTab() {
  const [activeSubTab, setActiveSubTab] = useState<"automations" | "integrations">("automations")
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all")
  const [automations, setAutomations] = useState<AutomationItem[]>(AUTOMATIONS_DATA)

  const toggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    )
  }

  const filteredAutomations = automations.filter((a) => {
    if (filter === "active") return a.active
    if (filter === "paused") return !a.active
    return true
  })

  const renderIcon = (type: string) => {
    const cls = "w-3 h-3 text-[var(--muted)]"
    switch (type) {
      case "zap":
        return <Zap className={cls} />
      case "mail":
        return <Mail className={cls} />
      case "clock":
        return <Clock className={cls} />
      case "filter":
        return <Filter className={cls} />
      case "check":
        return <CheckCircle2 className={cls} />
      case "tag":
        return <Tag className={cls} />
      default:
        return <Zap className={cls} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[26px] lg:text-[30px] font-bold tracking-tight text-[var(--text)] font-['Manrope']">
            Automations
          </h1>

          {/* Sub-tabs: Automations & Integrations */}
          <div className="flex items-center p-1 rounded-full bg-[var(--well)] border border-[var(--line)]">
            <button
              type="button"
              onClick={() => setActiveSubTab("automations")}
              className={`px-3.5 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer ${
                activeSubTab === "automations"
                  ? "bg-[var(--surface)] text-[var(--text)] font-semibold shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              Automations
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("integrations")}
              className={`px-3.5 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer ${
                activeSubTab === "integrations"
                  ? "bg-[var(--surface)] text-[var(--text)] font-semibold shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              Integrations
            </button>
          </div>
        </div>

        {/* Live count & + New Automation */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--line)] bg-[var(--well)] text-[12px] font-medium text-[var(--text)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--up)] animate-pulse" />
            <span>1,441 live now</span>
          </div>

          <button
            type="button"
            className="px-4 py-1.5 rounded-full text-[12px] font-semibold bg-[var(--ink)] text-[var(--on-ink)] hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New automation</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-2">
        {(["all", "active", "paused"] as const).map((chip) => {
          const isSelected = filter === chip
          return (
            <button
              key={chip}
              type="button"
              onClick={() => setFilter(chip)}
              className={`px-3.5 py-1 rounded-full text-[12px] font-medium capitalize transition-all cursor-pointer ${
                isSelected
                  ? "bg-[var(--surface-2)] text-[var(--text)] font-bold border border-[var(--line-2)] shadow-sm"
                  : "bg-[var(--well)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--line)]"
              }`}
            >
              {chip}
            </button>
          )
        })}
      </div>

      {/* 4-up KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Inverted Hero Card */}
        <KpiCard
          label="Active automations"
          value="4"
          rawValue={4}
          deltaPeriod="of 5 automations"
          isInverted={true}
          miniViz="bars"
        />

        <KpiCard
          label="Runs in 30 days"
          value="2,759"
          rawValue={2759}
          delta="↑ 11.8%"
          deltaType="up"
          deltaPeriod="vs last 30 days"
          miniViz="sparkline"
        />

        <KpiCard
          label="Revenue influenced"
          value="$26,554"
          rawValue={26554}
          prefix="$"
          delta="↑ 9.4%"
          deltaType="up"
          deltaPeriod="from automated emails"
          miniViz="ring"
        />

        <KpiCard
          label="Conversions"
          value="374"
          rawValue={374}
          deltaPeriod="13.6% of runs ended in an order"
          miniViz="equaliser"
        />
      </div>

      {/* Automation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAutomations.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="lumen-card p-5 flex flex-col justify-between"
            style={{
              borderRadius: "var(--card-radius, 20px)",
              boxShadow: "inset 0 0 0 1px var(--line)",
            }}
          >
            <div>
              {/* Header: Title, Description & Toggle Switch */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-[14px] font-bold text-[var(--text)]">{item.title}</h3>
                  <p className="text-[11.5px] text-[var(--muted)] mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Spring Switch */}
                <button
                  type="button"
                  onClick={() => toggleAutomation(item.id)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-160 cursor-pointer relative shrink-0 ${
                    item.active ? "bg-[var(--text)]" : "bg-[var(--well)]"
                  }`}
                  style={{
                    boxShadow: "inset 0 0 0 1px var(--line)",
                  }}
                >
                  <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="w-4 h-4 rounded-full shadow-sm"
                    style={{
                      backgroundColor: item.active ? "var(--surface)" : "var(--muted)",
                      marginLeft: item.active ? "auto" : "0",
                    }}
                  />
                </button>
              </div>

              {/* Connected Flow Nodes Diagram */}
              <div className="my-5 p-3 rounded-xl bg-[var(--well)] border border-[var(--line)]">
                <div className="flex items-center justify-between relative">
                  {/* Joining line */}
                  <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-0.5 bg-[var(--line-2)] -z-0" />

                  {item.nodes.map((node, nIdx) => (
                    <div
                      key={nIdx}
                      className="w-6 h-6 rounded-lg bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center relative z-10 shadow-xs"
                      title={node.icon}
                    >
                      {renderIcon(node.icon)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 pb-3">
                <div>
                  <span className="text-[var(--faint)] block">Runs, 30 days</span>
                  <span className="font-mono font-bold text-[var(--text)] text-[12px]">
                    {item.runs30Days}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--faint)] block">Conversion</span>
                  <span className="font-mono font-bold text-[var(--text)] text-[12px]">
                    {item.conversion}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--faint)] block">Edited</span>
                  <span className="text-[var(--muted)] font-medium text-[11px]">
                    {item.edited}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Status Pill & Builder Link */}
            <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  item.active
                    ? "bg-[rgba(11,122,92,0.12)] text-[var(--up)]"
                    : "bg-[var(--well)] text-[var(--muted)]"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    item.active ? "bg-[var(--up)]" : "bg-[var(--muted)]"
                  }`}
                />
                <span>{item.active ? "Active" : "Paused"}</span>
              </span>

              <button
                type="button"
                className="text-[11.5px] font-medium text-[var(--text)] hover:underline cursor-pointer"
              >
                Open builder
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
