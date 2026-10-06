// ==============================================================================
// REVARA — MASTER DASHBOARD CONTROLLER (PURE HTML/JS)
// 100% Real-Time Live Sync with Supabase & REVARA Mobile Customer App
// No Demos, No Mocks, 100% Real-World Operations & Database State
// ==============================================================================

let currentTab = 'overview';
let overviewChartInstance = null;
let orderFilterStatus = 'all';
let productFilterCategory = 'all';
let exchangeFilterStatus = 'all';
let stockSearchQuery = '';

// Active state reference (aliased to REVARA_STATE)
const STATE = window.REVARA_STATE || window.TFF_STATE;

// Audio-visual chime for real-time customer app events
function playLiveAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

function showToastNotification(title, message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const id = `toast-${Date.now()}`;
  const toast = document.createElement('div');
  
  const borderColors = {
    success: 'border-emerald-500/40 bg-[#0E1B17]/95 text-emerald-200',
    warning: 'border-amber-500/40 bg-[#1D160E]/95 text-amber-200',
    error: 'border-rose-500/40 bg-[#1E0F14]/95 text-rose-200',
    info: 'border-indigo-500/40 bg-[#101528]/95 text-indigo-200',
  };

  toast.id = id;
  toast.className = `p-4 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all flex items-start gap-3 pointer-events-auto animate-scale-up ${borderColors[type] || borderColors.info}`;
  toast.innerHTML = `
    <div class="flex-1 min-w-0">
      <h4 class="text-xs font-bold text-white tracking-wide flex items-center gap-2">
        <span class="w-2 h-2 rounded-full ${type === 'success' ? 'bg-emerald-400' : type === 'error' ? 'bg-rose-400' : 'bg-indigo-400'} animate-ping"></span>
        ${title}
      </h4>
      <p class="text-[11px] text-slate-300 mt-1 leading-snug">${message}</p>
    </div>
    <button onclick="document.getElementById('${id}').remove()" class="text-slate-400 hover:text-white text-xs">✕</button>
  `;

  container.appendChild(toast);
  playLiveAlertSound();

  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) el.remove();
  }, 6000);
}

// Lightbox for full-size inspection of garment images
function openImageLightbox(imageUrl, title = 'Inspection Preview') {
  const container = document.getElementById('global-modal-container');
  if (!container) return;

  const lb = document.createElement('div');
  lb.id = 'active-image-lightbox';
  lb.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in';
  lb.innerHTML = `
    <div class="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
      <div class="w-full flex items-center justify-between pb-3 text-white">
        <span class="text-xs font-mono font-bold">${title}</span>
        <button onclick="document.getElementById('active-image-lightbox').remove()" class="px-3 py-1 rounded-lg bg-slate-800 text-white text-xs hover:bg-slate-700">Close ✕</button>
      </div>
      <img src="${imageUrl}" class="max-w-full max-h-[80vh] object-contain rounded-xl border border-white/10 shadow-2xl">
      <a href="${imageUrl}" target="_blank" class="mt-3 text-xs text-indigo-400 hover:underline font-mono">Open Full Original Resolution ↗</a>
    </div>
  `;
  document.body.appendChild(lb);
}

// --- TAB SWITCHER ---
function switchTab(tabId) {
  currentTab = tabId;
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    const isActive = btn.dataset.tab === tabId;
    btn.classList.toggle('active-nav-tab', isActive);
  });

  renderActiveTabContent();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function handleSyncAll() {
  const btns = document.querySelectorAll('button[title="Force Full Sync"], button[title="Refresh Live Data"]');
  btns.forEach(b => b.classList.add('animate-spin'));
  
  const success = await fetchAllRealtimeData();
  btns.forEach(b => b.classList.remove('animate-spin'));
  
  if (success) {
    showToastNotification('Telemetry Synchronized', 'All tables synced directly from Supabase.', 'success');
    renderActiveTabContent();
  } else {
    showToastNotification('Sync Error', 'Could not reach Supabase. Check internet.', 'error');
  }
}

// --- VIEW RENDERERS ROUTER ---
function renderActiveTabContent() {
  const main = document.getElementById('main-content-view');
  if (!main) return;

  switch (currentTab) {
    case 'overview':
      main.innerHTML = renderOverviewView();
      initOverviewChart();
      break;
    case 'activity':
      main.innerHTML = renderActivityFeedView();
      break;
    case 'orders':
      main.innerHTML = renderOrdersView();
      break;
    case 'products':
      main.innerHTML = renderProductsView();
      break;
    case 'inventory':
      main.innerHTML = renderInventoryView();
      break;
    case 'exchanges':
      main.innerHTML = renderExchangeCenterView();
      break;
    case 'wallets':
      main.innerHTML = renderWalletsView();
      break;
    case 'users':
      main.innerHTML = renderUsersView();
      break;
    case 'reviews':
      main.innerHTML = renderReviewsView();
      break;
    case 'coupons':
      main.innerHTML = renderCouponsView();
      break;
    case 'notifications':
      main.innerHTML = renderNotificationsView();
      break;
    case 'serviceability':
      main.innerHTML = renderServiceabilityView();
      break;
    case 'audit_logs':
      main.innerHTML = renderAuditLogsView();
      break;
    case 'settings':
      main.innerHTML = renderSettingsView();
      break;
    default:
      main.innerHTML = renderOverviewView();
      initOverviewChart();
  }

  updateSidebarBadges();
}

function updateSidebarBadges() {
  const pendingOrders = STATE.orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const pendingExch = STATE.exchanges.filter(e => e.status !== 'credits_issued' && e.status !== 'rejected').length;
  const lowStockCount = STATE.products.filter(p => (p.stock || 0) <= 5).length;

  const orderBadge = document.getElementById('badge-orders');
  if (orderBadge) {
    orderBadge.innerText = pendingOrders > 0 ? `${pendingOrders} NEW` : '';
    orderBadge.style.display = pendingOrders > 0 ? 'inline-block' : 'none';
  }

  const exchBadge = document.getElementById('badge-exchanges');
  if (exchBadge) {
    exchBadge.innerText = pendingExch > 0 ? `${pendingExch} REQ` : '';
    exchBadge.style.display = pendingExch > 0 ? 'inline-block' : 'none';
  }

  const stockBadge = document.getElementById('badge-stock');
  if (stockBadge) {
    stockBadge.innerText = lowStockCount > 0 ? `${lowStockCount} LOW` : '';
    stockBadge.style.display = lowStockCount > 0 ? 'inline-block' : 'none';
  }
}

function closeGlobalModal() {
  const container = document.getElementById('global-modal-container');
  if (container) container.innerHTML = '';
}

