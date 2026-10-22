import { useState } from "react"
import { Star, Trash2, CheckCircle2, Package, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDashboardData } from "@/hooks/useDashboardData"
import type { Review } from "@/types"
import { formatDateTime } from "@/lib/utils"
import { deleteReviewInSupabase } from "@/lib/supabase"
import { toast } from "sonner"

export function ReviewsTab() {
  const { state, refreshData } = useDashboardData()
  const [selectedRating, setSelectedRating] = useState<number | "all">("all")

  const filteredReviews = state.reviews.filter((r) => {
    if (selectedRating === "all") return true
    return r.rating === selectedRating
  })

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this customer review?")) return
    try {
      const res = await deleteReviewInSupabase(reviewId)
      if (res.error) throw res.error
      toast.success("Review deleted!")
      await refreshData()
    } catch {
      toast.error("Failed to delete review.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Customer Reviews & UGC</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor verified purchaser feedback, star ratings, and moderate UGC.
          </p>
        </div>

        {/* Rating filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#131B2E] border border-white/[0.08]">
          <button
            onClick={() => setSelectedRating("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
              selectedRating === "all" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            All ({state.reviews.length})
          </button>
          {[5, 4, 3, 2, 1].map((stars) => (
            <button
              key={stars}
              onClick={() => setSelectedRating(stars)}
              className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer ${
                selectedRating === stars ? "bg-amber-600 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              <span>{stars}</span>
              <Star className="h-3 w-3 fill-current" />
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReviews.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl border border-white/10 bg-[#131B2E] text-slate-400 text-xs">
            No customer reviews found matching this filter.
          </div>
        ) : (
          filteredReviews.map((r) => {
            const product = state.products.find((p) => p.id === r.product_id)
            const customer = state.profiles.find((p) => p.id === r.user_id)

            return (
              <div
                key={r.id}
                className="rounded-2xl border border-white/[0.08] bg-[#131B2E] p-4 flex flex-col justify-between space-y-3 shadow-xl hover:border-amber-500/30 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    {/* Stars */}
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < r.rating ? "fill-amber-400" : "text-slate-600"
                          }`}
                        />
                      ))}
                    </div>

                    <span className="text-[10px] font-mono text-slate-500">
                      {formatDateTime(r.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed italic">
                    "{r.body || r.comment || 'No review text'}"
                  </p>

                  {/* Review photos */}
                  {r.photo_urls && r.photo_urls.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {r.photo_urls.map((url, i) => (
                        <img key={i} src={url} alt="" className="h-12 w-12 rounded-md object-cover border border-white/10" />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-white/[0.05]">
                  {/* Product */}
                  <div className="flex items-center gap-2 overflow-hidden text-[11px] text-slate-300">
                    <Package className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate font-semibold">{product?.name || "Product Item"}</span>
                  </div>

                  {/* Customer & Actions */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1 truncate">
                      <User className="h-3 w-3 text-cyan-400 shrink-0" />
                      <span>{r.user_name || customer?.full_name || "Verified Collector"}</span>
                    </span>

                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                      title="Delete Review"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
