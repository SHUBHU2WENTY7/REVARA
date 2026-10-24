# Old App Inventory & Mapping to Lumen Design System

## 1. App Summary
- **App Name**: REVARA Central Operations Dashboard (`revara-dashboard`)
- **Tech Stack**: React 18, Vite, TypeScript, Tailwind CSS, Motion (framer-motion), Supabase Client, Lucide React, Radix UI.
- **Backend / DB**: Supabase PostgreSQL + Auth + Realtime.

## 2. Pages & Navigation Inventory

| Old Tab / Screen | Purpose & Data State | Lumen System Mapping |
| :--- | :--- | :--- |
| **`overview`** | Live revenue, orders count, trade-in count, low stock radar, revenue graph, order status pie, recent orders/exchanges. | **Dashboard Screen**: Floating pill shell + 4-up KpiCards (Active sales inverted, Revenue, Units/Orders, Conversion rate) + 4-col Semicircle Radial Gauge (`Sales performance`) + 8-col HatchedBarChart (12 capsule columns, diagonal hatching, active gradient glow, tooltip) + Heatmap & Donut. |
| **`orders`** | Full orders fulfillment management, shipping tracking numbers, order items breakdown, status transitions. | **Orders Screen / Kanban / DataTable**: Filter chips, orders summary, status management, OrderDetailSheet. |
| **`products` & `inventory`** | Product catalog, SKU editing, inventory radar, categories management, stock adjust modals. | **Products Screen**: Filter chips, product grid/table with stock counts, drawer modal. |
| **`exchanges`** | Circular garment trade-in requests, photo proof inspection, grading, wallet credit allocation. | **Trade-In / Approvals**: Review queue, inspection sheet, credit approval. |
| **`users`** | Customer 360 CRM, user profiles, address history, direct push notifications. | **Customers Screen**: 4-up KPI row, customer data table with sortable headers, avatar initials, channel icons, lifetime spend. |
| **`notifications`** | Broadcast push alerts to mobile devices, announcement drops. | **Messages / Automations**: 3-pane inbox (conversations list, active thread, customer profile) + Automations view with flow nodes & switches. |
| **`wallets`** | User wallet balances, credit audit ledger, manual credit/debit adjustments. | **Wallets Ledger / Data table**. |
| **`reviews`** | Customer reviews & ratings approval/moderation. | **Feedback / Reviews Table**. |
| **`coupons` & `serviceability`** | Promo coupon codes, serviceable pincode corriors. | **Settings / Configuration Kits**. |
| **`settings`** | Master database seed, admin settings. | **Settings Kit**: Tabs, form grid, team cards, floating unsaved-changes bar. |

## 3. Endpoints & Database State
- `orders` / `order_items`: Orders telemetry, revenue sums, fulfillment tracking
- `products` / `categories`: Catalog, inventory stock levels, categories
- `exchange_requests` / `exchange_photos`: Circular economy trade-in queue
- `profiles` / `users`: Customer CRM records
- `wallets` / `wallet_transactions`: Customer credit balances and ledger entries
- `notifications`: Push broadcasts and communication logs
- `serviceable_pincodes`: Delivery corridor coverage
- `coupons`: Active promotion discount codes

## 4. Auth & Session Persistence
- Admin authentication via Supabase Auth + role check (`is_admin`)
- Session storage in `localStorage('revara_admin_session')` with zero-flicker pre-check in `index.html`
- Auth Provider context (`useAuth.ts`) and Admin Login Modal (`LoginOverlay.tsx`)

## 5. Architectural Implementation Plan
1. **Design Tokens (`src/styles/tokens.css`)**:
   - Install CSS tokens for light & dark themes (`--bg`, `--surface`, `--surface-2`, `--well`, `--line`, `--text`, `--muted`, `--faint`, `--ink`, `--primary`, `--primary-2`, `--c1`–`--c5`, `--up`, `--down`, `--warn`).
   - Configure typography with Manrope & Inter fonts, 20px card radius, 14px inner radius, 999px pill radius.
2. **Floating Pill Shell & Navigation (`src/components/layout/Shell.tsx`, `ToolRail.tsx`)**:
   - Top floating header with brand left, center pill nav with count badges and sliding active indicator on spring motion, right utilities (bell, team avatar cluster, user avatar).
   - Slim vertical tool rail floating on the left edge with search, shortcuts, settings, help, theme switch (`data-theme="light"` / `"dark"`).
   - Live count badge (`● 1,379 live now`).
3. **Lumen Components Suite**:
   - `KpiCard`: Hero numerals with tight tracking, label with info icon, delta pill, mini-viz (vertical bars, sparkline, ring gauge, equalizer), first card inversion rule (dark on light theme, light on dark theme).
   - `Gauge`: Semicircle arc with 40 radial ticks, knob at value, score numeral and delta pill, smooth sweep animation.
   - `HatchedBarChart`: 12 capsule columns, dashed average line, diagonal hatching on inactive bars, selected bar gradient fill + white cap, interactive floating tooltip card.
   - `Heatmap` & `Donut`: 7 columns of rounded cells and interactive donut chart with dimming.
   - `DataTable`: Customers & Orders table with sortable headers, avatar initials, sticky header, hover wash.
   - `Inbox`, `Thread`, `Composer`: 3-pane messages view with unread dot, star, quick reply chips, keyboard shortcuts.
   - `AutomationCard`: Flow diagram nodes connected by lines, status pill, stats row, spring switch toggle.
4. **Motion & Choreography**:
   - Page enter stagger fade + rise 12px over 420ms ease-out.
   - Count-up numerals with tabular figures.
   - Shared layout springs (`layoutId`) for pill nav indicators.