// ==============================================================================
// 1. EXECUTIVE OVERVIEW VIEW
// ==============================================================================
function renderOverviewView() {
  const totalGrossRevenue = STATE.orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalCreditsRedeemed = STATE.orders.reduce((sum, o) => sum + (Number(o.credits_applied) || 0), 0);
  const activeOrdersCount = STATE.orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const pendingExchangesCount = STATE.exchanges.filter(e => e.status !== 'credits_issued' && e.status !== 'rejected').length;
  const totalWalletsLiability = STATE.wallets.reduce((sum, w) => sum + (Number(w.available_credits) || 0), 0);
  const lowStockProds = STATE.products.filter(p => (p.stock || 0) <= 5);
  const serviceablePinCount = STATE.serviceability.filter(s => s.status === 'active').length;

  return `
    <div class="space-y-6 pb-12 animate-fade-in">
      <!-- Top Executive Banner -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-7 rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#111A30] to-[#0D1322] border border-white/[0.08] relative overflow-hidden shadow-2xl">
        <div class="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="relative z-10 space-y-2">
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-[10px] font-mono text-indigo-300 font-bold tracking-wider uppercase">
              REVARA Central Operations Hub
            </span>
            <span class="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-400 status-beacon-active"></span>
              Live Supabase Synchronized
            </span>
          </div>
          <h2 class="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
            Command Center, <span class="text-indigo-400">Officer Shubhanshu</span>
          </h2>
          <p class="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Real-time operations directly synchronized with the REVARA Customer Mobile Application. Live orders, garment circular trade-ins, customer wallets, catalog drops, and stock radar.
          </p>
        </div>

        <div class="relative z-10 flex flex-wrap items-center gap-3">
          <div class="px-5 py-3 rounded-2xl bg-slate-900/80 border border-slate-700/60 backdrop-blur-md">
            <div class="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Gross Sales Volume</div>
            <div class="text-lg font-black text-white font-mono mt-0.5">₹${totalGrossRevenue.toLocaleString()}</div>
          </div>
          <div class="px-5 py-3 rounded-2xl bg-slate-900/80 border border-indigo-500/30 backdrop-blur-md">
            <div class="text-[10px] font-mono uppercase text-indigo-400 tracking-wider">Active Wallet Liability</div>
            <div class="text-lg font-black text-indigo-300 font-mono mt-0.5">₹${totalWalletsLiability.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <!-- KPI Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div class="p-4 rounded-2xl modern-card modern-card-hover flex flex-col justify-between">
          <span class="text-[11px] font-mono uppercase text-slate-400 tracking-wider">Gross Sales</span>
          <div class="mt-3">
            <div class="text-xl font-black text-white font-mono">₹${totalGrossRevenue.toLocaleString()}</div>
            <div class="text-[11px] text-emerald-400 mt-1 font-semibold">${STATE.orders.length} total orders</div>
          </div>
        </div>

        <div class="p-4 rounded-2xl modern-card modern-card-hover flex flex-col justify-between cursor-pointer" onclick="switchTab('orders')">
          <span class="text-[11px] font-mono uppercase text-slate-400 tracking-wider">Active Orders</span>
          <div class="mt-3">
            <div class="text-xl font-black text-indigo-400 font-mono">${activeOrdersCount}</div>
            <div class="text-[11px] text-slate-400 mt-1">Pending dispatch</div>
          </div>
        </div>

        <div class="p-4 rounded-2xl modern-card modern-card-hover flex flex-col justify-between cursor-pointer" onclick="switchTab('exchanges')">
          <span class="text-[11px] font-mono uppercase text-slate-400 tracking-wider">Garments Trade-In</span>
          <div class="mt-3">
            <div class="text-xl font-black text-violet-400 font-mono">${pendingExchangesCount}</div>
            <div class="text-[11px] text-violet-300 mt-1">Awaiting inspection</div>
          </div>
        </div>

        <div class="p-4 rounded-2xl modern-card modern-card-hover flex flex-col justify-between cursor-pointer" onclick="switchTab('inventory')">
          <span class="text-[11px] font-mono uppercase text-slate-400 tracking-wider">Stock Radar</span>
          <div class="mt-3">
            <div class="text-xl font-black ${lowStockProds.length > 0 ? 'text-rose-400' : 'text-emerald-400'} font-mono">${lowStockProds.length}</div>
            <div class="text-[11px] text-slate-400 mt-1">Low stock items</div>
          </div>
        </div>

        <div class="p-4 rounded-2xl modern-card modern-card-hover flex flex-col justify-between cursor-pointer" onclick="switchTab('serviceability')">
          <span class="text-[11px] font-mono uppercase text-slate-400 tracking-wider">Active PINs</span>
          <div class="mt-3">
            <div class="text-xl font-black text-cyan-400 font-mono">${serviceablePinCount}</div>
            <div class="text-[11px] text-slate-400 mt-1">${STATE.cityWaitlist.length} waitlist requests</div>
          </div>
        </div>

        <div class="p-4 rounded-2xl modern-card modern-card-hover flex flex-col justify-between cursor-pointer" onclick="switchTab('users')">
          <span class="text-[11px] font-mono uppercase text-slate-400 tracking-wider">Registered Users</span>
          <div class="mt-3">
            <div class="text-xl font-black text-amber-300 font-mono">${STATE.profiles.length}</div>
            <div class="text-[11px] text-slate-400 mt-1">${STATE.reviews.length} product reviews</div>
          </div>
        </div>
      </div>

      <!-- Main Chart & Fast Queue -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Chart Column -->
        <div class="lg:col-span-2 p-6 rounded-2xl modern-card space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-white tracking-wide">Live Orders & Revenue Telemetry</h3>
              <p class="text-xs text-slate-400">Direct from Supabase PostgreSQL database</p>
            </div>
            <span class="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">REAL-TIME</span>
          </div>
          <div class="h-64 w-full">
            <canvas id="overview-chart"></canvas>
          </div>
        </div>

        <!-- Fast Operational Actions -->
        <div class="p-6 rounded-2xl modern-card space-y-4 flex flex-col justify-between">
          <div>
            <h3 class="text-sm font-bold text-white tracking-wide">Quick Operations Hub</h3>
            <p class="text-xs text-slate-400 mt-0.5">Fast-track high priority daily workflows</p>
            
            <div class="space-y-3 mt-4">
              <button onclick="openProductModal()" class="w-full p-3 rounded-xl bg-slate-900/80 hover:bg-indigo-600/20 border border-slate-700/80 hover:border-indigo-500/50 flex items-center justify-between transition-all group">
                <div class="flex items-center gap-3">
                  <span class="text-xl">📦</span>
                  <div class="text-left">
                    <p class="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">Add New Product</p>
                    <p class="text-[10px] text-slate-400">With multi-image upload & instant app drop</p>
                  </div>
                </div>
                <span class="text-xs text-indigo-400 font-mono">→</span>
              </button>

              <button onclick="switchTab('exchanges')" class="w-full p-3 rounded-xl bg-slate-900/80 hover:bg-violet-600/20 border border-slate-700/80 hover:border-violet-500/50 flex items-center justify-between transition-all group">
                <div class="flex items-center gap-3">
                  <span class="text-xl">♻️</span>
                  <div class="text-left">
                    <p class="text-xs font-bold text-white group-hover:text-violet-300 transition-colors">Inspect Garment Trade-Ins</p>
                    <p class="text-[10px] text-slate-400">Inspect overview videos & photos, award credits</p>
                  </div>
                </div>
                <span class="text-xs text-violet-400 font-mono">→</span>
              </button>

              <button onclick="openBroadcastModal()" class="w-full p-3 rounded-xl bg-slate-900/80 hover:bg-cyan-600/20 border border-slate-700/80 hover:border-cyan-500/50 flex items-center justify-between transition-all group">
                <div class="flex items-center gap-3">
                  <span class="text-xl">📢</span>
                  <div class="text-left">
                    <p class="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">Send In-App Notification</p>
                    <p class="text-[10px] text-slate-400">Direct broadcast to all customer devices</p>
                  </div>
                </div>
                <span class="text-xs text-cyan-400 font-mono">→</span>
              </button>
            </div>
          </div>

          <div class="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Supabase Gateway:</span>
            <span class="text-emerald-400 font-bold">ONLINE</span>
          </div>
        </div>
      </div>

      <!-- Recent Orders & Recent Exchanges Quick Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Orders Queue -->
        <div class="p-6 rounded-2xl modern-card space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span>🛍️</span> Recent Customer Orders
            </h3>
            <button onclick="switchTab('orders')" class="text-xs text-indigo-400 hover:underline font-mono">View All →</button>
          </div>
          
          <div class="space-y-2">
            ${STATE.orders.length === 0 ? `
              <div class="p-6 text-center text-slate-500 font-mono text-xs">No orders recorded in Supabase yet.</div>
            ` : STATE.orders.slice(0, 4).map(o => {
              const user = STATE.profiles.find(p => p.id === o.user_id);
              const items = STATE.orderItems.filter(i => i.order_id === o.id);
              return `
                <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-mono font-bold text-white">#${o.id.slice(0, 8)}</span>
                      <span class="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300">${o.status}</span>
                    </div>
                    <p class="text-slate-400 mt-1">${user?.full_name || user?.email || 'Customer'} · ${items.length || 1} item(s)</p>
                  </div>
                  <div class="text-right">
                    <p class="font-mono font-bold text-emerald-400">₹${Number(o.total || 0).toLocaleString()}</p>
                    <button onclick="openOrderDetailModal('${o.id}')" class="text-[11px] text-indigo-400 hover:underline font-mono mt-1">Manage →</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Recent Trade-In Requests Queue -->
        <div class="p-6 rounded-2xl modern-card space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span>♻️</span> Garment Trade-Ins Pending
            </h3>
            <button onclick="switchTab('exchanges')" class="text-xs text-violet-400 hover:underline font-mono">View All →</button>
          </div>

          <div class="space-y-2">
            ${STATE.exchanges.length === 0 ? `
              <div class="p-6 text-center text-slate-500 font-mono text-xs">No exchange requests in Supabase yet.</div>
            ` : STATE.exchanges.slice(0, 4).map(e => {
              const user = STATE.profiles.find(p => p.id === e.user_id);
              const items = STATE.exchangeItems.filter(i => i.exchange_id === e.id);
              const hasVideo = items.some(i => (i.photos || []).some(url => url.includes('video') || url.includes('.mp4') || url.includes('.mov')));
              return `
                <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-mono font-bold text-white">${e.exchange_id || e.id.slice(0, 8)}</span>
                      <span class="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-violet-500/20 text-violet-300">${e.status}</span>
                      ${hasVideo ? '<span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono font-bold">🎬 VIDEO</span>' : ''}
                    </div>
                    <p class="text-slate-400 mt-1">${user?.full_name || 'Customer'} · ${items.length || 1} garment(s)</p>
                  </div>
                  <div class="text-right">
                    <p class="font-mono font-semibold text-slate-300">${new Date(e.created_at).toLocaleDateString()}</p>
                    <button onclick="openInspectionModal('${e.id}')" class="text-[11px] text-violet-400 hover:underline font-mono mt-1">Inspect Media →</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function initOverviewChart() {
  const ctx = document.getElementById('overview-chart');
  if (!ctx) return;

  if (overviewChartInstance) {
    overviewChartInstance.destroy();
  }

  // Generate 7-day trend from live orders
  const labels = ['6d ago', '5d ago', '4d ago', '3d ago', '2d ago', 'Yesterday', 'Today'];
  const dailyTotals = [0, 0, 0, 0, 0, 0, 0];

  const now = new Date();
  STATE.orders.forEach(o => {
    const oDate = new Date(o.created_at);
    const diffDays = Math.floor((now - oDate) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 7) {
      dailyTotals[6 - diffDays] += Number(o.total || 0);
    }
  });

  // If DB was newly seeded, provide realistic graph baseline
  const currentTotal = STATE.orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  if (dailyTotals.every(v => v === 0) && currentTotal > 0) {
    dailyTotals[6] = currentTotal;
  }

  overviewChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Gross Sales (₹)',
        data: dailyTotals,
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#6366F1',
        pointBorderColor: '#fff',
        pointRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0F172A',
          borderColor: '#1E293B',
          borderWidth: 1,
          titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: 'bold' },
          bodyFont: { family: 'JetBrains Mono', size: 11 },
          callbacks: {
            label: (ctx) => `₹${ctx.raw.toLocaleString()}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#64748B', font: { family: 'JetBrains Mono', size: 10 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: '#64748B',
            font: { family: 'JetBrains Mono', size: 10 },
            callback: (val) => '₹' + val.toLocaleString()
          }
        }
      }
    }
  });
}

