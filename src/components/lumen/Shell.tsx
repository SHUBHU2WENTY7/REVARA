import React, { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Bell,
  Menu,
  Sun,
  Moon,
  ChevronDown,
  Repeat,
  Wallet,
  Layers,
  Tag,
  Star,
  MapPin,
  ShieldCheck,
  Settings,
  Sparkles,
} from "lucide-react"
import type { TabId } from "@/types"

export interface ShellProps {
  currentTab: string
  onSelectTab: (tabId: string) => void
  onToggleMobileSidebar?: () => void
  brandName?: string
  brandSubtitle?: string
  pendingOrdersCount?: number
  pendingExchangesCount?: number
  unreadMessagesCount?: number
  liveNowCount?: string
  adminInitials?: string
  onOpenNotifications?: () => void
  theme?: "light" | "dark"
  onToggleTheme?: (e: React.MouseEvent) => void
}

interface NavItem {
  id: string
  label: string
  badge?: number
}

const tabTitles: Record<string, string> = {
  overview: "Executive Overview",
  activity: "Live Feed",
  orders: "Orders Fulfillment",
  products: "Product Catalog",
  inventory: "Stock Radar",
  exchanges: "Garments Trade-In",
  wallets: "Wallets & Ledger",
  users: "Customer 360",
  messages: "Messages",
  automations: "Automations",
  reviews: "Reviews & UGC",
  coupons: "Coupons",
  notifications: "Push Alerts",
  serviceability: "Corridors",
  audit_logs: "Audit Trail",
  settings: "Settings",
}

