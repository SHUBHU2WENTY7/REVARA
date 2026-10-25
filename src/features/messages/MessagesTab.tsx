import React, { useState } from "react"
import { motion } from "motion/react"
import {
  Search,
  Star,
  Mail,
  Check,
  ChevronLeft,
  Send,
  MoreVertical,
  Paperclip,
} from "lucide-react"

interface MessageItem {
  id: string
  name: string
  initials: string
  time: string
  title: string
  snippet: string
  unread: boolean
  isStarred?: boolean
  orderId?: string
  city?: string
  lifetimeSpend?: string
  totalOrders?: number
}

const CONVERSATIONS: MessageItem[] = [
  {
    id: "1",
    name: "Sofia Bianchi",
    initials: "SB",
    time: "24 min. ago",
    title: "Where is my order?",
    snippet: "Thank you! It's a birthday present for Saturday...",
    unread: true,
    isStarred: false,
    orderId: "#10480",
    city: "Brooklyn, NY",
    lifetimeSpend: "$49",
    totalOrders: 1,
  },
  {
    id: "2",
    name: "Wren & Field Café",
    initials: "WF",
    time: "58 min. ago",
    title: "Reorder for both cafés",
    snippet: "Morning — could we get another batch of linen towels?",
    unread: true,
    isStarred: true,
    orderId: "#10472",
    city: "Denver, CO",
    lifetimeSpend: "$10,418",
    totalOrders: 17,
  },
  {
    id: "3",
    name: "Elena Marsh",
    initials: "EM",
    time: "2 hr. ago",
    title: "Gift wrapping question",
    snippet: "Perfect. Can I add a handwritten gift note to this?",
    unread: false,
    isStarred: false,
    orderId: "#10461",
    city: "Portland, OR",
    lifetimeSpend: "$1,173",
    totalOrders: 12,
  },
  {
    id: "4",
    name: "The Linen Room",
    initials: "TL",
    time: "5 hr. ago",
    title: "Towel colours for spring",
    snippet: "Lovely, thank you Priya. We look forward to receiving them.",
    unread: false,
    isStarred: false,
    orderId: "#10455",
    city: "Charleston, SC",
    lifetimeSpend: "$6,524",
    totalOrders: 16,
  },
  {
    id: "5",
    name: "Oliver Grant",
    initials: "OG",
    time: "yesterday",
    title: "Trade-in garment inspection",
    snippet: "I uploaded the photos of the wool trench coat yesterday.",
    unread: false,
    isStarred: false,
    orderId: "#10440",
    city: "Chicago, IL",
    lifetimeSpend: "$820",
    totalOrders: 4,
  },
]

