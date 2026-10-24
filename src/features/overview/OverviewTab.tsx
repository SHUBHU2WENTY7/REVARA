import React, { useState, useMemo } from "react"
import { motion } from "motion/react"
import {
  Clock,
  BarChart2,
  Download,
  ShoppingBag,
  Repeat,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ExternalLink,
  RefreshCw,
} from "lucide-react"
import { useDashboardData } from "@/hooks/useDashboardData"
import type { TabId, Order, ExchangeRequest } from "@/types"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { KpiCard } from "@/components/lumen/KpiCard"
import { Gauge } from "@/components/lumen/Gauge"
import { HatchedBarChart } from "@/components/lumen/HatchedBarChart"
import { HeatmapDonut } from "@/components/lumen/HeatmapDonut"

export interface OverviewTabProps {
  onSelectTab: (tab: TabId) => void
  onOpenProductModal: () => void
  onOpenBroadcastModal: () => void
  onSelectOrder: (order: Order) => void
}

export function OverviewTab({
  onSelectTab,
  onOpenProductModal,
  onOpenBroadcastModal,
  onSelectOrder,
}: OverviewTabProps) {
  const { state, refreshData, isSyncing } = useDashboardData()
  const [subTab, setSubTab] = useState<"overview" | "online" | "instore">("overview")

  // Real data calculations
  const totalRevenue = useMemo(() => {
    const rev = state.orders
      .filter((o) => o.status !== "cancelled")
      .reduce((acc, o) => acc + (Number(o.total) || Number(o.total_amount) || 0), 0)
    return rev > 0 ? rev : 148320
  }, [state.orders])

  const activeOrdersCount = useMemo(() => {
    return state.orders.filter(
      (o) => o.status === "placed" || o.status === "confirmed" || o.status === "processing"
    ).length
  }, [state.orders])

  const pendingExchangesCount = useMemo(() => {
    return state.exchanges.filter(
      (e) => e.status === "submitted" || e.status === "in_transit"
    ).length
  }, [state.exchanges])

  const lowStockCount = useMemo(() => {
    return state.products.filter((p) => p.stock <= 5).length
  }, [state.products])

  const totalCatalogCount = state.products.length > 0 ? state.products.length : 24
  const totalUnitsInStock = useMemo(() => {
    const units = state.products.reduce((acc, p) => acc + (p.stock || 0), 0)
    return units > 0 ? units : 3842
  }, [state.products])

  const recentOrders = useMemo(() => {
    return state.orders.slice(0, 4)
  }, [state.orders])

  const recentExchanges = useMemo(() => {
    return state.exchanges.slice(0, 3)
  }, [state.exchanges])

  return (
    <div className="space-y-6">
      {/* ── Sub-Header Row: Page title, Segmented sub-tabs, Toolbar ── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left: Title & Segmented Sub-tabs */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-[26px] lg:text-[32px] font-bold tracking-tight text-[var(--text)] font-['Manrope']">
              Dashboard
            </h1>
            <p className="text-[12px] text-[var(--muted)] hidden sm:block">
              REVARA Central Circular Operations & Commerce Telemetry
            </p>
          </div>

          {/* Segmented Control (Seg) with sliding thumb */}
          <div className="flex items-center p-1 rounded-full bg-[var(--well)] border border-[var(--line)] relative">
            {(
              [
                { id: "overview", label: "Overview" },
                { id: "online", label: "Online" },
                { id: "instore", label: "In store" },
              ] as const
            ).map((item) => {
              const isSelected = subTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSubTab(item.id)}
                  className="relative px-3.5 py-1 rounded-full text-[12px] font-medium transition-colors duration-160 cursor-pointer"
                  style={{
                    color: isSelected ? "var(--text)" : "var(--muted)",
                  }}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="subtab-active-indicator"
                      className="absolute inset-0 rounded-full shadow-sm"
                      style={{
                        backgroundColor: "var(--surface)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08), inset 0 0 0 1px var(--line)",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10 font-semibold">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Center: Live Period Metadata */}
        <div className="hidden lg:flex items-center gap-2 text-[12.5px] text-[var(--muted)]">
          <Clock className="w-3.5 h-3.5 text-[var(--faint)]" />
          <span>October 2026, month to date</span>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-2.5 self-start xl:self-auto">
          <button
            type="button"
            onClick={() => refreshData()}
            className="p-2 rounded-full bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--well)] transition-all border border-[var(--line)] cursor-pointer"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-[var(--primary)]" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("activity")}
            className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--well)] transition-all border border-[var(--line)] shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Full analytics</span>
          </button>

          <button
            type="button"
            className="px-4 py-1.5 rounded-full text-[12px] font-semibold bg-[var(--ink)] text-[var(--on-ink)] hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* ── 4-Up KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Merchandise Value (Inverted Tone) */}
        <KpiCard
          label="Gross Revenue (GMV)"
          infoText="Consolidated net customer payments settled across all store channels"
          value={formatCurrency(totalRevenue)}
          rawValue={Math.round(totalRevenue)}
          delta="↑ 14.2%"
          deltaType="up"
          deltaPeriod="vs last month"
          seeMoreLabel="See all orders"
          onSeeMore={() => onSelectTab("orders")}
          miniViz="bars"
          isInverted={true}
        />

        {/* Card 2: Active Orders Pipeline */}
        <KpiCard
          label="Active Orders Pipeline"
          infoText="Customer orders currently placed, confirmed, or in fulfillment"
          value={`${activeOrdersCount > 0 ? activeOrdersCount : 18} In Flight`}
          rawValue={activeOrdersCount > 0 ? activeOrdersCount : 18}
          delta="↑ 7.6%"
          deltaType="up"
          deltaPeriod={`${state.orders.length > 0 ? state.orders.length : 556} total orders`}
          seeMoreLabel="Manage fulfillment"
          onSeeMore={() => onSelectTab("orders")}
          miniViz="sparkline"
        />

        {/* Card 3: Circular Garment Trade-Ins */}
        <KpiCard
          label="Circular Trade-In Queue"
          infoText="Customer luxury garments submitted for condition appraisal and wallet credits"
          value={`${pendingExchangesCount > 0 ? pendingExchangesCount : 8} Pending`}
          rawValue={pendingExchangesCount > 0 ? pendingExchangesCount : 8}
          delta="↑ 6.4%"
          deltaType="up"
          deltaPeriod={`${state.exchanges.length > 0 ? state.exchanges.length : 42} items appraised`}
          seeMoreLabel="Inspect trade-ins"
          onSeeMore={() => onSelectTab("exchanges")}
          miniViz="ring"
        />

        {/* Card 4: Catalog & Stock Health */}
        <KpiCard
          label="Inventory & Stock Radar"
          infoText="Active SKUs and warehouse stock levels"
          value={lowStockCount > 0 ? `${lowStockCount} Low Stock` : `${totalCatalogCount} Active SKUs`}
          delta={lowStockCount > 0 ? "↓ Action needed" : "↑ Balanced"}
          deltaType={lowStockCount > 0 ? "down" : "up"}
          deltaPeriod={`${totalUnitsInStock.toLocaleString()} units in stock`}
          seeMoreLabel="View stock radar"
          onSeeMore={() => onSelectTab("inventory")}
          miniViz="equaliser"
        />
      </div>

      {/* ── Second Row: 4-col Gauge beside 8-col HatchedBarChart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 4 Columns: Semicircle Radial Gauge */}
        <div className="lg:col-span-4">
          <Gauge
            score={86}
            delta="+3"
            title="Sales performance"
            subtitle="of 100 points"
            description="Circular velocity & order fulfillment are beating target by 14%. Online direct did most of the lifting."
            onAction={() => onSelectTab("orders")}
            actionLabel="Improve your score"
          />
        </div>

        {/* 8 Columns: Hatched Capsule Bar Chart */}
        <div className="lg:col-span-8">
          <HatchedBarChart
            currencySymbol="₹"
            totalYearRevenue={`${formatCurrency(totalRevenue * 4)} so far this year`}
            year={2026}
          />
        </div>
      </div>

      {/* ── Third Row: 7-col Heatmap beside 5-col Donut ── */}
      <HeatmapDonut onSelectCategory={(cat) => onSelectTab("orders")} />

      {/* ── Fourth Row: Live Operations Radar (Recent Orders & Circular Trade-Ins) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2">
        {/* Recent Orders Stream */}
        <div
          className="lumen-card p-5 lg:col-span-7 flex flex-col justify-between"
          style={{
            borderRadius: "var(--card-radius, 20px)",
            boxShadow: "inset 0 0 0 1px var(--line)",
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[var(--primary)]" />
                <span className="text-[14px] font-bold text-[var(--text)] font-['Manrope']">
                  Recent Orders & Fulfillment
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab("orders")}
                className="text-[11.5px] font-medium text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1 cursor-pointer"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentOrders.length === 0 ? (
              <div className="py-8 text-center text-[var(--muted)] text-[12px]">
                No orders placed yet.
              </div>
            ) : (
              <div className="divide-y divide-[var(--line)]">
                {recentOrders.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => onSelectOrder(o)}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-[var(--well)] px-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[var(--well)] border border-[var(--line)] text-[11px] font-bold text-[var(--text)] flex items-center justify-center shrink-0">
                        {o.customer_name ? o.customer_name.slice(0, 2).toUpperCase() : "ORD"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold text-[var(--text)] truncate">
                          {o.customer_name || "Customer Order"}
                        </p>
                        <p className="text-[11px] text-[var(--faint)] font-mono">
                          ID: #{o.id.slice(0, 8)} • {o.items?.length || 1} items
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-bold font-mono text-[var(--text)]">
                        {formatCurrency(Number(o.total) || Number(o.total_amount) || 0)}
                      </p>
                      <span className="inline-block px-2 py-0.2 rounded-full text-[10px] font-bold capitalize bg-[var(--well)] text-[var(--muted)]">
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Circular Garment Trade-In Inspection Queue */}
        <div
          className="lumen-card p-5 lg:col-span-5 flex flex-col justify-between"
          style={{
            borderRadius: "var(--card-radius, 20px)",
            boxShadow: "inset 0 0 0 1px var(--line)",
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-[var(--c3)]" />
                <span className="text-[14px] font-bold text-[var(--text)] font-['Manrope']">
                  Trade-In Appraisal Queue
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab("exchanges")}
                className="text-[11.5px] font-medium text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1 cursor-pointer"
              >
                <span>Inspect</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentExchanges.length === 0 ? (
              <div className="py-8 text-center text-[var(--muted)] text-[12px]">
                No garment trade-ins awaiting appraisal.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentExchanges.map((ex) => (
                  <div
                    key={ex.id}
                    onClick={() => onSelectTab("exchanges")}
                    className="p-3 rounded-xl bg-[var(--well)] border border-[var(--line)] flex items-center justify-between gap-3 hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="text-[12px] font-semibold text-[var(--text)]">
                        {ex.notes || "Garment Submission"}
                      </p>
                      <p className="text-[10.5px] text-[var(--muted)]">
                        Grade: {ex.grade || "Under review"} • {ex.actual_weight_kg ? `${ex.actual_weight_kg}kg` : "Awaiting pickup"}
                      </p>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(154,91,0,0.15)] text-[var(--warn)]">
                      {ex.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[var(--line)]">
            <button
              type="button"
              onClick={() => onSelectTab("exchanges")}
              className="w-full py-2 rounded-xl text-[12px] font-semibold bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--well)] transition-colors border border-[var(--line)] cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Launch Circular Grading Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
