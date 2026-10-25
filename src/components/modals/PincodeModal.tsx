import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin } from "lucide-react"
import type { ServiceablePincode } from "@/types"
import { createPincodeInSupabase } from "@/lib/supabase"
import { useDashboardData } from "@/hooks/useDashboardData"
import { toast } from "sonner"

export interface PincodeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PincodeModal({ open, onOpenChange }: PincodeModalProps) {
  const { refreshData } = useDashboardData()

  const [pincode, setPincode] = useState("")
  const [cityName, setCityName] = useState("")
  const [stateName, setStateName] = useState("Maharashtra")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pincode.trim() || pincode.trim().length !== 6) {
      toast.error("Please enter a valid 6-digit Indian PIN code.")
      return
    }

    setIsSubmitting(true)
    try {
      const clean: Partial<ServiceablePincode> = {
        pincode: pincode.trim(),
        city_name: cityName.trim() || "Mumbai Corridor",
        state: stateName.trim() || "Maharashtra",
        status: "active",
        active_route_available: true,
      }

      const res = await createPincodeInSupabase(clean)
      if (res.error) throw res.error

      toast.success(`Activated serviceable PIN corridor ${pincode}!`)
      await refreshData()
      onOpenChange(false)
      setPincode("")
      setCityName("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add PIN code.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>Activate Delivery Corridor</DialogTitle>
              <DialogDescription>
                Enable instant logistics and trade-in pickup for a PIN code.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              6-Digit Postal PIN Code
            </label>
            <Input
              required
              maxLength={6}
              placeholder="e.g. 400078"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Area / Hub Name
            </label>
            <Input
              required
              placeholder="e.g. Mumbai (Bhandup / Nahur)"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              State
            </label>
            <Input
              value={stateName}
              onChange={(e) => setStateName(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              <span>{isSubmitting ? "Activating..." : "Activate Corridor"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
