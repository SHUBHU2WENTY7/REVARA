# THE FIGURE FACTORY (TFF) — MASTER ADMIN COMMAND CENTER

> **Enterprise Operations, Figure Commerce, Circular Trade-In & Logistics Hub**

The **TFF Admin Command Center** is a standalone, ultra-high performance web application serving as the real-time operational heart and central source of truth for **THE FIGURE FACTORY (TFF)** ecosystem.

It connects live via WebSockets and REST directly to the Supabase backend shared with the **TFF Mobile Customer Application** (`tff_app`).

---

## 🎨 Master Design System
- **Aesthetic**: Obsidian Slate (`#080C14`), Deep Space Navy (`#0F172A`), Electric Indigo (`#6366F1`), Cyber Cyan (`#0EA5E9`), Emerald (`#10B981`), Rose (`#F43F5E`).
- **Typography**: `Plus Jakarta Sans`, `Inter`, `JetBrains Mono` for IDs, metrics, and currency.
- **Micro-Interactions**: Ambient glassmorphism, animated live connection beacon, audible real-time synth alerts, responsive modals, and slide-in drawers.

---

## ⚡ Real-Time Architecture & Two-Way App Sync

```
                 TFF ADMIN COMMAND CENTER (Web)
                               │  [Real-Time Supabase WebSocket & REST API]
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
     COMMERCE              EXCHANGES               GROWTH
   Products & Drops      Figure Trade-Ins       Customer 360 CRM
   Stock Radar           Grading & Inspection   Reviews & UGC
   Orders & Shipping     Wallet Ledger          Coupons & Promos
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                               ▼
                   TFF CUSTOMER MOBILE APP
```

---

## 🚀 Key Modules & Live Capabilities

1. **Executive Overview**: High-impact live KPI telemetry (Gross Revenue, Active Orders, Trade-In Queue, Registered Collectors, Low Stock Radar, Wallet Liabilities), Velocity Trends Chart (Chart.js), Order Fulfillment Pipeline, and Live Stream.
2. **Order Fulfillment Hub**: Full order lifecycle management (`placed` → `confirmed` → `processing` → `shipped` → `delivered` → `cancelled`). Integrated tracking number generator, courier dispatch notes, item breakdown, and automated in-app customer push notifications.
3. **Product Catalog & Figure Drops**: Scale figure catalog manager with instant SKU auto-generator, high-resolution multi-image galleries, category filters, pricing, stock levels, and drop flags (`Limited Edition`, `Trending`, `New Arrival`, `Featured`).
4. **Inventory & Stock Radar**: Real-time warehouse inventory radar highlighting low stock (<= 5) and out of stock items, 1-click batch stock replenishment (+1, +5, +10, -1), and total warehouse inventory valuation.
5. **TFF Circular Exchange Studio**: Inspect customer pre-owned figure trade-ins. View submitted photos, set actual weight (KG), assign condition grades (Grade A 90%, Grade B 75%, Grade C 50%, Rejected), calculate credits, and 1-click deposit credits into the customer's wallet with ledger entry and push notification.
6. **Customer 360 CRM**: Master collector registry from `profiles` table. Track lifetime orders, registered delivery addresses, and wallet balances with direct in-app alert messaging.
7. **Wallets & Double-Entry Ledger**: Active customer balances, transaction ledgers (`credit_earned`, `credit_used`, `credit_adjusted`), 50% checkout cap policy, and manual credit adjustment with mandatory audit reasons.
8. **Review Moderation Studio**: Customer figure reviews, star ratings, verified purchase badge toggle, and 1-click spam deletion with automatic product average rating recalculation.
9. **Coupons & Promotional Engine**: Create discount codes (`flat`, `percent`, `free_shipping`), set min cart hurdles, max discount caps, validity dates, and live usage counters.
10. **Delivery Zones & City Waitlist**: Manage serviceable PIN codes and active pickup routes. View customer city waitlist submissions from collectors in unserved cities to guide expansion.
11. **In-App Notification Dispatcher**: Compose announcements and drop alerts to all registered collectors or individual customers.
12. **Forensic Audit Trail**: Permanent, immutable ledger recording every administrative mutation with timestamp, target entity, before/after values, and authorization reason.
13. **Live Operations Feed**: Chronological terminal of all real-time events streamed from the customer mobile application.
14. **System Tools & Master Data Seeder**: 1-click master anime figure seeder (Jujutsu Kaisen, One Piece, Attack on Titan, Evangelion, Dragon Ball) with high-res photography, categories, and metro delivery zones.

---

## 🏃 Running Instructions

Open `index.html` in any modern web browser or serve via any static web server:

```bash
# Option 1: Double-click index.html or open via VS Code Live Server
# Option 2: Run via Node / Python
npx serve c:\Users\shubhanshu\StudioProjects\tff_dashboard_app -p 3000
# or
python -m http.server 3000 --directory c:\Users\shubhanshu\StudioProjects\tff_dashboard_app
```
