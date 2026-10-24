import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
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
  X,
  Search,
  Sun,
  Moon,
  MessageSquare,
  Workflow,
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
  isMobileOpen?: boolean
  onCloseMobile?: () => void
  theme?: "light" | "dark"
  onToggleTheme?: (e: React.MouseEvent) => void
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
  isMobileOpen = false,
  onCloseMobile,
  theme,
  onToggleTheme,
}: SidebarProps) {
  const { admin, logout } = useAuth()
  const { sidebarBadges } = useDashboardData()
  const [filterQuery, setFilterQuery] = useState("")

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
      title: "Growth & Engagement",
      items: [
        { id: "users", label: "Customer 360 CRM", icon: Users },
        { id: "messages", label: "Messages & Inbox", icon: MessageSquare },
        { id: "automations", label: "Automations & Flows", icon: Workflow },
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

  const handleItemClick = (id: TabId) => {
    onSelectTab(id)
    if (onCloseMobile) onCloseMobile()
  }

  // Filter items if user is searching in mobile drawer
  const filteredSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.label.toLowerCase().includes(filterQuery.toLowerCase())
      ),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCloseMobile}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden cursor-pointer"
          />
        )}
      </AnimatePresence>

      {/* Main Sidebar Element */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-[70] md:z-40 flex flex-col justify-between border-r transition-all duration-300 ${
          isMobileOpen
            ? "translate-x-0 opacity-100 pointer-events-auto w-[85vw] max-w-[300px] shadow-2xl"
            : "-translate-x-full opacity-0 pointer-events-none md:translate-x-0 md:opacity-100 md:pointer-events-auto"
        } ${isCollapsed && !isMobileOpen ? "md:w-[72px]" : "md:w-[260px]"}`}
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--line)",
          color: "var(--text)",
        }}
      >
        {/* Brand Header */}
        <div
          className="h-16 flex items-center justify-between px-4 border-b shrink-0"
          style={{ borderColor: "var(--line)" }}
        >
          <div
            onClick={() => handleItemClick("overview")}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm"
              style={{
                backgroundColor: "var(--ink)",
                color: "var(--on-ink)",
              }}
            >
              R
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="overflow-hidden">
                <h1 className="font-bold text-sm tracking-wider font-['Manrope'] text-[var(--text)]">
                  REVARA
                </h1>
                <p className="text-[10px] font-mono tracking-widest uppercase text-[var(--muted)]">
                  COMMAND CENTER
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Desktop Collapse Toggle */}
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden md:flex h-7 w-7 rounded-lg items-center justify-center transition-colors cursor-pointer text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--well)]"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-2 rounded-xl text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--well)] transition-colors cursor-pointer"
              title="Close Menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile Quick Search inside Drawer */}
        {isMobileOpen && (
          <div className="p-3 border-b border-[var(--line)] md:hidden">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Jump to module..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-[var(--surface-2)] border border-[var(--line)] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5 custom-scrollbar">
          {filteredSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {(!isCollapsed || isMobileOpen) && (
                <h2 className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--faint)]">
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
                      type="button"
                      onClick={() => handleItemClick(item.id)}
                      className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                        isActive
                          ? "font-semibold bg-[var(--well)] text-[var(--text)] shadow-xs border border-[var(--line-2)]"
                          : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--well)] border border-transparent"
                      }`}
                      title={isCollapsed && !isMobileOpen ? item.label : undefined}
                    >
                      <span
                        className="shrink-0 transition-colors"
                        style={{
                          color: isActive ? "var(--primary)" : "var(--muted)",
                        }}
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      {(!isCollapsed || isMobileOpen) && (
                        <span className="truncate flex-1 text-left">{item.label}</span>
                      )}

                      {(!isCollapsed || isMobileOpen) && (
                        <>
                          {item.isLiveBadge && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[rgba(11,122,92,0.15)] text-[var(--up)] text-[10px] font-mono font-bold">
                              <span className="h-1.5 w-1.5 rounded-full bg-[var(--up)] status-beacon-active" />
                              LIVE
                            </span>
                          )}

                          {badgeCount > 0 && (
                            <span
                              className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold"
                              style={{
                                backgroundColor:
                                  item.badgeKey === "lowStock"
                                    ? "rgba(154,91,0,0.15)"
                                    : "rgba(42,111,154,0.15)",
                                color:
                                  item.badgeKey === "lowStock" ? "var(--warn)" : "var(--primary)",
                              }}
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

        {/* Footer / Admin Profile & Theme Switch */}
        <div
          className="p-3 border-t shrink-0 flex flex-col gap-2"
          style={{
            borderColor: "var(--line)",
            backgroundColor: "var(--surface-2)",
          }}
        >
          {/* Theme switch in sidebar drawer on mobile */}
          {onToggleTheme && (isMobileOpen || !isCollapsed) && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex items-center justify-between w-full px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                {theme === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                <span className="font-medium">Theme Mode</span>
              </span>
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--primary)]">
                {theme}
              </span>
            </button>
          )}

          {/* Admin user card */}
          {!isCollapsed || isMobileOpen ? (
            <div
              className="flex items-center justify-between gap-2 p-2 rounded-xl border border-[var(--line)] bg-[var(--surface)]"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Avatar className="h-8 w-8 border border-[var(--line-2)] shrink-0">
                  <AvatarImage src={admin?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-[var(--well)] text-[var(--text)] text-xs font-bold">
                    {getInitials(admin?.displayName || admin?.email || "AD")}
                  </AvatarFallback>
                </Avatar>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold truncate text-[var(--text)]">
                    {admin?.displayName || "Operations Lead"}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--primary)]">
                    <Shield className="h-2.5 w-2.5" />
                    <span className="truncate">
                      {(admin?.adminRole || "super_admin").replace(/_/g, " ").toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="p-1.5 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer text-[var(--muted)]"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-8 w-8 border border-[var(--line-2)]">
                <AvatarImage src={admin?.avatarUrl || undefined} />
                <AvatarFallback className="bg-[var(--well)] text-[var(--text)] text-xs font-bold">
                  {getInitials(admin?.displayName || admin?.email || "AD")}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={logout}
                className="p-1.5 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer text-[var(--muted)]"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
