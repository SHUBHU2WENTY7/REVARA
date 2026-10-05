// ==============================================================================
// REVARA — MASTER REAL-TIME SUPABASE CLIENT
// Direct Real-Time Connection with REVARA Customer Mobile Application
// 100% Live Database State — No Mocks, No Fake Data
// ==============================================================================

const SUPABASE_URL = 'https://ynsathlkfnbryafckvwm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inluc2F0aGxrZm5icnlhZmNrdndtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQwNTY3OSwiZXhwIjoyMTAyOTgxNjc5fQ.DREfaYV4ZYEsFTdRYNC5EwrtTOX3RoLzMKCgCwMtQdo';

let supabaseClient = null;

function getSupabase() {
  if (!supabaseClient && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true },
        realtime: { params: { eventsPerSecond: 10 } },
      });
    } catch (e) {
      console.error('[REVARA] Supabase initialization failed:', e);
    }
  }
  return supabaseClient;
}

// Master state cache — all live data from Supabase
const REVARA_STATE = {
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
};

// Aliases for global accessibility
window.REVARA_STATE = REVARA_STATE;
window.TFF_STATE = REVARA_STATE;

// --- DIRECT IMAGE FILE UPLOAD ENGINE ---
async function uploadProductImageToStorage(file) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase client missing');

  const fileExt = file.name.split('.').pop();
  const fileName = `revara_prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  const { data, error } = await sb.storage.from('tff-products').upload(fileName, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) {
    console.error('[REVARA Storage] Upload error:', error);
    throw error;
  }

  const { data: { publicUrl } } = sb.storage.from('tff-products').getPublicUrl(fileName);
  return publicUrl;
}

// --- DATA FETCHING ENGINE ---
async function fetchAllRealtimeData() {
  const sb = getSupabase();
  if (!sb) {
    console.warn('[REVARA] Supabase JS library is still loading...');
    return false;
  }

  try {
    const [
      prodsRes,
      catsRes,
      ordersRes,
      orderItemsRes,
      exchRes,
      exchItemsRes,
      exchInspRes,
      profRes,
      addrRes,
      walletsRes,
      walletTxRes,
      pinRes,
      citiesRes,
      waitlistRes,
      reviewsRes,
      couponsRes,
      auditRes,
      notifRes
    ] = await Promise.all([
      sb.from('products').select('*').order('created_at', { ascending: false }),
      sb.from('categories').select('*').order('sort_order', { ascending: true }),
      sb.from('orders').select('*').order('created_at', { ascending: false }),
      sb.from('order_items').select('*'),
      sb.from('exchange_requests').select('*').order('created_at', { ascending: false }),
      sb.from('exchange_items').select('*'),
      sb.from('exchange_inspections').select('*'),
      sb.from('profiles').select('*').order('created_at', { ascending: false }),
      sb.from('addresses').select('*'),
      sb.from('wallets').select('*'),
      sb.from('wallet_transactions').select('*').order('created_at', { ascending: false }),
      sb.from('serviceable_pincodes').select('*').order('pincode', { ascending: true }),
      sb.from('cities').select('*'),
      sb.from('city_waitlist').select('*').order('created_at', { ascending: false }),
      sb.from('reviews').select('*').order('created_at', { ascending: false }),
      sb.from('coupons').select('*').order('created_at', { ascending: false }),
      sb.from('audit_logs').select('*').order('created_at', { ascending: false }),
      sb.from('notifications').select('*').order('created_at', { ascending: false }),
    ]);

    REVARA_STATE.products = prodsRes.data || [];
    REVARA_STATE.categories = catsRes.data || [];
    REVARA_STATE.orders = ordersRes.data || [];
    REVARA_STATE.orderItems = orderItemsRes.data || [];
    REVARA_STATE.exchanges = exchRes.data || [];
    REVARA_STATE.exchangeItems = exchItemsRes.data || [];
    REVARA_STATE.exchangeInspections = exchInspRes.data || [];
    REVARA_STATE.profiles = profRes.data || [];
    REVARA_STATE.addresses = addrRes.data || [];
    REVARA_STATE.wallets = walletsRes.data || [];
    REVARA_STATE.walletTransactions = walletTxRes.data || [];
    REVARA_STATE.serviceability = pinRes.data || [];
    REVARA_STATE.cities = citiesRes.data || [];
    REVARA_STATE.cityWaitlist = waitlistRes.data || [];
    REVARA_STATE.reviews = reviewsRes.data || [];
    REVARA_STATE.coupons = couponsRes.data || [];
    REVARA_STATE.auditLogs = auditRes.data || [];
    REVARA_STATE.notifications = notifRes.data || [];
    REVARA_STATE.isConnected = true;
    REVARA_STATE.lastSyncTime = new Date();

    // Update last sync UI badge
    const badge = document.getElementById('last-sync-badge');
    const timeEl = document.getElementById('last-sync-time');
    if (badge && timeEl) {
      badge.classList.remove('hidden');
      timeEl.textContent = REVARA_STATE.lastSyncTime.toLocaleTimeString();
    }

    return true;
  } catch (err) {
    console.error('[REVARA] Error fetching Supabase data:', err);
    return false;
  }
}

// --- REAL-TIME POSTGRES SUBSCRIPTION CHANNEL ---
function setupRealtimeListener(onEventCallback) {
  const sb = getSupabase();
  if (!sb) return;

  const channel = sb.channel('revara_command_center_realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async (payload) => {
      console.log('[REVARA] ⚡ Realtime Order Event:', payload);
      await fetchAllRealtimeData();
      if (onEventCallback) onEventCallback('order', payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, async (payload) => {
      console.log('[REVARA] ⚡ Realtime Order Item Event:', payload);
      await fetchAllRealtimeData();
      if (onEventCallback) onEventCallback('order_item', payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'exchange_requests' }, async (payload) => {
      console.log('[REVARA] ⚡ Realtime Exchange Event:', payload);
      await fetchAllRealtimeData();
      if (onEventCallback) onEventCallback('exchange', payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'exchange_items' }, async (payload) => {
      console.log('[REVARA] ⚡ Realtime Exchange Item Event:', payload);
      await fetchAllRealtimeData();
      if (onEventCallback) onEventCallback('exchange_item', payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async (payload) => {
      console.log('[REVARA] ⚡ Realtime Product Event:', payload);
      await fetchAllRealtimeData();
      if (onEventCallback) onEventCallback('product', payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' }, async (payload) => {
      console.log('[REVARA] ⚡ Realtime Wallet Event:', payload);
      await fetchAllRealtimeData();
      if (onEventCallback) onEventCallback('wallet', payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions' }, async (payload) => {
      console.log('[REVARA] ⚡ Realtime Wallet Transaction:', payload);
      await fetchAllRealtimeData();
      if (onEventCallback) onEventCallback('wallet_tx', payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, async (payload) => {
      console.log('[REVARA] ⚡ Realtime Profile Event:', payload);
      await fetchAllRealtimeData();
      if (onEventCallback) onEventCallback('profile', payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, async (payload) => {
      console.log('[REVARA] ⚡ Realtime Review Event:', payload);
      await fetchAllRealtimeData();
      if (onEventCallback) onEventCallback('review', payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, async (payload) => {
      console.log('[REVARA] ⚡ Realtime Coupon Event:', payload);
      await fetchAllRealtimeData();
      if (onEventCallback) onEventCallback('coupon', payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, async (payload) => {
      console.log('[REVARA] ⚡ Realtime Notification Event:', payload);
      await fetchAllRealtimeData();
      if (onEventCallback) onEventCallback('notification', payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'serviceable_pincodes' }, async (payload) => {
      console.log('[REVARA] ⚡ Realtime Pincode Event:', payload);
      await fetchAllRealtimeData();
      if (onEventCallback) onEventCallback('pincode', payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'city_waitlist' }, async (payload) => {
      console.log('[REVARA] ⚡ Realtime City Waitlist Event:', payload);
      await fetchAllRealtimeData();
      if (onEventCallback) onEventCallback('waitlist', payload);
    })
    .subscribe((status) => {
      console.log('[REVARA] Supabase Realtime Channel Status:', status);
    });

  return channel;
}

// --- DATABASE MUTATIONS ---

async function logAuditInSupabase(action, entityType, entityId, oldVal, newVal, reason) {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.from('audit_logs').insert([{
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_value: oldVal ? JSON.stringify(oldVal) : null,
      new_value: newVal ? JSON.stringify(newVal) : null,
      reason: reason || 'Authorized via REVARA Command Center',
    }]);
  } catch (e) {
    console.warn('[REVARA] Audit log write error:', e);
  }
}

// Helper to sanitize product data to strictly match Supabase products schema
function sanitizeProductPayload(data) {
  const clean = {};
  if (data.name !== undefined) clean.name = data.name;
  if (data.sku !== undefined) clean.sku = data.sku;
  if (data.price !== undefined) clean.price = Number(data.price);
  if (data.stock !== undefined) clean.stock = Number(data.stock);
  if (data.category_id !== undefined) clean.category_id = data.category_id || null;
  if (data.brand !== undefined) clean.brand = data.brand || 'REVARA';
  if (data.description !== undefined) clean.description = data.description || '';
  if (data.is_limited !== undefined) clean.is_limited = Boolean(data.is_limited);
  if (data.is_trending !== undefined) clean.is_trending = Boolean(data.is_trending);
  if (data.is_new !== undefined) clean.is_new = Boolean(data.is_new);
  if (data.is_featured !== undefined) clean.is_featured = Boolean(data.is_featured);
  if (Array.isArray(data.images)) clean.images = data.images;
  return clean;
}

// 1. PRODUCTS MUTATIONS
async function createProductInSupabase(productData) {
  const sb = getSupabase();
  const cleanData = sanitizeProductPayload(productData);
  const res = await sb.from('products').insert([cleanData]).select().single();
  if (!res.error) {
    await logAuditInSupabase('CREATE_PRODUCT', 'products', res.data.id, null, res.data, `Created product: ${res.data.name} (SKU: ${res.data.sku})`);
  }
  return res;
}

async function updateProductInSupabase(productId, updates, reason) {
  const sb = getSupabase();
  const oldProd = REVARA_STATE.products.find(p => p.id === productId);
  const cleanUpdates = sanitizeProductPayload(updates);
  cleanUpdates.updated_at = new Date().toISOString();
  const res = await sb.from('products').update(cleanUpdates).eq('id', productId).select().single();

  if (!res.error) {
    await logAuditInSupabase('UPDATE_PRODUCT', 'products', productId, oldProd, res.data, reason || 'Product updated via REVARA Command Center');
  }
  return res;
}

async function deleteProductInSupabase(productId, reason) {
  const sb = getSupabase();
  const oldProd = REVARA_STATE.products.find(p => p.id === productId);
  const res = await sb.from('products').delete().eq('id', productId);
  if (!res.error) {
    await logAuditInSupabase('DELETE_PRODUCT', 'products', productId, oldProd, null, reason || 'Product deleted by REVARA admin');
  }
  return res;
}

async function adjustStockInSupabase(productId, delta, reason) {
  const sb = getSupabase();
  const prod = REVARA_STATE.products.find(p => p.id === productId);
  if (!prod) return { error: { message: 'Product not found' } };

  const newStock = Math.max(0, (prod.stock || 0) + delta);
  const res = await sb.from('products').update({
    stock: newStock,
    updated_at: new Date().toISOString()
  }).eq('id', productId).select().single();

  if (!res.error) {
    await logAuditInSupabase('ADJUST_STOCK', 'products', productId, { stock: prod.stock }, { stock: newStock }, reason || `Stock adjusted by ${delta}`);
  }
  return res;
}

// 2. ORDER FULFILLMENT MUTATIONS
async function updateOrderStatusInSupabase(orderId, status, trackingNumber, notes) {
  const sb = getSupabase();
  const updates = { status, updated_at: new Date().toISOString() };
  if (trackingNumber !== undefined && trackingNumber !== null) updates.tracking_number = trackingNumber;
  if (notes !== undefined && notes !== null) updates.notes = notes;

  const res = await sb.from('orders').update(updates).eq('id', orderId).select().single();
  if (!res.error) {
    await logAuditInSupabase('UPDATE_ORDER_STATUS', 'orders', orderId, null, updates, `Order status transitioned to ${status}`);
    
    // Auto-send in-app notification to customer
    const order = REVARA_STATE.orders.find(o => o.id === orderId);
    if (order && order.user_id) {
      try {
        let notifTitle = `Order Status: ${status.toUpperCase()}`;
        let notifBody = `Your REVARA order #${orderId.slice(0, 8)} status has been updated to ${status.toUpperCase()}.`;
        if (status === 'shipped') {
          notifTitle = '🚀 Your Order has been Dispatched!';
          notifBody = trackingNumber 
            ? `Your package is on its way! Tracking Number: ${trackingNumber}`
            : `Your package has been dispatched from REVARA warehouse.`;
        } else if (status === 'delivered') {
          notifTitle = '📦 Order Delivered!';
          notifBody = `Your REVARA order #${orderId.slice(0, 8)} has been delivered. Thank you for shopping with us!`;
        }

        await sb.from('notifications').insert([{
          user_id: order.user_id,
          title: notifTitle,
          body: notifBody,
          type: 'order_update',
          reference_type: 'order',
          reference_id: orderId,
        }]);
      } catch (e) {
        console.warn('[REVARA] Could not send order notification:', e);
      }
    }
  }
  return res;
}

