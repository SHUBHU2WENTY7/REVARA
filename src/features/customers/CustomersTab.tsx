import React, { useState, useMemo } from "react"
import { motion } from "motion/react"
import {
  Search,
  Globe,
  Store,
  ArrowUpDown,
  Download,
  Plus,
  MoreVertical,
} from "lucide-react"
import { KpiCard } from "@/components/lumen/KpiCard"

interface CustomerRow {
  id: string
  name: string
  email: string
  initials: string
  city: string
  channel: "Online" | "In store"
  orders: number
  lifetimeSpend: string
  rawSpend: number
  lastOrder: string
  tag: "VIP" | "Wholesale" | "New" | "Subscriber"
}

const CUSTOMERS_DATA: CustomerRow[] = [
  {
    id: "1",
    name: "Wren & Field Café",
    email: "wren.cafe@post.net",
    initials: "WF",
    city: "Denver, CO",
    channel: "Online",
    orders: 17,
    lifetimeSpend: "$10,418",
    rawSpend: 10418,
    lastOrder: "20 hr. ago",
    tag: "Wholesale",
  },
  {
    id: "2",
    name: "The Linen Room",
    email: "the.room@fastmail.fm",
    initials: "TL",
    city: "Charleston, SC",
    channel: "Online",
    orders: 16,
    lifetimeSpend: "$6,524",
    rawSpend: 6524,
    lastOrder: "6 days ago",
    tag: "VIP",
  },
  {
    id: "3",
    name: "Hana Sato",
    email: "hana.sato@mail.com",
    initials: "HS",
    city: "San Diego, CA",
    channel: "Online",
    orders: 16,
    lifetimeSpend: "$1,920",
    rawSpend: 1920,
    lastOrder: "2 days ago",
    tag: "VIP",
  },
  {
    id: "4",
    name: "Elena Marsh",
    email: "elena.marsh@mail.com",
    initials: "EM",
    city: "Portland, OR",
    channel: "Online",
    orders: 12,
    lifetimeSpend: "$1,173",
    rawSpend: 1173,
    lastOrder: "2 days ago",
    tag: "Subscriber",
  },
  {
    id: "5",
    name: "Amara Okoye",
    email: "amara.okoye@inbox.co",
    initials: "AO",
    city: "Austin, TX",
    channel: "In store",
    orders: 16,
    lifetimeSpend: "$976",
    rawSpend: 976,
    lastOrder: "9 days ago",
    tag: "VIP",
  },
  {
    id: "6",
    name: "Sofia Bianchi",
    email: "sofia.bianchi@design.it",
    initials: "SB",
    city: "Brooklyn, NY",
    channel: "Online",
    orders: 1,
    lifetimeSpend: "$49",
    rawSpend: 49,
    lastOrder: "24 min. ago",
    tag: "New",
  },
]

