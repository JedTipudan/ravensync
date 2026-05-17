import { renderSidebar, initSidebar } from '../components/sidebar.js';
import { api } from '../services/api.js';
import { showToast } from '../utils/toast.js';
import { on } from '../services/websocket.js';

export function renderMessaging(app) {
  app.innerHTML = `
    ${renderSidebar('/messaging')}
    <div class="main-content">
      <header class="sticky top-0 z-40 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button onclick="toggleSidebar()" class="mobile-menu-btn btn btn-ghost p-2 mr-1">
            <i class="fa-solid fa-bars"></i>
          </button>
          <div>
            <h1 class="text-lg font-bold">Message Queue Monitor</h1>
            <p class="text-xs text-slate-500">Kafka broker status and queue analytics</p>
          </div>
        </div>
        <button onclick="refreshQueueStats()" class="btn btn-ghost text-sm">
          <i class="fa-solid fa-rotate"></i> Refresh
        </button>
      </header>

      <main class="p-6 space-y-6">
        <!-- Broker status -->
        <div class="glass rounded-2xl border border-white/8 p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-bold flex items-center gap-2">
              <i class="fa-solid fa-server text-indigo-400"></i>
              Kafka Broker Status
            </h2>
            <div id="broker-status" class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
              <div class="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></div>
              Checking...
            </div>
          </div>
          <div class="grid grid-cols-3 gap-4" id="broker-stats">
            ${[0,1,2].map(() => `<div class="bg-white/5 rounded-xl p-4"><div class="skeleton h-6 w-12 mb-2"></div><div class="skeleton h-3 w-20"></div></div>`).join('')}
          </div>
        </div>

        <!-- Queue cards -->
        <div class="grid lg:grid-cols-2 gap-4" id="queue-cards">
          ${[0,1,2,3].map(() => `<div class="glass rounded-xl border border-white/8 p-4"><div class="skeleton h-5 w-32 mb-3"></div><div class="skeleton h-4 w-full mb-2"></div><div class="skeleton h-4 w-3/4"></div></div>`).join('')}
        </div>

        <!-- Throughput chart -->
        <div class="glass rounded-2xl border border-white/8 p-5">
          <h2 class="font-bold mb-4">📈 Message Throughput</h2>
          <div class="chart-container" style="height:220px">
            <canvas id="throughput-chart"></canvas>
          </div>
        </div>

        <!-- Live message feed -->
        <div class="glass rounded-2xl border border-white/8 p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-bold flex items-center gap-2">
              <div class="live-indicator"><div class="live-bar"></div><div class="live-bar"></div><div class="live-bar"></div><div class="live-bar"></div><div class="live-bar"></div></div>
              Live Message Feed
            </h2>
            <button onclick="clearFeed()" class="btn btn-ghost text-xs py-1.5">Clear</button>
          </div>
          <div id="message-feed" class="space-y-2 max-h-64 overflow-y-auto">
            <div class="text-xs text-slate-600 text-center py-4">Waiting for messages...</div>
          </div>
        </div>
      </main>
    </div>
  `;

  initSidebar();
  refreshQueueStats();
  renderThroughputChart();
  simulateLiveFeed();

  window.refreshQueueStats = refreshQueueStats;
  window.clearFeed = () => {
    const feed = document.getElementById('message-feed');
    if (feed) feed.innerHTML = `<div class="text-xs text-slate-600 text-center py-4">Feed cleared</div>`;
  };

  // Real-time alert events
  on('NEW_ALERT', (data) => addToFeed('emergency.alerts', `Alert published: ${data.data?.title}`, 'critical'));
}

