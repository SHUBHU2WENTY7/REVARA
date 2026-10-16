import { motion } from "motion/react"
import {
  BarChart3,
  Activity,
  ShoppingBag,
  Package,
  Layers,
  Repeat,
  Wallet,
  Users,
  Star,
  Tag,
  Bell,
  MapPin,
  ShieldCheck,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react"
import type { TabId } from "@/types"
import { useAuth } from "@/hooks/useAuth"
import { useDashboardData } from "@/hooks/useDashboardData"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"

export interface SidebarProps {
  currentTab: TabId
  onSelectTab: (tab: TabId) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

interface NavSection {
  title: string
  items: {
    id: TabId
    label: string
    icon: React.ComponentType<{ className?: string }>
    badgeKey?: "pendingOrders" | "lowStock" | "pendingExchanges"
    isLiveBadge?: boolean
  }[]
}

export function Sidebar({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const { admin, logout } = useAuth()
  const { sidebarBadges } = useDashboardData()

  const sections: NavSection[] = [
    {
      title: "Core Telemetry",
      items: [
        { id: "overview", label: "Executive Overview", icon: BarChart3 },
        { id: "activity", label: "Live Operations Feed", icon: Activity, isLiveBadge: true },
      ],
    },
    {
      title: "Commerce & Fulfillment",
      items: [
        { id: "orders", label: "Order Fulfillment", icon: ShoppingBag, badgeKey: "pendingOrders" },
        { id: "products", label: "Product Catalog", icon: Package },
        { id: "inventory", label: "Stock Radar", icon: Layers, badgeKey: "lowStock" },
      ],
    },
    {
      title: "Circular Economy",
      items: [
        { id: "exchanges", label: "Garments Trade-In", icon: Repeat, badgeKey: "pendingExchanges" },
        { id: "wallets", label: "Wallets & Ledger", icon: Wallet },
      ],
    },
    {
      title: "Growth & CRM",
      items: [
        { id: "users", label: "Customer 360 CRM", icon: Users },
        { id: "reviews", label: "Reviews & UGC", icon: Star },
        { id: "coupons", label: "Coupons & Promos", icon: Tag },
        { id: "notifications", label: "Push Alerts", icon: Bell },
      ],
    },
    {
      title: "Network & Controls",
      items: [
        { id: "serviceability", label: "PINs & Corridors", icon: MapPin },
        { id: "audit_logs", label: "Forensic Audit Trail", icon: ShieldCheck },
        { id: "settings", label: "Database & Master Seed", icon: Settings },
      ],
    },
  ]

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 flex flex-col justify-between border-r border-white/[0.08] bg-[#0B101D] transition-all duration-300 ${
        isCollapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.08]">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Layers className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-white tracking-wider">REVARA</h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                COMMAND CENTER
              </p>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="h-8 w-8 mx-auto rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Layers className="h-4 w-4 text-white" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="hidden md:flex h-6 w-6 rounded-md items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!isCollapsed && (
              <h2 className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </h2>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = currentTab === item.id
                const badgeCount = item.badgeKey ? sidebarBadges[item.badgeKey] : 0

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                      isActive
                        ? "text-white font-semibold shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600/30 to-indigo-600/10 border border-indigo-500/30 -z-10"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}

                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    />

                    {!isCollapsed && (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    )}

                    {!isCollapsed && (
                      <>
                        {item.isLiveBadge && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 status-beacon-active" />
                            LIVE
                          </span>
                        )}

                        {badgeCount > 0 && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                              item.badgeKey === "lowStock"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                            }`}
                          >
                            {badgeCount}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Admin Profile Card */}
      <div className="p-3 border-t border-white/[0.08] bg-[#080C14]/50">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#131B2E] border border-white/[0.05]">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Avatar className="h-8 w-8 border border-indigo-500/30">
                <AvatarImage src={admin?.avatarUrl || undefined} />
                <AvatarFallback>
                  {getInitials(admin?.displayName || admin?.email || "AD")}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">
                  {admin?.displayName || "Admin"}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-mono">
                  <Shield className="h-2.5 w-2.5" />
                  <span className="truncate">
                    {(admin?.adminRole || "super_admin").replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-8 w-8 border border-indigo-500/30">
              <AvatarImage src={admin?.avatarUrl || undefined} />
              <AvatarFallback>
                {getInitials(admin?.displayName || admin?.email || "AD")}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
