import { Tag, Plus, CheckCircle2, XCircle, Trash2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDashboardData } from "@/hooks/useDashboardData"
import type { Coupon } from "@/types"
import { updateCouponInSupabase, deleteCouponInSupabase } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

export interface CouponsTabProps {
  onOpenCouponModal: (coupon?: Coupon | null) => void
}

export function CouponsTab({ onOpenCouponModal }: CouponsTabProps) {
  const { state, refreshData } = useDashboardData()

  const handleToggle = async (c: Coupon) => {
    try {
      const nextActive = !c.is_active
      const res = await updateCouponInSupabase(c.id, { is_active: nextActive })
      if (res.error) throw res.error
      toast.success(`Coupon ${c.code} is now ${nextActive ? "ACTIVE" : "DISABLED"}!`)
      await refreshData()
    } catch {
      toast.error("Failed to update coupon status.")
    }
  }

  const handleDelete = async (c: Coupon) => {
    if (!confirm(`Are you sure you want to delete coupon code "${c.code}"?`)) return
    try {
      const res = await deleteCouponInSupabase(c.id)
      if (res.error) throw res.error
      toast.success(`Deleted coupon ${c.code}!`)
      await refreshData()
    } catch {
      toast.error("Failed to delete coupon.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Coupons & Promotions Engine</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure checkout discount codes, order minimums, and percentage off caps.
          </p>
        </div>

        <Button
          onClick={() => onOpenCouponModal(null)}
          className="h-8 gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create Coupon Code</span>
        </Button>
      </div>

      {/* Coupon Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.coupons.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl border border-white/10 bg-[#131B2E] text-slate-400 text-xs">
            No active coupons configured. Click "Create Coupon Code" above to drop your first promo.
          </div>
        ) : (
          state.coupons.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-white/[0.08] bg-[#131B2E] p-4 flex flex-col justify-between space-y-4 shadow-xl hover:border-indigo-500/40 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Tag className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-mono font-bold text-sm text-white tracking-wider">
                      {c.code}
                    </span>
                    <p className="text-[10px] text-slate-400 uppercase font-mono">
                      {c.type === "percent" ? `${c.value}% OFF` : c.type === "flat" ? `₹${c.value} FLAT OFF` : "FREE SHIPPING"}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                    c.is_active
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                  }`}
                >
                  {c.is_active ? "ACTIVE" : "DISABLED"}
                </span>
              </div>

              {/* Conditions */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#0B101D] border border-white/[0.05] text-[11px] font-mono">
                <div>
                  <span className="text-slate-500">Min Order</span>
                  <p className="font-bold text-white">₹{c.min_order_amount || 0}</p>
                </div>
                <div>
                  <span className="text-slate-500">Max Discount</span>
                  <p className="font-bold text-white">
                    {c.max_discount ? `₹${c.max_discount}` : "No Limit"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                <button
                  onClick={() => handleToggle(c)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    c.is_active
                      ? "bg-rose-500/10 text-rose-300 border-rose-500/25 hover:bg-rose-500/20"
                      : "bg-emerald-500/10 text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20"
                  }`}
                >
                  {c.is_active ? "Deactivate" : "Activate"}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenCouponModal(c)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Edit Coupon"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete Coupon"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