export function MessagesTab() {
  const [selectedId, setSelectedId] = useState("1")
  const [activeSubTab, setActiveSubTab] = useState<"inbox" | "email">("inbox")
  const [filter, setFilter] = useState<"all" | "unread" | "done">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [messages, setMessages] = useState([
    {
      id: "m1",
      sender: "Sofia Bianchi",
      initials: "SB",
      text: "Hi! I ordered the oak serving board on Monday — any idea when it ships?",
      time: "Sofia 9:49 AM",
      isCustomer: true,
    },
    {
      id: "m2",
      sender: "Priya",
      initials: "P",
      text: "Hi Sofia, let me check that for you now",
      time: "Priya 10:14 AM",
      isCustomer: false,
    },
    {
      id: "m3",
      sender: "Sofia Bianchi",
      initials: "SB",
      text: "Thank you! It's a birthday present for Saturday.",
      time: "Sofia 10:41 AM",
      isCustomer: true,
    },
  ])
  const [replyText, setReplyText] = useState("")

  const activeConv = CONVERSATIONS.find((c) => c.id === selectedId) || CONVERSATIONS[0]

  const handleSend = () => {
    if (!replyText.trim()) return
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "Priya",
        initials: "P",
        text: replyText.trim(),
        time: "Just now",
        isCustomer: false,
      },
    ])
    setReplyText("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const filteredConversations = CONVERSATIONS.filter((c) => {
    if (filter === "unread" && !c.unread) return false
    if (
      searchQuery &&
      !c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.snippet.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[26px] lg:text-[30px] font-bold tracking-tight text-[var(--text)] font-['Manrope']">
            Messages
          </h1>

          {/* Sub-tabs: Inbox & Email */}
          <div className="flex items-center p-1 rounded-full bg-[var(--well)] border border-[var(--line)]">
            <button
              type="button"
              onClick={() => setActiveSubTab("inbox")}
              className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "inbox"
                  ? "bg-[var(--surface)] text-[var(--text)] font-semibold shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              <span>Inbox</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[var(--well)] text-[var(--text)]">
                2
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("email")}
              className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer ${
                activeSubTab === "email"
                  ? "bg-[var(--surface)] text-[var(--text)] font-semibold shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              Email
            </button>
          </div>
        </div>

        {/* Live now pill */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--line)] bg-[var(--well)] text-[12px] font-medium text-[var(--text)] self-start sm:self-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--up)] animate-pulse" />
          <span>1,389 live now</span>
        </div>
      </div>

      {/* 3-Pane Messaging Workspace */}
      <div
        className="lumen-card overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]"
        style={{
          borderRadius: "var(--card-radius, 20px)",
          boxShadow: "inset 0 0 0 1px var(--line)",
        }}
      >
        {/* Pane 1: Inbox List (Col 3 or 4) */}
        <div className="lg:col-span-4 border-r border-[var(--line)] flex flex-col justify-between">
          <div>
            {/* Inbox header & Unread count */}
            <div className="p-4 border-b border-[var(--line)] flex items-center justify-between">
              <span className="text-[14px] font-bold text-[var(--text)]">Inbox</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--well)] text-[var(--muted)]">
                2 unread
              </span>
            </div>

            {/* Filter chips */}
            <div className="p-3 border-b border-[var(--line)] flex items-center gap-1.5">
              {(["all", "unread", "done"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium capitalize transition-all cursor-pointer ${
                    filter === f
                      ? "bg-[var(--surface-2)] text-[var(--text)] font-bold shadow-sm"
                      : "text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-[var(--line)]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--muted)] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search people or messages"
                  className="w-full pl-8 pr-3 py-1.5 rounded-full text-[12px] bg-[var(--well)] border border-[var(--line)] text-[var(--text)] placeholder-[var(--faint)] outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="divide-y divide-[var(--line)] overflow-y-auto max-h-[500px]">
              {filteredConversations.map((item) => {
                const isSelected = selectedId === item.id

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors duration-150 relative ${
                      isSelected ? "bg-[var(--surface-2)]" : "hover:bg-[var(--well)]"
                    }`}
                  >
                    {/* Selected Row indicator on spring */}
                    {isSelected && (
                      <motion.div
                        layoutId="active-inbox-row"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--primary)] rounded-r"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}

                    {/* Avatar Initials */}
                    <div className="w-8 h-8 rounded-full bg-[var(--well)] border border-[var(--line)] text-[11px] font-bold text-[var(--text)] flex items-center justify-center shrink-0">
                      {item.initials}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[12.5px] font-semibold text-[var(--text)] truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-[var(--faint)] shrink-0">{item.time}</span>
                      </div>
                      <p className="text-[11.5px] font-medium text-[var(--muted)] truncate mb-0.5">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-[var(--faint)] truncate">{item.snippet}</p>
                    </div>

                    {/* Unread dot & Star */}
                    <div className="flex flex-col items-center justify-between h-9 shrink-0">
                      {item.unread ? (
                        <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                      ) : (
                        <span className="w-2 h-2" />
                      )}
                      <Star
                        className={`w-3.5 h-3.5 ${
                          item.isStarred
                            ? "fill-[var(--warn)] text-[var(--warn)]"
                            : "text-[var(--faint)] hover:text-[var(--muted)]"
                        }`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Pane 2: Active Thread & Composer (Col 5) */}
        <div className="lg:col-span-5 border-r border-[var(--line)] flex flex-col justify-between">
          <div>
            {/* Thread Header */}
            <div className="p-4 border-b border-[var(--line)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[var(--well)] text-[11px] font-bold text-[var(--text)] flex items-center justify-center shrink-0">
                  {activeConv.initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[var(--text)] truncate">
                      {activeConv.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--well)] text-[var(--muted)] font-mono">
                      {activeConv.orderId}
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--muted)] truncate block">
                    Website chat | {activeConv.title}
                  </span>
                </div>
              </div>

              {/* Header Action icons */}
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" className="p-1.5 rounded-full text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--well)]">
                  <Star className="w-4 h-4" />
                </button>
                <button type="button" className="p-1.5 rounded-full text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--well)]">
                  <Mail className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--well)] text-[var(--text)] hover:bg-[var(--surface-2)] flex items-center gap-1 border border-[var(--line)]"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark done</span>
                </button>
              </div>
            </div>

            {/* Chat Messages Flow */}
            <div className="p-4 space-y-4 max-h-[380px] overflow-y-auto">
              <div className="text-center">
                <span className="text-[10px] text-[var(--faint)] font-medium">Today</span>
              </div>

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${msg.isCustomer ? "" : "flex-row-reverse"}`}
                >
                  <div className="w-7 h-7 rounded-full bg-[var(--well)] text-[10px] font-bold text-[var(--text)] flex items-center justify-center shrink-0">
                    {msg.initials}
                  </div>
                  <div className={`space-y-1 max-w-[80%] ${msg.isCustomer ? "" : "text-right"}`}>
                    <div
                      className={`p-3 rounded-2xl text-[12.5px] leading-relaxed ${
                        msg.isCustomer
                          ? "bg-[var(--well)] text-[var(--text)]"
                          : "bg-[var(--ink)] text-[var(--on-ink)]"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-[var(--faint)] px-1">{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Quick Replies & Composer */}
          <div className="p-4 border-t border-[var(--line)] space-y-3">
            {/* Quick replies */}
            <div className="flex items-center gap-2">
              {["Ships today", "Checking now", "Thanks"].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setReplyText(chip)}
                  className="px-3 py-1 rounded-full text-[11px] font-medium bg-[var(--well)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] border border-[var(--line)] transition-all cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Textarea Composer */}
            <div className="relative">
              <textarea
                rows={2}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a reply..."
                className="w-full p-3 pr-10 rounded-xl text-[12.5px] bg-[var(--well)] border border-[var(--line)] text-[var(--text)] placeholder-[var(--faint)] outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none"
              />
              <button
                type="button"
                onClick={handleSend}
                className="absolute right-3 bottom-3 p-1.5 rounded-full bg-[var(--primary)] text-white hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10.5px] text-[var(--faint)]">
              <kbd className="font-mono">Enter</kbd> to send, <kbd className="font-mono">Shift + Enter</kbd> for a new line
            </p>
          </div>
        </div>

        {/* Pane 3: Customer Details Profile (Col 3) */}
        <div className="lg:col-span-3 p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--well)] border-2 border-[var(--line)] text-[18px] font-bold text-[var(--text)] flex items-center justify-center mb-3">
                {activeConv.initials}
              </div>
              <h2 className="text-[16px] font-bold text-[var(--text)]">{activeConv.name}</h2>
              <span className="text-[12px] text-[var(--muted)]">{activeConv.city}</span>
              <span className="mt-2 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[var(--well)] text-[var(--text)]">
                New
              </span>
            </div>

            {/* Customer Stats Table */}
            <div className="divide-y divide-[var(--line)] text-[12px]">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[var(--muted)]">Lifetime spend</span>
                <span className="font-bold font-mono text-[var(--text)]">
                  {activeConv.lifetimeSpend}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[var(--muted)]">Orders</span>
                <span className="font-bold font-mono text-[var(--text)]">
                  {activeConv.totalOrders}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[var(--muted)]">Channel</span>
                <span className="font-medium text-[var(--text)]">Online</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--line)]">
            <button
              type="button"
              className="w-full py-2 rounded-xl text-[12px] font-semibold bg-[var(--well)] text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors border border-[var(--line)]"
            >
              View Full Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
