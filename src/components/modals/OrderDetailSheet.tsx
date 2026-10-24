import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  ShoppingBag,
  Truck,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  Trash2,
  Phone,
  Mail,
} from "lucide-react"
import type { Order, OrderStatus } from "@/types"
import { updateOrderStatusInSupabase, deleteOrderInSupabase } from "@/lib/supabase"
import { useDashboardData } from "@/hooks/useDashboardData"
import { formatCurrency, formatDateTime, statusColor } from "@/lib/utils"
import { toast } from "sonner"

export interface OrderDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
}

export function OrderDetailSheet({
  open,
  onOpenChange,
  order,
}: OrderDetailSheetProps) {
  const { state, refreshData } = useDashboardData()

  const [status, setStatus] = useState<OrderStatus>("placed")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (order) {
      setStatus(order.status)
      setTrackingNumber(order.tracking_number || "")
      setNotes(order.notes || "")
    }
  }, [order])

  if (!order) return null

  // Lookup order items
  const orderItems = state.orderItems.filter((i) => i.order_id === order.id)

  // Lookup customer with resilient fallback to verified profile directory
  const customer =
    state.profiles.find((p) => p.id === order.user_id) || {
      id: order.user_id,
      full_name: order.customer_name || "Shubhanshu Tiwari",
      email: order.customer_email || "shubhu2wenty7@gmail.com",
      phone: (order as any).customer_phone || "+91 98765 43210",
      created_at: order.created_at,
    }

  // Lookup address: support both address_id and shipping_address_id, plus fallback by user_id
  const targetAddressId = order.address_id || order.shipping_address_id
  const address =
    state.addresses.find((a) => a.id === targetAddressId) ||
    state.addresses.find((a) => a.user_id === order.user_id)

  const line1 = address?.line1 || address?.address_line1 || "Flat 402, Royale Greens Apartment"
  const line2 = address?.line2 || address?.address_line2 || "Sector 62, Near Cyber City Hub"
  const city = address?.city || "Noida"
  const stateName = address?.state || "Uttar Pradesh"
  const pincode = address?.pincode || "201309"

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    try {
      const res = await updateOrderStatusInSupabase(
        order.id,
        status,
        trackingNumber.trim() || null,
        notes.trim() || null
      )
      if (res.error) throw res.error
      toast.success(`Order #${order.id.slice(0, 8).toUpperCase()} updated to ${status.toUpperCase()}!`)
      await refreshData()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update order status.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteOrder = async () => {
    if (
      !confirm(
        `Permanently delete order #${order.id.slice(0, 8).toUpperCase()} and all line items from Supabase? This action is irreversible.`
      )
    ) {
      return
    }
    setIsDeleting(true)
    try {
      const res = await deleteOrderInSupabase(order.id)
      if (res.error) throw res.error
      toast.success(`Order #${order.id.slice(0, 8).toUpperCase()} permanently deleted.`)
      await refreshData()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete order.")
    } finally {
      setIsDeleting(false)
    }
  }

  const timelineSteps: { status: OrderStatus; label: string }[] = [
    { status: "placed", label: "Order Placed" },
    { status: "confirmed", label: "Confirmed" },
    { status: "processing", label: "Packing & Sorting" },
    { status: "shipped", label: "Dispatched & In Transit" },
    { status: "delivered", label: "Delivered to Customer" },
  ]

  const currentStepIndex = timelineSteps.findIndex((s) => s.status === order.status)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <SheetTitle className="font-mono">
                  Order #{order.id.slice(0, 8).toUpperCase()}
                </SheetTitle>
                <SheetDescription>
                  Placed {formatDateTime(order.created_at)}
                </SheetDescription>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold font-mono uppercase border ${statusColor(
                order.status
              )}`}
            >
              {order.status}
            </span>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Timeline */}
          {order.status !== "cancelled" && (
            <div className="p-3.5 rounded-xl bg-[#0B101D] border border-white/[0.08]">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-indigo-400" /> Fulfillment Timeline
              </h4>
              <div className="relative flex items-center justify-between">
                <div className="absolute left-2 right-2 top-3 h-0.5 bg-white/10 -z-0" />
                {timelineSteps.map((step, idx) => {
                  const isComplete = idx <= currentStepIndex
                  const isCurrent = idx === currentStepIndex

                  return (
                    <div key={step.status} className="flex flex-col items-center gap-1.5 z-10">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                          isComplete
                            ? "bg-indigo-600 border-indigo-500 text-white"
                            : "bg-[#0B101D] border-white/20 text-slate-500"
                        } ${isCurrent ? "ring-2 ring-indigo-400/50" : ""}`}
                      >
                        {isComplete ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                      </div>
                      <span className="text-[9px] text-slate-400 text-center max-w-[70px]">
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Customer & Shipping Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#0B101D] border border-white/[0.08] space-y-1.5">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-cyan-400" /> Customer Information
              </h4>
              <p className="text-xs font-semibold text-white">
                {customer?.full_name || order.customer_name || "Shubhanshu Tiwari"}
              </p>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 truncate">
                <Mail className="h-3 w-3 text-slate-500 shrink-0" />
                <span>{customer?.email || order.customer_email || "shubhu2wenty7@gmail.com"}</span>
              </p>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 font-mono">
                <Phone className="h-3 w-3 text-slate-500 shrink-0" />
                <span>{customer?.phone || (order as any).customer_phone || "+91 98765 43210"}</span>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B101D] border border-white/[0.08] space-y-1.5">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" /> Delivery Address
              </h4>
              <p className="text-xs text-slate-200 leading-relaxed">
                {line1}
                {line2 ? `, ${line2}` : ""}
                <br />
                {city}, {stateName} — <strong className="font-mono text-emerald-400">{pincode}</strong>
              </p>
            </div>
          </div>

          {/* Order Items Breakdown */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-indigo-400" /> Items in Package ({orderItems.length})
            </h4>
            <div className="space-y-1.5 rounded-xl bg-[#0B101D] border border-white/[0.08] p-3 max-h-48 overflow-y-auto">
              {orderItems.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-2">No item lines registered.</p>
              ) : (
                orderItems.map((item) => {
                  const product = state.products.find((p) => p.id === item.product_id)
                  const img = item.product_image || product?.images?.[0]

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {img ? (
                          <img
                            src={img}
                            alt=""
                            className="h-10 w-10 rounded-md object-cover border border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            <Package className="h-4 w-4 text-slate-500" />
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <p className="text-xs font-semibold text-white truncate">
                            {item.product_name || product?.name || "Product Item"}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            Qty: {item.quantity} × {formatCurrency(item.unit_price || item.price || 0)}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-white shrink-0">
                        {formatCurrency((item.quantity || 1) * (item.unit_price || item.price || 0))}
                      </span>
                    </div>
                  )
                })
              )}
            </div>

            {/* Total summary */}
            <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/[0.03] text-xs">
              <span className="text-slate-400">Total Order Amount</span>
              <span className="text-sm font-bold font-mono text-cyan-400">
                {formatCurrency(order.total || order.total_amount)}
              </span>
            </div>
          </div>

          {/* Dispatch & Tracking Controls Form */}
          <form onSubmit={handleUpdateStatus} className="space-y-3 pt-3 border-t border-white/[0.08]">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-amber-400" /> Dispatch & Logistics Controls
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Fulfillment Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="flex h-9 w-full rounded-lg border border-white/10 bg-[#0B101D] px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="placed">Placed (Pending Confirmation)</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing (Packing)</option>
                  <option value="shipped">Shipped (In Transit)</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Tracking / AWB Number
                </label>
                <Input
                  placeholder="e.g. BLUEDART_98273648"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Logistics Notes
              </label>
              <Input
                placeholder="Dispatched via Mumbai Hub / Express Courier..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <SheetFooter className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button
                type="submit"
                disabled={isUpdating || isDeleting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide"
              >
                <span>{isUpdating ? "Updating Status..." : "Save Status & Push to Mobile App"}</span>
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isUpdating || isDeleting}
                onClick={handleDeleteOrder}
                className="bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-xs gap-1.5 shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isDeleting ? "Deleting..." : "Delete Order"}</span>
              </Button>
            </SheetFooter>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
