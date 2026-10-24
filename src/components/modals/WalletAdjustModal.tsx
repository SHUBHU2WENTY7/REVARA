import { useState } from "react"
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
import { Wallet, Plus, Minus } from "lucide-react"
import { adjustWalletCreditInSupabase } from "@/lib/supabase"
import { useDashboardData } from "@/hooks/useDashboardData"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

export interface WalletAdjustModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string | null
  userName: string | null
  currentBalance: number
}

export function WalletAdjustModal({
  open,
  onOpenChange,
  userId,
  userName,
  currentBalance,
}: WalletAdjustModalProps) {
  const { refreshData } = useDashboardData()

  const [mode, setMode] = useState<"credit" | "debit">("credit")
  const [amount, setAmount] = useState<number | "">("")
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || amount === "" || Number(amount) <= 0) {
      toast.error("Please enter a valid credit adjustment amount.")
      return
    }

    setIsSubmitting(true)
    try {
      const delta = mode === "credit" ? Number(amount) : -Number(amount)
      const res = await adjustWalletCreditInSupabase(
        userId,
        delta,
        reason.trim() || `Manual ${mode.toUpperCase()} by Admin`
      )
      if (res.error) throw res.error

      toast.success(
        `Wallet adjusted! ${mode === "credit" ? "+" : "-"}${formatCurrency(
          Number(amount)
        )} for ${userName || "user"}.`
      )
      await refreshData()
      onOpenChange(false)
      setAmount("")
      setReason("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to adjust wallet balance.")
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
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>Adjust Customer Credit Ledger</DialogTitle>
              <DialogDescription>
                Manual ledger adjustment for customer #{userId?.slice(0, 8)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Current balance card */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B101D] border border-white/[0.08]">
            <div>
              <p className="text-[11px] text-slate-400">Target Customer</p>
              <p className="text-xs font-semibold text-white">{userName || "Customer"}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-slate-400">Current Balance</p>
              <p className="text-sm font-bold font-mono text-cyan-400">
                {formatCurrency(currentBalance)}
              </p>
            </div>
          </div>

          {/* Credit vs Debit Toggle */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#0B101D] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setMode("credit")}
              className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                mode === "credit"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Credit (+)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("debit")}
              className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                mode === "debit"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Minus className="h-3.5 w-3.5" />
              <span>Debit (−)</span>
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Adjustment Amount (₹)
            </label>
            <Input
              type="number"
              min="1"
              required
              placeholder="e.g. 250"
              value={amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Audited Reason / Reference
            </label>
            <Input
              required
              placeholder="e.g. Goodwill credit for delayed delivery / Trade-in correction"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
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
              className={
                mode === "credit"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-rose-600 hover:bg-rose-500 text-white"
              }
            >
              <span>{isSubmitting ? "Processing Ledger..." : `Post ${mode.toUpperCase()} to Wallet`}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