export function CustomersTab() {
  const [activeSubTab, setActiveSubTab] = useState<"customers" | "feedback">("customers")
  const [selectedTag, setSelectedTag] = useState<string>("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<"name" | "orders" | "spend">("spend")
  const [sortAsc, setSortAsc] = useState(false)

  const filterChips = [
    { label: "All", count: 14 },
    { label: "VIP", count: 4 },
    { label: "Wholesale", count: 2 },
    { label: "New", count: 3 },
    { label: "Subscribers", count: 7 },
  ]

  const filteredCustomers = useMemo(() => {
    return CUSTOMERS_DATA.filter((c) => {
      if (selectedTag === "VIP" && c.tag !== "VIP") return false
      if (selectedTag === "Wholesale" && c.tag !== "Wholesale") return false
      if (selectedTag === "New" && c.tag !== "New") return false
      if (selectedTag === "Subscribers" && c.tag !== "Subscriber") return false

      if (
        searchQuery &&
        !c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !c.email.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !c.city.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }
      return true
    }).sort((a, b) => {
      if (sortField === "name") {
        return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      }
      if (sortField === "orders") {
        return sortAsc ? a.orders - b.orders : b.orders - a.orders
      }
      return sortAsc ? a.rawSpend - b.rawSpend : b.rawSpend - a.rawSpend
    })
  }, [selectedTag, searchQuery, sortField, sortAsc])

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[26px] lg:text-[30px] font-bold tracking-tight text-[var(--text)] font-['Manrope']">
            Customers
          </h1>

          {/* Sub-tabs: Customers & Feedback */}
          <div className="flex items-center p-1 rounded-full bg-[var(--well)] border border-[var(--line)]">
            <button
              type="button"
              onClick={() => setActiveSubTab("customers")}
              className={`px-3.5 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer ${
                activeSubTab === "customers"
                  ? "bg-[var(--surface)] text-[var(--text)] font-semibold shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              Customers
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("feedback")}
              className={`px-3.5 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer ${
                activeSubTab === "feedback"
                  ? "bg-[var(--surface)] text-[var(--text)] font-semibold shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              Feedback
            </button>
          </div>
        </div>

        {/* Live now pill & action buttons */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--line)] bg-[var(--well)] text-[12px] font-medium text-[var(--text)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--up)] animate-pulse" />
            <span>1,425 live now</span>
          </div>

          <button
            type="button"
            className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold bg-[var(--well)] text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors border border-[var(--line)] flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          <button
            type="button"
            className="px-4 py-1.5 rounded-full text-[12px] font-semibold bg-[var(--ink)] text-[var(--on-ink)] hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add customer</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filterChips.map((chip) => {
          const isSelected = selectedTag === chip.label
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => setSelectedTag(chip.label)}
              className={`px-3.5 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? "bg-[var(--surface-2)] text-[var(--text)] font-bold border border-[var(--line-2)] shadow-sm"
                  : "bg-[var(--well)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--line)]"
              }`}
            >
              <span>{chip.label}</span>
              <span className="text-[11px] font-mono opacity-70">{chip.count}</span>
            </button>
          )
        })}
      </div>

      {/* 4-up KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Inverted Hero Card */}
        <KpiCard
          label="Customers"
          value="14"
          rawValue={14}
          deltaPeriod="9 online, 5 in store"
          isInverted={true}
          miniViz="bars"
        />

        <KpiCard
          label="New this month"
          value="3"
          rawValue={3}
          deltaPeriod="Joined since Oct 1"
          miniViz="sparkline"
        />

        <KpiCard
          label="Repeat rate"
          value="93%"
          deltaPeriod="Ordered more than once"
          miniViz="ring"
        />

        <KpiCard
          label="Average lifetime value"
          value="$1,788"
          rawValue={1788}
          prefix="$"
          deltaPeriod="$25k spent in total"
          miniViz="equaliser"
        />
      </div>

      {/* Customers Data Table */}
      <div
        className="lumen-card overflow-hidden"
        style={{
          borderRadius: "var(--card-radius, 20px)",
          boxShadow: "inset 0 0 0 1px var(--line)",
        }}
      >
        {/* Table Search & Header */}
        <div className="p-4 border-b border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-[var(--text)]">All customers</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--well)] text-[var(--muted)]">
              {filteredCustomers.length}
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[var(--muted)] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name, email..."
              className="w-full pl-8 pr-3 py-1.5 rounded-full text-[12px] bg-[var(--well)] border border-[var(--line)] text-[var(--text)] placeholder-[var(--faint)] outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px] divide-y divide-[var(--line)]">
            <thead className="bg-[var(--surface-2)] text-[var(--muted)] text-[11px] font-semibold sticky top-0">
              <tr>
                <th
                  onClick={() => {
                    setSortField("name")
                    setSortAsc(!sortAsc)
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-[var(--text)]"
                >
                  <div className="flex items-center gap-1">
                    <span>Customer</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Channel</th>
                <th
                  onClick={() => {
                    setSortField("orders")
                    setSortAsc(!sortAsc)
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-[var(--text)]"
                >
                  <div className="flex items-center gap-1">
                    <span>Orders</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setSortField("spend")
                    setSortAsc(!sortAsc)
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-[var(--text)]"
                >
                  <div className="flex items-center gap-1">
                    <span>Lifetime spend</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Last order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filteredCustomers.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-[var(--well)] transition-colors duration-150 cursor-pointer group"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--well)] border border-[var(--line)] text-[11px] font-bold text-[var(--text)] flex items-center justify-center shrink-0">
                        {c.initials}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text)] leading-tight">{c.name}</p>
                        <p className="text-[11px] text-[var(--faint)]">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[var(--muted)] font-medium">{c.city}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-[var(--muted)]">
                      {c.channel === "Online" ? (
                        <Globe className="w-3.5 h-3.5 text-[var(--primary)]" />
                      ) : (
                        <Store className="w-3.5 h-3.5 text-[var(--c3)]" />
                      )}
                      <span>{c.channel}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-[var(--text)]">
                    {c.orders}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[var(--text)]">
                    {c.lifetimeSpend}
                  </td>
                  <td className="py-3.5 px-4 text-right text-[var(--faint)] font-mono">
                    {c.lastOrder}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
