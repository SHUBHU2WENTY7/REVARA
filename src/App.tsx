import { useState, useEffect, lazy, Suspense } from "react"
import { Toaster, toast } from "sonner"
import { AuthProvider, useAuth } from "@/hooks/useAuth"
import { DashboardProvider, useDashboardData } from "@/hooks/useDashboardData"
import { useTheme } from "@/hooks/useTheme"
import type { TabId, Product, Order, ExchangeRequest, Coupon } from "@/types"

// Lumen Design System Layout Components
import { Shell } from "@/components/lumen/Shell"

// Layout & UI components
import { Sidebar } from "@/components/layout/Sidebar"
import { CommandPalette } from "@/components/layout/CommandPalette"
import { LoginOverlay } from "@/components/auth/LoginOverlay"
import { UnauthorizedScreen } from "@/components/auth/UnauthorizedScreen"
import { MobileRedirectBanner } from "@/components/auth/MobileRedirectBanner"
import { ErrorBoundary } from "@/components/layout/ErrorBoundary"

// Modals
import { BroadcastModal } from "@/components/modals/BroadcastModal"
import { ProductModal } from "@/components/modals/ProductModal"
import { CategoryModal } from "@/components/modals/CategoryModal"
import { OrderDetailSheet } from "@/components/modals/OrderDetailSheet"
import { ExchangeInspectionSheet } from "@/components/modals/ExchangeInspectionSheet"
import { WalletAdjustModal } from "@/components/modals/WalletAdjustModal"
import { CouponModal } from "@/components/modals/CouponModal"
import { PincodeModal } from "@/components/modals/PincodeModal"

// Tab Features (Lazy Loaded for route-level code splitting)
const OverviewTab = lazy(() => import("@/features/overview/OverviewTab").then(m => ({ default: m.OverviewTab })))
const ActivityTab = lazy(() => import("@/features/activity/ActivityTab").then(m => ({ default: m.ActivityTab })))
const OrdersTab = lazy(() => import("@/features/orders/OrdersTab").then(m => ({ default: m.OrdersTab })))
const ProductsTab = lazy(() => import("@/features/products/ProductsTab").then(m => ({ default: m.ProductsTab })))
const InventoryTab = lazy(() => import("@/features/inventory/InventoryTab").then(m => ({ default: m.InventoryTab })))
const ExchangesTab = lazy(() => import("@/features/exchanges/ExchangesTab").then(m => ({ default: m.ExchangesTab })))
const WalletsTab = lazy(() => import("@/features/wallets/WalletsTab").then(m => ({ default: m.WalletsTab })))
const UsersTab = lazy(() => import("@/features/users/UsersTab").then(m => ({ default: m.UsersTab })))
const MessagesTab = lazy(() => import("@/features/messages/MessagesTab").then(m => ({ default: m.MessagesTab })))
const AutomationsTab = lazy(() => import("@/features/automations/AutomationsTab").then(m => ({ default: m.AutomationsTab })))
const ReviewsTab = lazy(() => import("@/features/reviews/ReviewsTab").then(m => ({ default: m.ReviewsTab })))
const CouponsTab = lazy(() => import("@/features/coupons/CouponsTab").then(m => ({ default: m.CouponsTab })))
const NotificationsTab = lazy(() => import("@/features/notifications/NotificationsTab").then(m => ({ default: m.NotificationsTab })))
const ServiceabilityTab = lazy(() => import("@/features/serviceability/ServiceabilityTab").then(m => ({ default: m.ServiceabilityTab })))
const AuditLogsTab = lazy(() => import("@/features/audit_logs/AuditLogsTab").then(m => ({ default: m.AuditLogsTab })))
const SettingsTab = lazy(() => import("@/features/settings/SettingsTab").then(m => ({ default: m.SettingsTab })))

