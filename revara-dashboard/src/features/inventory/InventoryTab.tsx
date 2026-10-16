import { useState, useMemo } from "react"
import {
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Plus,
  Minus,
  Edit2,
  Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable, type ColumnDef } from "@/components/ui/table-with-dialog"
import { useDashboardData } from "@/hooks/useDashboardData"
import type { Product } from "@/types"
import { formatCurrency, stockLevel, stockColor } from "@/lib/utils"
import { adjustStockInSupabase } from "@/lib/supabase"
import { toast } from "sonner"

export interface InventoryTabProps {
  onOpenProductModal: (product?: Product | null) => void
}

export function InventoryTab({ onOpenProductModal }: InventoryTabProps) {
  const { state, refreshData } = useDashboardData()
  const [stockSearch, setStockSearch] = useState("")

  // Health Metrics
  const healthStats = useMemo(() => {
    const total = state.products.length
    const healthy = state.products.filter((p) => p.stock > 5).length
    const low = state.products.filter((p) => p.stock > 0 && p.stock <= 5).length
    const out = state.products.filter((p) => p.stock === 0).length
    return { total, healthy, low, out }
  }, [state.products])

  // Filtered by search
  const filteredProducts = useMemo(() => {
    if (!stockSearch.trim()) return state.products
    const q = stockSearch.toLowerCase()
    return state.products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    )
  }, [state.products, stockSearch])

  // Quick adjust stock
  const handleQuickAdjust = async (productId: string, delta: number, currentName: string) => {
    try {
      const res = await adjustStockInSupabase(
        productId,
        delta,
        `Quick Stock Radar Adjustment: ${delta > 0 ? "+" : ""}${delta}`
      )
      if (res.error) throw res.error
      toast.success(
        `Stock adjusted for "${currentName}" (${delta > 0 ? `+${delta}` : delta})`
      )
      await refreshData()
    } catch {
      toast.error("Failed to update inventory level.")
    }
  }

  const columns: ColumnDef<Product>[] = [
    {
      key: "name",
      header: "Product & SKU",
      sortable: true,
      accessor: (p) => p.name,
      render: (p) => (
        <div className="flex items-center gap-3">
          {p.images?.[0] ? (
            <img
              src={p.images[0]}
              alt=""
              className="h-10 w-10 rounded-lg object-cover border border-white/10 shrink-0"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Package className="h-4 w-4 text-slate-500" />
            </div>
          )}
          <div className="overflow-hidden">
            <p className="font-semibold text-white truncate max-w-xs">{p.name}</p>
            <p className="text-[11px] text-slate-400 font-mono">{p.sku}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      accessor: (p) => {
        const cat = state.categories.find((c) => c.id === p.category_id)
        return cat?.name || "Uncategorized"
      },
    },
    {
      key: "price",
      header: "Unit Price",
      sortable: true,
      accessor: (p) => p.price,
      render: (p) => (
        <span className="font-mono text-cyan-400 font-bold">
          {formatCurrency(p.price)}
        </span>
      ),
    },
    {
      key: "stock",
      header: "Current Stock",
      sortable: true,
      accessor: (p) => p.stock,
      render: (p) => {
        const level = stockLevel(p.stock)
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`font-mono font-bold text-sm ${stockColor(p.stock)}`}>
                {p.stock}
              </span>
              <span className="text-[10px] uppercase font-mono text-slate-500">
                units
              </span>
            </div>
            {/* Visual threshold bar */}
            <div className="h-1.5 w-24 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  level === "out"
                    ? "bg-rose-500"
                    : level === "low"
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(100, (p.stock / 20) * 100)}%` }}
              />
            </div>
          </div>
        )
      },
    },
    {
      key: "quick_adjust",
      header: "Quick Stock Radar Adjust",
      render: (p) => (
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleQuickAdjust(p.id, -5, p.name)}
            disabled={p.stock < 5}
            className="px-1.5 py-1 rounded bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 text-[10px] font-mono disabled:opacity-30 disabled:pointer-events-none"
            title="Deduct 5"
          >
            -5
          </button>
          <button
            onClick={() => handleQuickAdjust(p.id, -1, p.name)}
            disabled={p.stock < 1}
            className="px-1.5 py-1 rounded bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 text-[10px] font-mono disabled:opacity-30 disabled:pointer-events-none"
            title="Deduct 1"
          >
            -1
          </button>
          <button
            onClick={() => handleQuickAdjust(p.id, 1, p.name)}
            className="px-1.5 py-1 rounded bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-white/10 text-[10px] font-mono"
            title="Add 1"
          >
            +1
          </button>
          <button
            onClick={() => handleQuickAdjust(p.id, 5, p.name)}
            className="px-1.5 py-1 rounded bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-white/10 text-[10px] font-mono"
            title="Add 5"
          >
            +5
          </button>
          <button
            onClick={() => handleQuickAdjust(p.id, 10, p.name)}
            className="px-1.5 py-1 rounded bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-white/10 text-[10px] font-mono"
            title="Add 10"
          >
            +10
          </button>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Edit",
      render: (p) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation()
            onOpenProductModal(p)
          }}
          className="h-7 text-[11px] gap-1 hover:bg-indigo-600 hover:text-white"
        >
          <Edit2 className="h-3 w-3" />
          <span>Full SKU</span>
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Stock Radar & Inventory Health</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Realtime warehouse inventory monitoring, safety stock thresholds, and rapid delta adjustments.
        </p>
      </div>

      {/* 4 Health KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#131B2E] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total SKUs</span>
            <Layers className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-xl font-bold font-mono text-white">{healthStats.total}</p>
          <p className="text-[10px] text-slate-500">Tracked catalog listings</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#131B2E] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Healthy Stock</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold font-mono text-emerald-400">{healthStats.healthy}</p>
          <p className="text-[10px] text-emerald-500/80">&gt; 5 units available</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#131B2E] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Low Stock Radar</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold font-mono text-amber-400">{healthStats.low}</p>
          <p className="text-[10px] text-amber-500/80">Reorder threshold alert (1-5 units)</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#131B2E] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Depleted</span>
            <XCircle className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-xl font-bold font-mono text-rose-400">{healthStats.out}</p>
          <p className="text-[10px] text-rose-500/80">0 units (Backorder needed)</p>
        </div>
      </div>

      {/* Main Inventory DataTable */}
      <DataTable
        data={filteredProducts as (Product & Record<string, unknown>)[]}
        columns={columns as ColumnDef<Product & Record<string, unknown>>[]}
        keyExtractor={(p) => p.id}
        searchPlaceholder="Search product title or SKU..."
        onRowClick={(p) => onOpenProductModal(p as unknown as Product)}
        exportFilename="revara-inventory"
      />
    </div>
  )
}
