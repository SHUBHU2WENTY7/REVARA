import { useState, useEffect, lazy, Suspense } from "react"
import { Toaster, toast } from "sonner"
import { AuthProvider, useAuth } from "@/hooks/useAuth"
import { DashboardProvider, useDashboardData } from "@/hooks/useDashboardData"
import type { TabId, Product, Order, ExchangeRequest, Coupon } from "@/types"

// Layout & UI components
import { Sidebar } from "@/components/layout/Sidebar"
import { ResizableNavbar } from "@/components/ui/resizable-navbar"
import { StickyBanner } from "@/components/ui/sticky-banner"
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
const ReviewsTab = lazy(() => import("@/features/reviews/ReviewsTab").then(m => ({ default: m.ReviewsTab })))
const CouponsTab = lazy(() => import("@/features/coupons/CouponsTab").then(m => ({ default: m.CouponsTab })))
const NotificationsTab = lazy(() => import("@/features/notifications/NotificationsTab").then(m => ({ default: m.NotificationsTab })))
const ServiceabilityTab = lazy(() => import("@/features/serviceability/ServiceabilityTab").then(m => ({ default: m.ServiceabilityTab })))
const AuditLogsTab = lazy(() => import("@/features/audit_logs/AuditLogsTab").then(m => ({ default: m.AuditLogsTab })))
const SettingsTab = lazy(() => import("@/features/settings/SettingsTab").then(m => ({ default: m.SettingsTab })))

function DashboardShell() {
  const { admin, isLoading: isAuthLoading, unauthorizedUser } = useAuth()
  const { state } = useDashboardData()

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

      // Two-key chord shortcuts (e.g. G then O for orders)
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

  // Operational Warning condition for StickyBanner
  const lowStockCount = state.products.filter((p) => p.stock <= 5).length
  const pendingExchangeCount = state.exchanges.filter(
    (e) => e.status === "submitted" || e.status === "in_transit"
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
          <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-slate-400">Verifying REVARA Admin Session...</p>
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
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? "md:pl-[72px]" : "md:pl-[260px]"
        }`}
      >
        {/* Dynamic Operational Warning StickyBanner */}
        {lowStockCount > 0 ? (
          <StickyBanner
            variant="amber"
            title="Operational Alert:"
            description={`${lowStockCount} product(s) are below safety threshold (≤ 5 units). Reorder recommended.`}
            actionLabel="View Stock Radar"
            onAction={() => setCurrentTab("inventory")}
          />
        ) : pendingExchangeCount > 0 ? (
          <StickyBanner
            variant="indigo"
            title="Circular Queue:"
            description={`${pendingExchangeCount} garment trade-in submission(s) awaiting appraisal and credit deposit.`}
            actionLabel="Inspect Trade-Ins"
            onAction={() => setCurrentTab("exchanges")}
          />
        ) : null}

        {/* Resizable Navbar */}
        <ResizableNavbar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenBroadcastModal={() => handleOpenBroadcastModal()}
          onOpenProductModal={() => handleOpenProductModal()}
          onToggleMobileMenu={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Dynamic Tab Content */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto animate-fade-in">
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="space-y-6 animate-pulse">
                  <div className="h-24 bg-card/60 rounded-xl border border-border-card/60" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-28 bg-card/40 rounded-xl border border-border-card/40" />
                    ))}
                  </div>
                  <div className="h-96 bg-card/50 rounded-xl border border-border-card/50" />
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
                <UsersTab
                  onOpenTargetedBroadcast={(id, name) =>
                    handleOpenBroadcastModal(id, name)
                  }
                />
              )}

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

      <BroadcastModal
        open={broadcastModalOpen}
        onOpenChange={setBroadcastModalOpen}
        targetUserId={targetUser?.id}
        targetUserName={targetUser?.name}
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

      {walletTarget && (
        <WalletAdjustModal
          open={walletModalOpen}
          onOpenChange={setWalletModalOpen}
          userId={walletTarget.userId}
          userName={walletTarget.userName}
          currentBalance={walletTarget.balance}
        />
      )}

      <CouponModal
        open={couponModalOpen}
        onOpenChange={setCouponModalOpen}
        coupon={selectedCoupon}
      />

      <PincodeModal
        open={pincodeModalOpen}
        onOpenChange={setPincodeModalOpen}
      />

      <MobileRedirectBanner />
      <Toaster position="bottom-right" theme="dark" richColors />
    </div>
  )
}

export function App() {
  return (
    <AuthProvider>
      <DashboardProvider>
        <DashboardShell />
      </DashboardProvider>
    </AuthProvider>
  )
}

export default App
