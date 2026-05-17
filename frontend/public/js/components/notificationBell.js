import { getNotifications, getUnreadCount, markAllRead, clearAll, onNotifChange } from '../services/notifications.js';
import { timeAgo } from '../utils/helpers.js';

export function renderNotificationBell() {
  return `
    <div class="relative" id="notif-wrapper">
      <button onclick="toggleNotifPanel()" class="relative btn btn-ghost p-2" id="notif-btn">
        <i class="fa-solid fa-bell text-slate-300"></i>
        <span id="notif-badge" class="hidden absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold"></span>
      </button>
      <div id="notif-panel" class="hidden glass border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden notif-panel-pos">
        <div class="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <span class="font-bold text-sm">Notifications</span>
          <div class="flex items-center gap-3">
            <button onclick="markAllNotifRead()" class="text-xs text-indigo-400 hover:text-indigo-300">Mark all read</button>
            <button onclick="clearAllNotifs()" class="text-xs text-slate-500 hover:text-red-400">Clear all</button>
          </div>
        </div>
        <div id="notif-list" class="notif-list-scroll overflow-y-auto"></div>
      </div>
    </div>
  `;
}

export function initNotificationBell() {
  updateBell();
  const unsub = onNotifChange(updateBell);

  window.toggleNotifPanel = () => {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;
    const isHidden = panel.classList.contains('hidden');
    panel.classList.toggle('hidden');
    if (isHidden) renderNotifList();
  };

  window.markAllNotifRead = () => {
    markAllRead();
    renderNotifList();
  };

  window.clearAllNotifs = () => {
    clearAll();
    renderNotifList();
  };

  // Close on outside click
  document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('notif-wrapper');
    if (wrapper && !wrapper.contains(e.target)) {
      document.getElementById('notif-panel')?.classList.add('hidden');
    }
  });

  return unsub;
}

function updateBell() {
  const count = getUnreadCount();
  const badge = document.getElementById('notif-badge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function renderNotifList() {
  const list = document.getElementById('notif-list');
  if (!list) return;
  const notifs = getNotifications();
  if (!notifs.length) {
    list.innerHTML = `<div class="text-center py-8 text-slate-500 text-sm"><div class="text-3xl mb-2">🔔</div>No notifications yet</div>`;
    return;
  }
  const severityBg = { alert: 'bg-red-500/10', announcement: 'bg-indigo-500/10', message: 'bg-slate-500/10', help: 'bg-orange-500/10' };
  list.innerHTML = notifs.map(n => `
    <div onclick="navigate('${n.link || '/dashboard'}'); toggleNotifPanel();"
         class="flex items-start gap-3 px-4 py-4 hover:bg-white/5 cursor-pointer border-b border-white/5 transition-colors ${n.read ? 'opacity-50' : ''}">
      <div class="w-10 h-10 rounded-xl ${severityBg[n.type] || 'bg-slate-500/10'} flex items-center justify-center text-xl flex-shrink-0 mt-0.5">
        ${n.icon}
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-bold leading-snug mb-0.5">${n.title}</div>
        <div class="text-xs text-slate-300 leading-relaxed">${n.body || ''}</div>
        <div class="text-xs text-slate-500 mt-1.5">${timeAgo(n.time)}</div>
      </div>
      ${!n.read ? '<div class="w-2.5 h-2.5 rounded-full bg-indigo-400 flex-shrink-0 mt-2"></div>' : ''}
    </div>
  `).join('');
}