// 3. CIRCULAR TRADE-IN / GARMENTS MUTATIONS
async function submitExchangeInspectionInSupabase(exchangeId, userId, inspectionData) {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase client not initialized' };

  try {
    // 1. Insert Inspection Record
    const inspRes = await sb.from('exchange_inspections').insert([{
      exchange_id: exchangeId,
      actual_weight_kg: inspectionData.actual_weight_kg,
      grade: inspectionData.grade,
      accepted_items_count: inspectionData.accepted_items_count,
      rejected_items_count: inspectionData.rejected_items_count,
      final_credits_issued: inspectionData.final_credits_issued,
      inspector_notes: inspectionData.inspector_notes,
      inspection_photos: inspectionData.inspection_photos || [],
      inspected_at: new Date().toISOString(),
    }]).select().single();

    // 2. Update Exchange Request Status
    const newStatus = inspectionData.grade === 'rejected' ? 'rejected' : 'credits_issued';
    await sb.from('exchange_requests').update({
      status: newStatus,
      final_credits: inspectionData.final_credits_issued,
      updated_at: new Date().toISOString(),
    }).eq('id', exchangeId);

    // 3. Update customer wallet and add immutable ledger entry
    if (inspectionData.final_credits_issued > 0 && inspectionData.grade !== 'rejected' && userId) {
      let { data: wallet } = await sb.from('wallets').select('*').eq('user_id', userId).single();
      let walletId;
      let newBalance = inspectionData.final_credits_issued;

      if (!wallet) {
        const createWal = await sb.from('wallets').insert([{
          user_id: userId,
          available_credits: inspectionData.final_credits_issued,
          pending_credits: 0,
          total_earned: inspectionData.final_credits_issued,
          total_used: 0,
          updated_at: new Date().toISOString()
        }]).select().single();
        walletId = createWal.data?.id;
      } else {
        walletId = wallet.id;
        newBalance = (wallet.available_credits || 0) + inspectionData.final_credits_issued;
        await sb.from('wallets').update({
          available_credits: newBalance,
          total_earned: (wallet.total_earned || 0) + inspectionData.final_credits_issued,
          updated_at: new Date().toISOString()
        }).eq('id', walletId);
      }

      if (walletId) {
        await sb.from('wallet_transactions').insert([{
          wallet_id: walletId,
          type: 'credit_earned',
          amount: inspectionData.final_credits_issued,
          balance_after: newBalance,
          reference_type: 'exchange',
          reference_id: exchangeId,
          description: `REVARA Garment Trade-In Approved — Grade ${inspectionData.grade.toUpperCase()} (${inspectionData.actual_weight_kg}kg)`,
          created_at: new Date().toISOString()
        }]);

        // Send in-app notification to customer
        try {
          await sb.from('notifications').insert([{
            user_id: userId,
            title: '🎉 Trade-In Credits Added to Wallet!',
            body: `₹${inspectionData.final_credits_issued.toLocaleString()} REVARA Store Credits have been deposited into your wallet. Grade: ${inspectionData.grade.toUpperCase()}`,
            type: 'credit_issued',
            reference_type: 'exchange',
            reference_id: exchangeId,
          }]);
        } catch (e) { console.warn('[REVARA] Notification send error:', e); }
      }
    }

    await logAuditInSupabase(
      'APPROVE_EXCHANGE_INSPECTION',
      'exchange_requests',
      exchangeId,
      null,
      inspectionData,
      `Graded ${inspectionData.grade.toUpperCase()} — ₹${inspectionData.final_credits_issued} credits awarded to customer wallet`
    );

    return { data: inspRes.data, error: null };
  } catch (err) {
    console.error('[REVARA] Error submitting inspection:', err);
    return { error: err.message };
  }
}

