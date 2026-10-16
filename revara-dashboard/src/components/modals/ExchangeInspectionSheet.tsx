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
  Repeat,
  Sparkles,
  Scale,
  Video,
  Award,
  CheckCircle2,
  AlertCircle,
  Maximize2,
} from "lucide-react"
import type { ExchangeRequest, ExchangeInspection } from "@/types"
import { submitExchangeInspectionInSupabase } from "@/lib/supabase"
import { useDashboardData } from "@/hooks/useDashboardData"
import { formatDateTime, statusColor } from "@/lib/utils"
import { toast } from "sonner"

export interface ExchangeInspectionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exchange: ExchangeRequest | null
}

export function ExchangeInspectionSheet({
  open,
  onOpenChange,
  exchange,
}: ExchangeInspectionSheetProps) {
  const { state, refreshData } = useDashboardData()

  const [weight, setWeight] = useState<number | "">("")
  const [grade, setGrade] = useState<"a" | "b" | "c" | "rejected">("a")
  const [acceptedCount, setAcceptedCount] = useState<number | "">(1)
  const [rejectedCount, setRejectedCount] = useState<number | "">(0)
  const [finalCredits, setFinalCredits] = useState<number | "">(500)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  // Auto-calculate credits based on grade
  const handleGradeChange = (newGrade: "a" | "b" | "c" | "rejected") => {
    setGrade(newGrade)
    const gradeCredits: Record<string, number> = {
      a: 500,
      b: 350,
      c: 200,
      rejected: 0,
    }
    setFinalCredits(gradeCredits[newGrade] ?? 0)
  }

  useEffect(() => {
    if (exchange) {
      if (exchange.inspection) {
        setWeight(exchange.inspection.actual_weight_kg)
        setGrade(exchange.inspection.grade)
        setAcceptedCount(exchange.inspection.accepted_items_count)
        setRejectedCount(exchange.inspection.rejected_items_count)
        setFinalCredits(exchange.inspection.final_credits_issued)
        setNotes(exchange.inspection.inspector_notes)
      } else {
        setWeight("")
        handleGradeChange("a")
        setAcceptedCount(1)
        setRejectedCount(0)
        setNotes("")
      }
    }
  }, [exchange])

  if (!exchange) return null

  const items = state.exchangeItems.filter((i) => i.exchange_id === exchange.id)
  const customer = state.profiles.find((p) => p.id === exchange.user_id)
  const isAlreadyProcessed =
    exchange.status === "credits_issued" || exchange.status === "completed"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isAlreadyProcessed) {
      toast.error("Credits have already been issued for this trade-in request.")
      return
    }

    if (weight === "" || finalCredits === "") {
      toast.error("Please enter measured garment weight and credit award.")
      return
    }

    setIsSubmitting(true)
    try {
      const inspectionData: ExchangeInspection = {
        exchange_id: exchange.id,
        actual_weight_kg: Number(weight),
        grade,
        accepted_items_count: Number(acceptedCount) || 1,
        rejected_items_count: Number(rejectedCount) || 0,
        final_credits_issued: Number(finalCredits),
        inspector_notes: notes.trim(),
      }

      const res = await submitExchangeInspectionInSupabase(
        exchange.id,
        exchange.user_id,
        inspectionData
      )
      if (res.error) throw res.error

      toast.success(
        `Approved! ₹${finalCredits} wallet credits deposited for ${
          customer?.full_name || "collector"
        }!`
      )
      await refreshData()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to finalize inspection.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Repeat className="h-4 w-4" />
                </div>
                <div>
                  <SheetTitle className="font-mono">
                    Trade-In #{exchange.id.slice(0, 8).toUpperCase()}
                  </SheetTitle>
                  <SheetDescription>
                    Submitted {formatDateTime(exchange.created_at)}
                  </SheetDescription>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold font-mono uppercase border ${statusColor(
                  exchange.status
                )}`}
              >
                {exchange.status}
              </span>
            </div>
          </SheetHeader>

          <div className="space-y-5 py-4">
            {/* Customer & Submission Info */}
            <div className="p-3.5 rounded-xl bg-[#0B101D] border border-white/[0.08] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  {customer?.full_name || exchange.customer_name || "Collector"}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {customer?.email || exchange.customer_email || "No email"}
                </span>
              </div>
              {exchange.customer_notes && (
                <p className="text-xs text-slate-300 italic pt-1 border-t border-white/[0.05]">
                  "{exchange.customer_notes}"
                </p>
              )}
            </div>

            {/* Media Vault Gallery & Video */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" /> Garment Inspection Media Vault
              </h4>

              <div className="space-y-3">
                {items.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3 rounded-lg bg-white/[0.02]">
                    No garments recorded for this trade-in.
                  </p>
                ) : (
                  items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-[#0B101D] border border-white/[0.08] space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">
                          Garment #{idx + 1} — {item.category || "Apparel"} ({item.brand || "Brand"})
                        </span>
                        <span className="text-indigo-400 text-[11px] font-mono">
                          {item.condition || "Gently Used"}
                        </span>
                      </div>

                      {/* Video Player */}
                      {item.video_url && (
                        <div className="rounded-lg overflow-hidden border border-white/10 bg-black">
                          <video
                            src={item.video_url}
                            controls
                            className="w-full max-h-48 object-contain"
                          />
                        </div>
                      )}

                      {/* Photo Grid */}
                      {item.photos && item.photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {item.photos.map((photo, pIdx) => (
                            <div
                              key={pIdx}
                              onClick={() => setLightboxImage(photo)}
                              className="relative h-20 rounded-lg overflow-hidden border border-white/10 group cursor-pointer"
                            >
                              <img
                                src={photo}
                                alt="Inspection"
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                <Maximize2 className="h-4 w-4" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Appraisal & Credit Deposit Form */}
            {isAlreadyProcessed ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Inspection Completed & Credited</h4>
                <p className="text-xs text-emerald-300">
                  Awarded: <strong className="font-mono text-white">₹{exchange.final_credits || finalCredits}</strong> REVARA Credits
                  <br />
                  Grade: <strong className="uppercase font-mono text-white">{grade}</strong> | Weight: <strong className="font-mono text-white">{weight} kg</strong>
                </p>
                {notes && <p className="text-xs text-slate-400 italic">Notes: {notes}</p>}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5 pt-3 border-t border-white/[0.08]">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-amber-400" /> Official Appraisal & Credit Issue
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Scale className="h-3 w-3" /> Measured Weight (KG)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 1.25"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Condition Grade
                    </label>
                    <select
                      value={grade}
                      onChange={(e) =>
                        handleGradeChange(e.target.value as "a" | "b" | "c" | "rejected")
                      }
                      className="flex h-9 w-full rounded-lg border border-white/10 bg-[#0B101D] px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    >
                      <option value="a">GRADE A — Pristine (₹500 Credits)</option>
                      <option value="b">GRADE B — Good Wear (₹350 Credits)</option>
                      <option value="c">GRADE C — Heavy Use (₹200 Credits)</option>
                      <option value="rejected">REJECTED — Damaged (₹0)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Accepted Items
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={acceptedCount}
                      onChange={(e) => setAcceptedCount(e.target.value === "" ? "" : Number(e.target.value))}
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Rejected Items
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={rejectedCount}
                      onChange={(e) => setRejectedCount(e.target.value === "" ? "" : Number(e.target.value))}
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                      Final Credits (₹)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      required
                      value={finalCredits}
                      onChange={(e) => setFinalCredits(e.target.value === "" ? "" : Number(e.target.value))}
                      className="font-mono text-xs text-emerald-400 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Inspector Notes / Reason
                  </label>
                  <Input
                    placeholder="Verified cotton blend, minor fade on hemline..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <SheetFooter className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-emerald-600/30 gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{isSubmitting ? "Depositing Credits..." : "Approve & Deposit Credits to Customer"}</span>
                  </Button>
                </SheetFooter>
              </form>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Lightbox Overlay */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-zoom-out"
        >
          <img
            src={lightboxImage}
            alt="Enlarged inspection view"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </>
  )
}
