import { useState, useEffect } from "react"
import { motion, Reorder } from "motion/react"
import {
  GripVertical,
  RotateCcw,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export type WidgetSize = "sm" | "wide" | "tall" | "lg"

export interface DashboardWidget {
  id: string
  title: string
  size: WidgetSize
  component: React.ReactNode
}

export interface DraggableWidgetGridProps {
  widgets: DashboardWidget[]
  storageKey?: string
}

export function DraggableWidgetGrid({
  widgets: defaultWidgets,
  storageKey = "revara_dashboard_widgets_order_v1",
}: DraggableWidgetGridProps) {
  const [items, setItems] = useState<DashboardWidget[]>(() => {
    try {
      const savedOrder = localStorage.getItem(storageKey)
      if (savedOrder) {
        const orderIds = JSON.parse(savedOrder) as string[]
        const ordered: DashboardWidget[] = []
        orderIds.forEach((id) => {
          const w = defaultWidgets.find((x) => x.id === id)
          if (w) ordered.push(w)
        })
        defaultWidgets.forEach((w) => {
          if (!ordered.some((x) => x.id === w.id)) ordered.push(w)
        })
        return ordered
      }
    } catch {
      // ignore
    }
    return defaultWidgets
  })

  // Keep components updated if defaultWidgets prop updates
  useEffect(() => {
    setItems((prev) =>
      prev.map((item) => {
        const updated = defaultWidgets.find((w) => w.id === item.id)
        return updated ? { ...item, component: updated.component, title: updated.title } : item
      })
    )
  }, [defaultWidgets])

  const handleReorder = (newOrder: DashboardWidget[]) => {
    setItems(newOrder)
    try {
      const ids = newOrder.map((w) => w.id)
      localStorage.setItem(storageKey, JSON.stringify(ids))
    } catch {
      // ignore
    }
  }

  const resetLayout = () => {
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // ignore
    }
    setItems(defaultWidgets)
  }

  const sizeClasses: Record<WidgetSize, string> = {
    sm: "col-span-12 md:col-span-6 lg:col-span-4",
    wide: "col-span-12 md:col-span-12 lg:col-span-8",
    tall: "col-span-12 md:col-span-6 lg:col-span-4 row-span-2",
    lg: "col-span-12",
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Customizable Executive Canvas
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={resetLayout}
          className="h-7 text-[11px] gap-1.5 text-slate-400 hover:text-white"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset Layout</span>
        </Button>
      </div>

      <Reorder.Group
        axis="y"
        values={items}
        onReorder={handleReorder}
        className="grid grid-cols-12 gap-4 list-none p-0"
      >
        {items.map((widget) => (
          <Reorder.Item
            key={widget.id}
            value={widget}
            className={`${sizeClasses[widget.size]} rounded-2xl border border-white/[0.08] bg-[#131B2E] shadow-xl overflow-hidden flex flex-col group transition-all duration-200 hover:border-indigo-500/30`}
          >
            {/* Widget drag handle bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.05] bg-[#0E1524]/60">
              <span className="text-xs font-semibold text-white tracking-wide">
                {widget.title}
              </span>
              <div
                className="cursor-grab active:cursor-grabbing p-1 text-slate-500 hover:text-slate-300 rounded transition-colors opacity-60 group-hover:opacity-100"
                title="Drag to rearrange"
              >
                <GripVertical className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Widget Content */}
            <div className="p-4 flex-1">{widget.component}</div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  )
}