// 4. WALLET MUTATIONS
async function adjustWalletCreditInSupabase(userId, deltaAmount, reason) {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase client not initialized' };

  try {
    let { data: wallet } = await sb.from('wallets').select('*').eq('user_id', userId).single();
    if (!wallet) {
      const createWal = await sb.from('wallets').insert([{
        user_id: userId,
        available_credits: Math.max(0, deltaAmount),
        pending_credits: 0,
        total_earned: deltaAmount > 0 ? deltaAmount : 0,
        total_used: deltaAmount < 0 ? Math.abs(deltaAmount) : 0,
        updated_at: new Date().toISOString()
      }]).select().single();
      wallet = createWal.data;
    } else {
      const newBal = Math.max(0, (wallet.available_credits || 0) + deltaAmount);
      await sb.from('wallets').update({
        available_credits: newBal,
        total_earned: deltaAmount > 0 ? (wallet.total_earned || 0) + deltaAmount : wallet.total_earned,
        total_used: deltaAmount < 0 ? (wallet.total_used || 0) + Math.abs(deltaAmount) : wallet.total_used,
        updated_at: new Date().toISOString()
      }).eq('id', wallet.id);
      wallet.available_credits = newBal;
    }

    if (wallet) {
      await sb.from('wallet_transactions').insert([{
        wallet_id: wallet.id,
        type: 'credit_adjusted',
        amount: deltaAmount,
        balance_after: wallet.available_credits,
        reference_type: 'manual_adjustment',
        description: reason || 'Manual credit adjustment by REVARA Admin',
        created_at: new Date().toISOString()
      }]);

      try {
        await sb.from('notifications').insert([{
          user_id: userId,
          title: deltaAmount >= 0 ? '💰 Wallet Credited' : 'ℹ️ Wallet Adjusted',
          body: deltaAmount >= 0 
            ? `₹${deltaAmount.toLocaleString()} credits added to your REVARA wallet. Note: ${reason}`
            : `₹${Math.abs(deltaAmount).toLocaleString()} credits adjusted in your REVARA wallet. Note: ${reason}`,
          type: 'credit_issued',
          reference_type: 'wallet',
          reference_id: wallet.id,
        }]);
      } catch (e) {}
    }

    await logAuditInSupabase('MANUAL_WALLET_ADJUSTMENT', 'wallets', wallet ? wallet.id : userId, null, { delta: deltaAmount }, reason);
    return { data: wallet, error: null };
  } catch (e) {
    return { error: e.message };
  }
}

