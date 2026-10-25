// ==============================================================================
// REVARA DASHBOARD — STRICT TYPES
// Matches Supabase Schema 100% — Zero `any`
// ==============================================================================

export type AdminRole =
  | 'super_admin'
  | 'operations_admin'
  | 'product_admin'
  | 'customer_support'
  | 'finance'
  | 'analyst'

export interface AdminUser {
  id: string
  email: string
  displayName: string
  adminRole: AdminRole
  avatarUrl?: string | null
  token?: string
}

export type TabId =
  | 'overview'
  | 'activity'
  | 'orders'
  | 'products'
  | 'inventory'
  | 'exchanges'
  | 'wallets'
  | 'users'
  | 'reviews'
  | 'coupons'
  | 'notifications'
  | 'messages'
  | 'automations'
  | 'serviceability'
  | 'audit_logs'
  | 'settings'

export interface Product {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  category_id: string | null
  brand: string
  description: string
  is_limited: boolean
  is_trending: boolean
  is_new: boolean
  is_featured: boolean
  images: string[]
  tags?: string[]
  dimensions?: string | null
  created_at: string
  updated_at?: string
  status?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  image_url: string | null
  sort_order: number
  created_at?: string
}

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface Order {
  id: string
  user_id: string
  status: OrderStatus
  /** Supabase column is `total`; legacy code may reference `total_amount` */
  total: number
  total_amount?: number
  subtotal?: number
  subtotal_amount?: number
  discount?: number
  discount_amount?: number
  credits_applied?: number
  shipping_fee?: number
  shipping_amount?: number
  wallet_credit_used?: number
  address_id?: string
  shipping_address_id?: string
  payment_id?: string
  tracking_number?: string | null
  notes?: string | null
  created_at: string
  updated_at?: string
  items?: OrderItem[]
  customer_name?: string
  customer_email?: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  /** Supabase column is `unit_price` */
  unit_price: number
  /** Alias kept for backward compat */
  price?: number
  total?: number
  product_name?: string
  product_image?: string
}

export type ExchangeStatus =
  | 'submitted'
  | 'in_transit'
  | 'inspected'
  | 'credits_issued'
  | 'completed'
  | 'rejected'

export interface ExchangeRequest {
  id: string
  user_id: string
  status: ExchangeStatus
  pickup_address_id?: string
  pickup_date?: string
  actual_weight_kg?: number | null
  grade?: string | null
  final_credits?: number | null
  notes?: string | null
  customer_notes?: string | null
  created_at: string
  updated_at?: string
  items?: ExchangeItem[]
  inspection?: ExchangeInspection | null
  customer_name?: string
  customer_email?: string
}

export interface ExchangeItem {
  id: string
  exchange_id: string
  category?: string
  brand?: string
  condition?: string
  photos?: string[]
  video_url?: string | null
  created_at?: string
}

export interface ExchangeInspection {
  id?: string
  exchange_id: string
  actual_weight_kg: number
  grade: 'a' | 'b' | 'c' | 'rejected'
  accepted_items_count: number
  rejected_items_count: number
  final_credits_issued: number
  inspector_notes: string
  inspected_at?: string
}

export interface Profile {
  id: string
  email: string | null
  phone: string | null
  full_name: string | null
  avatar_url: string | null
  role: string
  created_at: string
  updated_at?: string
}

export interface Address {
  id: string
  user_id: string
  line1?: string
  line2?: string
  address_line1?: string
  address_line2?: string
  label?: string
  city?: string
  state?: string
  pincode: string
  phone?: string
  name?: string
  is_default?: boolean
  created_at?: string
}

export interface Wallet {
  user_id: string
  available_credits: number
  pending_credits: number
  total_earned: number
  total_used: number
  updated_at: string
}

export interface WalletTransaction {
  id: string
  wallet_id?: string
  user_id: string
  amount: number
  transaction_type?: 'credit' | 'debit'
  reason: string
  reference_type?: string
  reference_id?: string
  created_at: string
}

export interface ServiceablePincode {
  pincode: string
  city_name: string
  state: string
  status: 'active' | 'inactive' | 'suspended'
  active_route_available: boolean
  city_id?: string | null
  created_at?: string
}

export interface City {
  id: string
  name: string
  state: string
  status: string
  activation_threshold_households?: number
  activation_threshold_weight_kg?: number
  created_at?: string
}

export interface CityWaitlistEntry {
  id: string
  city_id?: string
  pincode: string
  collector_name?: string
  phone?: string
  estimated_garments?: number
  created_at: string
}

export interface Review {
  id: string
  product_id: string | null
  user_id: string | null
  /** Supabase stores reviewer name directly on the review row */
  user_name?: string | null
  avatar_url?: string | null
  rating: number
  title?: string | null
  /** Supabase column is `body`; legacy code may reference `comment` */
  body?: string | null
  comment?: string | null
  photo_urls?: string[]
  is_verified_purchase?: boolean
  helpful_count?: number
  status?: string
  created_at: string
}

export interface Coupon {
  id: string
  code: string
  type: 'percent' | 'flat' | 'free_shipping'
  value: number
  min_order_amount: number
  max_discount?: number
  is_active: boolean
  created_at?: string
}

export interface AuditLog {
  id: string
  admin_id: string | null
  action: string
  entity_type: string
  entity_id: string
  old_value: unknown
  new_value: unknown
  reason: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  type: string
  is_read: boolean
  reference_type?: string
  created_at: string
}

export interface InventoryMovement {
  id?: string
  product_id: string
  quantity_change: number
  reason: string
  reference_type?: string
  reference_id?: string | null
  stock_before: number
  stock_after: number
  admin_id?: string | null
  notes?: string
  created_at?: string
}

export interface ActivityEvent {
  id: string
  type: 'order' | 'exchange' | 'wallet' | 'review' | 'user' | 'product' | 'system'
  title: string
  description: string
  timestamp: string
  badgeColor: string
  raw?: unknown
}

export interface DashboardState {
  products: Product[]
  categories: Category[]
  orders: Order[]
  orderItems: OrderItem[]
  exchanges: ExchangeRequest[]
  exchangeItems: ExchangeItem[]
  exchangeInspections: ExchangeInspection[]
  profiles: Profile[]
  addresses: Address[]
  wallets: Wallet[]
  walletTransactions: WalletTransaction[]
  serviceability: ServiceablePincode[]
  cities: City[]
  cityWaitlist: CityWaitlistEntry[]
  reviews: Review[]
  coupons: Coupon[]
  auditLogs: AuditLog[]
  notifications: Notification[]
  isConnected: boolean
  lastSyncTime: Date | null
}
