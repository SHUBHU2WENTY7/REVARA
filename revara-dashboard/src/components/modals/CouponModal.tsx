import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tag } from "lucide-react"
import type { Coupon } from "@/types"
import { createCouponInSupabase, updateCouponInSupabase } from "@/lib/supabase"
import { useDashboardData } from "@/hooks/useDashboardData"
import { toast } from "sonner"

export interface CouponModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  coupon?: Coupon | null
}

export function CouponModal({ open, onOpenChange, coupon }: CouponModalProps) {
  const { refreshData } = useDashboardData()

  const [code, setCode] = useState("")
  const [type, setType] = useState<"percent" | "flat" | "free_shipping">("percent")
  const [value, setValue] = useState<number | "">("")
  const [minOrder, setMinOrder] = useState<number | "">("")
  const [maxDiscount, setMaxDiscount] = useState<number | "">("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (coupon) {
      setCode(coupon.code)
      setType(coupon.type)
      setValue(coupon.value)
      setMinOrder(coupon.min_order_amount)
      setMaxDiscount(coupon.max_discount ?? "")
    } else {
      setCode("")
      setType("percent")
      setValue("")
      setMinOrder(299)
      setMaxDiscount(100)
    }
  }, [coupon, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || value === "") {
      toast.error("Please enter coupon code and discount value.")
      return
    }

    setIsSubmitting(true)
    try {
      const payload: Partial<Coupon> = {
        code: code.trim().toUpperCase(),
        type,
        value: Number(value),
        min_order_amount: Number(minOrder) || 0,
        max_discount: maxDiscount !== "" ? Number(maxDiscount) : undefined,
        is_active: true,
      }

      if (coupon) {
        const res = await updateCouponInSupabase(coupon.id, payload)
        if (res.error) throw res.error
        toast.success(`Updated coupon "${payload.code}"!`)
      } else {
        const res = await createCouponInSupabase(payload)
        if (res.error) throw res.error
        toast.success(`Created promo code "${payload.code}"!`)
      }

      await refreshData()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save coupon.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Tag className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>{coupon ? "Edit Promo Code" : "Create New Coupon"}</DialogTitle>
              <DialogDescription>
                Promotional discounts applied during customer checkout.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Coupon Code (Uppercase)
            </label>
            <Input
              required
              placeholder="e.g. FESTIVE25"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="font-mono text-xs uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Discount Type
              </label>
              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as "percent" | "flat" | "free_shipping")
                }
                className="flex h-9 w-full rounded-lg border border-white/10 bg-[#0B101D] px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="percent">Percentage (%) Off</option>
                <option value="flat">Flat Rupee (₹) Off</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Discount Value
              </label>
              <Input
                type="number"
                min="0"
                required
                placeholder={type === "percent" ? "15" : "100"}
                value={value}
                onChange={(e) => setValue(e.target.value === "" ? "" : Number(e.target.value))}
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Min Order (₹)
              </label>
              <Input
                type="number"
                min="0"
                placeholder="299"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value === "" ? "" : Number(e.target.value))}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Max Discount Cap (₹)
              </label>
              <Input
                type="number"
                min="0"
                placeholder="100"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                className="font-mono text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              <span>{isSubmitting ? "Saving..." : coupon ? "Update Code" : "Publish Coupon"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