// 5. COUPON ENGINE MUTATIONS
async function createCouponInSupabase(couponData) {
  const sb = getSupabase();
  const res = await sb.from('coupons').insert([couponData]).select().single();
  if (!res.error) {
    await logAuditInSupabase('CREATE_COUPON', 'coupons', res.data.id, null, res.data, `Created promo code: ${couponData.code}`);
  }
  return res;
}

async function updateCouponInSupabase(couponId, updates) {
  const sb = getSupabase();
  const res = await sb.from('coupons').update(updates).eq('id', couponId).select().single();
  if (!res.error) {
    await logAuditInSupabase('UPDATE_COUPON', 'coupons', couponId, null, updates, `Updated promo code`);
  }
  return res;
}

async function deleteCouponInSupabase(couponId) {
  const sb = getSupabase();
  const res = await sb.from('coupons').delete().eq('id', couponId);
  if (!res.error) {
    await logAuditInSupabase('DELETE_COUPON', 'coupons', couponId, null, null, `Deleted promo code`);
  }
  return res;
}

// 6. REVIEW MODERATION MUTATIONS
async function updateReviewInSupabase(reviewId, updates) {
  const sb = getSupabase();
  const res = await sb.from('reviews').update(updates).eq('id', reviewId).select().single();
  if (!res.error) {
    await logAuditInSupabase('MODERATE_REVIEW', 'reviews', reviewId, null, updates, `Review updated`);
  }
  return res;
}

