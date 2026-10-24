import { useState, useMemo } from "react"
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

  // Synthesize profiles: real profiles + virtual profiles from user IDs across tables
  const synthesizedProfiles: Profile[] = useMemo(() => {
    const profileMap = new Map<string, Profile>()

    // 1. Seed from real profiles table
    state.profiles.forEach((p) => {
      profileMap.set(p.id, { ...p })
    })

    // 2. Collect user IDs from wallets, orders, exchanges, reviews
    const allUserIds = new Set<string>()
    state.wallets.forEach((w) => w.user_id && allUserIds.add(w.user_id))
    state.orders.forEach((o) => o.user_id && allUserIds.add(o.user_id))
    state.exchanges.forEach((e) => e.user_id && allUserIds.add(e.user_id))
    state.reviews.forEach((r) => r.user_id && allUserIds.add(r.user_id))

    // 3. For any user_id not already in profileMap, synthesize a profile
    allUserIds.forEach((uid) => {
      if (profileMap.has(uid)) return

      const review = state.reviews.find((r) => r.user_id === uid)
      const order = state.orders.find((o) => o.user_id === uid)
      const exchange = state.exchanges.find((e) => e.user_id === uid)
      const wallet = state.wallets.find((w) => w.user_id === uid)

      const name = review?.user_name || order?.customer_name || exchange?.customer_name || null
      const email = order?.customer_email || exchange?.customer_email || null
      const avatar = review?.avatar_url || null

      const dates = [
        order?.created_at,
        exchange?.created_at,
        review?.created_at,
        wallet?.updated_at,
      ].filter(Boolean) as string[]
      const earliest = dates.length > 0 ? dates.sort()[0] : new Date().toISOString()

      profileMap.set(uid, {
        id: uid,
        full_name: name,
        email: email,
        phone: null,
        avatar_url: avatar,
        role: "customer",
        created_at: earliest,
      })
    })

    return Array.from(profileMap.values())
  }, [state.profiles, state.wallets, state.orders, state.exchanges, state.reviews])

  const columns: ColumnDef<Profile>[] = [
    {
      key: "collector",
      header: "Customer",
      sortable: true,
      accessor: (p) => p.full_name || p.email || p.id,
      render: (p) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-[var(--line-2)] shrink-0">
            <AvatarImage src={p.avatar_url || undefined} />
            <AvatarFallback className="bg-[var(--well)] text-[var(--text)] text-xs font-bold">
              {getInitials(p.full_name || p.email || "CO")}
            </AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="font-semibold text-[var(--text)] truncate">{p.full_name || "Collector"}</p>
            <p className="text-[11px] text-[var(--muted)] font-mono truncate">{p.email || p.id.slice(0, 8)}</p>
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
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-[var(--well)] text-[var(--primary)] border border-[var(--line-2)]">
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
          <span className="font-mono font-bold text-[var(--primary)] text-xs">
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
          <span className="font-mono text-[var(--text)] text-xs font-semibold">
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
        <span className="text-[11px] font-mono text-[var(--muted)]">
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
          className="h-7 text-[11px] gap-1 hover:border-[var(--primary)] hover:text-[var(--primary)]"
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

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-[var(--text)] tracking-tight font-['Manrope']">
          Customer 360 CRM
        </h2>
        <p className="text-xs text-[var(--muted)] mt-0.5">
          Unified collector directory, lifetime orders, circular wallet balances, and direct push alerts.
        </p>
      </div>

      {/* CRM Table */}
      <DataTable
        data={synthesizedProfiles as (Profile & Record<string, unknown>)[]}
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
                  <Avatar className="h-12 w-12 border border-[var(--line-2)]">
                    <AvatarImage src={selectedProfile.avatar_url || undefined} />
                    <AvatarFallback className="bg-[var(--well)] text-[var(--text)] font-bold">
                      {getInitials(selectedProfile.full_name || selectedProfile.email || "CO")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-base text-[var(--text)]">
                      {selectedProfile.full_name || "REVARA Collector"}
                    </SheetTitle>
                    <SheetDescription className="font-mono text-xs text-[var(--muted)]">
                      {selectedProfile.email || selectedProfile.id}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-6 py-4">
                {/* Metrics ribbon */}
                <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--line)] text-center">
                  <div>
                    <p className="text-[10px] text-[var(--muted)] uppercase font-mono">Wallet Credits</p>
                    <p className="text-sm font-bold font-mono text-[var(--primary)]">
                      {formatCurrency(userWallet?.available_credits || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--muted)] uppercase font-mono">Orders Placed</p>
                    <p className="text-sm font-bold font-mono text-[var(--text)]">
                      {userOrders.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--muted)] uppercase font-mono">Trade-Ins</p>
                    <p className="text-sm font-bold font-mono text-[var(--up)]">
                      {userExchanges.length}
                    </p>
                  </div>
                </div>

                {/* Orders History */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5 text-[var(--primary)]" /> Order History ({userOrders.length})
                  </h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                    {userOrders.length === 0 ? (
                      <p className="text-xs text-[var(--muted)] italic p-2">No orders recorded.</p>
                    ) : (
                      userOrders.map((o) => (
                        <div
                          key={o.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-[var(--well)] text-xs border border-[var(--line)]"
                        >
                          <span className="font-mono font-bold text-[var(--text)]">
                            #{o.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className="font-mono text-[var(--primary)] font-bold">
                            {formatCurrency(o.total_amount)}
                          </span>
                          <span className="text-[10px] uppercase font-mono text-[var(--muted)]">
                            {o.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Trade-Ins History */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
                    <Repeat className="h-3.5 w-3.5 text-[var(--up)]" /> Garments Trade-In Submissions ({userExchanges.length})
                  </h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                    {userExchanges.length === 0 ? (
                      <p className="text-xs text-[var(--muted)] italic p-2">No trade-ins recorded.</p>
                    ) : (
                      userExchanges.map((e) => (
                        <div
                          key={e.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-[var(--well)] text-xs border border-[var(--line)]"
                        >
                          <span className="font-mono font-bold text-[var(--text)]">
                            #{e.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className="font-mono text-[var(--up)] font-bold">
                            ₹{e.final_credits || 0} Credits
                          </span>
                          <span className="text-[10px] uppercase font-mono text-[var(--muted)]">
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
                    className="w-full bg-[var(--ink)] hover:opacity-90 text-[var(--on-ink)] gap-2 text-xs rounded-xl"
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
