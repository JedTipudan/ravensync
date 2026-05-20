import { getUser, logout } from '../services/auth.js';
import { getWsStatus, on } from '../services/websocket.js';
import { toggleTheme, getTheme } from '../services/theme.js';

export function renderSidebar(activePage) {
  const user = getUser();
  const role = user?.role;

  const commonItems = [
    { path: '/dashboard', icon: 'fa-gauge-high', label: 'Dashboard' },
    { path: '/channels', icon: 'fa-comments', label: 'Channels' },
  ];

  const adminItems = [
    { path: '/dashboard', icon: 'fa-gauge-high', label: 'Dashboard' },
    { path: '/alerts', icon: 'fa-triangle-exclamation', label: 'Emergency Alerts' },
    { path: '/announcements', icon: 'fa-bullhorn', label: 'Announcements' },
    { path: '/channels', icon: 'fa-comments', label: 'Channels' },
    { path: '/messaging', icon: 'fa-layer-group', label: 'Message Queue' },
    { path: '/xml', icon: 'fa-code', label: 'XML Center' },
    { path: '/automation', icon: 'fa-terminal', label: 'Automation' },
    { path: '/analytics', icon: 'fa-chart-line', label: 'Analytics' },
    { path: '/users', icon: 'fa-users', label: 'Manage Users' },
    { path: '/map', icon: 'fa-map', label: 'Campus Map' },
  ];

  const superadminItems = [
    ...adminItems,
  ];

  const userItems = [
    { path: '/dashboard', icon: 'fa-gauge-high', label: 'My Dashboard' },
    { path: '/announcements', icon: 'fa-bullhorn', label: 'Announcements' },
    { path: '/channels', icon: 'fa-comments', label: 'Channels' },
    { path: '/map', icon: 'fa-map', label: 'Campus Map' },
  ];

  const navItems = role === 'superadmin' ? superadminItems : role === 'admin' ? adminItems : userItems;

  return `
    <aside class="sidebar" id="sidebar">
      <div class="p-4 border-b border-white/5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold shadow-lg">
              <img src="/images/logo.png" alt="RavenSync" class="w-8 h-8 object-contain raven-logo" onerror="this.outerHTML='🦅'"/>
            </div>
            <div>
              <div class="font-bold text-sm gradient-text">RavenSync</div>
              <div class="text-xs text-slate-500 capitalize">${role === 'superadmin' ? 'Super Admin' : role === 'admin' ? 'Instructor' : 'Student'}</div>
            </div>
          </div>
          <button onclick="toggleSidebar()" class="sidebar-close-btn md-hidden btn btn-ghost p-1.5 text-slate-400">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      <div class="p-3 border-b border-white/5">
        <div class="flex items-center gap-2 px-2 py-1.5">
          <div class="w-2 h-2 rounded-full bg-red-400 animate-pulse" id="ws-status-dot"></div>
          <span class="text-xs text-slate-400" id="ws-status-text">Connecting...</span>
        </div>
      </div>

      <nav class="flex-1 p-2 space-y-0.5 overflow-y-auto">
        ${navItems.map(item => `
          <a href="${item.path}" onclick="event.preventDefault(); navigate('${item.path}')"
             class="nav-item ${activePage === item.path ? 'active' : ''}">
            <i class="fa-solid ${item.icon} w-4 text-center flex-shrink-0"></i>
            <span class="truncate">${item.label}</span>
          </a>
        `).join('')}
      </nav>

      <div class="p-3 border-t border-white/5 flex-shrink-0">
        <div class="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors mb-1" onclick="navigate('/settings')">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0">
            ${user?.avatar ? `<img src="${user.avatar}" class="w-full h-full object-cover"/>` : (user?.name?.charAt(0)?.toUpperCase() || 'U')}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium truncate">${user?.name || 'User'}</div>
            <div class="text-xs text-slate-500 capitalize">${role === 'superadmin' ? 'Super Admin' : role === 'admin' ? 'Instructor' : 'Student'}</div>
          </div>
          <i class="fa-solid fa-gear text-slate-500 text-xs"></i>
        </div>
        <button onclick="logoutUser()" class="nav-item w-full text-red-400 hover:bg-red-500/10 hover:text-red-300">
          <i class="fa-solid fa-right-from-bracket w-4 text-center flex-shrink-0"></i>
          <span>Sign Out</span>
        </button>
        <button onclick="toggleAppTheme()" class="btn btn-ghost w-full mt-1 justify-start" id="theme-toggle-btn">
          <i class="fa-solid ${getTheme() === 'dark' ? 'fa-sun text-yellow-400' : 'fa-moon text-indigo-500'}"></i>
          <span>${getTheme() === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </aside>
    <div class="sidebar-overlay" id="sidebar-overlay" onclick="toggleSidebar()"></div>
  `;
}

export function initSidebar() {
  window.logoutUser = () => logout();
  window.toggleSidebar = () => {
    document.getElementById('sidebar')?.classList.toggle('open');
    document.getElementById('sidebar-overlay')?.classList.toggle('active');
  };
  window.toggleAppTheme = () => {
    const next = toggleTheme();
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      btn.innerHTML = `<i class="fa-solid ${next === 'dark' ? 'fa-sun text-yellow-400' : 'fa-moon text-indigo-500'}"></i><span>${next === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>`;
    }
  };

  // Update WS status indicator dynamically — sidebar is static HTML so we patch the DOM
  const _setWsStatus = (connected) => {
    const dot = document.getElementById('ws-status-dot');
    const text = document.getElementById('ws-status-text');
    if (!dot || !text) return;
    dot.className = `w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`;
    text.textContent = connected ? 'Live Connected' : 'Connecting...';
  };

  // Set immediately based on current state
  _setWsStatus(getWsStatus() === 'open');

  // Update on connect / disconnect events
  on('connected', () => _setWsStatus(true));
  on('CONNECTED', () => _setWsStatus(true));
  on('disconnected', () => _setWsStatus(false));
}