async function deleteReviewInSupabase(reviewId, productId) {
  const sb = getSupabase();
  const res = await sb.from('reviews').delete().eq('id', reviewId);
  if (!res.error) {
    await logAuditInSupabase('DELETE_REVIEW', 'reviews', reviewId, null, null, `Review deleted`);
  }
  return res;
}

// 7. SERVICEABLE PINCODES & CITIES
async function updatePincodeInSupabase(pincode, status, activeRoute) {
  const sb = getSupabase();
  const res = await sb.from('serviceable_pincodes').update({
    status,
    active_route_available: activeRoute,
  }).eq('pincode', pincode);
  await logAuditInSupabase('UPDATE_PINCODE_STATUS', 'serviceable_pincodes', pincode, null, { status, activeRoute }, `Pincode ${pincode} status set to ${status}`);
  return res;
}

async function createPincodeInSupabase(pincodeData) {
  const sb = getSupabase();
  const res = await sb.from('serviceable_pincodes').upsert([pincodeData]).select().single();
  if (!res.error) {
    await logAuditInSupabase('CREATE_PINCODE', 'serviceable_pincodes', pincodeData.pincode, null, pincodeData, `Added serviceable pincode ${pincodeData.pincode}`);
  }
  return res;
}

async function deletePincodeInSupabase(pincode) {
  const sb = getSupabase();
  const res = await sb.from('serviceable_pincodes').delete().eq('pincode', pincode);
  if (!res.error) {
    await logAuditInSupabase('DELETE_PINCODE', 'serviceable_pincodes', pincode, null, null, `Deleted pincode ${pincode}`);
  }
  return res;
}

