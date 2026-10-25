import { useState } from "react"
import {
  Settings as SettingsIcon,
  Database,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Server,
  Layers,
  ShoppingBag,
  Repeat,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useDashboardData } from "@/hooks/useDashboardData"
import {
  SUPABASE_URL,
  seedMasterDataInSupabase,
} from "@/lib/supabase"
import { toast } from "sonner"

export function SettingsTab() {
  const { state, refreshData, isSyncing } = useDashboardData()
  const [isSeeding, setIsSeeding] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [typedConfirm, setTypedConfirm] = useState("")

  const handleSeedExecution = async () => {
    if (typedConfirm !== "SEED MASTER") {
      toast.error('Please type "SEED MASTER" to confirm.')
      return
    }

    setIsSeeding(true)
    try {
      await seedMasterDataInSupabase()
      toast.success("Master database synchronization complete! Categories, products, and corridors seeded.")
      await refreshData()
      setConfirmOpen(false)
      setTypedConfirm("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Master seed failed.")
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Database & Infrastructure Settings</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Live connection telemetry with Supabase cloud PostgreSQL, storage buckets, and master data seeding.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Cloud Connection */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#131B2E] p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                <Cloud className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Supabase Cloud Engine</h3>
                <p className="text-[11px] text-slate-400 font-mono">Managed PostgreSQL & GoTrue</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 status-beacon-active" />
              CONNECTED
            </span>
          </div>

          <div className="space-y-2 p-3.5 rounded-xl bg-[#0B101D] border border-white/[0.06] text-xs font-mono space-y-1">
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-slate-500">Project Endpoint</span>
              <span className="text-indigo-300 truncate max-w-[220px]">{SUPABASE_URL}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-slate-500">Realtime Channel</span>
              <span className="text-emerald-400">revara_command_center_realtime</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-slate-500">Storage Buckets</span>
              <span className="text-slate-300">tff-products, tff-exchange-photos</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Last Full Sync</span>
              <span className="text-slate-300">
                {state.lastSyncTime ? state.lastSyncTime.toLocaleTimeString() : "Pending"}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => refreshData()}
            disabled={isSyncing}
            className="w-full text-xs gap-2 border-white/10"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-indigo-400" : ""}`} />
            <span>Force Full Cloud Resync</span>
          </Button>
        </div>

        {/* Card 2: Live Database Row Counters */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#131B2E] p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Live Row Counts</h3>
              <p className="text-[11px] text-slate-400">Database telemetry across primary public tables</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-[#0B101D] border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Products</span>
              <p className="text-base font-bold font-mono text-white">{state.products.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#0B101D] border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Orders</span>
              <p className="text-base font-bold font-mono text-white">{state.orders.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#0B101D] border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Trade-Ins</span>
              <p className="text-base font-bold font-mono text-white">{state.exchanges.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#0B101D] border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Wallets</span>
              <p className="text-base font-bold font-mono text-white">{state.wallets.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Master Database Seed Engine */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/30 via-[#131B2E] to-[#0E1524] p-6 space-y-4 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                1-Click Master Database Seed Engine
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mt-1 max-w-2xl">
                Populates all 7 core categories, master production merchandise (Gardening Set, Solaris Light, Food Container Set, Cleaning Station, Organizer Trolley), Mumbai MMR active delivery PIN corridors, and welcome coupons into live Supabase tables.
              </p>
            </div>
          </div>

          <Button
            onClick={() => setConfirmOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-indigo-600/30 gap-2 shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            <span>Execute Master Seed</span>
          </Button>
        </div>
      </div>

      {/* Typed Confirmation Modal for Seeding */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle>Confirm Master Seed Synchronization</DialogTitle>
                <DialogDescription>
                  This operation will upsert core product merchandise, categories, coupons, and delivery corridors.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <p className="text-slate-300">
              Please type <strong className="text-amber-400 font-mono">SEED MASTER</strong> below to proceed:
            </p>
            <Input
              value={typedConfirm}
              onChange={(e) => setTypedConfirm(e.target.value)}
              placeholder="SEED MASTER"
              className="font-mono text-xs uppercase"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={typedConfirm !== "SEED MASTER" || isSeeding}
              onClick={handleSeedExecution}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              <span>{isSeeding ? "Synchronizing Cloud..." : "Confirm & Execute Seed"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
