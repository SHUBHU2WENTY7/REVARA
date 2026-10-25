import React from "react"
import { motion } from "motion/react"
import {
  Search,
  LayoutGrid,
  Settings,
  HelpCircle,
  Sparkles,
  Sun,
  Moon,
  Check,
} from "lucide-react"

export interface ToolRailProps {
  theme: "light" | "dark"
  onToggleTheme: (e: React.MouseEvent) => void
  onOpenSearch: () => void
  onOpenSettings: () => void
  onOpenShortcuts?: () => void
  onOpenHelp?: () => void
  activeShortcutsCount?: number
}

export function ToolRail({
  theme,
  onToggleTheme,
  onOpenSearch,
  onOpenSettings,
  onOpenShortcuts,
  onOpenHelp,
  activeShortcutsCount = 11,
}: ToolRailProps) {
  return (
    <aside
      className="fixed left-4 top-24 bottom-24 z-40 hidden md:flex flex-col justify-between items-center py-4 px-2 select-none"
      style={{
        width: "48px",
        backgroundColor: "var(--surface)",
        borderRadius: "999px",
        boxShadow: "inset 0 0 0 1px var(--line), var(--shadow-lift)",
      }}
    >
      {/* Top action icons */}
      <div className="flex flex-col items-center gap-4">
        {/* Search */}
        <button
          type="button"
          onClick={onOpenSearch}
          title="Search (Cmd + K)"
          className="p-2 rounded-full text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--well)] transition-all cursor-pointer"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Shortcuts Drawer with count badge */}
        <button
          type="button"
          onClick={onOpenShortcuts}
          title="Quick Modules"
          className="p-2 rounded-full text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--well)] transition-all relative cursor-pointer"
        >
          <LayoutGrid className="w-4 h-4" />
          {activeShortcutsCount > 0 && (
            <span
              className="absolute -top-1 -right-1 px-1 min-w-[15px] h-[15px] flex items-center justify-center rounded-full text-[9px] font-bold"
              style={{
                backgroundColor: "var(--well)",
                color: "var(--text)",
                boxShadow: "0 0 0 1px var(--line)",
              }}
            >
              {activeShortcutsCount}
            </span>
          )}
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={onOpenSettings}
          title="Settings"
          className="p-2 rounded-full text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--well)] transition-all cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Help */}
        <button
          type="button"
          onClick={onOpenHelp}
          title="Support & Docs"
          className="p-2 rounded-full text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--well)] transition-all cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Sparkles / AI Assistant */}
        <button
          type="button"
          title="AI Insights"
          className="p-2 rounded-full text-[var(--primary)] hover:bg-[var(--well)] transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        {/* Theme switch */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
          className="p-2 rounded-full text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--well)] transition-all cursor-pointer"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom Brand checkmark icon */}
      <div className="pt-2">
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center shadow-sm"
          style={{
            backgroundColor: "var(--well)",
            border: "1px solid var(--line)",
          }}
        >
          <Check className="w-3.5 h-3.5 text-[var(--primary)] stroke-[3]" />
        </div>
      </div>
    </aside>
  )
}
