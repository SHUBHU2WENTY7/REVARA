import { useState, useEffect } from "react"
import { motion } from "motion/react"
import {
  Search,
  Bell,
  Plus,
  Radio,
  RefreshCw,
  LogOut,
  User,
  Shield,
  Layers,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/useAuth"
import { useDashboardData } from "@/hooks/useDashboardData"
import type { TabId } from "@/types"
import { getInitials } from "@/lib/utils"

export interface ResizableNavbarProps {
  currentTab: TabId
  onSelectTab: (tab: TabId) => void
  onOpenCommandPalette: () => void
  onOpenBroadcastModal: () => void
  onOpenProductModal: () => void
  onToggleMobileMenu?: () => void
}

export function ResizableNavbar({
  currentTab,
  onSelectTab,
  onOpenCommandPalette,
  onOpenBroadcastModal,
  onOpenProductModal,
  onToggleMobileMenu,
}: ResizableNavbarProps) {
  const { admin, logout } = useAuth()
  const { state, isSyncing, refreshData } = useDashboardData()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const quickLinks: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "orders", label: "Orders" },
    { id: "products", label: "Catalog" },
    { id: "inventory", label: "Radar" },
    { id: "exchanges", label: "Trade-In" },
    { id: "activity", label: "Live Feed" },
  ]

  return (
    <motion.header
      animate={{
        paddingTop: isScrolled ? "0.5rem" : "0.75rem",
        paddingBottom: isScrolled ? "0.5rem" : "0.75rem",
        backgroundColor: isScrolled ? "rgba(11, 16, 29, 0.92)" : "rgba(8, 12, 20, 0.75)",
        borderColor: isScrolled ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.05)",
      }}
      transition={{ duration: 0.2 }}
      className="sticky top-0 z-30 w-full border-b backdrop-blur-xl px-4 lg:px-6 flex items-center justify-between gap-4"
    >
      {/* Left: Quick links & Mobile trigger */}
      <div className="flex items-center gap-1.5 md:gap-3">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Open Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Layers className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-wider text-white hidden sm:inline-block font-sans">
            REVARA
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-1 ml-3 border-l border-white/10 pl-3">
          {quickLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => onSelectTab(link.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                currentTab === link.id
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Center: Global Search (Cmd+K) */}
      <div className="flex-1 max-w-md mx-2">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-white/10 bg-[#0E1524]/80 text-xs text-slate-400 hover:border-indigo-500/50 hover:text-slate-200 transition-colors shadow-inner"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-slate-500" />
            <span className="truncate">Search commands, orders, SKU, users...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right: Realtime status, sync, actions, admin profile */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Real-time Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-mono">
          <span className="h-2 w-2 rounded-full bg-emerald-400 status-beacon-active" />
          <span>LIVE</span>
          {state.lastSyncTime && (
            <span className="text-slate-500 text-[10px] pl-1 border-l border-emerald-500/20">
              {state.lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>

        {/* Sync Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => refreshData()}
          disabled={isSyncing}
          className="h-8 w-8 text-slate-400 hover:text-white"
          title="Force Supabase Sync"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-indigo-400" : ""}`} />
        </Button>

        {/* Global Action: Push Alert */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenBroadcastModal}
          className="h-8 gap-1.5 text-xs text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/10 hidden sm:inline-flex"
        >
          <Bell className="h-3.5 w-3.5" />
          <span>Push Alert</span>
        </Button>

        {/* Global Action: Add Product */}
        <Button
          variant="default"
          size="sm"
          onClick={onOpenProductModal}
          className="h-8 gap-1.5 text-xs hidden sm:inline-flex"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Product</span>
        </Button>

        {/* Admin Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/5 transition-colors focus:outline-none">
              <Avatar className="h-7 w-7 border border-indigo-500/40">
                <AvatarImage src={admin?.avatarUrl || undefined} />
                <AvatarFallback>
                  {getInitials(admin?.displayName || admin?.email || "AD")}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-semibold leading-none text-white">
                  {admin?.displayName || "REVARA Admin"}
                </p>
                <p className="text-[11px] leading-none text-slate-400 truncate">
                  {admin?.email}
                </p>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                    <Shield className="h-2.5 w-2.5" />
                    {(admin?.adminRole || "admin").replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSelectTab("settings")} className="gap-2">
              <Radio className="h-3.5 w-3.5 text-slate-400" />
              <span>Database Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSelectTab("audit_logs")} className="gap-2">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span>Forensic Audit Trail</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="gap-2 text-rose-400 focus:text-rose-400">
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  )
}