async function refreshQueueStats() {
  try {
    const res = await api.get('/system/queue-stats');
    const d = res.data;

    // Broker status
    const statusEl = document.getElementById('broker-status');
    if (statusEl) {
      const isConnected = d.connected;
      statusEl.className = `flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'}`;
      statusEl.innerHTML = `<div class="w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-yellow-400'} animate-pulse"></div>${isConnected ? 'Connected' : 'Simulation Mode'}`;
    }

    // Broker stats
    const brokerEl = document.getElementById('broker-stats');
    if (brokerEl) {
      const tp = d.throughput || {};
      brokerEl.innerHTML = [
        { label: 'Published', value: tp.published || 0, color: '#6366f1', icon: '📤' },
        { label: 'Consumed', value: tp.consumed || 0, color: '#10b981', icon: '📥' },
        { label: 'Failed', value: tp.failed || 0, color: '#ef4444', icon: '❌' },
      ].map(s => `
        <div class="bg-white/5 rounded-xl p-4 text-center">
          <div class="text-2xl mb-1">${s.icon}</div>
          <div class="text-2xl font-black" style="color:${s.color}">${s.value}</div>
          <div class="text-xs text-slate-400 mt-1">${s.label}</div>
        </div>
      `).join('');
    }

    // Queue cards
    const queuesEl = document.getElementById('queue-cards');
    if (queuesEl && d.queues) {
      queuesEl.innerHTML = d.queues.map(q => `
        <div class="glass rounded-xl border border-white/8 p-4 card-hover">
          <div class="flex items-start justify-between mb-3">
            <div>
              <div class="font-semibold text-sm">${q.name}</div>
              <div class="text-xs text-slate-500 mt-0.5">${getQueueDescription(q.name)}</div>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-2 h-2 rounded-full ${q.messages > 0 ? 'bg-yellow-400' : 'bg-emerald-400'} animate-pulse"></div>
              <span class="text-xs ${q.messages > 0 ? 'text-yellow-400' : 'text-emerald-400'}">${q.messages > 0 ? 'Processing' : 'Idle'}</span>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="bg-white/5 rounded-lg p-2">
              <div class="text-lg font-bold text-indigo-400">${q.messages}</div>
              <div class="text-xs text-slate-500">Messages</div>
            </div>
            <div class="bg-white/5 rounded-lg p-2">
              <div class="text-lg font-bold text-emerald-400">${q.consumers}</div>
              <div class="text-xs text-slate-500">Consumers</div>
            </div>
            <div class="bg-white/5 rounded-lg p-2">
              <div class="text-lg font-bold text-yellow-400">${q.ready}</div>
              <div class="text-xs text-slate-500">Ready</div>
            </div>
          </div>
          <div class="mt-3">
            <div class="flex justify-between text-xs text-slate-500 mb-1">
              <span>Queue Load</span>
              <span>${Math.min(q.messages * 10, 100)}%</span>
            </div>
            <div class="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all" style="width:${Math.min(q.messages * 10, 100)}%;background:${q.messages > 5 ? '#ef4444' : q.messages > 2 ? '#f59e0b' : '#10b981'}"></div>
            </div>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    showToast('Failed to load queue stats', 'error');
  }
}

function renderThroughputChart() {
  const ctx = document.getElementById('throughput-chart');
  if (!ctx) return;

  const labels = Array.from({ length: 20 }, (_, i) => `${i * 3}s`);
  const published = Array.from({ length: 20 }, () => Math.floor(Math.random() * 30 + 5));
  const consumed = published.map(v => Math.max(0, v - Math.floor(Math.random() * 5)));

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Published', data: published, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', tension: 0.4, fill: true, pointRadius: 2 },
        { label: 'Consumed', data: consumed, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', tension: 0.4, fill: true, pointRadius: 2 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', maxTicksLimit: 10 } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
      },
      animation: { duration: 0 },
    },
  });
}

function simulateLiveFeed() {
  const messages = [
    { queue: 'emergency.alerts', msg: 'Alert published: Typhoon Warning', priority: 'critical' },
    { queue: 'notifications', msg: 'Push notification sent to 247 devices', priority: 'normal' },
    { queue: 'broadcasts', msg: 'Broadcast message delivered to Channel #emergency', priority: 'high' },
    { queue: 'notifications', msg: 'Email notification dispatched', priority: 'normal' },
    { queue: 'emergency.alerts', msg: 'Alert resolved: Water interruption', priority: 'normal' },
  ];

  let i = 0;
  setInterval(() => {
    const msg = messages[i % messages.length];
    addToFeed(msg.queue, msg.msg, msg.priority);
    i++;
  }, 4000);
}

function addToFeed(queue, message, priority) {
  const feed = document.getElementById('message-feed');
  if (!feed) return;

  const emptyState = feed.querySelector('.text-slate-600');
  if (emptyState) feed.innerHTML = '';

  const colors = { critical: 'text-red-400', high: 'text-yellow-400', normal: 'text-emerald-400' };
  const item = document.createElement('div');
  item.className = 'flex items-center gap-3 py-2 border-b border-white/5 text-xs';
  item.innerHTML = `
    <div class="w-1.5 h-1.5 rounded-full ${priority === 'critical' ? 'bg-red-400' : priority === 'high' ? 'bg-yellow-400' : 'bg-emerald-400'} flex-shrink-0"></div>
    <span class="text-slate-500 font-mono flex-shrink-0">${queue}</span>
    <span class="flex-1 text-slate-300">${message}</span>
    <span class="text-slate-600 flex-shrink-0">${new Date().toLocaleTimeString()}</span>
  `;
  feed.insertBefore(item, feed.firstChild);
  if (feed.children.length > 20) feed.removeChild(feed.lastChild);
}

function getQueueDescription(name) {
  const desc = {
    'emergency.alerts': 'Critical emergency broadcasts',
    'notifications': 'User push & email notifications',
    'broadcasts': 'Channel broadcast messages',
    'dead.letter': 'Failed message recovery',
  };
  return desc[name] || 'Message queue';
}
