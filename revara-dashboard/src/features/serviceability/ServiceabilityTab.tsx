import { MapPin, Plus, Trash2, CheckCircle2, XCircle, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable, type ColumnDef } from "@/components/ui/table-with-dialog"
import { useDashboardData } from "@/hooks/useDashboardData"
import type { ServiceablePincode, CityWaitlistEntry } from "@/types"
import { updatePincodeInSupabase, deletePincodeInSupabase } from "@/lib/supabase"
import { formatDateTime } from "@/lib/utils"
import { toast } from "sonner"

export interface ServiceabilityTabProps {
  onOpenPincodeModal: () => void
}

export function ServiceabilityTab({ onOpenPincodeModal }: ServiceabilityTabProps) {
  const { state, refreshData } = useDashboardData()

  const handleToggle = async (pin: ServiceablePincode) => {
    try {
      const nextStatus = pin.status === "active" ? "inactive" : "active"
      const res = await updatePincodeInSupabase(
        pin.pincode,
        nextStatus,
        pin.active_route_available
      )
      if (res.error) throw res.error
      toast.success(`PIN ${pin.pincode} status set to ${nextStatus.toUpperCase()}!`)
      await refreshData()
    } catch {
      toast.error("Failed to update corridor status.")
    }
  }

  const handleDelete = async (pin: ServiceablePincode) => {
    if (!confirm(`Are you sure you want to deactivate and remove corridor ${pin.pincode}?`)) return
    try {
      const res = await deletePincodeInSupabase(pin.pincode)
      if (res.error) throw res.error
      toast.success(`Removed PIN corridor ${pin.pincode}!`)
      await refreshData()
    } catch {
      toast.error("Failed to remove PIN corridor.")
    }
  }

  const pinColumns: ColumnDef<ServiceablePincode>[] = [
    {
      key: "pincode",
      header: "PIN Code",
      sortable: true,
      accessor: (p) => p.pincode,
      render: (p) => (
        <span className="font-mono font-bold text-white tracking-wider text-xs">
          {p.pincode}
        </span>
      ),
    },
    {
      key: "city_name",
      header: "Hub / Area Name",
      sortable: true,
      accessor: (p) => p.city_name,
      render: (p) => <span className="text-white font-medium">{p.city_name}</span>,
    },
    {
      key: "state",
      header: "State",
      sortable: true,
      accessor: (p) => p.state,
    },
    {
      key: "status",
      header: "Route Status",
      sortable: true,
      accessor: (p) => p.status,
      render: (p) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
            p.status === "active"
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : "bg-rose-500/15 text-rose-400 border-rose-500/30"
          }`}
        >
          {p.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (p) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleToggle(p)}
            className={`text-[11px] font-semibold px-2 py-0.5 rounded border transition-colors ${
              p.status === "active"
                ? "bg-rose-500/10 text-rose-300 border-rose-500/25 hover:bg-rose-500/20"
                : "bg-emerald-500/10 text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20"
            }`}
          >
            {p.status === "active" ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={() => handleDelete(p)}
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
            title="Delete Corridor"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  const waitlistColumns: ColumnDef<CityWaitlistEntry>[] = [
    {
      key: "pincode",
      header: "Requested PIN",
      sortable: true,
      accessor: (w) => w.pincode,
      render: (w) => (
        <span className="font-mono font-bold text-amber-300 text-xs">
          {w.pincode}
        </span>
      ),
    },
    {
      key: "collector",
      header: "Collector Name",
      accessor: (w) => w.collector_name || "Prospective Member",
    },
    {
      key: "phone",
      header: "Phone Contact",
      accessor: (w) => w.phone || "—",
      render: (w) => (
        <span className="font-mono text-slate-300 text-xs">{w.phone || "—"}</span>
      ),
    },
    {
      key: "estimated_garments",
      header: "Est. Garments",
      sortable: true,
      accessor: (w) => Number(w.estimated_garments || 0),
      render: (w) => (
        <span className="font-mono text-emerald-400 font-bold">
          {w.estimated_garments || 1} units
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Joined Waitlist",
      sortable: true,
      accessor: (w) => w.created_at,
      render: (w) => (
        <span className="text-[11px] font-mono text-slate-400">
          {formatDateTime(w.created_at)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      {/* Table 1: Active Corridors */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Active Delivery & Trade-In Corridors
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Serviceable postal codes enabled for rapid same-day logistics and circular garment pickups.
            </p>
          </div>

          <Button
            onClick={onOpenPincodeModal}
            className="h-8 gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Serviceable PIN</span>
          </Button>
        </div>

        <DataTable
          data={state.serviceability as (ServiceablePincode & Record<string, unknown>)[]}
          columns={pinColumns as ColumnDef<ServiceablePincode & Record<string, unknown>>[]}
          keyExtractor={(p) => p.pincode}
          searchPlaceholder="Search PIN code, hub name, or city..."
          exportFilename="revara-serviceable-pins"
        />
      </div>

      {/* Table 2: Customer Expansion Waitlist */}
      <div className="space-y-4 pt-4 border-t border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">
              Customer Expansion Waitlist
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold">
              {state.cityWaitlist.length} COLLECTORS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Geographic demand signals from collectors awaiting launch in unserviced areas.
          </p>
        </div>

        <DataTable
          data={state.cityWaitlist as (CityWaitlistEntry & Record<string, unknown>)[]}
          columns={waitlistColumns as ColumnDef<CityWaitlistEntry & Record<string, unknown>>[]}
          keyExtractor={(w) => w.id}
          searchPlaceholder="Search waitlist by PIN, collector, or phone..."
          exportFilename="revara-expansion-waitlist"
        />
      </div>
    </div>
  )
}
