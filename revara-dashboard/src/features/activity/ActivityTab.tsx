import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Activity,
  ShoppingBag,
  Repeat,
  Wallet,
  Star,
  User,
  Package,
  Play,
  Pause,
  RefreshCw,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDashboardData } from "@/hooks/useDashboardData"
import type { ActivityEvent } from "@/types"
import { formatTimeAgo, formatCurrency } from "@/lib/utils"

export function ActivityTab() {
  const { state, refreshData, isSyncing } = useDashboardData()
  const [isPaused, setIsPaused] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<string>("all")

  // Synthesize unified activity stream from all live tables
  const activities: ActivityEvent[] = useMemo(() => {
    const list: ActivityEvent[] = []

    // Orders
    state.orders.forEach((o) => {
      const customer = state.profiles.find((p) => p.id === o.user_id)
      list.push({
        id: `order-${o.id}`,
        type: "order",
        title: `Order #${o.id.slice(0, 8).toUpperCase()} — ${o.status.toUpperCase()}`,
        description: `${customer?.full_name || "Customer"} checked out items totaling ${formatCurrency(
          o.total_amount
        )}`,
        timestamp: o.created_at,
        badgeColor: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
        raw: o,
      })
    })

    // Exchanges
    state.exchanges.forEach((e) => {
      const customer = state.profiles.find((p) => p.id === e.user_id)
      list.push({
        id: `exchange-${e.id}`,
        type: "exchange",
        title: `Trade-In #${e.id.slice(0, 8).toUpperCase()} — ${e.status.toUpperCase()}`,
        description: `${customer?.full_name || "Collector"} submitted circular garments for evaluation.`,
        timestamp: e.created_at,
        badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        raw: e,
      })
    })

    // Wallet Transactions
    state.walletTransactions.forEach((tx) => {
      list.push({
        id: `tx-${tx.id}`,
        type: "wallet",
        title: `Wallet ${tx.transaction_type?.toUpperCase() || "CREDIT"} — ₹${tx.amount}`,
        description: tx.reason || "Wallet credit balance adjusted",
        timestamp: tx.created_at,
        badgeColor: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
        raw: tx,
      })
    })

    // Reviews
    state.reviews.forEach((r) => {
      list.push({
        id: `review-${r.id}`,
        type: "review",
        title: `Review Submitted (${r.rating}★)`,
        description: `"${r.comment}"`,
        timestamp: r.created_at,
        badgeColor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        raw: r,
      })
    })

    // Profiles
    state.profiles.forEach((p) => {
      list.push({
        id: `user-${p.id}`,
        type: "user",
        title: `New Collector Joined`,
        description: `${p.full_name || "New user"} (${p.email || "No email"}) registered account.`,
        timestamp: p.created_at,
        badgeColor: "bg-violet-500/15 text-violet-400 border-violet-500/30",
        raw: p,
      })
    })

    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [state.orders, state.exchanges, state.walletTransactions, state.reviews, state.profiles])

  const filteredActivities = useMemo(() => {
    if (selectedFilter === "all") return activities
    return activities.filter((a) => a.type === selectedFilter)
  }, [activities, selectedFilter])

  const filterOptions = [
    { id: "all", label: "All Events" },
    { id: "order", label: "Orders" },
    { id: "exchange", label: "Trade-Ins" },
    { id: "wallet", label: "Wallets" },
    { id: "review", label: "Reviews" },
    { id: "user", label: "Users" },
  ]

  const getEventIcon = (type: ActivityEvent["type"]) => {
    switch (type) {
      case "order":
        return <ShoppingBag className="h-4 w-4 text-indigo-400" />
      case "exchange":
        return <Repeat className="h-4 w-4 text-emerald-400" />
      case "wallet":
        return <Wallet className="h-4 w-4 text-cyan-400" />
      case "review":
        return <Star className="h-4 w-4 text-amber-400" />
      case "user":
        return <User className="h-4 w-4 text-violet-400" />
      default:
        return <Activity className="h-4 w-4 text-slate-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Live Operations Feed</h2>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 status-beacon-active" />
              STREAMING
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Realtime telemetry stream of order checkout, trade-in drop-offs, credits, and UGC.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            className={`h-8 gap-1.5 text-xs ${
              isPaused ? "text-amber-400 border-amber-500/40" : "text-slate-300"
            }`}
          >
            {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            <span>{isPaused ? "Resume Stream" : "Pause Feed"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshData()}
            disabled={isSyncing}
            className="h-8 gap-1.5 text-xs text-slate-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-indigo-400" : ""}`} />
            <span>Force Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {filterOptions.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFilter(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 ${
              selectedFilter === f.id
                ? "bg-indigo-600 text-white font-semibold"
                : "bg-[#131B2E] text-slate-400 hover:text-white border border-white/[0.08]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline Stream List */}
      <div className="space-y-2.5">
        <AnimatePresence>
          {filteredActivities.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-white/10 bg-[#131B2E] text-slate-400 text-xs">
              No live operations recorded for this filter.
            </div>
          ) : (
            filteredActivities.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index < 10 ? index * 0.03 : 0 }}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#131B2E] border border-white/[0.06] hover:border-indigo-500/30 transition-all shadow-md group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-9 w-9 rounded-xl bg-[#0B101D] border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                    {getEventIcon(event.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white tracking-wide">
                        {event.title}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase border ${event.badgeColor}`}
                      >
                        {event.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {event.description}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] font-mono text-slate-500">
                    {formatTimeAgo(event.timestamp)}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