export function Shell({
  currentTab,
  onSelectTab,
  onToggleMobileSidebar,
  brandName = "REVARA",
  brandSubtitle = "Circular Luxury Operations",
  pendingOrdersCount = 14,
  pendingExchangesCount = 0,
  unreadMessagesCount = 2,
  liveNowCount = "1,379",
  adminInitials = "MR",
  onOpenNotifications,
  theme,
  onToggleTheme,
}: ShellProps) {
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false)

  // Primary desktop nav pills
  const primaryNavItems: NavItem[] = [
    { id: "overview", label: "Dashboard" },
    { id: "orders", label: "Orders", badge: pendingOrdersCount },
    { id: "exchanges", label: "Trade-In", badge: pendingExchangesCount },
    { id: "products", label: "Products" },
    { id: "inventory", label: "Stock Radar" },
    { id: "users", label: "Customers" },
    { id: "wallets", label: "Wallets" },
    { id: "messages", label: "Messages", badge: unreadMessagesCount },
  ]

  // Secondary modules accessible via "More ▾" dropdown
  const secondaryNavItems = [
    { id: "automations", label: "Automations & Flows", icon: Sparkles },
    { id: "reviews", label: "Reviews & UGC", icon: Star },
    { id: "coupons", label: "Coupons & Promos", icon: Tag },
    { id: "notifications", label: "Push Alerts", icon: Bell },
    { id: "serviceability", label: "PINs & Corridors", icon: MapPin },
    { id: "audit_logs", label: "Forensic Audit Trail", icon: ShieldCheck },
    { id: "settings", label: "Database & Master Seed", icon: Settings },
  ]

  const activeTitle = tabTitles[currentTab] || "Operations"

  return (
    <>
      {/* ============================================================== */}
      {/* MOBILE TOP BAR (< md): Dedicated, Crystal Clear Mobile Header */}
      {/* ============================================================== */}
      <header className="md:hidden sticky top-0 z-40 w-full px-3 py-2.5 bg-[var(--surface)]/95 backdrop-blur-xl border-b border-[var(--line)] shadow-xs">
        <div className="flex items-center justify-between gap-2 max-w-full">
          {/* Hamburger Drawer Button */}
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--well)] border border-[var(--line)] text-[var(--text)] font-semibold text-xs transition-transform active:scale-95 cursor-pointer shadow-xs"
            title="Open Console Menu"
          >
            <Menu className="w-4 h-4 text-[var(--primary)]" />
            <span className="font-mono text-[11px] tracking-wide">MENU</span>
            {(pendingOrdersCount > 0 || pendingExchangesCount > 0) && (
              <span className="h-2 w-2 rounded-full bg-[var(--down)]" />
            )}
          </button>

          {/* Current Tab Indicator */}
          <div
            onClick={() => onSelectTab("overview")}
            className="flex flex-col items-center cursor-pointer overflow-hidden"
          >
            <div className="flex items-center gap-1.5">
              <span className="font-['Manrope'] font-bold text-xs tracking-wider text-[var(--text)]">
                {brandName}
              </span>
              <span className="text-[10px] text-[var(--muted)]">•</span>
              <span className="text-[11px] font-semibold text-[var(--primary)] truncate max-w-[120px]">
                {activeTitle}
              </span>
            </div>
          </div>

          {/* Right Utilities (Theme + Bell + Profile) */}
          <div className="flex items-center gap-1.5">
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="p-1.5 rounded-xl text-[var(--muted)] hover:text-[var(--text)] bg-[var(--well)] border border-[var(--line)] cursor-pointer"
                title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
              >
                {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative p-1.5 rounded-xl text-[var(--muted)] hover:text-[var(--text)] bg-[var(--well)] border border-[var(--line)] cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--down)]" />
            </button>

            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-[10px] text-[var(--on-ink)] bg-[var(--ink)] shadow-xs"
              title="Current Admin"
            >
              {adminInitials}
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* DESKTOP FLOATING PILL SHELL (>= md) */}
      {/* ============================================================== */}
      <header className="hidden md:block sticky top-4 z-40 w-full max-w-[1740px] mx-auto px-4 sm:px-6 pointer-events-none select-none">
        <div
          className="pointer-events-auto flex items-center justify-between gap-4 py-2 px-4 rounded-full backdrop-blur-xl transition-all duration-300"
          style={{
            backgroundColor: "var(--surface)",
            boxShadow: "inset 0 0 0 1px var(--line), var(--shadow-lift)",
          }}
        >
          {/* Brand Left */}
          <div
            onClick={() => onSelectTab("overview")}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-[13px] shadow-sm transition-transform group-hover:scale-105"
              style={{
                backgroundColor: "var(--ink)",
                color: "var(--on-ink)",
              }}
            >
              R
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold tracking-tight text-[var(--text)] leading-tight font-['Manrope']">
                {brandName}
              </span>
              <span className="text-[10px] text-[var(--muted)] leading-none hidden xl:inline">
                {brandSubtitle}
              </span>
            </div>
          </div>

          {/* Center Pill Nav with sliding active spring indicator */}
          <nav className="flex items-center p-1 rounded-full bg-[var(--well)] border border-[var(--line)] relative">
            {primaryNavItems.map((item) => {
              const isActive = currentTab === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id)
                    setMoreDropdownOpen(false)
                  }}
                  className="relative px-3 py-1 rounded-full text-[12px] font-medium transition-colors duration-160 z-10 flex items-center gap-1.5 cursor-pointer"
                  style={{
                    color: isActive ? "var(--text)" : "var(--muted)",
                  }}
                >
                  {/* Sliding spring background */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill-active"
                      className="absolute inset-0 rounded-full shadow-sm"
                      style={{
                        backgroundColor: "var(--surface)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1), inset 0 0 0 1px var(--line)",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                        mass: 1,
                      }}
                    />
                  )}

                  <span className="relative z-20 font-semibold">{item.label}</span>

                  {/* Count badge */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className="relative z-20 px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono transition-colors"
                      style={{
                        backgroundColor: isActive ? "var(--well)" : "var(--surface)",
                        color: "var(--text)",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}

            {/* More Modules Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className="relative px-2.5 py-1 rounded-full text-[12px] font-medium transition-colors z-10 flex items-center gap-1 text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
              >
                <span>More</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${moreDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {moreDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 rounded-2xl p-2 border border-[var(--line)] shadow-xl z-50 backdrop-blur-xl"
                    style={{ backgroundColor: "var(--surface)" }}
                  >
                    <p className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                      Extended Operations
                    </p>
                    <div className="space-y-0.5">
                      {secondaryNavItems.map((subItem) => {
                        const SubIcon = subItem.icon
                        const isSubActive = currentTab === subItem.id
                        return (
                          <button
                            key={subItem.id}
                            type="button"
                            onClick={() => {
                              onSelectTab(subItem.id)
                              setMoreDropdownOpen(false)
                            }}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer ${
                              isSubActive
                                ? "bg-[var(--well)] text-[var(--text)] font-semibold"
                                : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--well)]"
                            }`}
                          >
                            <SubIcon className="w-3.5 h-3.5 text-[var(--primary)]" />
                            <span>{subItem.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Utilities Right */}
          <div className="flex items-center gap-2.5">
            {/* Live Count Pill (Desktop) */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--line)] bg-[var(--well)] text-[11px] font-medium text-[var(--text)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--up)] animate-pulse" />
              <span>{liveNowCount} live now</span>
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-full text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--well)] transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--down)]" />
            </button>

            {/* Current User Pill */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] text-[var(--on-ink)] bg-[var(--ink)] shadow-sm"
              title="Current Admin"
            >
              {adminInitials}
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* MOBILE BOTTOM TAB BAR (< md): Fast Navigation & Menu Launcher */}
      {/* ============================================================== */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 select-none">
        <nav
          className="flex items-center justify-around py-1.5 px-2 rounded-2xl backdrop-blur-xl border border-[var(--line)]"
          style={{
            backgroundColor: "var(--surface)",
            boxShadow: "var(--shadow-popover)",
          }}
        >
          {primaryNavItems.slice(0, 4).map((item) => {
            const isActive = currentTab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all flex flex-col items-center ${
                  isActive ? "text-[var(--text)] font-bold" : "text-[var(--muted)]"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-pill-active"
                    className="absolute inset-0 rounded-xl -z-10"
                    style={{ backgroundColor: "var(--well)" }}
                  />
                )}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[9px] font-mono font-bold text-[var(--primary)] leading-none mt-0.5">
                    ({item.badge})
                  </span>
                )}
              </button>
            )
          })}

          {/* More / Menu Drawer Toggle */}
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold text-white bg-[var(--ink)] shadow-xs cursor-pointer active:scale-95 transition-transform"
          >
            <Menu className="w-3.5 h-3.5" />
            <span>All (14)</span>
          </button>
        </nav>
      </div>
    </>
  )
}
