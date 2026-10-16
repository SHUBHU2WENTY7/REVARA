import { useState } from "react"
import {
  Users,
  Bell,
  Wallet,
  ShoppingBag,
  Repeat,
  Star,
  Shield,
  Calendar,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { DataTable, type ColumnDef } from "@/components/ui/table-with-dialog"
import { useDashboardData } from "@/hooks/useDashboardData"
import type { Profile } from "@/types"
import { formatCurrency, formatDateTime, getInitials } from "@/lib/utils"

export interface UsersTabProps {
  onOpenTargetedBroadcast: (userId: string, userName: string) => void
}

export function UsersTab({ onOpenTargetedBroadcast }: UsersTabProps) {
  const { state } = useDashboardData()
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)

  const columns: ColumnDef<Profile>[] = [
    {
      key: "collector",
      header: "Customer",
      sortable: true,
      accessor: (p) => p.full_name || p.email || p.id,
      render: (p) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-white/10">
            <AvatarImage src={p.avatar_url || undefined} />
            <AvatarFallback>{getInitials(p.full_name || p.email || "CO")}</AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="font-semibold text-white truncate">{p.full_name || "Collector"}</p>
            <p className="text-[11px] text-slate-400 font-mono truncate">{p.email || p.id.slice(0, 8)}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Account Tier",
      sortable: true,
      accessor: (p) => p.role,
      render: (p) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
          {p.role || "customer"}
        </span>
      ),
    },
    {
      key: "wallet",
      header: "Wallet Credits",
      sortable: true,
      accessor: (p) => {
        const w = state.wallets.find((x) => x.user_id === p.id)
        return Number(w?.available_credits || 0)
      },
      render: (p) => {
        const w = state.wallets.find((x) => x.user_id === p.id)
        return (
          <span className="font-mono font-bold text-cyan-400 text-xs">
            {formatCurrency(w?.available_credits || 0)}
          </span>
        )
      },
    },
    {
      key: "orders_count",
      header: "Orders Placed",
      sortable: true,
      accessor: (p) => {
        return state.orders.filter((o) => o.user_id === p.id).length
      },
      render: (p) => {
        const count = state.orders.filter((o) => o.user_id === p.id).length
        return (
          <span className="font-mono text-white text-xs font-semibold">
            {count} {count === 1 ? "order" : "orders"}
          </span>
        )
      },
    },
    {
      key: "created_at",
      header: "Joined Date",
      sortable: true,
      accessor: (p) => p.created_at,
      render: (p) => (
        <span className="text-[11px] font-mono text-slate-400">
          {formatDateTime(p.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Reach Out",
      render: (p) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation()
            onOpenTargetedBroadcast(p.id, p.full_name || p.email || "Customer")
          }}
          className="h-7 text-[11px] gap-1 hover:bg-amber-600 hover:text-white hover:border-amber-500 transition-colors"
        >
          <Bell className="h-3 w-3" />
          <span>Push Alert →</span>
        </Button>
      ),
    },
  ]

  // User 360 sub-records
  const userOrders = selectedProfile
    ? state.orders.filter((o) => o.user_id === selectedProfile.id)
    : []
  const userExchanges = selectedProfile
    ? state.exchanges.filter((e) => e.user_id === selectedProfile.id)
    : []
  const userWallet = selectedProfile
    ? state.wallets.find((w) => w.user_id === selectedProfile.id)
    : null
  const userReviews = selectedProfile
    ? state.reviews.filter((r) => r.user_id === selectedProfile.id)
    : []

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Customer 360 CRM</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Unified collector directory, lifetime orders, circular wallet balances, and direct push alerts.
        </p>
      </div>

      {/* CRM Table */}
      <DataTable
        data={state.profiles as (Profile & Record<string, unknown>)[]}
        columns={columns as ColumnDef<Profile & Record<string, unknown>>[]}
        keyExtractor={(p) => p.id}
        searchPlaceholder="Search collector by name, email, or user ID..."
        onRowClick={(p) => setSelectedProfile(p as unknown as Profile)}
        exportFilename="revara-customers"
      />

      {/* Customer 360 Profile Sheet */}
      <Sheet
        open={Boolean(selectedProfile)}
        onOpenChange={(open) => !open && setSelectedProfile(null)}
      >
        <SheetContent className="w-full sm:max-w-xl">
          {selectedProfile && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border border-indigo-500/30">
                    <AvatarImage src={selectedProfile.avatar_url || undefined} />
                    <AvatarFallback>
                      {getInitials(selectedProfile.full_name || selectedProfile.email || "CO")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-base text-white">
                      {selectedProfile.full_name || "REVARA Collector"}
                    </SheetTitle>
                    <SheetDescription className="font-mono text-xs text-slate-400">
                      {selectedProfile.email || selectedProfile.id}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-6 py-4">
                {/* Metrics ribbon */}
                <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#0B101D] border border-white/[0.08] text-center">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-mono">Wallet Credits</p>
                    <p className="text-sm font-bold font-mono text-cyan-400">
                      {formatCurrency(userWallet?.available_credits || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-mono">Orders Placed</p>
                    <p className="text-sm font-bold font-mono text-white">
                      {userOrders.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-mono">Trade-Ins</p>
                    <p className="text-sm font-bold font-mono text-emerald-400">
                      {userExchanges.length}
                    </p>
                  </div>
                </div>

                {/* Orders History */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5 text-indigo-400" /> Order History ({userOrders.length})
                  </h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {userOrders.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-2">No orders recorded.</p>
                    ) : (
                      userOrders.map((o) => (
                        <div
                          key={o.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] text-xs"
                        >
                          <span className="font-mono font-bold text-white">
                            #{o.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className="font-mono text-cyan-400 font-bold">
                            {formatCurrency(o.total_amount)}
                          </span>
                          <span className="text-[10px] uppercase font-mono text-slate-400">
                            {o.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Trade-Ins History */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Repeat className="h-3.5 w-3.5 text-emerald-400" /> Garments Trade-In Submissions ({userExchanges.length})
                  </h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {userExchanges.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-2">No trade-ins recorded.</p>
                    ) : (
                      userExchanges.map((e) => (
                        <div
                          key={e.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] text-xs"
                        >
                          <span className="font-mono font-bold text-white">
                            #{e.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className="font-mono text-emerald-400 font-bold">
                            ₹{e.final_credits || 0} Credits
                          </span>
                          <span className="text-[10px] uppercase font-mono text-slate-400">
                            {e.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Push alert direct action */}
                <div className="pt-2">
                  <Button
                    onClick={() => {
                      const id = selectedProfile.id
                      const name = selectedProfile.full_name || "Customer"
                      setSelectedProfile(null)
                      onOpenTargetedBroadcast(id, name)
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-2 text-xs"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    <span>Send In-App Push Alert to this Collector</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
