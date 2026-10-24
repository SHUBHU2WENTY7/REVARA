import { useState, useMemo } from "react"
import {
  ShoppingBag,
  LayoutList,
  Kanban,
  Download,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Trash2,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable, type ColumnDef } from "@/components/ui/table-with-dialog"
import { useDashboardData } from "@/hooks/useDashboardData"
import type { Order, OrderStatus } from "@/types"
import { formatCurrency, formatDateTime, statusColor } from "@/lib/utils"
import { updateOrderStatusInSupabase, deleteOrderInSupabase, deleteOrdersBulkInSupabase } from "@/lib/supabase"
import { toast } from "sonner"

export interface OrdersTabProps {
  onSelectOrder: (order: Order) => void
}

export function OrdersTab({ onSelectOrder }: OrdersTabProps) {
  const { state, refreshData } = useDashboardData()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table")

  // Counts by status
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: state.orders.length }
    state.orders.forEach((o) => {
      c[o.status] = (c[o.status] || 0) + 1
    })
    return c
  }, [state.orders])

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return state.orders
    return state.orders.filter((o) => o.status === statusFilter)
  }, [state.orders, statusFilter])

  // Bulk status update
  const handleBulkStatusChange = async (selected: Order[], newStatus: OrderStatus) => {
    try {
      const promises = selected.map((o) =>
        updateOrderStatusInSupabase(o.id, newStatus)
      )
      await Promise.all(promises)
      toast.success(`Updated ${selected.length} orders to ${newStatus.toUpperCase()}!`)
      await refreshData()
    } catch {
      toast.error("Failed to update selected orders.")
    }
  }

  const columns: ColumnDef<Order>[] = [
    {
      key: "id",
      header: "Order ID",
      sortable: true,
      accessor: (o) => o.id,
      render: (o) => (
        <span className="font-mono font-bold text-[var(--text)]">
          #{o.id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      key: "customer",
      header: "Collector",
      sortable: true,
      accessor: (o) => {
        const c = state.profiles.find((p) => p.id === o.user_id)
        return c?.full_name || o.customer_name || "Collector"
      },
      render: (o) => {
        const c = state.profiles.find((p) => p.id === o.user_id)
        const name = c?.full_name || o.customer_name || "Collector"
        const email = c?.email || o.customer_email || "collector@revara.in"
        const phone = c?.phone || (o as any).customer_phone || "+91 98765 43210"

        return (
          <div>
            <p className="font-semibold text-[var(--text)]">{name}</p>
            <p className="text-[11px] text-[var(--muted)] font-mono">{email}</p>
            <p className="text-[10px] text-[var(--faint)] font-mono">{phone}</p>
          </div>
        )
      },
    },
    {
      key: "total",
      header: "Total (₹)",
      sortable: true,
      accessor: (o) => Number(o.total) || Number(o.total_amount) || 0,
      render: (o) => (
        <span className="font-mono font-bold text-[var(--primary)]">
          {formatCurrency(o.total || o.total_amount)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (o) => o.status,
      render: (o) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase border ${statusColor(
            o.status
          )}`}
        >
          {o.status}
        </span>
      ),
    },
    {
      key: "tracking_number",
      header: "AWB Tracking",
      accessor: (o) => o.tracking_number || "—",
      render: (o) => (
        <span className="font-mono text-xs text-[var(--text)]">
          {o.tracking_number || <span className="text-[var(--muted)] italic">Unassigned</span>}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Date Placed",
      sortable: true,
      accessor: (o) => o.created_at,
      render: (o) => (
        <span className="text-[var(--muted)] font-mono text-[11px]">
          {formatDateTime(o.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Manage",
      render: (o) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSelectOrder(o)}
            className="h-7 text-[11px] gap-1 hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            <Eye className="h-3 w-3" />
            <span>Dispatch →</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              if (
                confirm(
                  `Permanently delete order #${o.id.slice(0, 8).toUpperCase()} from Supabase?`
                )
              ) {
                try {
                  const res = await deleteOrderInSupabase(o.id)
                  if (res.error) throw res.error
                  toast.success(`Order #${o.id.slice(0, 8).toUpperCase()} deleted.`)
                  await refreshData()
                } catch {
                  toast.error("Failed to delete order.")
                }
              }
            }}
            className="h-7 w-7 p-0 text-[var(--muted)] hover:text-rose-500 hover:bg-rose-500/10"
            title="Delete Order Record"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  const statusTabs: { id: string; label: string }[] = [
    { id: "all", label: "All Orders" },
    { id: "placed", label: "Placed" },
    { id: "confirmed", label: "Confirmed" },
    { id: "processing", label: "Processing" },
    { id: "shipped", label: "Shipped" },
    { id: "delivered", label: "Delivered" },
    { id: "cancelled", label: "Cancelled" },
  ]

  const kanbanStages: OrderStatus[] = [
    "placed",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--text)] tracking-tight font-['Manrope']">
            Order Fulfillment Pipeline
          </h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Realtime customer checkout orders, dispatch verification, and logistics tracking.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--surface-2)] border border-[var(--line)]">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`p-1.5 px-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewMode === "table"
                ? "bg-[var(--surface)] text-[var(--text)] font-semibold shadow-xs border border-[var(--line)]"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            <LayoutList className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Table</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("kanban")}
            className={`p-1.5 px-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewMode === "kanban"
                ? "bg-[var(--surface)] text-[var(--text)] font-semibold shadow-xs border border-[var(--line)]"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            <Kanban className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Fulfillment Board</span>
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 ${
              statusFilter === tab.id
                ? "bg-[var(--ink)] text-[var(--on-ink)] font-semibold shadow-xs"
                : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--line)]"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                statusFilter === tab.id
                  ? "bg-white/20 text-white"
                  : "bg-[var(--well)] text-[var(--muted)]"
              }`}
            >
              {counts[tab.id] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* View Mode: Table vs Kanban */}
      {viewMode === "table" ? (
        <DataTable
          data={filteredOrders as (Order & Record<string, unknown>)[]}
          columns={columns as ColumnDef<Order & Record<string, unknown>>[]}
          keyExtractor={(o) => o.id}
          searchPlaceholder="Search order ID, collector name, or tracking AWB..."
          onRowClick={(o) => onSelectOrder(o as unknown as Order)}
          exportFilename="revara-orders"
          bulkActions={[
            {
              label: "Mark Confirmed",
              onClick: (selected) => handleBulkStatusChange(selected as unknown as Order[], "confirmed"),
            },
            {
              label: "Mark Processing",
              onClick: (selected) => handleBulkStatusChange(selected as unknown as Order[], "processing"),
            },
            {
              label: "Mark Shipped",
              onClick: (selected) => handleBulkStatusChange(selected as unknown as Order[], "shipped"),
            },
            {
              label: "Delete Selected",
              variant: "destructive",
              onClick: async (selected) => {
                const ids = selected.map((s) => s.id)
                if (
                  confirm(
                    `Are you sure you want to permanently delete ${ids.length} orders from Supabase?`
                  )
                ) {
                  try {
                    const res = await deleteOrdersBulkInSupabase(ids)
                    if (res.error) throw res.error
                    toast.success(`Deleted ${res.count} orders from Supabase.`)
                    await refreshData()
                  } catch {
                    toast.error("Failed to delete selected orders.")
                  }
                }
              },
            },
          ]}
        />
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 overflow-x-auto pb-4 custom-scrollbar">
          {kanbanStages.map((stage) => {
            const stageOrders = state.orders.filter((o) => o.status === stage)

            return (
              <div
                key={stage}
                className="flex flex-col rounded-2xl bg-[var(--surface-2)] border border-[var(--line)] p-3 space-y-3 min-w-[240px]"
              >
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] font-mono">
                    {stage}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text)] border border-[var(--line)] text-[10px] font-mono font-bold">
                    {stageOrders.length}
                  </span>
                </div>

                <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[600px] pr-1 custom-scrollbar">
                  {stageOrders.length === 0 ? (
                    <div className="p-4 text-center rounded-xl border border-dashed border-[var(--line-2)] text-[var(--muted)] text-xs italic">
                      Empty queue
                    </div>
                  ) : (
                    stageOrders.map((order) => {
                      const customer = state.profiles.find((p) => p.id === order.user_id)
                      return (
                        <div
                          key={order.id}
                          onClick={() => onSelectOrder(order)}
                          className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line-2)] transition-all cursor-pointer shadow-xs space-y-2 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-[var(--text)]">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span className="text-xs font-mono font-bold text-[var(--primary)]">
                              {formatCurrency(order.total_amount)}
                            </span>
                          </div>

                          <p className="text-xs text-[var(--text)] font-semibold truncate">
                            {customer?.full_name || order.customer_name || "Guest Collector"}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-[var(--muted)] font-mono pt-1.5 border-t border-[var(--line)]">
                            <span>{formatDateTime(order.created_at)}</span>
                            <span className="text-[var(--primary)] font-semibold group-hover:underline">Open →</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
