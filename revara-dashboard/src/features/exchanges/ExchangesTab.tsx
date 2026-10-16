import { useState, useMemo } from "react"
import {
  Repeat,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Sparkles,
  Eye,
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

export interface ExchangesTabProps {
  onSelectExchange: (exchange: ExchangeRequest) => void
}

export function ExchangesTab({ onSelectExchange }: ExchangesTabProps) {
  const { state } = useDashboardData()
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredExchanges = useMemo(() => {
    if (statusFilter === "all") return state.exchanges
    return state.exchanges.filter((e) => e.status === statusFilter)
  }, [state.exchanges, statusFilter])

  // Carousel items from submitted garment photos
  const tradeInGalleryItems: CarouselCardItem[] = useMemo(() => {
    const list: CarouselCardItem[] = []
    state.exchangeItems.forEach((item) => {
      const parentExchange = state.exchanges.find((e) => e.id === item.exchange_id)
      const photo =
        item.photos?.[0] ||
        "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop&q=80"

      list.push({
        id: item.id,
        title: `${item.brand || "Vintage"} ${item.category || "Garment"}`,
        category: item.condition || "Trade-In",
        src: photo,
        badge: item.video_url ? "VIDEO INSPECTION" : undefined,
        content: (
          <p className="text-xs text-slate-300">
            Exchange #{parentExchange?.id.slice(0, 8).toUpperCase()} • Condition: {item.condition || "Good"}
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
        <span className="font-mono font-bold text-white">
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
            <p className="font-semibold text-white">
              {c?.full_name || e.customer_name || "Collector"}
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
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
            <span className="font-semibold text-white text-xs">
              {items.length} {items.length === 1 ? "garment" : "garments"}
            </span>
            {hasVideo && (
              <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono flex items-center gap-0.5">
                <Video className="h-2.5 w-2.5" /> Video
              </span>
            )}
            {totalPhotos > 0 && (
              <span className="text-[10px] text-slate-400 font-mono">
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
          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase border ${statusColor(
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
        <span className="font-mono font-bold text-emerald-400 text-xs">
          {e.final_credits ? `₹${e.final_credits}` : <span className="text-slate-500 italic">—</span>}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Submitted",
      sortable: true,
      accessor: (e) => e.created_at,
      render: (e) => (
        <span className="text-slate-400 font-mono text-[11px]">
          {formatDateTime(e.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Appraisal",
      render: (e) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(ev) => {
            ev.stopPropagation()
            onSelectExchange(e)
          }}
          className="h-7 text-[11px] gap-1 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 transition-colors"
        >
          <Eye className="h-3 w-3" />
          <span>Inspect & Grade →</span>
        </Button>
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
        <h2 className="text-xl font-bold text-white tracking-tight">
          Circular Garments Trade-In Studio
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Appraise collected garments, verify condition photos/videos, award credit deposits.
        </p>
      </div>

      {/* Trade-In Gallery Carousel */}
      {tradeInGalleryItems.length > 0 && (
        <AppleCardsCarousel items={tradeInGalleryItems} />
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 ${
              statusFilter === tab.id
                ? "bg-emerald-600 text-white font-semibold shadow-sm"
                : "bg-[#131B2E] text-slate-400 hover:text-white border border-white/[0.08]"
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
      />
    </div>
  )
}
