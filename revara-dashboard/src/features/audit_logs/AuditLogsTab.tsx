import { useState } from "react"
import { ShieldCheck, Search, FileCode, Check, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { DataTable, type ColumnDef } from "@/components/ui/table-with-dialog"
import { useDashboardData } from "@/hooks/useDashboardData"
import type { AuditLog } from "@/types"
import { formatDateTime } from "@/lib/utils"

export function AuditLogsTab() {
  const { state } = useDashboardData()
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const columns: ColumnDef<AuditLog>[] = [
    {
      key: "action",
      header: "Operation Action",
      sortable: true,
      accessor: (a) => a.action,
      render: (a) => (
        <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-2 py-0.5 rounded">
          {a.action}
        </span>
      ),
    },
    {
      key: "entity",
      header: "Target Entity",
      sortable: true,
      accessor: (a) => a.entity_type,
      render: (a) => (
        <span className="font-mono text-xs text-slate-300">
          <strong className="text-white">{a.entity_type}</strong> #{a.entity_id?.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Audited Rationale",
      accessor: (a) => a.reason,
      render: (a) => (
        <span className="text-xs text-slate-300 truncate max-w-sm block">
          {a.reason || "Authorized via Command Center"}
        </span>
      ),
    },
    {
      key: "admin_id",
      header: "Admin Actor",
      accessor: (a) => a.admin_id || "System",
      render: (a) => (
        <span className="font-mono text-[11px] text-slate-400">
          {a.admin_id ? `adm_${a.admin_id.slice(0, 8)}` : "System/Bootstrap"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Timestamp",
      sortable: true,
      accessor: (a) => a.created_at,
      render: (a) => (
        <span className="font-mono text-[11px] text-slate-400">
          {formatDateTime(a.created_at)}
        </span>
      ),
    },
    {
      key: "diff",
      header: "Payload",
      render: (a) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation()
            setSelectedLog(a)
          }}
          className="h-6 text-[10px] gap-1 hover:bg-white/10"
        >
          <FileCode className="h-3 w-3" />
          <span>Diff</span>
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Forensic Operational Audit Trail
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Immutable ledger of every administrative update, credit deposit, and catalog mutation.
        </p>
      </div>

      {/* Audit Log Table */}
      <DataTable
        data={state.auditLogs as (AuditLog & Record<string, unknown>)[]}
        columns={columns as ColumnDef<AuditLog & Record<string, unknown>>[]}
        keyExtractor={(a) => a.id}
        searchPlaceholder="Search action, entity type, reason, or admin..."
        onRowClick={(a) => setSelectedLog(a as unknown as AuditLog)}
        exportFilename="revara-audit-logs"
      />

      {/* Audit Log Diff Dialog */}
      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-xl">
          {selectedLog && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <DialogTitle className="font-mono text-sm">
                      {selectedLog.action} on {selectedLog.entity_type}
                    </DialogTitle>
                    <DialogDescription className="font-mono text-[11px]">
                      {formatDateTime(selectedLog.created_at)} • Actor: {selectedLog.admin_id || "System"}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-3 py-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-400 uppercase text-[10px]">Reason:</span>
                  <p className="text-white mt-0.5">{selectedLog.reason}</p>
                </div>

                {selectedLog.old_value !== null && (
                  <div>
                    <span className="font-semibold text-rose-400 uppercase text-[10px]">Old State:</span>
                    <pre className="mt-1 p-3 rounded-lg bg-[#0B101D] border border-white/10 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-36">
                      {JSON.stringify(selectedLog.old_value, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.new_value !== null && (
                  <div>
                    <span className="font-semibold text-emerald-400 uppercase text-[10px]">New State:</span>
                    <pre className="mt-1 p-3 rounded-lg bg-[#0B101D] border border-white/10 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48">
                      {JSON.stringify(selectedLog.new_value, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