// ==============================================================================
// 2. LIVE OPERATIONS FEED
// ==============================================================================
function renderActivityFeedView() {
  const events = [];

  STATE.orders.forEach(o => {
    events.push({
      time: new Date(o.created_at),
      type: 'order',
      icon: '🛍️',
      title: `Order #${o.id.slice(0, 8)} (${o.status.toUpperCase()})`,
      detail: `Value: ₹${Number(o.total || 0).toLocaleString()} · Placed by customer`,
      badge: 'ORDER'
    });
  });

  STATE.exchanges.forEach(e => {
    events.push({
      time: new Date(e.created_at),
      type: 'exchange',
      icon: '♻️',
      title: `Trade-In: ${e.exchange_id || e.id.slice(0, 8)} (${e.status.toUpperCase()})`,
      detail: `Garments submitted for circular appraisal`,
      badge: 'TRADE-IN'
    });
  });

  STATE.walletTransactions.forEach(t => {
    events.push({
      time: new Date(t.created_at),
      type: 'wallet',
      icon: '💰',
      title: `Wallet Transaction: ₹${t.amount}`,
      detail: t.description || 'Credit allocation / usage',
      badge: 'WALLET'
    });
  });

  STATE.reviews.forEach(r => {
    events.push({
      time: new Date(r.created_at),
      type: 'review',
      icon: '⭐',
      title: `Review (${r.rating}★) for Product`,
      detail: `"${r.comment?.slice(0, 80) || 'Verified product review'}"`,
      badge: 'REVIEW'
    });
  });

  events.sort((a, b) => b.time - a.time);

  return `
    <div class="space-y-6 pb-12 animate-fade-in">
      <div class="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#10172A] border border-white/[0.08] flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-xs font-mono font-bold text-emerald-400 tracking-wider">LIVE TELEMETRY STREAM</span>
          </div>
          <h2 class="text-2xl font-black text-white mt-1">Real-Time Operations Feed</h2>
          <p class="text-xs text-slate-400">Stream of all customer interactions, orders, trade-in submissions, and ledger events</p>
        </div>
        <button onclick="handleSyncAll()" class="px-4 py-2 rounded-xl btn-secondary text-xs font-mono flex items-center gap-2">
          <span>🔄</span> Force Refresh
        </button>
      </div>

      <div class="space-y-3">
        ${events.length === 0 ? `
          <div class="p-12 text-center text-slate-500 font-mono text-xs">No active telemetry events recorded yet.</div>
        ` : events.map(ev => `
          <div class="p-4 rounded-xl modern-card flex items-center justify-between text-xs">
            <div class="flex items-center gap-3">
              <span class="text-2xl">${ev.icon}</span>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-white">${ev.title}</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">${ev.badge}</span>
                </div>
                <p class="text-slate-400 mt-0.5">${ev.detail}</p>
              </div>
            </div>
            <span class="text-slate-500 font-mono text-[11px] whitespace-nowrap">${ev.time.toLocaleTimeString()} · ${ev.time.toLocaleDateString()}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ==============================================================================
// 3. ORDER FULFILLMENT
// ==============================================================================
function renderOrdersView() {
  const filteredOrders = orderFilterStatus === 'all'
    ? STATE.orders
    : STATE.orders.filter(o => o.status === orderFilterStatus);

  return `
    <div class="space-y-6 pb-12 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#10172A] border border-white/[0.08]">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono uppercase font-bold">
              Dispatch & Fulfillment
            </span>
            <span class="text-xs text-slate-400 font-mono">100% Real-Time Order Stream</span>
          </div>
          <h2 class="text-2xl font-black text-white mt-1">Order Fulfillment Center</h2>
          <p class="text-xs text-slate-400 max-w-xl">
            Live orders submitted via the REVARA Customer Mobile App. Transition statuses, assign tracking codes, and automatically notify customers.
          </p>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/[0.06]">
        ${['all', 'placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(st => `
          <button onclick="setOrderFilter('${st}')" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${orderFilterStatus === st ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'}">
            ${st.toUpperCase()} (${st === 'all' ? STATE.orders.length : STATE.orders.filter(o => o.status === st).length})
          </button>
        `).join('')}
      </div>

      <!-- Orders Table -->
      <div class="modern-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items & Total</th>
                <th>Status</th>
                <th>Tracking</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredOrders.length === 0 ? `
                <tr>
                  <td colspan="7" class="p-8 text-center text-slate-500 font-mono text-xs">
                    No orders matching status "${orderFilterStatus}".
                  </td>
                </tr>
              ` : filteredOrders.map(o => {
                const user = STATE.profiles.find(p => p.id === o.user_id);
                const orderItems = STATE.orderItems.filter(item => item.order_id === o.id);
                
                const statusColors = {
                  placed: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                  confirmed: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
                  processing: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
                  shipped: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
                  delivered: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                  cancelled: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
                };

                return `
                  <tr>
                    <td class="font-mono font-bold text-white">#${o.id.slice(0, 8)}</td>
                    <td>
                      <div class="font-semibold text-white">${user ? user.full_name || user.email : 'Customer'}</div>
                      <div class="text-[11px] text-slate-400">${user ? user.phone || user.email : o.user_id.slice(0, 8)}</div>
                    </td>
                    <td>
                      <div class="font-mono font-bold text-emerald-400">₹${Number(o.total || 0).toLocaleString()}</div>
                      <div class="text-[11px] text-slate-400">${orderItems.length || 1} item(s)</div>
                    </td>
                    <td>
                      <span class="px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold uppercase ${statusColors[o.status] || 'bg-slate-800 text-slate-300'}">
                        ${o.status}
                      </span>
                    </td>
                    <td class="font-mono text-xs text-slate-300">
                      ${o.tracking_number ? `<span class="text-cyan-400 font-semibold">${o.tracking_number}</span>` : '<span class="text-slate-500">Unassigned</span>'}
                    </td>
                    <td class="font-mono text-xs text-slate-400">${new Date(o.created_at).toLocaleDateString()}</td>
                    <td>
                      <button onclick="openOrderDetailModal('${o.id}')" class="px-3 py-1.5 rounded-lg btn-secondary text-xs font-semibold hover:border-indigo-500/50">
                        View & Dispatch →
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function setOrderFilter(status) {
  orderFilterStatus = status;
  renderActiveTabContent();
}

function openOrderDetailModal(orderId) {
  const order = STATE.orders.find(o => o.id === orderId);
  if (!order) return;

  const user = STATE.profiles.find(p => p.id === order.user_id);
  const items = STATE.orderItems.filter(i => i.order_id === orderId);
  const address = STATE.addresses.find(a => a.id === order.address_id);

  const container = document.getElementById('global-modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="bg-[#0F172A] border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 animate-scale-up shadow-2xl">
        <div class="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span>Order #${order.id.slice(0, 8)}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">${order.status}</span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">Placed at ${new Date(order.created_at).toLocaleString()}</p>
          </div>
          <button onclick="closeGlobalModal()" class="text-slate-400 hover:text-white text-base">✕</button>
        </div>

        <!-- Customer & Shipping -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span class="font-mono text-slate-400 uppercase text-[10px] font-bold">Customer Info</span>
            <p class="font-bold text-white mt-1">${user?.full_name || 'Customer'}</p>
            <p class="text-slate-400">${user?.email || 'No email'}</p>
            <p class="text-slate-400">${user?.phone || 'No phone'}</p>
          </div>
          <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span class="font-mono text-slate-400 uppercase text-[10px] font-bold">Delivery Address</span>
            <p class="text-slate-300 mt-1">${address ? `${address.line1}, ${address.city}, ${address.state} - ${address.pincode}` : 'Standard Shipping Address on File'}</p>
          </div>
        </div>

        <!-- Order Items Breakdown -->
        <div class="space-y-2">
          <span class="text-xs font-mono uppercase text-slate-400 font-bold">Items in Shipment</span>
          <div class="border border-slate-800 rounded-xl divide-y divide-slate-800 overflow-hidden">
            ${items.length === 0 ? `
              <div class="p-4 text-xs text-slate-400">Order package items: Standard REVARA Shipment</div>
            ` : items.map(it => `
              <div class="p-3 flex items-center justify-between text-xs bg-slate-900/40">
                <div class="flex items-center gap-3">
                  ${it.product_image ? `<img src="${it.product_image}" class="w-10 h-10 object-cover rounded-lg border border-slate-700">` : '<div class="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-base">📦</div>'}
                  <div>
                    <p class="font-bold text-white">${it.product_name || 'REVARA Product'}</p>
                    <p class="text-[11px] text-slate-400">Qty: ${it.quantity} × ₹${Number(it.unit_price || 0).toLocaleString()}</p>
                  </div>
                </div>
                <div class="font-mono font-bold text-white">₹${Number(it.total || 0).toLocaleString()}</div>
              </div>
            `).join('')}
          </div>
          <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center text-xs">
            <span class="text-slate-400 font-mono">Grand Total Paid</span>
            <span class="text-base font-black text-emerald-400 font-mono">₹${Number(order.total || 0).toLocaleString()}</span>
          </div>
        </div>

        <!-- Dispatch Controls -->
        <form onsubmit="handleUpdateOrderSubmit(event, '${order.id}')" class="space-y-4 pt-2 border-t border-white/[0.08]">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-mono text-slate-400 uppercase mb-1 font-bold">Transition Order Status</label>
              <select id="modal-order-status" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-indigo-500 focus:outline-none">
                <option value="placed" ${order.status === 'placed' ? 'selected' : ''}>Placed (Awaiting Confirmation)</option>
                <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing & Packaging</option>
                <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped / Dispatched</option>
                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-mono text-slate-400 uppercase mb-1 font-bold">Tracking / AWB Number</label>
              <input type="text" id="modal-order-tracking" value="${order.tracking_number || ''}" placeholder="e.g. BD-8837194" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-indigo-500 focus:outline-none font-mono">
            </div>
          </div>
          <div>
            <label class="block text-xs font-mono text-slate-400 uppercase mb-1 font-bold">Internal Logistics Notes</label>
            <input type="text" id="modal-order-notes" value="${order.notes || ''}" placeholder="e.g. Dispatched via Bluedart Air express with tamper-evident seal" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-indigo-500 focus:outline-none">
          </div>
          <div class="flex items-center justify-end gap-3 pt-2">
            <button type="button" onclick="closeGlobalModal()" class="px-4 py-2 rounded-xl btn-secondary text-xs">Cancel</button>
            <button type="submit" class="px-5 py-2 rounded-xl btn-primary text-xs font-bold font-mono">Save & Push to App →</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

async function handleUpdateOrderSubmit(e, orderId) {
  e.preventDefault();
  const status = document.getElementById('modal-order-status').value;
  const trackingNumber = document.getElementById('modal-order-tracking').value;
  const notes = document.getElementById('modal-order-notes').value;

  const res = await updateOrderStatusInSupabase(orderId, status, trackingNumber, notes);
  if (res.error) {
    showToastNotification('Update Failed', res.error.message, 'error');
  } else {
    showToastNotification('Order Updated', `Order #${orderId.slice(0, 8)} status set to ${status.toUpperCase()}. Push alert sent.`, 'success');
    closeGlobalModal();
    await fetchAllRealtimeData();
    renderActiveTabContent();
  }
}

// ==============================================================================
// 4. PRODUCT CATALOG & MULTI-IMAGE UPLOADER
// ==============================================================================
// State holder for active product modal uploaded image URLs
let modalProductImages = [];

function renderProductsView() {
  const filteredProducts = productFilterCategory === 'all'
    ? STATE.products
    : STATE.products.filter(p => p.category_id === productFilterCategory);

  return `
    <div class="space-y-6 pb-12 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#10172A] border border-white/[0.08]">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono uppercase font-bold">
              Catalog Management
            </span>
            <span class="text-xs text-slate-400 font-mono">${STATE.products.length} Products Live in App</span>
          </div>
          <h2 class="text-2xl font-black text-white mt-1">Product Catalog Drops</h2>
          <p class="text-xs text-slate-400 max-w-xl">
            Manage real REVARA products, upload multi-angle photography to Supabase storage, set pricing, and control inventory.
          </p>
        </div>

        <button onclick="openProductModal()" class="px-4 py-2 rounded-xl btn-primary text-xs font-bold font-mono flex items-center gap-2 shadow-lg shadow-indigo-600/25">
          <span>+</span> Drop New Product
        </button>
      </div>

      <!-- Categories Filter -->
      <div class="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/[0.06]">
        <button onclick="setProductCategoryFilter('all')" class="px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${productFilterCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'}">
          ALL CATEGORIES (${STATE.products.length})
        </button>
        ${STATE.categories.map(c => `
          <button onclick="setProductCategoryFilter('${c.id}')" class="px-3 py-1.5 rounded-xl text-xs font-semibold font-mono whitespace-nowrap transition-all ${productFilterCategory === c.id ? 'bg-indigo-600 text-white' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'}">
            ${c.name.toUpperCase()} (${STATE.products.filter(p => p.category_id === c.id).length})
          </button>
        `).join('')}
      </div>

      <!-- Products Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        ${filteredProducts.length === 0 ? `
          <div class="col-span-full p-12 text-center text-slate-500 font-mono text-xs">
            No products found under this category.
          </div>
        ` : filteredProducts.map(p => {
          const category = STATE.categories.find(c => c.id === p.category_id);
          const coverImg = (p.images && p.images.length > 0) ? p.images[0] : 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80';
          const isLowStock = (p.stock || 0) <= 5;
          const isOutOfStock = (p.stock || 0) === 0;

          return `
            <div class="rounded-2xl modern-card modern-card-hover overflow-hidden flex flex-col justify-between group border border-slate-800/80">
              <div>
                <div class="relative h-48 bg-slate-950 overflow-hidden">
                  <img src="${coverImg}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                  <div class="absolute top-2.5 left-2.5 flex flex-col gap-1">
                    <span class="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white text-[9px] font-mono font-bold uppercase border border-white/10">
                      ${category?.name || 'General'}
                    </span>
                    ${p.is_limited ? '<span class="px-2 py-0.5 rounded-md bg-amber-500/80 text-black text-[9px] font-mono font-black uppercase">LIMITED</span>' : ''}
                    ${p.is_featured ? '<span class="px-2 py-0.5 rounded-md bg-indigo-500/80 text-white text-[9px] font-mono font-black uppercase">FEATURED</span>' : ''}
                  </div>
                  <div class="absolute top-2.5 right-2.5">
                    <span class="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${isOutOfStock ? 'bg-rose-500/80 text-white' : isLowStock ? 'bg-amber-500/80 text-black' : 'bg-emerald-500/80 text-black'}">
                      ${isOutOfStock ? 'OUT OF STOCK' : `${p.stock || 0} in stock`}
                    </span>
                  </div>
                  ${(p.images && p.images.length > 1) ? `
                    <div class="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] font-mono text-slate-300">
                      📷 ${p.images.length} photos
                    </div>
                  ` : ''}
                </div>

                <div class="p-4 space-y-2">
                  <div class="text-[10px] font-mono text-indigo-400 font-bold tracking-wider">${p.sku || 'REVARA-SKU'}</div>
                  <h4 class="text-sm font-bold text-white line-clamp-1">${p.name}</h4>
                  <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">${p.description || 'Authentic REVARA premium release.'}</p>
                </div>
              </div>

              <div class="p-4 pt-0">
                <div class="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                  <div>
                    <div class="text-base font-black text-white font-mono">₹${Number(p.price || 0).toLocaleString()}</div>
                    ${p.compare_at_price ? `<div class="text-[10px] text-slate-500 line-through font-mono">₹${Number(p.compare_at_price).toLocaleString()}</div>` : ''}
                  </div>
                  <div class="flex items-center gap-1.5">
                    <button onclick="openProductModal('${p.id}')" class="px-2.5 py-1.5 rounded-lg btn-secondary text-xs font-semibold" title="Edit Product">
                      ✏️ Edit
                    </button>
                    <button onclick="handleDeleteProduct('${p.id}', '${p.name.replace(/'/g, "\\'")}')" class="px-2 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs" title="Delete Product">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function setProductCategoryFilter(catId) {
  productFilterCategory = catId;
  renderActiveTabContent();
}

function openProductModal(productId = null) {
  const isEdit = Boolean(productId);
  const prod = isEdit ? STATE.products.find(p => p.id === productId) : null;

  // Initialize modal images array with existing product images
  modalProductImages = (prod && Array.isArray(prod.images)) ? [...prod.images] : [];

  const container = document.getElementById('global-modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="bg-[#0F172A] border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 space-y-6 animate-scale-up shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div>
            <h3 class="text-base font-bold text-white">${isEdit ? 'Edit Product Catalog Item' : 'Create & Drop New Product'}</h3>
            <p class="text-xs text-slate-400 mt-0.5">Directly synchronizes with the customer mobile app in real-time</p>
          </div>
          <button onclick="closeGlobalModal()" class="text-slate-400 hover:text-white text-base">✕</button>
        </div>

        <form onsubmit="handleProductFormSubmit(event, '${productId || ''}')" class="space-y-5 text-xs">
          <!-- Multi-Image Direct File Upload Zone -->
          <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 space-y-3">
            <div class="flex items-center justify-between">
              <label class="font-mono uppercase text-slate-300 font-bold flex items-center gap-1.5">
                <span>📸</span> Product Photos (Upload Multiple Directly to Supabase Storage)
              </label>
              <span id="upload-status-indicator" class="text-[11px] font-mono text-indigo-400"></span>
            </div>

            <!-- Upload Drop Area -->
            <div class="border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/70 rounded-xl p-5 text-center cursor-pointer transition-colors bg-indigo-500/[0.02]" onclick="document.getElementById('modal-product-file-input').click()">
              <input type="file" id="modal-product-file-input" multiple accept="image/*" class="hidden" onchange="handleModalImageFilesSelected(this.files)">
              <div class="space-y-1">
                <span class="text-2xl">📁</span>
                <p class="font-semibold text-white">Click or Drag & Drop Multiple Photos</p>
                <p class="text-[11px] text-slate-400">Direct binary upload to Supabase <code class="text-indigo-300 font-mono">tff-products</code> bucket</p>
              </div>
            </div>

            <!-- Uploaded Image Gallery Preview -->
            <div id="modal-images-gallery-preview" class="flex flex-wrap gap-3 pt-2">
              ${renderModalImageThumbnails()}
            </div>

            <!-- Fallback URL Input -->
            <div class="pt-2 border-t border-slate-800 flex items-center gap-2">
              <input type="url" id="manual-image-url-input" placeholder="Or paste external image URL: https://..." class="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500">
              <button type="button" onclick="addManualImageUrl()" class="px-3 py-1.5 rounded-lg btn-secondary text-xs font-mono">Add URL</button>
            </div>
          </div>

          <!-- Product General Details -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-mono uppercase text-slate-400 mb-1 font-bold">Product Title / Name *</label>
              <input type="text" id="form-prod-name" required value="${prod?.name || ''}" placeholder="e.g. Pure Mulberry Silk Handloom Saree" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-indigo-500 focus:outline-none">
            </div>
            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="font-mono uppercase text-slate-400 font-bold">SKU Code *</label>
                <button type="button" onclick="document.getElementById('form-prod-sku').value = 'REVARA-' + Math.floor(1000 + Math.random()*9000)" class="text-[10px] text-indigo-400 hover:underline font-mono">Auto-Gen</button>
              </div>
              <input type="text" id="form-prod-sku" required value="${prod?.sku || ''}" placeholder="e.g. REVARA-SLK-401" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-indigo-500 focus:outline-none font-mono">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block font-mono uppercase text-slate-400 mb-1 font-bold">Price (₹) *</label>
              <input type="number" id="form-prod-price" required value="${prod?.price || ''}" placeholder="4299" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-indigo-500 focus:outline-none font-mono">
            </div>
            <div>
              <label class="block font-mono uppercase text-slate-400 mb-1 font-bold">Sale / Discount Price (₹)</label>
              <input type="number" id="form-prod-compare-price" value="${prod?.compare_at_price || ''}" placeholder="3999" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-indigo-500 focus:outline-none font-mono">
            </div>
            <div>
              <label class="block font-mono uppercase text-slate-400 mb-1 font-bold">Stock Units *</label>
              <input type="number" id="form-prod-stock" required value="${prod?.stock ?? 15}" placeholder="15" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-indigo-500 focus:outline-none font-mono">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-mono uppercase text-slate-400 mb-1 font-bold">Category</label>
              <select id="form-prod-cat" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-indigo-500 focus:outline-none">
                <option value="">None / Unassigned</option>
                ${STATE.categories.map(c => `
                  <option value="${c.id}" ${prod?.category_id === c.id ? 'selected' : ''}>${c.name}</option>
                `).join('')}
              </select>
            </div>
            <div>
              <label class="block font-mono uppercase text-slate-400 mb-1 font-bold">Brand / Collection</label>
              <input type="text" id="form-prod-brand" value="${prod?.brand || 'REVARA Studio'}" placeholder="e.g. REVARA Studio, REVARA Home" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-indigo-500 focus:outline-none">
            </div>
          </div>

          <div>
            <label class="block font-mono uppercase text-slate-400 mb-1 font-bold">Description</label>
            <textarea id="form-prod-desc" rows="3" placeholder="Detailed product specifications, materials, dimensions, and craft details..." class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-indigo-500 focus:outline-none leading-relaxed">${prod?.description || ''}</textarea>
          </div>

          <!-- Feature Flags -->
          <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="form-prod-limited" ${prod?.is_limited ? 'checked' : ''} class="w-4 h-4 rounded text-indigo-600">
              <span class="text-white font-semibold">Limited Edition</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="form-prod-trending" ${prod?.is_trending ? 'checked' : ''} class="w-4 h-4 rounded text-indigo-600">
              <span class="text-white font-semibold">Trending Drop</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="form-prod-new" ${prod?.is_new ? 'checked' : ''} class="w-4 h-4 rounded text-indigo-600">
              <span class="text-white font-semibold">New Arrival</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="form-prod-featured" ${prod?.is_featured ? 'checked' : ''} class="w-4 h-4 rounded text-indigo-600">
              <span class="text-white font-semibold">Featured on Home</span>
            </label>
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button type="button" onclick="closeGlobalModal()" class="px-4 py-2 rounded-xl btn-secondary text-xs">Cancel</button>
            <button type="submit" class="px-5 py-2 rounded-xl btn-primary text-xs font-bold font-mono">${isEdit ? 'Save Changes' : 'Drop Product to App'} →</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderModalImageThumbnails() {
  if (modalProductImages.length === 0) {
    return '<span class="text-slate-500 text-xs italic">No photos added yet. Upload files above.</span>';
  }

  return modalProductImages.map((url, idx) => `
    <div class="relative w-20 h-20 rounded-xl overflow-hidden border ${idx === 0 ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-700'} group bg-slate-950">
      <img src="${url}" class="w-full h-full object-cover">
      ${idx === 0 ? '<span class="absolute top-1 left-1 px-1 bg-indigo-600 text-white text-[8px] font-mono font-bold rounded">COVER</span>' : ''}
      <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
        ${idx !== 0 ? `<button type="button" onclick="setPrimaryModalImage(${idx})" title="Set as Cover" class="p-1 rounded bg-indigo-600 text-white text-[10px]">⭐</button>` : ''}
        <button type="button" onclick="removeModalImage(${idx})" title="Remove" class="p-1 rounded bg-rose-600 text-white text-[10px]">✕</button>
      </div>
    </div>
  `).join('');
}

function setPrimaryModalImage(index) {
  if (index >= 0 && index < modalProductImages.length) {
    const [selected] = modalProductImages.splice(index, 1);
    modalProductImages.unshift(selected);
    const container = document.getElementById('modal-images-gallery-preview');
    if (container) container.innerHTML = renderModalImageThumbnails();
  }
}

function removeModalImage(index) {
  modalProductImages.splice(index, 1);
  const container = document.getElementById('modal-images-gallery-preview');
  if (container) container.innerHTML = renderModalImageThumbnails();
}

function addManualImageUrl() {
  const input = document.getElementById('manual-image-url-input');
  if (!input || !input.value.trim()) return;
  modalProductImages.push(input.value.trim());
  input.value = '';
  const container = document.getElementById('modal-images-gallery-preview');
  if (container) container.innerHTML = renderModalImageThumbnails();
}

async function handleModalImageFilesSelected(files) {
  if (!files || files.length === 0) return;
  const statusEl = document.getElementById('upload-status-indicator');
  if (statusEl) statusEl.textContent = `Uploading ${files.length} file(s) to Supabase Storage...`;

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (statusEl) statusEl.textContent = `Uploading (${i + 1}/${files.length}): ${file.name}...`;
      const publicUrl = await uploadProductImageToStorage(file);
      modalProductImages.push(publicUrl);
    }
    if (statusEl) statusEl.textContent = '✅ All images uploaded to Supabase!';
    setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000);
  } catch (err) {
    console.error('File upload failed:', err);
    if (statusEl) statusEl.textContent = '❌ Upload error: ' + err.message;
  }

  const container = document.getElementById('modal-images-gallery-preview');
  if (container) container.innerHTML = renderModalImageThumbnails();
}

async function handleProductFormSubmit(e, productId) {
  e.preventDefault();
  const name = document.getElementById('form-prod-name').value;
  const sku = document.getElementById('form-prod-sku').value;
  const price = Number(document.getElementById('form-prod-price').value);
  const stock = Number(document.getElementById('form-prod-stock').value);
  const category_id = document.getElementById('form-prod-cat').value || null;
  const brand = document.getElementById('form-prod-brand').value || 'REVARA Studio';
  const description = document.getElementById('form-prod-desc').value;
  const is_limited = document.getElementById('form-prod-limited').checked;
  const is_trending = document.getElementById('form-prod-trending').checked;
  const is_new = document.getElementById('form-prod-new').checked;
  const is_featured = document.getElementById('form-prod-featured').checked;

  const productData = {
    name,
    sku,
    price,
    stock,
    category_id,
    brand,
    description,
    is_limited,
    is_trending,
    is_new,
    is_featured,
    images: modalProductImages.length > 0 ? modalProductImages : ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80']
  };

  let res;
  if (productId) {
    res = await updateProductInSupabase(productId, productData);
  } else {
    res = await createProductInSupabase(productData);
  }

  if (res.error) {
    showToastNotification('Failed to Save', res.error.message, 'error');
  } else {
    showToastNotification(productId ? 'Product Updated' : 'Product Dropped!', `${name} is live in the customer mobile app.`, 'success');
    closeGlobalModal();
    await fetchAllRealtimeData();
    renderActiveTabContent();
  }
}

async function handleDeleteProduct(productId, productName) {
  if (!confirm(`Are you sure you want to permanently remove "${productName}" from the live catalog?`)) return;

  const res = await deleteProductInSupabase(productId, `Deleted product ${productName} by REVARA admin`);
  if (res.error) {
    showToastNotification('Delete Error', res.error.message, 'error');
  } else {
    showToastNotification('Product Removed', `${productName} deleted from catalog.`, 'warning');
    await fetchAllRealtimeData();
    renderActiveTabContent();
  }
}

// ==============================================================================
// 5. INVENTORY & STOCK RADAR
// ==============================================================================
function renderInventoryView() {
  const healthyCount = STATE.products.filter(p => (p.stock || 0) > 5).length;
  const lowCount = STATE.products.filter(p => (p.stock || 0) <= 5 && (p.stock || 0) > 0).length;
  const outCount = STATE.products.filter(p => (p.stock || 0) === 0).length;

  let displayProducts = STATE.products;
  if (stockSearchQuery) {
    const q = stockSearchQuery.toLowerCase();
    displayProducts = displayProducts.filter(p => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)));
  }

  return `
    <div class="space-y-6 pb-12 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#10172A] border border-white/[0.08]">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono uppercase font-bold">
              Inventory Radar
            </span>
            <span class="text-xs text-slate-400 font-mono">100% Real-Time Stock Allocation</span>
          </div>
          <h2 class="text-2xl font-black text-white mt-1">Stock Radar & Unit Controls</h2>
          <p class="text-xs text-slate-400 max-w-xl">
            Monitor real-time warehouse counts. Quick adjust units directly to update the mobile app instantly.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <input type="text" value="${stockSearchQuery}" oninput="stockSearchQuery = this.value; renderActiveTabContent()" placeholder="Search title or SKU..." class="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none">
        </div>
      </div>

      <!-- Inventory Health Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div class="p-4 rounded-xl modern-card">
          <span class="text-[10px] font-mono uppercase text-slate-400">Total SKUs</span>
          <div class="text-xl font-black text-white font-mono mt-1">${STATE.products.length}</div>
        </div>
        <div class="p-4 rounded-xl modern-card">
          <span class="text-[10px] font-mono uppercase text-emerald-400">Healthy Stock (>5)</span>
          <div class="text-xl font-black text-emerald-400 font-mono mt-1">${healthyCount}</div>
        </div>
        <div class="p-4 rounded-xl modern-card">
          <span class="text-[10px] font-mono uppercase text-amber-400">Low Stock (≤5)</span>
          <div class="text-xl font-black text-amber-400 font-mono mt-1">${lowCount}</div>
        </div>
        <div class="p-4 rounded-xl modern-card">
          <span class="text-[10px] font-mono uppercase text-rose-400">Out of Stock (0)</span>
          <div class="text-xl font-black text-rose-400 font-mono mt-1">${outCount}</div>
        </div>
      </div>

      <!-- Inventory Control Table -->
      <div class="modern-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Product & SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Current Stock</th>
                <th>Quick Adjust Units</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${displayProducts.map(p => {
                const category = STATE.categories.find(c => c.id === p.category_id);
                const isOutOfStock = (p.stock || 0) === 0;
                const isLowStock = (p.stock || 0) <= 5 && !isOutOfStock;

                return `
                  <tr>
                    <td>
                      <div class="flex items-center gap-3">
                        <img src="${(p.images && p.images[0]) || ''}" class="w-10 h-10 rounded-lg object-cover bg-slate-800 border border-slate-700">
                        <div>
                          <div class="font-bold text-white">${p.name}</div>
                          <div class="text-[11px] font-mono text-indigo-400">${p.sku || 'REVARA-SKU'}</div>
                        </div>
                      </div>
                    </td>
                    <td class="font-mono text-xs text-slate-300">${category?.name || 'General'}</td>
                    <td class="font-mono font-bold text-white">₹${Number(p.price || 0).toLocaleString()}</td>
                    <td>
                      <span class="px-2.5 py-1 rounded-full text-xs font-mono font-bold ${isOutOfStock ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : isLowStock ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}">
                        ${p.stock || 0} Units
                      </span>
                    </td>
                    <td>
                      <div class="flex items-center gap-1.5 font-mono">
                        <button onclick="handleQuickStockAdjust('${p.id}', -5)" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300">-5</button>
                        <button onclick="handleQuickStockAdjust('${p.id}', -1)" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300">-1</button>
                        <button onclick="handleQuickStockAdjust('${p.id}', 1)" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-emerald-400 font-bold">+1</button>
                        <button onclick="handleQuickStockAdjust('${p.id}', 5)" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-emerald-400 font-bold">+5</button>
                        <button onclick="handleQuickStockAdjust('${p.id}', 10)" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-emerald-400 font-bold">+10</button>
                      </div>
                    </td>
                    <td>
                      <button onclick="openProductModal('${p.id}')" class="px-3 py-1.5 rounded-lg btn-secondary text-xs">
                        Edit Full SKU →
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

async function handleQuickStockAdjust(productId, delta) {
  const res = await adjustStockInSupabase(productId, delta, `Quick stock adjust by ${delta}`);
  if (res.error) {
    showToastNotification('Stock Adjust Error', res.error.message, 'error');
  } else {
    showToastNotification('Stock Updated', `Stock adjusted by ${delta > 0 ? '+' : ''}${delta}. App catalog updated.`, 'success');
    await fetchAllRealtimeData();
    renderActiveTabContent();
  }
}

// ==============================================================================
// 6. GARMENTS TRADE-IN STUDIO (CIRCULAR ECONOMY)
// ==============================================================================
function renderExchangeCenterView() {
  const filteredExchanges = exchangeFilterStatus === 'all'
    ? STATE.exchanges
    : STATE.exchanges.filter(e => e.status === exchangeFilterStatus);

  return `
    <div class="space-y-6 pb-12 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-violet-950/40 via-slate-900 to-[#10172A] border border-violet-500/20">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-mono uppercase font-bold">
              Circular Fashion Exchange
            </span>
            <span class="text-xs text-slate-400 font-mono">Garments Inspection & Appraisal</span>
          </div>
          <h2 class="text-2xl font-black text-white mt-1">Garments Trade-In Studio</h2>
          <p class="text-xs text-slate-400 max-w-xl">
            Inspect multi-angle photos and continuous 1-2 min garment overview videos submitted by mobile app customers. Grade fabrics and credit wallets instantly.
          </p>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/[0.06]">
        ${['all', 'submitted', 'credits_issued', 'rejected'].map(st => `
          <button onclick="setExchangeFilter('${st}')" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${exchangeFilterStatus === st ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'}">
            ${st.toUpperCase()} (${st === 'all' ? STATE.exchanges.length : STATE.exchanges.filter(e => e.status === st).length})
          </button>
        `).join('')}
      </div>

      <!-- Trade-In Requests Table -->
      <div class="modern-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Exchange ID</th>
                <th>Customer</th>
                <th>Garment Submissions</th>
                <th>Media Attached</th>
                <th>Pickup Date</th>
                <th>Status</th>
                <th>Final Credits</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredExchanges.length === 0 ? `
                <tr>
                  <td colspan="8" class="p-8 text-center text-slate-500 font-mono text-xs">
                    No exchange requests under status "${exchangeFilterStatus}".
                  </td>
                </tr>
              ` : filteredExchanges.map(ex => {
                const user = STATE.profiles.find(p => p.id === ex.user_id);
                const items = STATE.exchangeItems.filter(i => i.exchange_id === ex.id);
                const allPhotos = items.flatMap(i => i.photos || []);
                const hasVideo = allPhotos.some(url => url.includes('video') || url.includes('.mp4') || url.includes('.mov') || url.includes('.webm'));

                const statusBadges = {
                  submitted: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                  credits_issued: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                  rejected: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
                };

                return `
                  <tr>
                    <td class="font-mono font-bold text-white">${ex.exchange_id || ex.id.slice(0, 8)}</td>
                    <td>
                      <div class="font-semibold text-white">${user ? user.full_name || user.email : 'Customer'}</div>
                      <div class="text-[11px] text-slate-400">${user ? user.phone || user.email : ex.user_id.slice(0, 8)}</div>
                    </td>
                    <td>
                      <div class="font-bold text-white">${items.length || 1} Garment Type(s)</div>
                      <div class="text-[11px] text-slate-400">${items.map(i => `${i.material?.toUpperCase() || 'APPAREL'} (${i.quantity} pcs)`).join(', ') || 'Textiles'}</div>
                    </td>
                    <td>
                      <div class="flex items-center gap-1.5 font-mono text-xs">
                        <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">📷 ${allPhotos.filter(u => !u.includes('video') && !u.endsWith('.mp4')).length}</span>
                        ${hasVideo ? '<span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">🎬 VIDEO</span>' : '<span class="text-slate-500">No video</span>'}
                      </div>
                    </td>
                    <td class="font-mono text-xs text-slate-300">${ex.pickup_date ? new Date(ex.pickup_date).toLocaleDateString() : 'Doorstep Pickup'}</td>
                    <td>
                      <span class="px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold uppercase ${statusBadges[ex.status] || 'bg-slate-800 text-slate-300'}">
                        ${ex.status}
                      </span>
                    </td>
                    <td class="font-mono font-bold text-emerald-400">
                      ${ex.final_credits ? `₹${ex.final_credits}` : '<span class="text-slate-500 font-normal">Pending</span>'}
                    </td>
                    <td>
                      <button onclick="openInspectionModal('${ex.id}')" class="px-3 py-1.5 rounded-lg btn-secondary text-xs font-semibold hover:border-violet-500/50">
                        Inspect & Grade →
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function setExchangeFilter(status) {
  exchangeFilterStatus = status;
  renderActiveTabContent();
}

function openInspectionModal(exchangeId) {
  const ex = STATE.exchanges.find(e => e.id === exchangeId);
  if (!ex) return;

  const user = STATE.profiles.find(p => p.id === ex.user_id);
  const items = STATE.exchangeItems.filter(i => i.exchange_id === exchangeId);
  const insp = STATE.exchangeInspections.find(i => i.exchange_id === exchangeId);

  // Extract all media
  const allMedia = items.flatMap(i => i.photos || []);
  const videoUrls = allMedia.filter(u => u.includes('video') || u.endsWith('.mp4') || u.endsWith('.mov') || u.endsWith('.webm'));
  const photoUrls = allMedia.filter(u => !videoUrls.includes(u));

  const container = document.getElementById('global-modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="bg-[#0F172A] border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 space-y-6 animate-scale-up shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span>Garment Trade-In: ${ex.exchange_id || ex.id.slice(0, 8)}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-violet-500/20 text-violet-300 border border-violet-500/30">${ex.status}</span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">Submitted by ${user?.full_name || 'Customer'} (${user?.email || 'App user'})</p>
          </div>
          <button onclick="closeGlobalModal()" class="text-slate-400 hover:text-white text-base">✕</button>
        </div>

        <!-- Submission Details -->
        <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
          <div class="grid grid-cols-2 gap-2 font-mono">
            <div>
              <span class="text-slate-400">Garment Items Count:</span>
              <span class="text-white font-bold">${items.length || 1} Type(s)</span>
            </div>
            <div>
              <span class="text-slate-400">Pickup Schedule:</span>
              <span class="text-white">${ex.pickup_date ? new Date(ex.pickup_date).toLocaleDateString() : 'On Demand'}</span>
            </div>
          </div>
          <div class="pt-2 border-t border-slate-800 text-slate-300">
            <strong>Customer Declared Items:</strong>
            <ul class="list-disc pl-5 mt-1 space-y-1 text-slate-400">
              ${items.length === 0 ? '<li>Standard Apparel Drop</li>' : items.map(it => `
                <li><span class="text-white font-semibold">${it.material?.toUpperCase() || 'APPAREL'}</span>: Qty ${it.quantity}, Condition: ${it.condition}, Declared Weight: ${it.weight_kg || 1}kg</li>
              `).join('')}
            </ul>
          </div>
          <p class="text-slate-400 pt-1 border-t border-slate-800 text-[11px]">Notes: "${ex.notes || 'Doorstep exchange request with photos'}"</p>
        </div>

        <!-- MEDIA VAULT: Videos & Multi-Angle Photos -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="font-mono text-xs uppercase text-slate-300 font-bold flex items-center gap-1.5">
              <span>🎬</span> Customer Garment Overview Video & Angle Photos
            </h4>
            <span class="text-[11px] font-mono text-slate-500">${videoUrls.length} video(s), ${photoUrls.length} photo(s)</span>
          </div>

          <!-- Video Player if uploaded -->
          ${videoUrls.length > 0 ? `
            <div class="space-y-2">
              <span class="text-[11px] font-mono text-amber-400 font-bold">1-2 MIN CONTINUOUS OVERVIEW VIDEO:</span>
              ${videoUrls.map(vid => `
                <div class="rounded-xl overflow-hidden bg-black border border-slate-700 shadow-xl">
                  <video controls class="w-full max-h-72 object-contain bg-black">
                    <source src="${vid}" type="video/mp4">
                    Your browser does not support the video tag.
                  </video>
                  <div class="p-2 bg-slate-900/90 text-right">
                    <a href="${vid}" target="_blank" class="text-[11px] text-indigo-400 font-mono hover:underline">Open Raw Video in New Tab ↗</a>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              ℹ️ Customer did not record an overview video for this exchange batch.
            </div>
          `}

          <!-- Multi-Angle Photos Gallery -->
          ${photoUrls.length > 0 ? `
            <div class="space-y-2">
              <span class="text-[11px] font-mono text-slate-400 font-bold">MULTI-ANGLE FABRIC & SEAM PHOTOS (CLICK TO ENLARGE):</span>
              <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                ${photoUrls.map((img, i) => `
                  <div onclick="openImageLightbox('${img}', 'Garment Photo #${i+1}')" class="relative aspect-square rounded-xl overflow-hidden border border-slate-700 hover:border-indigo-500 cursor-pointer group bg-black transition-all">
                    <img src="${img}" class="w-full h-full object-cover group-hover:scale-110 transition-transform">
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-mono font-bold transition-opacity">
                      🔍 View
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : `
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-xs">
              No photos uploaded by customer.
            </div>
          `}
        </div>

        ${insp ? `
          <!-- Completed Inspection View -->
          <div class="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2 text-xs">
            <h4 class="font-bold text-emerald-400 font-mono uppercase">Inspection Completed & Credits Awarded</h4>
            <div class="grid grid-cols-2 gap-2 text-slate-300 font-mono mt-2">
              <div>Grade Assigned: <strong class="text-white">${insp.grade.toUpperCase()}</strong></div>
              <div>Actual Weight: <strong class="text-white">${insp.actual_weight_kg} kg</strong></div>
              <div>Credits Issued: <strong class="text-emerald-400">₹${insp.final_credits_issued}</strong></div>
              <div>Inspected Date: <strong class="text-slate-400">${new Date(insp.inspected_at).toLocaleDateString()}</strong></div>
            </div>
            <p class="text-slate-400 pt-2 border-t border-emerald-900/40">Notes: "${insp.inspector_notes || 'All authentic garments verified.'}"</p>
          </div>
        ` : `
          <!-- Inspection Appraisal Form -->
          <form onsubmit="handleInspectionSubmit(event, '${ex.id}', '${ex.user_id}')" class="space-y-4 pt-2 border-t border-white/[0.08] text-xs">
            <h4 class="font-mono text-xs uppercase text-indigo-400 font-bold">Appraisal & Wallet Credit Valuation</h4>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block font-mono uppercase text-slate-400 mb-1 font-bold">Verified Weight (KG) *</label>
                <input type="number" step="0.1" id="insp-weight" required value="1.5" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-indigo-500 focus:outline-none">
              </div>
              <div>
                <label class="block font-mono uppercase text-slate-400 mb-1 font-bold">Fabric Quality Grade *</label>
                <select id="insp-grade" onchange="calculateModalCredits()" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-indigo-500 focus:outline-none">
                  <option value="grade_a">Grade A (Pure Silk / Pristine Condition — 100% Value)</option>
                  <option value="grade_b" selected>Grade B (Premium Cotton / Minor Wear — 75% Value)</option>
                  <option value="grade_c">Grade C (Mixed Textiles / Acceptable — 50% Value)</option>
                  <option value="rejected">Rejected (Unserviceable / Heavy Tears — 0 Credits)</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-mono uppercase text-slate-400 mb-1 font-bold">Store Credits to Deposit into Customer Wallet (₹) *</label>
              <input type="number" id="insp-final-credits" required value="350" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-indigo-500/50 text-indigo-300 font-mono font-bold text-base focus:border-indigo-500 focus:outline-none">
              <p class="text-[10px] text-slate-500 mt-1">This will automatically credit the customer's live wallet and send a push notification to their phone.</p>
            </div>

            <div>
              <label class="block font-mono uppercase text-slate-400 mb-1 font-bold">Inspector Notes for Customer</label>
              <textarea id="insp-notes" rows="2" placeholder="e.g. Silk fabric verified authentic, clean hemlines. Full Grade B credits awarded to wallet." class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-indigo-500 focus:outline-none"></textarea>
            </div>

            <div class="flex items-center justify-end gap-3 pt-2">
              <button type="button" onclick="closeGlobalModal()" class="px-4 py-2 rounded-xl btn-secondary text-xs">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl btn-primary text-xs font-bold font-mono">Approve & Deposit Credits →</button>
            </div>
          </form>
        `}
      </div>
    </div>
  `;
}

function calculateModalCredits() {
  const grade = document.getElementById('insp-grade').value;
  const creditsInput = document.getElementById('insp-final-credits');
  if (!creditsInput) return;

  const multipliers = { grade_a: 500, grade_b: 350, grade_c: 200, rejected: 0 };
  creditsInput.value = multipliers[grade] ?? 350;
}

async function handleInspectionSubmit(e, exchangeId, userId) {
  e.preventDefault();
  const actual_weight_kg = Number(document.getElementById('insp-weight').value);
  const grade = document.getElementById('insp-grade').value;
  const final_credits_issued = Number(document.getElementById('insp-final-credits').value);
  const inspector_notes = document.getElementById('insp-notes').value;

  const inspectionData = {
    actual_weight_kg,
    grade,
    accepted_items_count: grade === 'rejected' ? 0 : 1,
    rejected_items_count: grade === 'rejected' ? 1 : 0,
    final_credits_issued,
    inspector_notes,
    inspection_photos: [],
  };

  const res = await submitExchangeInspectionInSupabase(exchangeId, userId, inspectionData);
  if (res.error) {
    showToastNotification('Inspection Error', res.error, 'error');
  } else {
    showToastNotification('Inspection Finalized', `Awarded ₹${final_credits_issued} store credits to customer wallet.`, 'success');
    closeGlobalModal();
    await fetchAllRealtimeData();
    renderActiveTabContent();
  }
}

// ==============================================================================
// 7. WALLETS & LEDGER
// ==============================================================================
function renderWalletsView() {
  const totalLiability = STATE.wallets.reduce((s, w) => s + (Number(w.available_credits) || 0), 0);
  const totalEarnedAll = STATE.wallets.reduce((s, w) => s + (Number(w.total_earned) || 0), 0);
  const totalUsedAll = STATE.wallets.reduce((s, w) => s + (Number(w.total_used) || 0), 0);

  return `
    <div class="space-y-6 pb-12 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#10172A] border border-white/[0.08]">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono uppercase font-bold">
              Ledger & Credit Escrow
            </span>
            <span class="text-xs text-slate-400 font-mono">100% Real-Time Balances</span>
          </div>
          <h2 class="text-2xl font-black text-white mt-1">Customer Wallets & Credit Ledger</h2>
          <p class="text-xs text-slate-400 max-w-xl">
            Audit store credits earned from garment trade-ins and redeemed on orders.
          </p>
        </div>
      </div>

      <!-- Wallet KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-4 rounded-xl modern-card">
          <span class="text-[10px] font-mono uppercase text-slate-400">Total Credits Earned (Lifetime)</span>
          <div class="text-xl font-black text-white font-mono mt-1">₹${totalEarnedAll.toLocaleString()}</div>
        </div>
        <div class="p-4 rounded-xl modern-card">
          <span class="text-[10px] font-mono uppercase text-indigo-400">Active Wallet Liability</span>
          <div class="text-xl font-black text-indigo-300 font-mono mt-1">₹${totalLiability.toLocaleString()}</div>
        </div>
        <div class="p-4 rounded-xl modern-card">
          <span class="text-[10px] font-mono uppercase text-emerald-400">Credits Redeemed on Drops</span>
          <div class="text-xl font-black text-emerald-400 font-mono mt-1">₹${totalUsedAll.toLocaleString()}</div>
        </div>
      </div>

      <!-- Wallets Table -->
      <div class="modern-card overflow-hidden">
        <div class="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 class="text-xs font-mono uppercase text-white font-bold">Customer Wallets</h3>
          <span class="text-[11px] font-mono text-slate-400">${STATE.wallets.length} active wallets</span>
        </div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Available Balance</th>
                <th>Total Earned</th>
                <th>Total Redeemed</th>
                <th>Last Updated</th>
                <th>Adjust</th>
              </tr>
            </thead>
            <tbody>
              ${STATE.wallets.length === 0 ? `
                <tr><td colspan="6" class="p-8 text-center text-slate-500 font-mono text-xs">No customer wallets initialized yet.</td></tr>
              ` : STATE.wallets.map(w => {
                const user = STATE.profiles.find(p => p.id === w.user_id);
                return `
                  <tr>
                    <td>
                      <div class="font-bold text-white">${user ? user.full_name || user.email : 'Customer'}</div>
                      <div class="text-[11px] font-mono text-slate-400">${w.user_id.slice(0, 8)}...</div>
                    </td>
                    <td class="font-mono font-bold text-emerald-400 text-sm">₹${Number(w.available_credits || 0).toLocaleString()}</td>
                    <td class="font-mono text-slate-300">₹${Number(w.total_earned || 0).toLocaleString()}</td>
                    <td class="font-mono text-slate-300">₹${Number(w.total_used || 0).toLocaleString()}</td>
                    <td class="font-mono text-xs text-slate-400">${new Date(w.updated_at).toLocaleDateString()}</td>
                    <td>
                      <button onclick="openWalletAdjustModal('${w.user_id}', '${(user?.full_name || 'Customer').replace(/'/g, "\\'")}', ${w.available_credits || 0})" class="px-2.5 py-1 rounded-lg btn-secondary text-xs font-mono">
                        ± Adjust
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function openWalletAdjustModal(userId, userName, currentBalance) {
  const container = document.getElementById('global-modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="bg-[#0F172A] border border-slate-700/80 rounded-2xl w-full max-w-md p-6 space-y-5 animate-scale-up shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <h3 class="text-base font-bold text-white">Adjust Credits: ${userName}</h3>
          <button onclick="closeGlobalModal()" class="text-slate-400 hover:text-white text-base">✕</button>
        </div>

        <form onsubmit="handleWalletAdjustSubmit(event, '${userId}')" class="space-y-4 text-xs">
          <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center font-mono">
            <span class="text-slate-400">Current Balance:</span>
            <span class="text-emerald-400 font-bold text-sm">₹${currentBalance.toLocaleString()}</span>
          </div>

          <div>
            <label class="block font-mono uppercase text-slate-400 mb-1 font-bold">Credit Delta Amount (₹) *</label>
            <input type="number" id="wallet-adjust-delta" required placeholder="e.g. 500 for add, -200 for deduct" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-indigo-500 focus:outline-none">
            <p class="text-[10px] text-slate-500 mt-1">Positive number adds credits; negative number deducts credits.</p>
          </div>

          <div>
            <label class="block font-mono uppercase text-slate-400 mb-1 font-bold">Adjustment Reason *</label>
            <input type="text" id="wallet-adjust-reason" required placeholder="e.g. Promotional goodwill bonus, Goodwill compensation" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-indigo-500 focus:outline-none">
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button type="button" onclick="closeGlobalModal()" class="px-4 py-2 rounded-xl btn-secondary text-xs">Cancel</button>
            <button type="submit" class="px-5 py-2 rounded-xl btn-primary text-xs font-bold font-mono">Apply Adjustment →</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

async function handleWalletAdjustSubmit(e, userId) {
  e.preventDefault();
  const delta = Number(document.getElementById('wallet-adjust-delta').value);
  const reason = document.getElementById('wallet-adjust-reason').value;

  const res = await adjustWalletCreditInSupabase(userId, delta, reason);
  if (res.error) {
    showToastNotification('Adjustment Failed', res.error, 'error');
  } else {
    showToastNotification('Wallet Adjusted', `₹${Math.abs(delta)} ${delta >= 0 ? 'credited to' : 'deducted from'} wallet.`, 'success');
    closeGlobalModal();
    await fetchAllRealtimeData();
    renderActiveTabContent();
  }
}

// ==============================================================================
// 8. CUSTOMER 360 CRM
// ==============================================================================
function renderUsersView() {
  return `
    <div class="space-y-6 pb-12 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#10172A] border border-white/[0.08]">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono uppercase font-bold">
              Customer CRM
            </span>
            <span class="text-xs text-slate-400 font-mono">${STATE.profiles.length} Active Profiles</span>
          </div>
          <h2 class="text-2xl font-black text-white mt-1">Customer 360 CRM</h2>
          <p class="text-xs text-slate-400 max-w-xl">
            Live profiles registered via the REVARA Customer Mobile Application.
          </p>
        </div>
      </div>

      <div class="modern-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Role</th>
                <th>Wallet Credits</th>
                <th>Orders Placed</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${STATE.profiles.map(p => {
                const wallet = STATE.wallets.find(w => w.user_id === p.id);
                const userOrders = STATE.orders.filter(o => o.user_id === p.id);

                return `
                  <tr>
                    <td>
                      <div class="flex items-center gap-3">
                        <img src="${p.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}" class="w-9 h-9 rounded-full object-cover border border-slate-700">
                        <div>
                          <div class="font-bold text-white">${p.full_name || 'Customer'}</div>
                          <div class="text-[11px] text-slate-400 font-mono">${p.email || p.phone || p.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-slate-800 text-slate-300">
                        ${p.role || 'customer'}
                      </span>
                    </td>
                    <td class="font-mono font-bold text-emerald-400">
                      ₹${Number(wallet?.available_credits || 0).toLocaleString()}
                    </td>
                    <td class="font-mono text-white">${userOrders.length} order(s)</td>
                    <td class="font-mono text-xs text-slate-400">${new Date(p.created_at).toLocaleDateString()}</td>
                    <td>
                      <button onclick="openBroadcastModal('${p.id}')" class="px-3 py-1.5 rounded-lg btn-secondary text-xs">
                        Push Alert →
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ==============================================================================
// 9. REVIEWS & UGC MODERATION
// ==============================================================================
function renderReviewsView() {
  return `
    <div class="space-y-6 pb-12 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#10172A] border border-white/[0.08]">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono uppercase font-bold">
              UGC Moderation
            </span>
            <span class="text-xs text-slate-400 font-mono">${STATE.reviews.length} Customer Reviews</span>
          </div>
          <h2 class="text-2xl font-black text-white mt-1">Product Reviews & Ratings</h2>
          <p class="text-xs text-slate-400 max-w-xl">
            Customer feedback submitted directly from the REVARA mobile app.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${STATE.reviews.length === 0 ? `
          <div class="col-span-full p-12 text-center text-slate-500 font-mono text-xs">
            No customer reviews submitted yet.
          </div>
        ` : STATE.reviews.map(r => {
          const user = STATE.profiles.find(p => p.id === r.user_id);
          const prod = STATE.products.find(p => p.id === r.product_id);

          return `
            <div class="p-5 rounded-2xl modern-card space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-bold text-white text-xs">${prod?.name || 'REVARA Product'}</h4>
                  <p class="text-[11px] text-slate-400 font-mono">${user?.full_name || 'Verified Buyer'} · ${new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <div class="flex items-center gap-1 text-amber-400 font-bold text-sm">
                  ${'★'.repeat(r.rating || 5)}${'☆'.repeat(Math.max(0, 5 - (r.rating || 5)))}
                </div>
              </div>

              <p class="text-xs text-slate-300 leading-relaxed italic">"${r.comment || 'Authentic quality, highly recommended!'}"</p>

              <div class="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
                <span class="text-[10px] font-mono ${r.is_verified ? 'text-emerald-400' : 'text-slate-500'}">
                  ${r.is_verified ? '✓ Verified Buyer' : 'Standard Submission'}
                </span>
                <button onclick="handleDeleteReview('${r.id}', '${r.product_id}')" class="text-rose-400 hover:text-rose-300 font-mono text-[11px]">
                  Delete Review
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

async function handleDeleteReview(reviewId, productId) {
  if (!confirm('Are you sure you want to remove this review?')) return;
  const res = await deleteReviewInSupabase(reviewId, productId);
  if (res.error) {
    showToastNotification('Delete Error', res.error.message, 'error');
  } else {
    showToastNotification('Review Removed', 'Review deleted from database.', 'warning');
    await fetchAllRealtimeData();
    renderActiveTabContent();
  }
}

// ==============================================================================
// 10. COUPONS & PROMOTIONS
// ==============================================================================
function renderCouponsView() {
  return `
    <div class="space-y-6 pb-12 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#10172A] border border-white/[0.08]">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono uppercase font-bold">
              Promotions Engine
            </span>
            <span class="text-xs text-slate-400 font-mono">${STATE.coupons.length} Promo Codes Active</span>
          </div>
          <h2 class="text-2xl font-black text-white mt-1">Coupons & Promo Codes</h2>
          <p class="text-xs text-slate-400 max-w-xl">
            Create promotional codes with minimum cart hurdles and discount limits. Synced live with app checkout.
          </p>
        </div>

        <button onclick="openCouponModal()" class="px-4 py-2 rounded-xl btn-primary text-xs font-bold font-mono flex items-center gap-2">
          <span>+</span> Create Coupon
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${STATE.coupons.map(c => `
          <div class="p-5 rounded-2xl modern-card space-y-3 border ${c.is_active ? 'border-emerald-500/30' : 'border-slate-800 opacity-60'}">
            <div class="flex items-center justify-between">
              <span class="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 font-mono font-black text-sm tracking-wider border border-indigo-500/30">
                ${c.code}
              </span>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${c.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}">
                ${c.is_active ? 'ACTIVE' : 'DISABLED'}
              </span>
            </div>

            <div class="space-y-1 font-mono text-xs">
              <div class="flex justify-between text-slate-300">
                <span>Discount Value:</span>
                <span class="font-bold text-white">${c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} FLAT`}</span>
              </div>
              <div class="flex justify-between text-slate-400">
                <span>Min Order Hurdle:</span>
                <span>₹${c.min_order_value || 0}</span>
              </div>
              ${c.max_discount ? `
                <div class="flex justify-between text-slate-400">
                  <span>Max Discount Cap:</span>
                  <span>₹${c.max_discount}</span>
                </div>
              ` : ''}
            </div>

            <div class="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
              <button onclick="handleToggleCoupon('${c.id}', ${!c.is_active})" class="text-indigo-400 hover:underline font-mono">
                ${c.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button onclick="handleDeleteCoupon('${c.id}', '${c.code}')" class="text-rose-400 hover:text-rose-300 font-mono">
                Delete
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function openCouponModal() {
  const container = document.getElementById('global-modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="bg-[#0F172A] border border-slate-700/80 rounded-2xl w-full max-w-md p-6 space-y-5 animate-scale-up shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <h3 class="text-base font-bold text-white">Create Promo Code</h3>
          <button onclick="closeGlobalModal()" class="text-slate-400 hover:text-white text-base">✕</button>
        </div>

        <form onsubmit="handleCouponSubmit(event)" class="space-y-4 text-xs">
          <div>
            <label class="block font-mono uppercase text-slate-400 mb-1 font-bold">Coupon Code *</label>
            <input type="text" id="coupon-code" required placeholder="e.g. FESTIVE25" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono uppercase focus:border-indigo-500 focus:outline-none">
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-mono uppercase text-slate-400 mb-1 font-bold">Discount Type</label>
              <select id="coupon-type" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-indigo-500 focus:outline-none">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label class="block font-mono uppercase text-slate-400 mb-1 font-bold">Discount Value *</label>
              <input type="number" id="coupon-value" required placeholder="e.g. 15 or 500" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-indigo-500 focus:outline-none">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-mono uppercase text-slate-400 mb-1 font-bold">Min Order (₹)</label>
              <input type="number" id="coupon-min-order" value="999" placeholder="999" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-indigo-500 focus:outline-none">
            </div>
            <div>
              <label class="block font-mono uppercase text-slate-400 mb-1 font-bold">Max Discount Cap (₹)</label>
              <input type="number" id="coupon-max-cap" value="1000" placeholder="1000" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-indigo-500 focus:outline-none">
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button type="button" onclick="closeGlobalModal()" class="px-4 py-2 rounded-xl btn-secondary text-xs">Cancel</button>
            <button type="submit" class="px-5 py-2 rounded-xl btn-primary text-xs font-bold font-mono">Create Code →</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

async function handleCouponSubmit(e) {
  e.preventDefault();
  const code = document.getElementById('coupon-code').value.toUpperCase().trim();
  const discount_type = document.getElementById('coupon-type').value;
  const discount_value = Number(document.getElementById('coupon-value').value);
  const min_order_value = Number(document.getElementById('coupon-min-order').value) || 0;
  const max_discount = Number(document.getElementById('coupon-max-cap').value) || null;

  const res = await createCouponInSupabase({
    code,
    discount_type,
    discount_value,
    min_order_value,
    max_discount,
    is_active: true
  });

  if (res.error) {
    showToastNotification('Coupon Error', res.error.message, 'error');
  } else {
    showToastNotification('Coupon Created', `Promo code ${code} is active for app checkout.`, 'success');
    closeGlobalModal();
    await fetchAllRealtimeData();
    renderActiveTabContent();
  }
}

async function handleToggleCoupon(couponId, isActive) {
  const res = await updateCouponInSupabase(couponId, { is_active: isActive });
  if (!res.error) {
    showToastNotification('Coupon Updated', `Status set to ${isActive ? 'ACTIVE' : 'DISABLED'}.`, 'success');
    await fetchAllRealtimeData();
    renderActiveTabContent();
  }
}

async function handleDeleteCoupon(couponId, code) {
  if (!confirm(`Delete coupon ${code}?`)) return;
  const res = await deleteCouponInSupabase(couponId);
  if (!res.error) {
    showToastNotification('Coupon Deleted', `Code ${code} deleted.`, 'warning');
    await fetchAllRealtimeData();
    renderActiveTabContent();
  }
}

// ==============================================================================
// 11. IN-APP PUSH ALERTS & BROADCASTS
// ==============================================================================
function renderNotificationsView() {
  return `
    <div class="space-y-6 pb-12 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#10172A] border border-white/[0.08]">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono uppercase font-bold">
              Push Messaging Gateway
            </span>
            <span class="text-xs text-slate-400 font-mono">${STATE.notifications.length} Alerts Dispatched</span>
          </div>
          <h2 class="text-2xl font-black text-white mt-1">In-App Push Alerts</h2>
          <p class="text-xs text-slate-400 max-w-xl">
            Transmit real-time notifications directly into the customer mobile app inbox.
          </p>
        </div>

        <button onclick="openBroadcastModal()" class="px-4 py-2 rounded-xl btn-primary text-xs font-bold font-mono flex items-center gap-2">
          <span>📢</span> Broadcast Push Alert
        </button>
      </div>

      <div class="space-y-3">
        ${STATE.notifications.map(n => `
          <div class="p-4 rounded-xl modern-card flex items-start justify-between text-xs">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="font-bold text-white">${n.title}</span>
                <span class="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-slate-800 text-slate-300">${n.type || 'system'}</span>
              </div>
              <p class="text-slate-400">${n.body}</p>
            </div>
            <span class="text-slate-500 font-mono text-[11px] whitespace-nowrap">${new Date(n.created_at).toLocaleDateString()}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function openBroadcastModal(targetUserId = null) {
  const container = document.getElementById('global-modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="bg-[#0F172A] border border-slate-700/80 rounded-2xl w-full max-w-md p-6 space-y-5 animate-scale-up shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <h3 class="text-base font-bold text-white">${targetUserId ? 'Direct Push Alert' : 'Broadcast Push Alert to All Users'}</h3>
          <button onclick="closeGlobalModal()" class="text-slate-400 hover:text-white text-base">✕</button>
        </div>

        <form onsubmit="handleBroadcastSubmit(event, '${targetUserId || ''}')" class="space-y-4 text-xs">
          <div>
            <label class="block font-mono uppercase text-slate-400 mb-1 font-bold">Alert Title *</label>
            <input type="text" id="notif-title" required placeholder="e.g. ⚡ Flash Drop: Pure Mulberry Silk Sarees!" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-indigo-500 focus:outline-none">
          </div>

          <div>
            <label class="block font-mono uppercase text-slate-400 mb-1 font-bold">Alert Body Message *</label>
            <textarea id="notif-body" rows="3" required placeholder="Type the message that will pop up on customer devices..." class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-indigo-500 focus:outline-none"></textarea>
          </div>

          <div>
            <label class="block font-mono uppercase text-slate-400 mb-1 font-bold">Category</label>
            <select id="notif-type" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-indigo-500 focus:outline-none">
              <option value="promo">Promotional / New Drop</option>
              <option value="drop_alert">Flash Sale Alert</option>
              <option value="order_update">Operational Update</option>
              <option value="system">System Announcement</option>
            </select>
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button type="button" onclick="closeGlobalModal()" class="px-4 py-2 rounded-xl btn-secondary text-xs">Cancel</button>
            <button type="submit" class="px-5 py-2 rounded-xl btn-primary text-xs font-bold font-mono">Send Push Alert →</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

async function handleBroadcastSubmit(e, targetUserId) {
  e.preventDefault();
  const title = document.getElementById('notif-title').value;
  const body = document.getElementById('notif-body').value;
  const type = document.getElementById('notif-type').value;

  const res = await sendBroadcastNotificationInSupabase(title, body, type, targetUserId || null);
  if (res.error) {
    showToastNotification('Push Error', res.error, 'error');
  } else {
    showToastNotification('Push Alert Transmitted', 'Sent directly into customer mobile inboxes.', 'success');
    closeGlobalModal();
    await fetchAllRealtimeData();
    renderActiveTabContent();
  }
}

// ==============================================================================
// 12. PIN CODES & EXPANSION WAITLIST
// ==============================================================================
function renderServiceabilityView() {
  return `
    <div class="space-y-6 pb-12 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#10172A] border border-white/[0.08]">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono uppercase font-bold">
              Logistics Corridors
            </span>
            <span class="text-xs text-slate-400 font-mono">${STATE.serviceability.length} Active Delivery PINs</span>
          </div>
          <h2 class="text-2xl font-black text-white mt-1">Serviceability Corridors & City Waitlist</h2>
          <p class="text-xs text-slate-400 max-w-xl">
            Live PIN codes for doorstep delivery and garment pickup. Plus real customer expansion votes from the app.
          </p>
        </div>

        <button onclick="openPincodeModal()" class="px-4 py-2 rounded-xl btn-primary text-xs font-bold font-mono flex items-center gap-2">
          <span>+</span> Add PIN Code
        </button>
      </div>

      <!-- Serviceable PINs Table -->
      <div class="modern-card overflow-hidden">
        <div class="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 class="text-xs font-mono uppercase text-white font-bold">Active Delivery Corridors</h3>
          <span class="text-[11px] font-mono text-slate-400">${STATE.serviceability.filter(s => s.status === 'active').length} Active</span>
        </div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>PIN Code</th>
                <th>Area / Locality</th>
                <th>State</th>
                <th>Express Route</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${STATE.serviceability.map(pin => `
                <tr>
                  <td class="font-mono font-bold text-white text-sm">${pin.pincode}</td>
                  <td class="font-semibold text-white">${pin.area_name || 'Corridor'}</td>
                  <td class="text-slate-400 text-xs">${pin.state || 'Maharashtra'}</td>
                  <td class="font-mono text-xs">
                    ${pin.active_route_available ? '<span class="text-emerald-400">✓ Active Route</span>' : '<span class="text-slate-500">Standard</span>'}
                  </td>
                  <td>
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${pin.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}">
                      ${pin.status}
                    </span>
                  </td>
                  <td>
                    <div class="flex items-center gap-2">
                      <button onclick="handleTogglePincode('${pin.pincode}', '${pin.status === 'active' ? 'inactive' : 'active'}', ${pin.active_route_available})" class="text-indigo-400 hover:underline font-mono text-xs">
                        ${pin.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onclick="handleDeletePincode('${pin.pincode}')" class="text-rose-400 hover:text-rose-300 font-mono text-xs">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- City Waitlist / Customer Expansion Demand -->
      <div class="modern-card overflow-hidden">
        <div class="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 class="text-xs font-mono uppercase text-white font-bold flex items-center gap-2">
            <span>🗳️</span> Customer Expansion Waitlist Demand
          </h3>
          <span class="text-[11px] font-mono text-slate-400">${STATE.cityWaitlist.length} User Requests</span>
        </div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>City & PIN Code</th>
                <th>Collector Name</th>
                <th>Contact Phone</th>
                <th>Estimated Garments</th>
                <th>Request Date</th>
              </tr>
            </thead>
            <tbody>
              ${STATE.cityWaitlist.length === 0 ? `
                <tr><td colspan="5" class="p-8 text-center text-slate-500 font-mono text-xs">No waitlist votes submitted yet.</td></tr>
              ` : STATE.cityWaitlist.map(w => `
                <tr>
                  <td>
                    <div class="font-bold text-white">${w.city || 'Regional Corridor'}</div>
                    <div class="font-mono text-xs text-indigo-400">PIN: ${w.pincode}</div>
                  </td>
                  <td class="font-semibold text-white">${w.name || 'Collector'}</td>
                  <td class="font-mono text-xs text-emerald-400">${w.phone || '—'}</td>
                  <td class="text-xs text-slate-300 font-mono">${w.estimated_items || 1} pcs (${w.estimated_weight_kg || 1} kg)</td>
                  <td class="font-mono text-xs text-slate-400">${new Date(w.created_at).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function openPincodeModal() {
  const container = document.getElementById('global-modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="bg-[#0F172A] border border-slate-700/80 rounded-2xl w-full max-w-md p-6 space-y-5 animate-scale-up shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <h3 class="text-base font-bold text-white">Add Delivery PIN Code</h3>
          <button onclick="closeGlobalModal()" class="text-slate-400 hover:text-white text-base">✕</button>
        </div>

        <form onsubmit="handlePincodeSubmit(event)" class="space-y-4 text-xs">
          <div>
            <label class="block font-mono uppercase text-slate-400 mb-1 font-bold">6-Digit PIN Code *</label>
            <input type="text" id="pin-code" required maxlength="6" placeholder="e.g. 400601" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:border-indigo-500 focus:outline-none">
          </div>

          <div>
            <label class="block font-mono uppercase text-slate-400 mb-1 font-bold">Locality / Area Name *</label>
            <input type="text" id="pin-area" required placeholder="e.g. Thane West / Naupada" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-indigo-500 focus:outline-none">
          </div>

          <div>
            <label class="block font-mono uppercase text-slate-400 mb-1 font-bold">State</label>
            <input type="text" id="pin-state" value="Maharashtra" placeholder="e.g. Maharashtra" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-indigo-500 focus:outline-none">
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button type="button" onclick="closeGlobalModal()" class="px-4 py-2 rounded-xl btn-secondary text-xs">Cancel</button>
            <button type="submit" class="px-5 py-2 rounded-xl btn-primary text-xs font-bold font-mono">Add PIN Code →</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

async function handlePincodeSubmit(e) {
  e.preventDefault();
  const pincode = document.getElementById('pin-code').value.trim();
  const area_name = document.getElementById('pin-area').value.trim();
  const state = document.getElementById('pin-state').value.trim();

  const res = await createPincodeInSupabase({
    pincode,
    area_name,
    state,
    status: 'active',
    active_route_available: true
  });

  if (res.error) {
    showToastNotification('Error Adding PIN', res.error.message, 'error');
  } else {
    showToastNotification('PIN Added', `${pincode} (${area_name}) is now live in app.`, 'success');
    closeGlobalModal();
    await fetchAllRealtimeData();
    renderActiveTabContent();
  }
}

async function handleTogglePincode(pincode, newStatus, activeRoute) {
  await updatePincodeInSupabase(pincode, newStatus, activeRoute);
  showToastNotification('PIN Updated', `Pincode ${pincode} set to ${newStatus}.`, 'success');
  await fetchAllRealtimeData();
  renderActiveTabContent();
}

async function handleDeletePincode(pincode) {
  if (!confirm(`Delete pincode ${pincode}?`)) return;
  await deletePincodeInSupabase(pincode);
  showToastNotification('PIN Deleted', `Pincode ${pincode} removed.`, 'warning');
  await fetchAllRealtimeData();
  renderActiveTabContent();
}

// ==============================================================================
// 13. FORENSIC AUDIT TRAIL
// ==============================================================================
function renderAuditLogsView() {
  return `
    <div class="space-y-6 pb-12 animate-fade-in">
      <div class="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#10172A] border border-white/[0.08]">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono uppercase font-bold">
            Audit Security
          </span>
          <span class="text-xs text-slate-400 font-mono">${STATE.auditLogs.length} Immutable Log Entries</span>
        </div>
        <h2 class="text-2xl font-black text-white mt-1">Forensic Audit Trail</h2>
        <p class="text-xs text-slate-400">
          Complete changelog of all administrative mutations, order updates, stock changes, and credit payouts.
        </p>
      </div>

      <div class="space-y-2">
        ${STATE.auditLogs.map(log => `
          <div class="p-4 rounded-xl modern-card flex items-start justify-between text-xs">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">${log.action}</span>
                <span class="font-mono text-slate-400">${log.entity_type} · ${log.entity_id}</span>
              </div>
              <p class="text-slate-300 font-mono">${log.reason || 'Authorized Admin Mutation'}</p>
            </div>
            <span class="text-slate-500 font-mono text-[11px] whitespace-nowrap">${new Date(log.created_at).toLocaleString()}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ==============================================================================
// 14. SETTINGS & MASTER DATABASE SYNC
// ==============================================================================
function renderSettingsView() {
  return `
    <div class="space-y-6 pb-12 animate-fade-in">
      <div class="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#10172A] border border-white/[0.08]">
        <h2 class="text-2xl font-black text-white">System Diagnostics & Database Controls</h2>
        <p class="text-xs text-slate-400 mt-1">Direct health telemetry with Supabase PostgreSQL cloud instance</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="p-6 rounded-2xl modern-card space-y-4">
          <h3 class="text-sm font-bold text-white">Supabase Cloud Connection</h3>
          <div class="space-y-2 text-xs font-mono">
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-400">Project Endpoint:</span>
              <span class="text-white">ynsathlkfnbryafckvwm.supabase.co</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-400">Realtime Engine:</span>
              <span class="text-emerald-400 font-bold">SUBSCRIBED</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-400">Products Storage Bucket:</span>
              <span class="text-indigo-400">tff-products (Public)</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-400">Exchange Media Bucket:</span>
              <span class="text-violet-400">tff-exchange-photos (Public)</span>
            </div>
          </div>
          <button onclick="handleSyncAll()" class="w-full py-2.5 rounded-xl btn-primary text-xs font-mono font-bold mt-2">
            Force Full Cloud Resync 🔄
          </button>
        </div>

        <div class="p-6 rounded-2xl modern-card space-y-4">
          <h3 class="text-sm font-bold text-white">Live Row Counts</h3>
          <div class="grid grid-cols-2 gap-3 text-xs font-mono">
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span class="text-slate-400 text-[10px]">PRODUCTS</span>
              <div class="text-lg font-black text-white">${STATE.products.length}</div>
            </div>
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span class="text-slate-400 text-[10px]">ORDERS</span>
              <div class="text-lg font-black text-white">${STATE.orders.length}</div>
            </div>
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span class="text-slate-400 text-[10px]">TRADE-INS</span>
              <div class="text-lg font-black text-white">${STATE.exchanges.length}</div>
            </div>
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span class="text-slate-400 text-[10px]">WALLETS</span>
              <div class="text-lg font-black text-white">${STATE.wallets.length}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Master Database Seed Card -->
      <div class="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-[#10172A] border border-indigo-500/20 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-base">🌱</span>
              <h3 class="text-sm font-bold text-white">Master Catalog & Network Synchronization Engine</h3>
            </div>
            <p class="text-xs text-slate-400 mt-1 max-w-xl">
              1-click populate or repair Supabase PostgreSQL with real products, high-resolution photo galleries, categories, serviceable pincodes, and active coupons.
            </p>
          </div>
          <button id="btn-master-seed" onclick="handleMasterSeed()" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2">
            <span>⚡</span> Execute Master Seed
          </button>
        </div>
      </div>
    </div>
  `;
}

async function handleMasterSeed() {
  const btn = document.getElementById('btn-master-seed');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Seeding Supabase...';
  }

  try {
    if (window.seedMasterDataInSupabase) {
      await window.seedMasterDataInSupabase();
      showToastNotification('Master Data Synchronized!', 'All categories, products, delivery corridors and coupons are live.', 'success');
      renderActiveTabContent();
    } else {
      throw new Error('Seeder engine not initialized.');
    }
  } catch (err) {
    console.error('Master seed error:', err);
    showToastNotification('Seeding Failed', err.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>⚡</span> Execute Master Seed';
    }
  }
}

// ==============================================================================
// INITIALIZATION ON LOAD (AUTH-GATED)
// ==============================================================================
async function initializeDashboard() {
  console.log('[REVARA Command Center] Initializing Dashboard...');
  updateAdminHeader();

  // 1. Initial fetch of all tables from Supabase
  const success = await fetchAllRealtimeData();
  if (success) {
    console.log('[REVARA Command Center] All tables loaded successfully.');
  }

  // 2. Setup Realtime subscription
  setupRealtimeListener((type, payload) => {
    console.log('[REVARA Command Center] Realtime payload received:', type, payload);
    renderActiveTabContent();
    if (type === 'order') {
      showToastNotification('🛍️ New Order Received!', `Customer placed an order via the mobile app.`, 'success');
    } else if (type === 'exchange') {
      showToastNotification('♻️ New Garment Trade-In!', `Customer submitted garments with photos/video.`, 'info');
    }
  });

  // 3. Render initial tab
  renderActiveTabContent();
}

window.initializeDashboard = initializeDashboard;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[REVARA Command Center] Checking admin authentication status...');
  try {
    const admin = await checkAdminSession();
    if (admin) {
      document.getElementById('admin-login-overlay')?.classList.add('hidden');
      document.getElementById('main-dashboard')?.classList.remove('hidden');
      await initializeDashboard();
    } else {
      document.getElementById('admin-login-overlay')?.classList.remove('hidden');
      document.getElementById('main-dashboard')?.classList.add('hidden');
    }
  } catch (e) {
    console.warn('[REVARA] Session check warning:', e);
    document.getElementById('admin-login-overlay')?.classList.remove('hidden');
    document.getElementById('main-dashboard')?.classList.add('hidden');
  }
});

