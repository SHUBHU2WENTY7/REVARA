// ==============================================================================
// REVARA DASHBOARD — REAL-TIME DATA HOOK
// Reactive state with live Supabase Postgres subscriptions
// ==============================================================================

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react'
import type { DashboardState } from '@/types'
import { fetchAllRealtimeData, setupRealtimeListener } from '@/lib/supabase'
import { toast } from 'sonner'

export function playLiveAlertSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12) // A5
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  } catch {
    // AudioContext blocked or not supported
  }
}

const initialDashboardState: DashboardState = {
  products: [],
  categories: [],
  orders: [],
  orderItems: [],
  exchanges: [],
  exchangeItems: [],
  exchangeInspections: [],
  profiles: [],
  addresses: [],
  wallets: [],
  walletTransactions: [],
  serviceability: [],
  cities: [],
  cityWaitlist: [],
  reviews: [],
  coupons: [],
  auditLogs: [],
  notifications: [],
  isConnected: false,
  lastSyncTime: null,
}

interface DashboardContextType {
  state: DashboardState
  isLoading: boolean
  isSyncing: boolean
  refreshData: () => Promise<void>
  sidebarBadges: {
    pendingOrders: number
    lowStock: number
    pendingExchanges: number
  }
}

import React from 'react'
const DashboardContext = createContext<DashboardContextType | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DashboardState>(initialDashboardState)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)

  const refreshData = useCallback(async () => {
    setIsSyncing(true)
    try {
      const data = await fetchAllRealtimeData()
      setState(data)
    } catch (err) {
      console.error('[REVARA] Error refreshing data:', err)
      toast.error('Failed to sync data with Supabase')
    } finally {
      setIsLoading(false)
      setIsSyncing(false)
    }
  }, [])

  useEffect(() => {
    refreshData()

    const channel = setupRealtimeListener((type) => {
      playLiveAlertSound()
      refreshData()

      if (type === 'order') {
        toast.success('New Order Placed!', {
          description: 'A customer has submitted a new checkout order.',
        })
      } else if (type === 'exchange') {
        toast.info('New Garment Trade-In!', {
          description: 'A collector submitted items for appraisal.',
        })
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [refreshData])

  const pendingOrders = state.orders.filter(
    (o) => o.status === 'placed' || o.status === 'confirmed' || o.status === 'processing'
  ).length

  const lowStock = state.products.filter((p) => p.stock <= 5).length

  const pendingExchanges = state.exchanges.filter(
    (e) => e.status === 'submitted' || e.status === 'in_transit'
  ).length

  return React.createElement(
    DashboardContext.Provider,
    {
      value: {
        state,
        isLoading,
        isSyncing,
        refreshData,
        sidebarBadges: {
          pendingOrders,
          lowStock,
          pendingExchanges,
        },
      },
    },
    children
  )
}

export function useDashboardData(): DashboardContextType {
  const ctx = useContext(DashboardContext)
  if (!ctx) {
    throw new Error('useDashboardData must be used within DashboardProvider')
  }
  return ctx
}
