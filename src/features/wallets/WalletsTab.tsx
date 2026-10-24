import { useMemo } from "react"
import {
  Wallet as WalletIcon,
  TrendingUp,
  CreditCard,
  SlidersHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable, type ColumnDef } from "@/components/ui/table-with-dialog"
import { useDashboardData } from "@/hooks/useDashboardData"
import type { Wallet } from "@/types"
import { formatCurrency, formatDateTime } from "@/lib/utils"

export interface WalletsTabProps {
  onOpenAdjustModal: (userId: string, userName: string, balance: number) => void
}

export function WalletsTab({ onOpenAdjustModal }: WalletsTabProps) {
  const { state } = useDashboardData()

  // Aggregated KPI Totals
  const { totalEarned, totalLiability, totalRedeemed } = useMemo(() => {
    let earned = 0
    let liability = 0
    let redeemed = 0

    state.wallets.forEach((w) => {
      liability += Number(w.available_credits) || 0
      earned += Number(w.total_earned) || 0
      redeemed += Number(w.total_used) || 0
    })

    return { totalEarned: earned, totalLiability: liability, totalRedeemed: redeemed }
  }, [state.wallets])

  const columns: ColumnDef<Wallet>[] = [
    {
      key: "user",
      header: "Collector / Customer",
      sortable: true,
      accessor: (w) => {
        const p = state.profiles.find((x) => x.id === w.user_id)
        return p?.full_name || w.user_id
      },
      render: (w) => {
        const p = state.profiles.find((x) => x.id === w.user_id)
        return (
          <div>
            <p className="font-semibold text-[var(--text)]">
              {p?.full_name || "Registered Collector"}
            </p>
            <p className="text-[11px] text-[var(--muted)] font-mono">
              {p?.email || w.user_id.slice(0, 12)}
            </p>
          </div>
        )
      },
    },
    {
      key: "available_credits",
      header: "Available Balance",
      sortable: true,
      accessor: (w) => Number(w.available_credits),
      render: (w) => (
        <span className="font-mono font-bold text-sm text-[var(--primary)]">
          {formatCurrency(w.available_credits)}
        </span>
      ),
    },
    {
      key: "total_earned",
      header: "Total Earned",
      sortable: true,
      accessor: (w) => Number(w.total_earned),
      render: (w) => (
        <span className="font-mono text-xs text-[var(--up)] font-semibold">
          {formatCurrency(w.total_earned)}
        </span>
      ),
    },
    {
      key: "total_used",
      header: "Total Redeemed",
      sortable: true,
      accessor: (w) => Number(w.total_used),
      render: (w) => (
        <span className="font-mono text-xs text-[var(--muted)]">
          {formatCurrency(w.total_used)}
        </span>
      ),
    },
    {
      key: "updated_at",
      header: "Last Ledger Update",
      sortable: true,
      accessor: (w) => w.updated_at,
      render: (w) => (
        <span className="text-[11px] font-mono text-[var(--muted)]">
          {formatDateTime(w.updated_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Adjust",
      render: (w) => {
        const p = state.profiles.find((x) => x.id === w.user_id)
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              onOpenAdjustModal(
                w.user_id,
                p?.full_name || p?.email || "Collector",
                Number(w.available_credits)
              )
            }}
            className="h-7 text-[11px] gap-1 hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            <SlidersHorizontal className="h-3 w-3" />
            <span>± Adjust</span>
          </Button>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-[var(--text)] tracking-tight font-['Manrope']">
          Wallets & Circular Credit Ledger
        </h2>
        <p className="text-xs text-[var(--muted)] mt-0.5">
          Audited store credit balances, circular trade-in earnings, and checkout redemptions.
        </p>
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Total Credits Earned
            </span>
            <TrendingUp className="h-4 w-4 text-[var(--up)]" />
          </div>
          <p className="text-xl font-bold font-mono text-[var(--up)]">
            {formatCurrency(totalEarned)}
          </p>
          <p className="text-[10px] text-[var(--faint)]">Cumulative circular payouts</p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Active Store Liability
            </span>
            <WalletIcon className="h-4 w-4 text-[var(--primary)]" />
          </div>
          <p className="text-xl font-bold font-mono text-[var(--primary)]">
            {formatCurrency(totalLiability)}
          </p>
          <p className="text-[10px] text-[var(--faint)]">Current customer available balance</p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Credits Redeemed
            </span>
            <CreditCard className="h-4 w-4 text-[var(--muted)]" />
          </div>
          <p className="text-xl font-bold font-mono text-[var(--text)]">
            {formatCurrency(totalRedeemed)}
          </p>
          <p className="text-[10px] text-[var(--faint)]">Applied towards checkout orders</p>
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={state.wallets as (Wallet & Record<string, unknown>)[]}
        columns={columns as ColumnDef<Wallet & Record<string, unknown>>[]}
        keyExtractor={(w) => w.user_id}
        searchPlaceholder="Search customer ID or profile..."
        exportFilename="revara-wallets"
      />
    </div>
  )
}
