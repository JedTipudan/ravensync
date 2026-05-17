import { renderSidebar, initSidebar } from '../components/sidebar.js';
import { renderNotificationBell, initNotificationBell } from '../components/notificationBell.js';
import { api } from '../services/api.js';
import { on } from '../services/websocket.js';
import { showToast } from '../utils/toast.js';
import { timeAgo, typeIcon, severityBadge, statusBadge, debounce } from '../utils/helpers.js';
import { isAdmin } from '../services/auth.js';

let currentPage = 1;
let searchQuery = '';
let filterStatus = '';
let filterSeverity = '';

export function renderAlerts(app) {
  app.innerHTML = `
    ${renderSidebar('/alerts')}
    <div class="main-content">
      <header class="sticky top-0 z-40 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button onclick="toggleSidebar()" class="mobile-menu-btn btn btn-ghost p-2 mr-1">
            <i class="fa-solid fa-bars"></i>
          </button>
          <div>
            <h1 class="text-lg font-bold">Emergency Alerts</h1>
            <p class="text-xs text-slate-500">Manage and broadcast emergency notifications</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          ${renderNotificationBell()}
          ${isAdmin() ? `
            <button onclick="openCreateAlert()" class="btn btn-danger">
              <i class="fa-solid fa-plus"></i> New Alert
            </button>
          ` : ''}
        </div>
      </header>

      <main class="p-6 space-y-5">
        <!-- Filters -->
        <div class="glass rounded-xl border border-white/8 p-4 flex flex-wrap gap-3 items-center">
          <div class="relative flex-1 min-w-48">
            <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
            <input type="text" id="search-input" class="input pl-9 py-2" placeholder="Search alerts..."/>
          </div>
          <select id="status-filter" class="input w-auto py-2">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
            <option value="scheduled">Scheduled</option>
            <option value="draft">Draft</option>
          </select>
          <select id="severity-filter" class="input w-auto py-2">
            <option value="">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button onclick="loadAlerts()" class="btn btn-ghost py-2">
            <i class="fa-solid fa-rotate"></i> Refresh
          </button>
        </div>

        <!-- Alert stats bar -->
        <div class="grid grid-cols-4 gap-3" id="alert-stats"></div>

        <!-- Alerts list -->
        <div id="alerts-container" class="space-y-3">
          <div class="text-center py-12"><div class="spinner mx-auto"></div></div>
        </div>

        <!-- Pagination -->
        <div id="pagination" class="flex justify-center gap-2"></div>
      </main>
    </div>

    <!-- Create Alert Modal -->
    <div id="create-alert-modal" class="modal-overlay hidden">
      <div class="modal p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold">🚨 Create Emergency Alert</h2>
          <button onclick="closeModal()" class="text-slate-400 hover:text-white text-xl">×</button>
        </div>
        <form id="alert-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Alert Title *</label>
            <input type="text" id="alert-title" class="input" placeholder="e.g. Typhoon Warning — Immediate Evacuation" required/>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Type</label>
              <select id="alert-type" class="input">
                <option value="emergency">🚨 Emergency</option>
                <option value="warning">⚠️ Warning</option>
                <option value="weather">🌪️ Weather</option>
                <option value="security">🔒 Security</option>
                <option value="announcement">📢 Announcement</option>
                <option value="drill">🔔 Drill</option>
                <option value="info">ℹ️ Info</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Severity</label>
              <select id="alert-severity" class="input">
                <option value="critical">🔴 Critical</option>
                <option value="high">🟡 High</option>
                <option value="medium" selected>🔵 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Message *</label>
            <textarea id="alert-message" class="input h-24 resize-none" placeholder="Describe the emergency situation and required actions..." required></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Affected Area</label>
              <input type="text" id="alert-area" class="input" placeholder="e.g. Barangay 1-15, Zone A"/>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Priority (1-10)</label>
              <input type="number" id="alert-priority" class="input" value="5" min="1" max="10"/>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Instructions</label>
            <textarea id="alert-instructions" class="input h-16 resize-none" placeholder="Specific instructions for affected individuals..."></textarea>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="submit" class="btn btn-danger flex-1">
              <i class="fa-solid fa-broadcast-tower"></i> Broadcast Alert
            </button>
            <button type="button" onclick="closeModal()" class="btn btn-ghost">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;

  initSidebar();
  initNotificationBell();
  loadAlerts();
  loadAlertStats();

  // Search
  const searchInput = document.getElementById('search-input');
  searchInput?.addEventListener('input', debounce((e) => {
    searchQuery = e.target.value;
    currentPage = 1;
    loadAlerts();
  }, 400));

  document.getElementById('status-filter')?.addEventListener('change', (e) => {
    filterStatus = e.target.value;
    loadAlerts();
  });

  document.getElementById('severity-filter')?.addEventListener('change', (e) => {
    filterSeverity = e.target.value;
    loadAlerts();
  });

  // Real-time
  on('NEW_ALERT', () => { loadAlerts(); loadAlertStats(); });
  on('ALERT_RESOLVED', () => { loadAlerts(); loadAlertStats(); });

  // Form submit
  document.getElementById('alert-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api.post('/alerts', {
        title: document.getElementById('alert-title').value,
        type: document.getElementById('alert-type').value,
        severity: document.getElementById('alert-severity').value,
        message: document.getElementById('alert-message').value,
        affectedArea: document.getElementById('alert-area').value,
        priority: parseInt(document.getElementById('alert-priority').value),
        instructions: document.getElementById('alert-instructions').value,
      });
      showToast('Alert broadcast successfully!', 'success');
      closeModal();
      loadAlerts();
      loadAlertStats();
    } catch (err) {
      showToast(err.message || 'Failed to create alert', 'error');
    }
  });

  window.openCreateAlert = () => document.getElementById('create-alert-modal').classList.remove('hidden');
  window.closeModal = () => document.getElementById('create-alert-modal').classList.add('hidden');
  window.resolveAlert = resolveAlert;
  window.deleteAlert = deleteAlertFn;
}

async function loadAlerts() {
  const container = document.getElementById('alerts-container');
  if (!container) return;
  container.innerHTML = `<div class="text-center py-12"><div class="spinner mx-auto"></div></div>`;

  try {
    const params = { page: currentPage, limit: 10 };
    if (searchQuery) params.search = searchQuery;
    if (filterStatus) params.status = filterStatus;
    if (filterSeverity) params.severity = filterSeverity;

    const res = await api.get('/alerts', params);
    const alerts = res.data;

    if (!alerts.length) {
      container.innerHTML = `<div class="text-center py-16 text-slate-500"><div class="text-5xl mb-3">📭</div><p class="font-medium">No alerts found</p><p class="text-sm mt-1">Try adjusting your filters</p></div>`;
      return;
    }

    container.innerHTML = alerts.map(a => `
      <div class="alert-card ${a.severity} group">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-3 flex-1 min-w-0">
            <div class="text-2xl flex-shrink-0 mt-0.5">${typeIcon(a.type)}</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <span class="font-bold text-sm">${a.title}</span>
                ${severityBadge(a.severity)}
                ${statusBadge(a.status)}
              </div>
              <p class="text-sm text-slate-400 line-clamp-2 mb-2">${a.message}</p>
              <div class="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                ${a.affectedArea ? `<span>📍 ${a.affectedArea}</span>` : ''}
                <span>👤 ${a.author?.name || 'System'}</span>
                <span>🕐 ${timeAgo(a.createdAt)}</span>
                <span>📊 Priority: ${a.priority}/10</span>
              </div>
            </div>
          </div>
          ${isAdmin() ? `
            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              ${a.status === 'active' ? `<button onclick="resolveAlert('${a._id}')" class="btn btn-success text-xs py-1.5 px-3">✅ Resolve</button>` : ''}
              <button onclick="deleteAlert('${a._id}')" class="btn btn-ghost text-xs py-1.5 px-3 text-red-400 hover:bg-red-500/10">🗑️</button>
            </div>
          ` : ''}
        </div>
        ${a.qrCode ? `<div class="mt-3 pt-3 border-t border-white/5 flex items-center gap-3"><img src="${a.qrCode}" class="w-12 h-12 rounded-lg" alt="QR"/><span class="text-xs text-slate-500">Scan to verify alert</span></div>` : ''}
      </div>
    `).join('');

    // Pagination
    const pagination = document.getElementById('pagination');
    if (pagination && res.pagination) {
      const { page, pages } = res.pagination;
      pagination.innerHTML = Array.from({ length: pages }, (_, i) => i + 1).map(p => `
        <button onclick="goToPage(${p})" class="btn ${p === page ? 'btn-primary' : 'btn-ghost'} text-sm px-3 py-1.5">${p}</button>
      `).join('');
    }
  } catch (err) {
    container.innerHTML = `<div class="text-center py-12 text-red-400"><div class="text-4xl mb-2">⚠️</div><p>Failed to load alerts</p></div>`;
  }
}

async function loadAlertStats() {
  try {
    const res = await api.get('/alerts/stats');
    const d = res.data;
    const el = document.getElementById('alert-stats');
    if (!el) return;
    el.innerHTML = [
      { label: 'Total', value: d.total, color: '#6366f1' },
      { label: 'Active', value: d.active, color: '#ef4444' },
      { label: 'Critical', value: d.critical, color: '#f97316' },
      { label: 'Resolved', value: d.resolved, color: '#10b981' },
    ].map(s => `
      <div class="glass rounded-xl border border-white/8 p-3 text-center">
        <div class="text-2xl font-black" style="color:${s.color}">${s.value}</div>
        <div class="text-xs text-slate-400 mt-0.5">${s.label}</div>
      </div>
    `).join('');
  } catch (e) { /* silent */ }
}

async function resolveAlert(id) {
  try {
    await api.patch(`/alerts/${id}/resolve`);
    showToast('Alert resolved successfully', 'success');
    loadAlerts();
    loadAlertStats();
  } catch (err) {
    showToast('Failed to resolve alert', 'error');
  }
}

async function deleteAlertFn(id) {
  if (!confirm('Delete this alert?')) return;
  try {
    await api.delete(`/alerts/${id}`);
    showToast('Alert deleted', 'success');
    loadAlerts();
    loadAlertStats();
  } catch (err) {
    showToast('Failed to delete alert', 'error');
  }
}

window.goToPage = (p) => { currentPage = p; loadAlerts(); };
