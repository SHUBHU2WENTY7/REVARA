import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Smartphone, ExternalLink, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MobileRedirectBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [appDeepLink, setAppDeepLink] = useState("")

  useEffect(() => {
    try {
      const hash = window.location.hash || ""
      const search = window.location.search || ""
      const isAuthCallback =
        hash.includes("access_token=") ||
        hash.includes("refresh_token=") ||
        search.includes("code=")
      const isWebSource = search.includes("source=web")

      // Only prompt deep-link if an auth callback leaked without source=web on a mobile user-agent
      if (isAuthCallback && !isWebSource) {
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        if (isMobile) {
          const deepLink = `io.supabase.thefigurefactory://login-callback${hash}`
          setAppDeepLink(deepLink)
          window.location.href = deepLink
          setTimeout(() => setShowBanner(true), 400)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  if (!showBanner) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="max-w-md w-full bg-[#12151E] border border-indigo-500/40 rounded-3xl p-8 text-center shadow-2xl space-y-6"
        >
          <div className="inline-flex w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 items-center justify-center text-indigo-400">
            <Smartphone className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-wide">
              Return to REVARA Mobile App
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              You signed in via Google Authentication. Tap below to launch your session inside the mobile app.
            </p>
          </div>

          <div className="space-y-3">
            <a
              href={appDeepLink}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/40 transition-all"
            >
              <span>Open REVARA App</span>
              <ExternalLink className="h-4 w-4" />
            </a>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBanner(false)}
              className="w-full text-slate-400 border-white/10 text-xs"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              <span>Stay on Operations Web Dashboard</span>
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
