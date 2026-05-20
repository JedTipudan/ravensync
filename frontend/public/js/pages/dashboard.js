import { renderSidebar, initSidebar } from '../components/sidebar.js';
import { renderNotificationBell, initNotificationBell } from '../components/notificationBell.js';
import { api } from '../services/api.js';
import { on } from '../services/websocket.js';
import { showToast } from '../utils/toast.js';
import { getUser } from '../services/auth.js';
import { animateCounter, timeAgo, severityBadge, statusBadge, skeleton, typeIcon } from '../utils/helpers.js';

export function renderDashboard(app) {
  const user = getUser();
  if (user?.role === 'user') {
    renderStudentDashboard(app);
  } else {
    renderAdminDashboard(app);
  }
}

// ─── ADMIN / SUPERADMIN DASHBOARD ───────────────────────────────────────────

function renderAdminDashboard(app) {
  app.innerHTML = `
    ${renderSidebar('/dashboard')}
    <div class="main-content">
      <header class="sticky top-0 z-40 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button onclick="toggleSidebar()" class="mobile-menu-btn btn btn-ghost p-2 mr-1">
            <i class="fa-solid fa-bars"></i>
          </button>
          <div>
            <h1 class="text-lg font-bold">Command Dashboard</h1>
            <p class="text-xs text-slate-500">Real-time emergency monitoring</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
            Live
          </div>
          ${renderNotificationBell()}
          <button onclick="navigate('/alerts')" class="btn btn-danger text-sm">
            <i class="fa-solid fa-triangle-exclamation"></i> Send Alert
          </button>
        </div>
      </header>

      <main class="p-6 space-y-6">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4" id="stat-cards">
          ${[0,1,2,3].map(() => `<div class="stat-card"><div class="skeleton h-8 w-16 mb-2"></div><div class="skeleton h-4 w-24"></div></div>`).join('')}
        </div>

        <div class="grid lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            <!-- Active alerts -->
            <div class="glass rounded-2xl border border-white/8 p-5">
              <div class="flex items-center justify-between mb-4">
                <h2 class="font-bold flex items-center gap-2">
                  <div class="live-indicator"><div class="live-bar"></div><div class="live-bar"></div><div class="live-bar"></div><div class="live-bar"></div><div class="live-bar"></div></div>
                  Live Emergency Feed
                </h2>
                <button onclick="navigate('/alerts')" class="text-xs text-indigo-400 hover:text-indigo-300">View all →</button>
              </div>
              <div id="alert-feed" class="space-y-3">${skeleton(3)}</div>
            </div>

            <!-- Student responses -->
            <div class="glass rounded-2xl border border-white/8 p-5">
              <div class="flex items-center justify-between mb-4">
                <h2 class="font-bold flex items-center gap-2">
                  <span class="text-red-400"><i class="fa-solid fa-hand-holding-medical"></i></span>
                  Student Response Status
                </h2>
                <div id="response-summary" class="flex gap-3 text-xs"></div>
              </div>
              <div id="response-list" class="space-y-2">${skeleton(3)}</div>
            </div>
          </div>

          <div class="space-y-4">
            <div class="glass rounded-2xl border border-white/8 p-5">
              <h2 class="font-bold mb-4">Alert Distribution</h2>
              <div class="chart-container" style="height:200px">
                <canvas id="alert-chart"></canvas>
              </div>
            </div>
            <div class="glass rounded-2xl border border-white/8 p-5">
              <h2 class="font-bold mb-3">System Status</h2>
              <div id="system-status" class="space-y-2">${skeleton(4)}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  initSidebar();
  initNotificationBell();
  loadAdminDashboard();

  on('NEW_ALERT', (data) => { showToast(`🚨 New Alert: ${data.data?.title}`, 'error'); loadAdminDashboard(); });
  on('ALERT_RESOLVED', () => loadAdminDashboard());
  on('STUDENT_REPORT', (data) => {
    const s = data.data?.status;
    if (s === 'need_help') showToast(`🆘 ${data.data?.user?.name} needs help!`, 'error');
    loadAdminDashboard();
  });
}

async function loadAdminDashboard() {
  const [statsRes, alertsRes, systemRes] = await Promise.all([
    api.get('/admin/dashboard').catch(() => null),
    api.get('/alerts', { limit: 5, status: 'active' }).catch(() => null),
    api.get('/system/system-health').catch(() => null),
  ]);

  renderAdminStatCards(statsRes?.data);
  renderAlertFeed(alertsRes?.data);
  renderSystemStatus(systemRes?.data);
  renderAdminCharts(statsRes?.data);

  if (alertsRes?.data?.length) {
    loadStudentResponses(alertsRes.data[0]._id);
  } else {
    const el = document.getElementById('response-list');
    if (el) el.innerHTML = `<p class="text-slate-500 text-sm text-center py-4">No active alerts</p>`;
  }
}

async function loadStudentResponses(alertId) {
  try {
    const res = await api.get(`/reports/${alertId}`);
    const { data: reports, summary } = res;

    const summaryEl = document.getElementById('response-summary');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <span class="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">✅ Safe: ${summary.safe}</span>
        <span class="px-2 py-1 rounded-full bg-red-500/20 text-red-400">🆘 Help: ${summary.need_help}</span>
        <span class="px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">⚠️ Damage: ${summary.damage_report}</span>
      `;
    }

    const listEl = document.getElementById('response-list');
    if (!listEl) return;
    if (!reports.length) {
      listEl.innerHTML = `<p class="text-slate-500 text-sm text-center py-4">No student responses yet</p>`;
      return;
    }
    listEl.innerHTML = reports.map(r => {
      const cfg = {
        safe: { icon: '✅', color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Safe' },
        need_help: { icon: '🆘', color: 'text-red-400', bg: 'bg-red-500/10', label: 'Needs Help' },
        damage_report: { icon: '⚠️', color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Damage Report' },
      }[r.status] || { icon: '❓', color: 'text-slate-400', bg: 'bg-slate-500/10', label: r.status };
      return `
        <div class="flex items-center gap-3 p-3 rounded-xl ${cfg.bg} border border-white/5">
          <span class="text-xl">${cfg.icon}</span>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium">${r.user?.name || 'Unknown'}</div>
            <div class="text-xs text-slate-400">${r.user?.department || ''} ${r.message ? '· ' + r.message : ''}</div>
          </div>
          <div class="text-right">
            <span class="text-xs font-medium ${cfg.color}">${cfg.label}</span>
            <div class="text-xs text-slate-500">${timeAgo(r.updatedAt)}</div>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) { /* reports endpoint may 403 for non-admin, ignore */ }
}

function renderAdminStatCards(data) {
  const cards = [
    { label: 'Active Alerts', value: data?.activeAlerts ?? 0, icon: '🚨', color: '#ef4444' },
    { label: 'Need Help', value: data?.needHelp ?? 0, icon: '🆘', color: '#f97316' },
    { label: 'Total Users', value: data?.totalUsers ?? 0, icon: '👥', color: '#6366f1' },
    { label: 'Channels', value: data?.totalChannels ?? 0, icon: '📡', color: '#06b6d4' },
  ];
  document.getElementById('stat-cards').innerHTML = cards.map((c, i) => `
    <div class="stat-card card-hover" style="--accent-color:${c.color}">
      <div class="flex items-start justify-between mb-3">
        <div class="text-3xl">${c.icon}</div>
        <div class="w-2 h-2 rounded-full animate-pulse" style="background:${c.color}"></div>
      </div>
      <div class="text-3xl font-black mb-1" style="color:${c.color}" id="stat-${i}">0</div>
      <div class="text-sm text-slate-400">${c.label}</div>
    </div>
  `).join('');
  cards.forEach((c, i) => {
    const el = document.getElementById(`stat-${i}`);
    if (el) animateCounter(el, c.value);
  });
}

// ─── STUDENT DASHBOARD ───────────────────────────────────────────────────────

function renderStudentDashboard(app) {
  app.innerHTML = `
    ${renderSidebar('/dashboard')}
    <div class="main-content">
      <header class="sticky top-0 z-40 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button onclick="toggleSidebar()" class="mobile-menu-btn btn btn-ghost p-2 mr-1">
            <i class="fa-solid fa-bars"></i>
          </button>
          <div>
            <h1 class="text-lg font-bold">My Dashboard</h1>
            <p class="text-xs text-slate-500">Stay safe — respond to alerts</p>
          </div>
        </div>
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
          Live
        </div>
        ${renderNotificationBell()}
      </header>

      <main class="p-6 space-y-6">
        <!-- Active alert banner -->
        <div id="active-alert-banner"></div>

        <!-- Response panel -->
        <div id="response-panel" class="hidden glass rounded-2xl border border-white/8 p-6">
          <h2 class="font-bold text-lg mb-2">📣 Emergency Alert Active</h2>
          <p class="text-slate-400 text-sm mb-6">Please respond to let your instructor know your current status.</p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <button onclick="submitResponse('safe')" id="btn-safe"
              class="response-btn flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500/60 transition-all">
              <span class="text-4xl">✅</span>
              <span class="font-bold text-emerald-400">I'm Safe</span>
              <span class="text-xs text-slate-400 text-center">I am safe and accounted for</span>
            </button>
            <button onclick="submitResponse('need_help')" id="btn-need_help"
              class="response-btn flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-red-500/30 bg-red-500/10 hover:bg-red-500/20 hover:border-red-500/60 transition-all">
              <span class="text-4xl">🆘</span>
              <span class="font-bold text-red-400">I Need Help</span>
              <span class="text-xs text-slate-400 text-center">I am injured or need assistance</span>
            </button>
            <button onclick="submitResponse('damage_report')" id="btn-damage_report"
              class="response-btn flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 hover:border-amber-500/60 transition-all">
              <span class="text-4xl">⚠️</span>
              <span class="font-bold text-amber-400">Report Damage</span>
              <span class="text-xs text-slate-400 text-center">I see damage or hazard nearby</span>
            </button>
          </div>

          <div id="response-detail" class="hidden space-y-3">
            <input type="text" id="response-location" class="input" placeholder="Your location (e.g. Room 201, Building A)"/>
            <textarea id="response-message" class="input resize-none" rows="2" placeholder="Additional details (optional)"></textarea>
            <div class="flex gap-3">
              <button onclick="confirmResponse()" class="btn btn-primary flex-1">Send Response</button>
              <button onclick="cancelResponse()" class="btn btn-ghost">Cancel</button>
            </div>
          </div>

          <div id="response-status" class="hidden text-center py-4">
            <div class="text-4xl mb-2" id="response-status-icon"></div>
            <div class="font-bold" id="response-status-text"></div>
            <div class="text-xs text-slate-400 mt-1">Your instructor has been notified. You can update your status anytime.</div>
            <button onclick="showResponseButtons()" class="btn btn-ghost text-sm mt-3">Update Status</button>
          </div>
        </div>

        <!-- No active alerts -->
        <div id="no-alert-panel" class="glass rounded-2xl border border-white/8 p-10 text-center">
          <div class="text-5xl mb-4">🛡️</div>
          <h2 class="font-bold text-lg mb-2">All Clear</h2>
          <p class="text-slate-400 text-sm">No active emergency alerts at this time. Stay prepared.</p>
        </div>

        <!-- Recent alerts -->
        <div class="glass rounded-2xl border border-white/8 p-5">
          <h2 class="font-bold mb-4">Recent Alerts</h2>
          <div id="student-alert-feed" class="space-y-3">${skeleton(2)}</div>
        </div>
      </main>
    </div>
  `;

  initSidebar();
  initNotificationBell();
  loadStudentDashboard();

  on('NEW_ALERT', (data) => {
    showToast(`🚨 Emergency: ${data.data?.title}`, 'error');
    loadStudentDashboard();
  });
  on('ALERT_RESOLVED', () => loadStudentDashboard());
}

let currentAlertId = null;
let selectedStatus = null;

async function loadStudentDashboard() {
  try {
    const alertsRes = await api.get('/alerts', { limit: 5 }).catch(() => null);
    const alerts = alertsRes?.data || [];
    const activeAlerts = alerts.filter(a => a.status === 'active');

    const noAlertPanel = document.getElementById('no-alert-panel');
    const responsePanel = document.getElementById('response-panel');

    if (activeAlerts.length) {
      currentAlertId = activeAlerts[0]._id;
      noAlertPanel?.classList.add('hidden');
      responsePanel?.classList.remove('hidden');

      // Show banner
      const banner = document.getElementById('active-alert-banner');
      if (banner) {
        const a = activeAlerts[0];
        banner.innerHTML = `
          <div class="alert-card critical p-4 rounded-2xl">
            <div class="flex items-start gap-3">
              <span class="text-2xl flex-shrink-0">${typeIcon(a.type)}</span>
              <div>
                <div class="font-bold">${a.title}</div>
                <div class="text-sm text-slate-300 mt-1">${a.message}</div>
                ${a.instructions ? `<div class="text-xs text-amber-300 mt-2">📋 ${a.instructions}</div>` : ''}
              </div>
            </div>
          </div>
        `;
      }

      // Check existing response
      const myReport = await api.get(`/reports/${currentAlertId}/me`).catch(() => null);
      if (myReport?.data) {
        showResponseStatus(myReport.data.status);
      } else {
        showResponseButtons();
      }
    } else {
      noAlertPanel?.classList.remove('hidden');
      responsePanel?.classList.add('hidden');
      document.getElementById('active-alert-banner').innerHTML = '';
    }

    // Recent alerts list
    const feed = document.getElementById('student-alert-feed');
    if (feed) {
      if (!alerts.length) {
        feed.innerHTML = `<p class="text-slate-500 text-sm text-center py-4">No alerts yet</p>`;
      } else {
        feed.innerHTML = alerts.map(a => `
          <div class="alert-card ${a.severity} p-3 rounded-xl">
            <div class="flex items-center gap-3">
              <span class="text-xl">${typeIcon(a.type)}</span>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm truncate">${a.title}</div>
                <div class="flex gap-2 mt-1">${severityBadge(a.severity)} ${statusBadge(a.status)} <span class="text-xs text-slate-500">${timeAgo(a.createdAt)}</span></div>
              </div>
            </div>
          </div>
        `).join('');
      }
    }
  } catch (e) {
    showToast('Failed to load dashboard', 'error');
  }
}

function showResponseButtons() {
  document.getElementById('response-detail')?.classList.add('hidden');
  document.getElementById('response-status')?.classList.add('hidden');
  document.querySelectorAll('.response-btn').forEach(b => b.classList.remove('ring-2', 'ring-white/40'));
  selectedStatus = null;
}

function showResponseStatus(status) {
  const cfg = {
    safe: { icon: '✅', text: 'You marked yourself as Safe', color: 'text-emerald-400' },
    need_help: { icon: '🆘', text: 'You requested Help — stay where you are', color: 'text-red-400' },
    damage_report: { icon: '⚠️', text: 'Damage report submitted', color: 'text-amber-400' },
  }[status] || { icon: '❓', text: 'Response submitted', color: 'text-slate-400' };
  if (!cfg) return;
  document.getElementById('response-status-icon').textContent = cfg.icon;
  const textEl = document.getElementById('response-status-text');
  textEl.textContent = cfg.text;
  textEl.className = `font-bold ${cfg.color}`;
  document.getElementById('response-detail')?.classList.add('hidden');
  document.getElementById('response-status')?.classList.remove('hidden');
  document.querySelectorAll('.response-btn').forEach(b => b.classList.remove('ring-2', 'ring-white/40'));
}

window.submitResponse = (status) => {
  selectedStatus = status;
  document.querySelectorAll('.response-btn').forEach(b => b.classList.remove('ring-2', 'ring-white/40'));
  document.getElementById(`btn-${status}`)?.classList.add('ring-2', 'ring-white/40');
  document.getElementById('response-detail')?.classList.remove('hidden');
  document.getElementById('response-status')?.classList.add('hidden');
};

window.cancelResponse = () => {
  showResponseButtons();
};

window.confirmResponse = async () => {
  if (!selectedStatus || !currentAlertId) return;
  try {
    const location = document.getElementById('response-location')?.value;
    const message = document.getElementById('response-message')?.value;
    await api.post(`/reports/${currentAlertId}`, { status: selectedStatus, location, message });
    showResponseStatus(selectedStatus);
    const labels = { safe: 'Safe', need_help: 'Help Request', damage_report: 'Damage Report' };
    showToast(`${labels[selectedStatus]} sent to your instructor`, 'success');
  } catch (e) {
    showToast('Failed to send response', 'error');
  }
};

window.showResponseButtons = showResponseButtons;

// ─── SHARED HELPERS ──────────────────────────────────────────────────────────

function renderAlertFeed(alerts) {
  const feed = document.getElementById('alert-feed');
  if (!feed) return;
  if (!alerts?.length) {
    feed.innerHTML = `<div class="text-center py-8 text-slate-500"><div class="text-4xl mb-2">✅</div><p>No active alerts</p></div>`;
    return;
  }
  feed.innerHTML = alerts.map(a => `
    <div class="alert-card ${a.severity}" onclick="navigate('/alerts')">
      <div class="flex items-start gap-3">
        <span class="text-xl flex-shrink-0">${typeIcon(a.type)}</span>
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-sm truncate">${a.title}</div>
          <div class="text-xs text-slate-400 mt-0.5 line-clamp-1">${a.message}</div>
          <div class="flex items-center gap-2 mt-2">
            ${severityBadge(a.severity)} ${statusBadge(a.status)}
            <span class="text-xs text-slate-500">${timeAgo(a.createdAt)}</span>
          </div>
        </div>
        <div class="pulse-dot ${a.severity === 'critical' ? 'red' : a.severity === 'high' ? 'yellow' : 'blue'}"></div>
      </div>
    </div>
  `).join('');
}

function renderSystemStatus(data) {
  const el = document.getElementById('system-status');
  if (!el) return;
  const items = [
    { label: 'Database', status: data?.database === 'healthy' ? 'online' : 'offline', icon: '🗄️' },
    { label: 'WebSocket', status: data?.websocket?.serverStatus === 'running' ? 'online' : 'offline', icon: '📡' },
    { label: 'Message Queue', status: 'online', icon: '📨' },
    { label: 'XML Engine', status: 'online', icon: '📄' },
  ];
  el.innerHTML = items.map(item => `
    <div class="flex items-center justify-between py-1.5">
      <div class="flex items-center gap-2 text-sm">
        <span>${item.icon}</span>
        <span class="text-slate-300">${item.label}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div class="w-2 h-2 rounded-full ${item.status === 'online' ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse"></div>
        <span class="text-xs ${item.status === 'online' ? 'text-emerald-400' : 'text-red-400'}">${item.status}</span>
      </div>
    </div>
  `).join('');
}

function renderAdminCharts(data) {
  const ctx1 = document.getElementById('alert-chart');
  if (ctx1) {
    new Chart(ctx1, {
      type: 'doughnut',
      data: {
        labels: ['Emergency', 'Weather', 'Security', 'Announcement', 'Drill'],
        datasets: [{ data: [12, 10, 8, 9, 5], backgroundColor: ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981'], borderWidth: 0 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, padding: 10 } } },
        cutout: '65%',
      },
    });
  }
}