// 8. BROADCAST & IN-APP NOTIFICATIONS
async function sendBroadcastNotificationInSupabase(title, body, type = 'promo', targetUserId = null) {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase client missing' };

  try {
    if (targetUserId) {
      const res = await sb.from('notifications').insert([{
        user_id: targetUserId,
        title,
        body,
        type,
        is_read: false
      }]).select().single();
      await logAuditInSupabase('SEND_NOTIFICATION', 'notifications', res.data?.id, null, { title, targetUserId }, `Sent direct notification to customer`);
      return res;
    } else {
      const users = REVARA_STATE.profiles;
      if (!users || users.length === 0) {
        return { error: 'No registered customer profiles found in database.' };
      }
      const notifications = users.map(u => ({
        user_id: u.id,
        title,
        body,
        type,
        is_read: false
      }));
      const res = await sb.from('notifications').insert(notifications);
      await logAuditInSupabase('BROADCAST_NOTIFICATION', 'notifications', 'ALL', null, { title, count: users.length }, `Broadcasted alert to ${users.length} collectors`);
      return res;
    }
  } catch (err) {
    return { error: err.message };
  }
}

// 9. MASTER DATABASE SEED ENGINE
async function seedMasterDataInSupabase() {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase client missing');

  console.log('[REVARA Seeder] Commencing Master Database Synchronization...');

  // 1. Categories
  const categories = [
    { name: 'Gardening Tools', slug: 'gardening', sort_order: 1 },
    { name: 'Solar & Lights', slug: 'lighting', sort_order: 2 },
    { name: 'Kitchen & Dining', slug: 'kitchen', sort_order: 3 },
    { name: 'Cleaning & Care', slug: 'cleaning', sort_order: 4 },
    { name: 'Storage & Trolleys', slug: 'storage', sort_order: 5 },
    { name: 'Scale Figures (1/7 & 1/4)', slug: 'scale-figures', sort_order: 6 },
    { name: 'Apparel & Streetwear Drops', slug: 'apparel', sort_order: 7 }
  ];

  for (const c of categories) {
    const { data: existing } = await sb.from('categories').select('id').eq('slug', c.slug);
    if (!existing || existing.length === 0) {
      await sb.from('categories').insert([c]);
    }
  }

  // Refresh categories map
  const { data: allCats } = await sb.from('categories').select('*');
  const catMap = {};
  (allCats || []).forEach(c => { catMap[c.slug] = c.id; });

  // 2. Master Products
  const masterProducts = [
    {
      name: '5-in-1 Gardening Hand Tool Set',
      description: 'Complete 5-piece heavy-duty gardening hand tool set featuring interchangeable heads: trowel, transplanter, hand fork, rake, and cultivator. Crafted with anti-rust black matte coated alloy and polished ergonomic natural wooden handle for optimal grip and leverage.',
      price: 96.00,
      sku: '15628_5in1_gardening_hand_tool_set',
      stock: 120,
      brand: 'REVARA UTILITY',
      is_featured: true,
      is_trending: true,
      is_new: true,
      is_limited: false,
      category_id: catMap['gardening'] || null,
      images: [
        'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1000&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1000&auto=format&fit=crop&q=80'
      ]
    },
    {
      name: 'Solar LED Flood Light (1pc)',
      description: 'High-efficiency solar powered outdoor LED flood light with 4 high-lumen illumination panels. Equipped with monocrystalline solar collector, multi-position stand/mount, USB-C emergency recharge port, and waterproof ruggedized housing.',
      price: 292.00,
      sku: '15908_solar_led_flood_light_1pc',
      stock: 65,
      brand: 'SOLARIS PRO',
      is_featured: true,
      is_trending: false,
      is_new: true,
      is_limited: false,
      category_id: catMap['lighting'] || null,
      images: [
        'https://images.unsplash.com/photo-1509390222030-9833777a6f91?w=1000&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1000&auto=format&fit=crop&q=80'
      ]
    },
    {
      name: 'Plastic Everyday Container Set (3pc)',
      description: 'Triple nesting premium food-safe storage containers in modern lilac with deep plum seal-lock lids. Ribbed exterior sidewalls ensure non-slip grip. 100% BPA-free, microwave safe, freezer friendly, and dishwasher safe.',
      price: 97.00,
      sku: '10972_plastic_everyday_container_3pc',
      stock: 250,
      brand: 'REVARA HOME',
      is_featured: false,
      is_trending: true,
      is_new: false,
      is_limited: false,
      category_id: catMap['kitchen'] || null,
      images: [
        'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=1000&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1544816155-12df9643f363?w=1000&auto=format&fit=crop&q=80'
      ]
    },
    {
      name: 'Multi-Function Cleaning Combo with Brush & Holder',
      description: 'Wall-mounted all-in-one hygiene station complete with soap-dispensing cleaning wand, non-abrasive scour scrub pad, and damage-free adhesive wall cradle. Keeps countertops dry and clean.',
      price: 84.00,
      sku: '8857_multi_function_cleaning_combo',
      stock: 180,
      brand: 'CLEAN BOT',
      is_featured: false,
      is_trending: false,
      is_new: true,
      is_limited: false,
      category_id: catMap['cleaning'] || null,
      images: [
        'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=1000&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=1000&auto=format&fit=crop&q=80'
      ]
    },
    {
      name: '2-Layer Transparent Storage Organizer Trolley with Wheels',
      description: 'Multi-purpose 2-tier rolling utility cart with transparent ribbed organizer trays, polished chrome steel framework, and 360-degree silent caster wheels with dual brakes. Perfect for kitchen produce, bathroom toiletries, or pantry essentials.',
      price: 393.00,
      sku: '10894_2layer_tran_storage_organizer_trolley_n_wheel',
      stock: 90,
      brand: 'LUMINA ORG',
      is_featured: true,
      is_trending: true,
      is_new: false,
      is_limited: false,
      category_id: catMap['storage'] || null,
      images: [
        'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=1000&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=1000&auto=format&fit=crop&q=80'
      ]
    }
  ];

  for (const p of masterProducts) {
    const { data: existing } = await sb.from('products').select('id').eq('sku', p.sku);
    if (!existing || existing.length === 0) {
      await sb.from('products').insert([p]);
    } else {
      await sb.from('products').update(p).eq('sku', p.sku);
    }
  }

  // 3. Serviceable Pincodes & City Corridors
  const { data: existingCities } = await sb.from('cities').select('id').eq('name', 'Mumbai MMR');
  let mmrId = existingCities && existingCities.length > 0 ? existingCities[0].id : null;
  if (!mmrId) {
    const { data: newCity } = await sb.from('cities').insert([{
      name: 'Mumbai MMR',
      state: 'Maharashtra',
      status: 'active',
      activation_threshold_households: 500,
      activation_threshold_weight_kg: 1000
    }]).select().single();
    mmrId = newCity?.id;
  }

  const pins = [
    { pincode: '400078', city_id: mmrId, city_name: 'Mumbai (Bhandup/Nahur)', state: 'Maharashtra', status: 'active', active_route_available: true },
    { pincode: '400080', city_id: mmrId, city_name: 'Mumbai (Mulund)', state: 'Maharashtra', status: 'active', active_route_available: true },
    { pincode: '400601', city_id: mmrId, city_name: 'Thane West', state: 'Maharashtra', status: 'active', active_route_available: true },
    { pincode: '400042', city_id: mmrId, city_name: 'Mumbai (Kanjurmarg)', state: 'Maharashtra', status: 'active', active_route_available: true },
    { pincode: '400076', city_id: mmrId, city_name: 'Mumbai (Powai)', state: 'Maharashtra', status: 'active', active_route_available: true }
  ];

  for (const pin of pins) {
    await sb.from('serviceable_pincodes').upsert([pin]);
  }

  // 4. Coupons
  await sb.from('coupons').upsert([
    { code: 'WELCOME10', type: 'percent', value: 10, min_order_amount: 200, max_discount: 100, is_active: true },
    { code: 'FLAT50', type: 'flat', value: 50, min_order_amount: 299, max_discount: 50, is_active: true },
    { code: 'FREESHIP', type: 'free_shipping', value: 0, min_order_amount: 199, is_active: true }
  ], { onConflict: 'code' });

  await logAuditInSupabase('MASTER_SEED', 'database', 'ALL', null, null, 'Executed 1-Click Master Database Seed');
  await fetchAllRealtimeData();
  return true;
}

window.seedMasterDataInSupabase = seedMasterDataInSupabase;