function DashboardShell() {
  const { admin, isLoading: isAuthLoading, unauthorizedUser } = useAuth()
  const { state } = useDashboardData()
  const { theme, toggleTheme } = useTheme()

  const [currentTab, setCurrentTab] = useState<TabId>("overview")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Modal States
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false)
  const [targetUser, setTargetUser] = useState<{ id: string; name: string } | null>(null)

  const [productModalOpen, setProductModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const [categoryModalOpen, setCategoryModalOpen] = useState(false)

  const [orderSheetOpen, setOrderSheetOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const [exchangeSheetOpen, setExchangeSheetOpen] = useState(false)
  const [selectedExchange, setSelectedExchange] = useState<ExchangeRequest | null>(null)

  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [walletTarget, setWalletTarget] = useState<{ userId: string; userName: string; balance: number } | null>(null)

  const [couponModalOpen, setCouponModalOpen] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)

  const [pincodeModalOpen, setPincodeModalOpen] = useState(false)

  // Keyboard navigation shortcuts
  useEffect(() => {
    let keyBuffer = ""
    let timer: ReturnType<typeof setTimeout>

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandPaletteOpen(true)
        return
      }

      // Two-key chord shortcuts
      keyBuffer += e.key.toLowerCase()
      clearTimeout(timer)
      timer = setTimeout(() => {
        keyBuffer = ""
      }, 500)

      if (keyBuffer === "go") {
        setCurrentTab("orders")
        keyBuffer = ""
      } else if (keyBuffer === "gp") {
        setCurrentTab("products")
        keyBuffer = ""
      } else if (keyBuffer === "gi") {
        setCurrentTab("inventory")
        keyBuffer = ""
      } else if (keyBuffer === "ge") {
        setCurrentTab("exchanges")
        keyBuffer = ""
      } else if (keyBuffer === "gw") {
        setCurrentTab("wallets")
        keyBuffer = ""
      } else if (keyBuffer === "gu") {
        setCurrentTab("users")
        keyBuffer = ""
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const pendingExchangeCount = state.exchanges.filter(
    (e) => e.status === "submitted" || e.status === "in_transit"
  ).length
  const pendingOrdersCount = state.orders.filter(
    (o) => o.status === "placed" || o.status === "confirmed"
  ).length

  // Handlers
  const handleOpenProductModal = (product?: Product | null) => {
    setSelectedProduct(product || null)
    setProductModalOpen(true)
  }

  const handleOpenBroadcastModal = (userId?: string | null, userName?: string | null) => {
    if (userId) {
      setTargetUser({ id: userId, name: userName || "Customer" })
    } else {
      setTargetUser(null)
    }
    setBroadcastModalOpen(true)
  }

  const handleOpenOrderSheet = (order: Order) => {
    setSelectedOrder(order)
    setOrderSheetOpen(true)
  }

  const handleOpenExchangeSheet = (exchange: ExchangeRequest) => {
    setSelectedExchange(exchange)
    setExchangeSheetOpen(true)
  }

  const handleOpenWalletModal = (userId: string, userName: string, balance: number) => {
    setWalletTarget({ userId, userName, balance })
    setWalletModalOpen(true)
  }

  const handleOpenCouponModal = (coupon?: Coupon | null) => {
    setSelectedCoupon(coupon || null)
    setCouponModalOpen(true)
  }

  // Auth gate
  if (isAuthLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080C14]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-[var(--muted)]">Verifying REVARA Admin Session...</p>
        </div>
      </div>
    )
  }

  if (unauthorizedUser) {
    return <UnauthorizedScreen />
  }

  if (!admin) {
    return (
      <>
        <LoginOverlay />
        <MobileRedirectBanner />
      </>
    )
  }

  return (
    <div
      className="min-h-screen text-[var(--text)] transition-colors duration-200 relative selection:bg-[var(--primary)] selection:text-white"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* Revara Operations Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab)
          setIsMobileSidebarOpen(false)
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Floating Pill Shell at top & Dedicated Mobile Header */}
      <Shell
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab as TabId)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        brandName="REVARA"
        brandSubtitle="Circular Luxury Operations"
        pendingOrdersCount={pendingOrdersCount}
        pendingExchangesCount={pendingExchangeCount}
        unreadMessagesCount={2}
        liveNowCount={state.orders.length > 0 ? state.orders.length.toLocaleString() : "0"}
        adminInitials={admin?.displayName?.slice(0, 2).toUpperCase() || "AD"}
        onOpenNotifications={() => setCurrentTab("messages")}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <div
        className={`transition-all duration-300 pb-24 md:pb-8 ${
          isSidebarCollapsed ? "md:pl-[72px]" : "md:pl-[260px]"
        }`}
      >
        <main className="p-4 sm:p-6 lg:p-8 max-w-[1740px] w-full mx-auto">
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="space-y-6 animate-pulse">
                  <div className="h-24 bg-[var(--surface)] rounded-2xl border border-[var(--line)]" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="h-28 bg-[var(--surface)] rounded-2xl border border-[var(--line)]"
                      />
                    ))}
                  </div>
                  <div className="h-96 bg-[var(--surface)] rounded-2xl border border-[var(--line)]" />
                </div>
              }
            >
              {currentTab === "overview" && (
                <OverviewTab
                  onSelectTab={setCurrentTab}
                  onOpenProductModal={() => handleOpenProductModal()}
                  onOpenBroadcastModal={() => handleOpenBroadcastModal()}
                  onSelectOrder={handleOpenOrderSheet}
                />
              )}

              {currentTab === "activity" && <ActivityTab />}

              {currentTab === "orders" && (
                <OrdersTab onSelectOrder={handleOpenOrderSheet} />
              )}

              {currentTab === "products" && (
                <ProductsTab
                  onOpenProductModal={handleOpenProductModal}
                  onOpenCategoryModal={() => setCategoryModalOpen(true)}
                />
              )}

              {currentTab === "inventory" && (
                <InventoryTab onOpenProductModal={handleOpenProductModal} />
              )}

              {currentTab === "exchanges" && (
                <ExchangesTab onSelectExchange={handleOpenExchangeSheet} />
              )}

              {currentTab === "wallets" && (
                <WalletsTab onOpenAdjustModal={handleOpenWalletModal} />
              )}

              {currentTab === "users" && (
                <UsersTab onOpenTargetedBroadcast={handleOpenBroadcastModal} />
              )}

              {currentTab === "messages" && <MessagesTab />}

              {currentTab === "automations" && <AutomationsTab />}

              {currentTab === "reviews" && <ReviewsTab />}

              {currentTab === "coupons" && (
                <CouponsTab onOpenCouponModal={handleOpenCouponModal} />
              )}

              {currentTab === "notifications" && (
                <NotificationsTab
                  onOpenBroadcastModal={() => handleOpenBroadcastModal()}
                />
              )}

              {currentTab === "serviceability" && (
                <ServiceabilityTab
                  onOpenPincodeModal={() => setPincodeModalOpen(true)}
                />
              )}

              {currentTab === "audit_logs" && <AuditLogsTab />}

              {currentTab === "settings" && <SettingsTab />}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Global Modals & Sheets */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onSelectTab={setCurrentTab}
        onOpenBroadcastModal={() => handleOpenBroadcastModal()}
        onOpenProductModal={() => handleOpenProductModal()}
      />

      <ProductModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        product={selectedProduct}
      />

      <CategoryModal
        open={categoryModalOpen}
        onOpenChange={setCategoryModalOpen}
      />

      <OrderDetailSheet
        open={orderSheetOpen}
        onOpenChange={setOrderSheetOpen}
        order={selectedOrder}
      />

      <ExchangeInspectionSheet
        open={exchangeSheetOpen}
        onOpenChange={setExchangeSheetOpen}
        exchange={selectedExchange}
      />

      <WalletAdjustModal
        open={walletModalOpen}
        onOpenChange={setWalletModalOpen}
        userId={walletTarget?.userId || null}
        userName={walletTarget?.userName || null}
        currentBalance={walletTarget?.balance || 0}
      />

      <BroadcastModal
        open={broadcastModalOpen}
        onOpenChange={setBroadcastModalOpen}
        targetUserId={targetUser?.id || null}
        targetUserName={targetUser?.name || null}
      />

      <CouponModal
        open={couponModalOpen}
        onOpenChange={setCouponModalOpen}
        coupon={selectedCoupon}
      />

      <PincodeModal
        open={pincodeModalOpen}
        onOpenChange={setPincodeModalOpen}
      />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardProvider>
        <DashboardShell />
        <Toaster position="bottom-right" richColors theme="system" />
      </DashboardProvider>
    </AuthProvider>
  )
}
