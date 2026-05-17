import { renderLanding } from './pages/landing.js';
import { renderLogin } from './pages/login.js';
import { renderRegister } from './pages/register.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderAlerts } from './pages/alerts.js';
import { renderChannels } from './pages/channels.js';
import { renderXML } from './pages/xml.js';
import { renderAutomation } from './pages/automation.js';
import { renderUsers } from './pages/users.js';
import { renderAnalytics } from './pages/analytics.js';
import { renderMessaging } from './pages/messaging.js';
import { renderAnnouncements } from './pages/announcements.js';
import { renderSettings } from './pages/settings.js';
import { renderMap } from './pages/map.js';
import { initWebSocket } from './services/websocket.js';
import { getToken, getUser } from './services/auth.js';
import { refreshUser } from './services/auth.js';
import { showToast } from './utils/toast.js';
import { initNotifications } from './services/notifications.js';
import { initTheme } from './services/theme.js';

const app = document.getElementById('app');

// Apply saved theme immediately before render
initTheme();

const routes = {
  '/': () => renderLanding(app),
  '/login': () => renderLogin(app),
  '/register': () => renderRegister(app),
  '/dashboard': () => requireAuth(() => renderDashboard(app)),
  '/alerts': () => requireAuth(() => renderAlerts(app)),
  '/channels': () => requireAuth(() => renderChannels(app)),
  '/xml': () => requireAuth(() => renderXML(app)),
  '/automation': () => requireAuth(() => renderAutomation(app)),
  '/announcements': () => requireAuth(() => renderAnnouncements(app)),
  '/users': () => requireAuth(() => renderUsers(app), ['superadmin', 'admin']),
  '/analytics': () => requireAuth(() => renderAnalytics(app)),
  '/messaging': () => requireAuth(() => renderMessaging(app)),
  '/settings': () => requireAuth(() => renderSettings(app)),
  '/map': () => requireAuth(() => renderMap(app)),
};

function requireAuth(fn, roles = null) {
  const token = getToken();
  const user = getUser();
  if (!token) { navigate('/login'); return; }
  if (roles && !roles.includes(user?.role)) { showToast('Access denied', 'error'); navigate('/dashboard'); return; }
  fn();
}

export function navigate(path) {
  window.history.pushState({}, '', path);
  render(path);
}

function render(path) {
  const route = routes[path] || routes['/'];
  route();
}

window.addEventListener('popstate', () => render(window.location.pathname));

// Global navigation helper
window.navigate = navigate;

// Init
const token = getToken();
const currentPath = window.location.pathname;

if (token && (currentPath === '/' || currentPath === '/login' || currentPath === '/register')) {
  navigate('/dashboard');
} else {
  render(currentPath);
}

// Init WebSocket if authenticated
if (token) {
  initWebSocket(token);
  initNotifications();
  // Refresh user data on every page load/refresh to get latest mutedUntil
  refreshUser();

  // Auto-subscribe to emergency channel whenever server tells us the channel ID
  import('./services/websocket.js').then(({ on, subscribeChannel }) => {
    on('EMERGENCY_CHANNEL', (data) => {
      if (data.channelId) subscribeChannel(data.channelId);
    });

    // Also subscribe to any existing emergency channels on startup
    import('./services/api.js').then(({ api }) => {
      api.get('/channels').then(res => {
        (res.data || []).filter(ch => ch.type === 'emergency').forEach(ch => subscribeChannel(ch._id));
      }).catch(() => {});
    });
  });
}

// PWA install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showPWABanner();
});

function showPWABanner() {
  const banner = document.createElement('div');
  banner.className = 'pwa-banner';
  banner.innerHTML = `
    <div class="text-2xl">📱</div>
    <div>
      <div class="font-semibold text-sm">Install RavenSync</div>
      <div class="text-xs text-slate-400">Get instant emergency alerts</div>
    </div>
    <button onclick="installPWA()" class="btn btn-primary text-xs px-3 py-1.5">Install</button>
    <button onclick="this.closest('.pwa-banner').remove()" class="text-slate-500 hover:text-slate-300 ml-1">✕</button>
  `;
  document.body.appendChild(banner);
}

window.installPWA = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    document.querySelector('.pwa-banner')?.remove();
  }
};
