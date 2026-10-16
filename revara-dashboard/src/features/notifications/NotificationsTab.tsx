import { Bell, Plus, Send, CheckCircle2, User, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDashboardData } from "@/hooks/useDashboardData"
import { formatDateTime } from "@/lib/utils"

export interface NotificationsTabProps {
  onOpenBroadcastModal: () => void
}

export function NotificationsTab({ onOpenBroadcastModal }: NotificationsTabProps) {
  const { state } = useDashboardData()

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            In-App Push Alerts & Broadcasts
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log of dispatched high-priority announcements and direct customer notifications.
          </p>
        </div>

        <Button
          onClick={onOpenBroadcastModal}
          className="h-8 gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
        >
          <Bell className="h-3.5 w-3.5" />
          <span>Broadcast Push Alert</span>
        </Button>
      </div>

      {/* Dispatched Notifications List */}
      <div className="space-y-3">
        {state.notifications.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-white/10 bg-[#131B2E] text-slate-400 text-xs">
            No push notifications sent yet. Use "Broadcast Push Alert" above to dispatch a campaign.
          </div>
        ) : (
          state.notifications.map((n) => {
            const recipient = state.profiles.find((p) => p.id === n.user_id)

            return (
              <div
                key={n.id}
                className="p-4 rounded-2xl bg-[#131B2E] border border-white/[0.08] hover:border-indigo-500/30 transition-all shadow-md flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 shrink-0 mt-0.5">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">{n.title}</h4>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-white/5 border border-white/10 text-slate-300">
                        {n.type || "alert"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{n.body}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono pt-1">
                      {recipient ? (
                        <span className="flex items-center gap-1 text-indigo-300">
                          <User className="h-2.5 w-2.5" /> Direct: {recipient.full_name || recipient.email}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Globe className="h-2.5 w-2.5" /> Broadcast to all
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-slate-500">
                    {formatDateTime(n.created_at)}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
