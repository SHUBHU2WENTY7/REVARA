import { useState } from "react"
import { motion } from "motion/react"
import { ShieldAlert, ShieldCheck, LogOut, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"

export function UnauthorizedScreen() {
  const { unauthorizedUser, claimAdminAccess, logout } = useAuth()
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)

  const handleClaim = async () => {
    setIsClaiming(true)
    setClaimError(null)
    try {
      await claimAdminAccess()
    } catch (err: any) {
      setClaimError(err.message || "Failed to claim administrator access")
    } finally {
      setIsClaiming(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080C14]">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-[#0E1524] p-8 text-center shadow-2xl space-y-6"
      >
        <div className="mx-auto h-14 w-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-white tracking-wide">
            Unauthorized Access
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The authenticated Firebase account (
            <strong className="text-slate-200">{unauthorizedUser?.email || "Unknown User"}</strong>
            ) is signed in, but does not yet have administrator privileges in the REVARA Command Center.
          </p>
        </div>

        {claimError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300">
            {claimError}
          </div>
        )}

        <div className="space-y-3 pt-2">
          <Button
            onClick={handleClaim}
            disabled={isClaiming}
            className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-indigo-600/30 gap-2 cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{isClaiming ? "ACTIVATING PRIVILEGES..." : "CLAIM & ACTIVATE SUPER ADMIN PRIVILEGES"}</span>
            <ArrowRight className="h-4 w-4 ml-auto" />
          </Button>

          <Button
            variant="outline"
            onClick={logout}
            className="w-full h-9 text-xs text-slate-400 hover:text-white border-white/10 gap-2 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out & Try Another Account</span>
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
