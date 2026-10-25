import { useState, useMemo } from "react"
import {
  Repeat,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Sparkles,
  Eye,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable, type ColumnDef } from "@/components/ui/table-with-dialog"
import {
  AppleCardsCarousel,
  type CarouselCardItem,
} from "@/components/ui/apple-cards-carousel"
import { useDashboardData } from "@/hooks/useDashboardData"
import type { ExchangeRequest } from "@/types"
import { formatCurrency, formatDateTime, statusColor } from "@/lib/utils"
import { deleteExchangeInSupabase, deleteExchangesBulkInSupabase } from "@/lib/supabase"
import { toast } from "sonner"

export interface ExchangesTabProps {
  onSelectExchange: (exchange: ExchangeRequest) => void
}

export function ExchangesTab({ onSelectExchange }: ExchangesTabProps) {
  const { state, refreshData } = useDashboardData()
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredExchanges = useMemo(() => {
    if (statusFilter === "all") return state.exchanges
    return state.exchanges.filter((e) => e.status === statusFilter)
  }, [state.exchanges, statusFilter])

  // Carousel items from submitted garment photos (LIVE data only, NO mock fallbacks)
  const tradeInGalleryItems: CarouselCardItem[] = useMemo(() => {
    const list: CarouselCardItem[] = []
    state.exchangeItems.forEach((item) => {
      const parentExchange = state.exchanges.find((e) => e.id === item.exchange_id)
      // Pick first genuine image (excluding video URLs)
      const imagePhotos = (item.photos || []).filter(
        (url) => !url.toLowerCase().endsWith(".mp4") && !url.toLowerCase().includes(".mp4")
      )
      const photo = imagePhotos[0]
      const hasVideo =
        Boolean(item.video_url) ||
        (item.photos || []).some((u) => u.toLowerCase().includes(".mp4"))

      // Only display items with genuine user-uploaded media
      if (!photo) return

      list.push({
        id: item.id,
        title: `${item.brand || (item as any).material || "Vintage"} ${item.category || "Garment"}`,
        category: `${item.condition || "Trade-In"} • ${(item as any).quantity || 1} pcs`,
        src: photo,
        badge: hasVideo ? "VIDEO INSPECTED" : "VERIFIED PHOTOS",
        content: (
          <p className="text-xs text-[var(--muted)]">
            Exchange #{(parentExchange as any)?.exchange_id || parentExchange?.id.slice(0, 8).toUpperCase()} • Condition: {item.condition || "Good"}
          </p>
        ),
      })
    })

    return list.slice(0, 8)
  }, [state.exchangeItems, state.exchanges])

  const columns: ColumnDef<ExchangeRequest>[] = [
    {
      key: "id",
      header: "Exchange ID",
      sortable: true,
      accessor: (e) => e.id,
      render: (e) => (
        <span className="font-mono font-bold text-[var(--text)]">
          #{e.id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      key: "collector",
      header: "Collector",
      sortable: true,
      accessor: (e) => {
        const c = state.profiles.find((p) => p.id === e.user_id)
        return c?.full_name || e.customer_name || "Collector"
      },
      render: (e) => {
        const c = state.profiles.find((p) => p.id === e.user_id)
        return (
          <div>
            <p className="font-semibold text-[var(--text)]">
              {c?.full_name || e.customer_name || "Collector"}
            </p>
            <p className="text-[11px] text-[var(--muted)] font-mono">
              {c?.email || e.customer_email || e.user_id.slice(0, 8)}
            </p>
          </div>
        )
      },
    },
    {
      key: "items",
      header: "Submissions & Media",
      render: (e) => {
        const items = state.exchangeItems.filter((i) => i.exchange_id === e.id)
        const hasVideo = items.some((i) => Boolean(i.video_url))
        const totalPhotos = items.reduce((acc, i) => acc + (i.photos?.length || 0), 0)

        return (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text)] text-xs">
              {items.length} {items.length === 1 ? "garment" : "garments"}
            </span>
            {hasVideo && (
              <span className="px-1.5 py-0.5 rounded bg-[var(--well)] text-[var(--primary)] border border-[var(--line-2)] text-[10px] font-mono flex items-center gap-0.5">
                <Video className="h-2.5 w-2.5" /> Video
              </span>
            )}
            {totalPhotos > 0 && (
              <span className="text-[10px] text-[var(--muted)] font-mono">
                ({totalPhotos} photos)
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: "status",
      header: "Appraisal Status",
      sortable: true,
      accessor: (e) => e.status,
      render: (e) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase border ${statusColor(
            e.status
          )}`}
        >
          {e.status}
        </span>
      ),
    },
    {
      key: "final_credits",
      header: "Credits Awarded",
      sortable: true,
      accessor: (e) => Number(e.final_credits || 0),
      render: (e) => (
        <span className="font-mono font-bold text-[var(--up)] text-xs">
          {e.final_credits ? `₹${e.final_credits}` : <span className="text-[var(--muted)] italic">—</span>}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Submitted",
      sortable: true,
      accessor: (e) => e.created_at,
      render: (e) => (
        <span className="text-[var(--muted)] font-mono text-[11px]">
          {formatDateTime(e.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Appraisal",
      render: (e) => (
        <div className="flex items-center gap-1.5" onClick={(ev) => ev.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSelectExchange(e)}
            className="h-7 text-[11px] gap-1 hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            <Eye className="h-3 w-3" />
            <span>Inspect & Grade →</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              if (
                confirm(
                  `Permanently delete garment trade-in submission #${e.id.slice(0, 8).toUpperCase()} from Supabase?`
                )
              ) {
                try {
                  const res = await deleteExchangeInSupabase(e.id)
                  if (res.error) throw res.error
                  toast.success(`Trade-in #${e.id.slice(0, 8).toUpperCase()} deleted.`)
                  await refreshData()
                } catch {
                  toast.error("Failed to delete trade-in.")
                }
              }
            }}
            className="h-7 w-7 p-0 text-[var(--muted)] hover:text-rose-500 hover:bg-rose-500/10"
            title="Delete Trade-In Submission"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  const statusTabs = [
    { id: "all", label: "All Trade-Ins" },
    { id: "submitted", label: "Awaiting Review" },
    { id: "credits_issued", label: "Credits Issued" },
    { id: "rejected", label: "Rejected" },
  ]

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-[var(--text)] tracking-tight font-['Manrope']">
          Circular Garments Trade-In Studio
        </h2>
        <p className="text-xs text-[var(--muted)] mt-0.5">
          Appraise collected garments, verify condition photos/videos, award credit deposits.
        </p>
      </div>

      {/* Trade-In Gallery Carousel */}
      {tradeInGalleryItems.length > 0 && (
        <AppleCardsCarousel items={tradeInGalleryItems} />
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 ${
              statusFilter === tab.id
                ? "bg-[var(--ink)] text-[var(--on-ink)] font-semibold shadow-xs"
                : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--line)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        data={filteredExchanges as (ExchangeRequest & Record<string, unknown>)[]}
        columns={columns as ColumnDef<ExchangeRequest & Record<string, unknown>>[]}
        keyExtractor={(e) => e.id}
        searchPlaceholder="Search exchange ID or collector..."
        onRowClick={(e) => onSelectExchange(e as unknown as ExchangeRequest)}
        exportFilename="revara-trade-ins"
        bulkActions={[
          {
            label: "Delete Selected",
            variant: "destructive",
            onClick: async (selected) => {
              const ids = selected.map((s) => s.id)
              if (
                confirm(
                  `Permanently delete ${ids.length} trade-in submissions from Supabase?`
                )
              ) {
                try {
                  const res = await deleteExchangesBulkInSupabase(ids)
                  if (res.error) throw res.error
                  toast.success(`Deleted ${res.count} submissions from Supabase.`)
                  await refreshData()
                } catch {
                  toast.error("Failed to delete submissions.")
                }
              }
            },
          },
        ]}
      />
    </div>
  )
}
