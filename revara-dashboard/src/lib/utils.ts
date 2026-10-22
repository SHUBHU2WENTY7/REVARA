import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount?: number | string | null): string {
  const num = typeof amount === "number" ? amount : Number(amount)
  if (isNaN(num)) return "₹0"
  const rounded = Math.round(num * 100) / 100
  const hasDecimals = rounded % 1 !== 0
  return `₹${rounded.toLocaleString("en-IN", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`
}

/** Safely extract the total from an order, handling both `total` and `total_amount` */
export function orderTotal(o: Record<string, unknown>): number {
  return Number(o?.total ?? o?.total_amount ?? o?.subtotal ?? 0) || 0
}

/** Safely extract item unit price from `unit_price` or `price` */
export function itemPrice(item: Record<string, unknown>): number {
  return Number(item?.unit_price ?? item?.price ?? 0) || 0
}

export function formatDate(date?: string | Date | null): string {
  if (!date) return "—"
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return "—"
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return "—"
  }
}

export function formatDateTime(date?: string | Date | null): string {
  if (!date) return "—"
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return "—"
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return "—"
  }
}

export function formatTimeAgo(date?: string | Date | null): string {
  if (!date) return "Just now"
  try {
    const now = new Date()
    const then = new Date(date)
    if (isNaN(then.getTime())) return "Just now"
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDate(date)
  } catch {
    return "Just now"
  }
}

export function truncate(str?: string | null, length: number = 20): string {
  if (!str) return ""
  if (str.length <= length) return str
  return str.slice(0, length) + "…"
}

export function getInitials(name?: string | null): string {
  if (!name) return "AD"
  return name
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
}

export function generateSku(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let sku = 'REV-'
  for (let i = 0; i < 8; i++) {
    sku += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return sku
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    placed: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    confirmed: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
    processing: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    shipped: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
    delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    cancelled: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
    submitted: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    credits_issued: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    rejected: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    inactive: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
    suspended: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
    completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  }
  return map[status] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/20'
}

export function stockLevel(stock: number): 'healthy' | 'low' | 'out' {
  if (stock <= 0) return 'out'
  if (stock <= 5) return 'low'
  return 'healthy'
}

export function stockColor(stock: number): string {
  const level = stockLevel(stock)
  if (level === 'out') return 'text-rose-400'
  if (level === 'low') return 'text-amber-400'
  return 'text-emerald-400'
}
