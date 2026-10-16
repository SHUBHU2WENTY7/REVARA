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
import { Send, Bell, User } from "lucide-react"
import { sendBroadcastNotificationInSupabase } from "@/lib/supabase"
import { useDashboardData } from "@/hooks/useDashboardData"
import { toast } from "sonner"

export interface BroadcastModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetUserId?: string | null
  targetUserName?: string | null
}

export function BroadcastModal({
  open,
  onOpenChange,
  targetUserId = null,
  targetUserName = null,
}: BroadcastModalProps) {
  const { refreshData } = useDashboardData()
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [type, setType] = useState<string>("promo")
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) {
      toast.error("Please provide both title and notification body.")
      return
    }

    setIsSending(true)
    try {
      const result = await sendBroadcastNotificationInSupabase(
        title.trim(),
        body.trim(),
        type,
        targetUserId
      )

      if (result.error) {
        toast.error(result.error.message)
      } else {
        toast.success(
          targetUserId
            ? `Push alert dispatched to ${targetUserName || "customer"}!`
            : `Broadcast sent to ${result.count} registered collectors!`
        )
        await refreshData()
        onOpenChange(false)
        setTitle("")
        setBody("")
      }
    } catch {
      toast.error("Failed to send notification.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>
                {targetUserId ? "Direct Customer Push Alert" : "Broadcast Push Notification"}
              </DialogTitle>
              <DialogDescription>
                {targetUserId
                  ? `Send an in-app alert directly to ${targetUserName || "selected user"}`
                  : "Dispatch a high-priority push banner to all registered app users."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {targetUserId && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-xs text-indigo-300">
              <User className="h-4 w-4 shrink-0" />
              <span>Targeting customer: <strong>{targetUserName || targetUserId}</strong></span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Alert Title
            </label>
            <Input
              required
              placeholder="e.g. FLASH DROP: 20% Off Scale Figures"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Category / Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-white/10 bg-[#0B101D] px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="promo">Promotional / Campaign</option>
              <option value="flash_sale">Flash Sale Announcement</option>
              <option value="order_update">Order Status Update</option>
              <option value="credit_issued">Wallet Credit Alert</option>
              <option value="system">System Notification</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Notification Body
            </label>
            <textarea
              required
              rows={3}
              placeholder="Enter message details that will appear on customer device lockscreen..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0B101D] p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
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
              disabled={isSending}
              className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSending ? "Dispatching..." : "Dispatch Alert"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
