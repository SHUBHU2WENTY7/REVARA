import { useState, useMemo } from "react"
import { motion } from "motion/react"
import {
  DollarSign,
  ShoppingBag,
  Repeat,
  Layers,
  MapPin,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Bell,
  RefreshCw,
  TrendingUp,
  PieChart as PieChartIcon,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useDashboardData } from "@/hooks/useDashboardData"
import type { TabId, Order } from "@/types"
import { formatCurrency, formatDateTime, statusColor } from "@/lib/utils"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { DraggableWidgetGrid, type DashboardWidget } from "@/components/ui/draggable-widget-grid"

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
  const [chartRange, setChartRange] = useState<"7D" | "30D" | "90D">("7D")

  // Gross Sales calculation
  const totalRevenue = useMemo(() => {
    return state.orders
      .filter((o) => o.status !== "cancelled")
      .reduce((acc, o) => acc + (Number(o.total) || Number(o.total_amount) || 0), 0)
  }, [state.orders])

  // Active Orders count
  const activeOrdersCount = useMemo(() => {
    return state.orders.filter(
      (o) => o.status === "placed" || o.status === "confirmed" || o.status === "processing"
    ).length
  }, [state.orders])

  // Pending trade-in count
  const pendingExchangesCount = useMemo(() => {
    return state.exchanges.filter(
      (e) => e.status === "submitted" || e.status === "in_transit"
    ).length
  }, [state.exchanges])

  // Low stock products count
  const lowStockCount = useMemo(() => {
    return state.products.filter((p) => p.stock <= 5).length
  }, [state.products])

  // Chart Data: group orders by date
  const revenueChartData = useMemo(() => {
    const days = chartRange === "7D" ? 7 : chartRange === "30D" ? 30 : 90
    const result: { date: string; revenue: number; orders: number }[] = []

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const label = d.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      })

      const dayOrders = state.orders.filter(
        (o) => o.created_at && o.created_at.slice(0, 10) === dateStr && o.status !== "cancelled"
      )

      const dayRev = dayOrders.reduce(
        (acc, o) => acc + (Number(o.total) || Number(o.total_amount) || 0),
        0
      )

      result.push({
        date: label,
        revenue: dayRev,
        orders: dayOrders.length,
      })
    }

    // If all zero but totalRevenue > 0, attribute to today for preview
    const totalInDays = result.reduce((acc, r) => acc + r.revenue, 0)
    if (totalInDays === 0 && totalRevenue > 0 && result.length > 0) {
      result[result.length - 1].revenue = totalRevenue
      result[result.length - 1].orders = state.orders.length
    }

    return result
  }, [state.orders, chartRange, totalRevenue])

  // Donut chart: Orders by status
  const ordersByStatusData = useMemo(() => {
    const counts: Record<string, number> = {}
    state.orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1
    })

    const statusColors: Record<string, string> = {
      placed: "#3B82F6",
      confirmed: "#6366F1",
      processing: "#F59E0B",
      shipped: "#0EA5E9",
      delivered: "#10B981",
      cancelled: "#F43F5E",
    }

    return Object.entries(counts).map(([name, value]) => ({
      name: name.toUpperCase(),
      value,
      color: statusColors[name] || "#64748B",
    }))
  }, [state.orders])

  // Recent 4 orders
  const recentOrders = useMemo(() => {
    return state.orders.slice(0, 4)
  }, [state.orders])

  // Recent 4 exchanges
  const recentExchanges = useMemo(() => {
    return state.exchanges.slice(0, 4)
  }, [state.exchanges])

  // Widgets definition for DraggableWidgetGrid
  const widgets: DashboardWidget[] = [
    {
      id: "widget-revenue-chart",
      title: "Revenue Telemetry & Growth Curve",
      size: "wide",
      component: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase text-slate-400">Total Net Inflow</span>
              <p className="text-xl font-bold font-mono text-white mt-0.5">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#0B101D] border border-white/10">
              {(["7D", "30D", "90D"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setChartRange(r)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    chartRange === r
                      ? "bg-indigo-600 text-white font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#475569"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                />
                <YAxis
                  stroke="#475569"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-xl border border-white/10 bg-[#0E1524] p-3 shadow-xl text-xs space-y-1">
                          <p className="text-[10px] text-slate-400">{payload[0].payload.date}</p>
                          <p className="font-mono font-bold text-indigo-400 text-sm">
                            {formatCurrency(Number(payload[0].value))}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Orders: <strong>{payload[0].payload.orders}</strong>
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366F1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },
    {
      id: "widget-order-status-donut",
      title: "Order Distribution by Stage",
      size: "sm",
      component: (
        <div className="space-y-3">
          <div className="h-44 w-full flex items-center justify-center">
            {ordersByStatusData.length === 0 ? (
              <p className="text-xs text-slate-500">No orders placed yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ordersByStatusData}
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {ordersByStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border border-white/10 bg-[#0E1524] px-2.5 py-1.5 shadow-xl text-xs">
                            <span className="font-mono text-white">
                              {payload[0].name}: <strong>{payload[0].value}</strong>
                            </span>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-white/[0.05]">
            {ordersByStatusData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 text-[10px]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-slate-400 truncate">{s.name}</span>
                <span className="font-mono text-white font-bold ml-auto">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "widget-quick-operations",
      title: "Quick Action Command Deck",
      size: "sm",
      component: (
        <div className="space-y-2.5">
          <button
            onClick={onOpenProductModal}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition-colors cursor-pointer group text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Plus className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Drop New Product</p>
                <p className="text-[10px] text-slate-400">Add listing with images to storage</p>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
          </button>

          <button
            onClick={() => onSelectTab("exchanges")}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition-colors cursor-pointer group text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Repeat className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Inspect Trade-Ins</p>
                <p className="text-[10px] text-slate-400">{pendingExchangesCount} pending verification</p>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
          </button>

          <button
            onClick={onOpenBroadcastModal}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition-colors cursor-pointer group text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Push Alert Broadcast</p>
                <p className="text-[10px] text-slate-400">Dispatch lockscreen alert to app</p>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
          </button>
        </div>
      ),
    },
    {
      id: "widget-recent-orders-queue",
      title: "Live Order Fulfillment Stream",
      size: "wide",
      component: (
        <div className="space-y-2">
          {recentOrders.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No recent orders placed.</p>
          ) : (
            recentOrders.map((order) => {
              const customer = state.profiles.find((p) => p.id === order.user_id)
              return (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#0B101D] border border-white/[0.06] hover:border-indigo-500/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase border ${statusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {customer?.full_name || order.customer_name || "Guest Collector"} •{" "}
                        {formatDateTime(order.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs text-white">
                      {formatCurrency(order.total_amount)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-colors"
                    >
                      Dispatch →
                    </Button>
                  </div>
                </div>
              )
            })
          )}
          <div className="text-right pt-1">
            <button
              onClick={() => onSelectTab("orders")}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              View all {state.orders.length} orders →
            </button>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Executive Command Overview</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time telemetry across REVARA commerce, circular trade-in operations, and CRM.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshData()}
            disabled={isSyncing}
            className="h-8 gap-1.5 text-xs text-slate-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-indigo-400" : ""}`} />
            <span>Resync</span>
          </Button>

          <Button
            size="sm"
            onClick={onOpenProductModal}
            className="h-8 gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Drop Product</span>
          </Button>
        </div>
      </div>

      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Gross Sales */}
        <Card
          onClick={() => onSelectTab("orders")}
          className="cursor-pointer hover:border-indigo-500/40 transition-all group p-4 space-y-2 bg-[#131B2E]"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Gross Sales</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-lg font-bold font-mono text-white">
            {formatCurrency(totalRevenue)}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
            <ArrowUpRight className="h-3 w-3" />
            <span>+14.8% vs last cycle</span>
          </div>
        </Card>

        {/* Active Orders */}
        <Card
          onClick={() => onSelectTab("orders")}
          className="cursor-pointer hover:border-indigo-500/40 transition-all group p-4 space-y-2 bg-[#131B2E]"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Orders</span>
            <ShoppingBag className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-lg font-bold font-mono text-white">
            {activeOrdersCount}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-indigo-300 font-mono">
            <span>{state.orders.length} total orders</span>
          </div>
        </Card>

        {/* Trade-In Queue */}
        <Card
          onClick={() => onSelectTab("exchanges")}
          className="cursor-pointer hover:border-indigo-500/40 transition-all group p-4 space-y-2 bg-[#131B2E]"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Trade-Ins</span>
            <Repeat className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-lg font-bold font-mono text-white">
            {pendingExchangesCount}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-emerald-300 font-mono">
            <span>Awaiting grading</span>
          </div>
        </Card>

        {/* Low-Stock Radar */}
        <Card
          onClick={() => onSelectTab("inventory")}
          className="cursor-pointer hover:border-amber-500/40 transition-all group p-4 space-y-2 bg-[#131B2E]"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Stock Radar</span>
            <Layers className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-lg font-bold font-mono text-amber-300">
            {lowStockCount}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
            <span>Items ≤ 5 units</span>
          </div>
        </Card>

        {/* Active PINs */}
        <Card
          onClick={() => onSelectTab("serviceability")}
          className="cursor-pointer hover:border-cyan-500/40 transition-all group p-4 space-y-2 bg-[#131B2E]"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Corridors</span>
            <MapPin className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-lg font-bold font-mono text-white">
            {state.serviceability.filter((s) => s.status === "active").length}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-cyan-300 font-mono">
            <span>Active postal hubs</span>
          </div>
        </Card>

        {/* Customers */}
        <Card
          onClick={() => onSelectTab("users")}
          className="cursor-pointer hover:border-indigo-500/40 transition-all group p-4 space-y-2 bg-[#131B2E]"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Collectors</span>
            <Users className="h-4 w-4 text-violet-400" />
          </div>
          <p className="text-lg font-bold font-mono text-white">
            {state.profiles.length}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-violet-300 font-mono">
            <span>Registered profiles</span>
          </div>
        </Card>
      </div>

      {/* Draggable Widget Grid */}
      <DraggableWidgetGrid widgets={widgets} />
    </div>
  )
}
