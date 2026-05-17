import { renderSidebar, initSidebar } from '../components/sidebar.js';
import { api } from '../services/api.js';
import { showToast } from '../utils/toast.js';

export function renderAutomation(app) {
  app.innerHTML = `
    ${renderSidebar('/automation')}
    <div class="main-content">
      <header class="sticky top-0 z-40 glass border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <button onclick="toggleSidebar()" class="mobile-menu-btn btn btn-ghost p-2">
            <i class="fa-solid fa-bars"></i>
          </button>
          <div>
            <h1 class="text-base font-bold">Automation</h1>
            <p class="text-xs text-slate-500 hidden sm:block">Scripts &amp; system automation</p>
          </div>
        </div>
        <div class="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span class="hidden sm:inline">Automation Engine</span> Active
        </div>
      </header>

      <main class="p-3 sm:p-6 space-y-4 sm:space-y-6">
        <!-- Cron status -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          ${[
            { name: 'XML Backup', schedule: 'Every 6h', status: 'active', last: '2h ago', icon: '💾' },
            { name: 'Log Cleanup', schedule: 'Daily 2AM', status: 'active', last: '22h ago', icon: '🧹' },
            { name: 'Health Check', schedule: 'Every 5m', status: 'active', last: '3m ago', icon: '❤️' },
            { name: 'Report Gen', schedule: 'Daily 8AM', status: 'active', last: '4h ago', icon: '📊' },
          ].map(job => `
            <div class="stat-card card-hover p-3" style="--accent-color:#10b981">
              <div class="flex items-start justify-between mb-1">
                <span class="text-xl">${job.icon}</span>
                <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mt-1"></div>
              </div>
              <div class="font-semibold text-xs sm:text-sm">${job.name}</div>
              <div class="text-xs text-slate-500">${job.schedule}</div>
            </div>
          `).join('')}
        </div>

        <!-- Scripts + Terminal: stack on mobile -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div class="glass rounded-2xl border border-white/8 p-4">
            <h2 class="font-bold mb-3 flex items-center gap-2 text-sm sm:text-base">
              <i class="fa-solid fa-terminal text-indigo-400"></i>
              Available Scripts
            </h2>
            <div id="scripts-list" class="space-y-2">
              <div class="text-center py-8"><div class="spinner mx-auto"></div></div>
            </div>
          </div>

          <div class="glass rounded-2xl border border-white/8 p-4">
            <div class="flex items-center justify-between mb-3">
              <h2 class="font-bold flex items-center gap-2 text-sm sm:text-base">
                <i class="fa-solid fa-display text-green-400"></i>
                Terminal
              </h2>
              <div class="flex gap-2">
                <div id="exec-status" class="hidden items-center gap-1.5 text-xs">
                  <div class="spinner" style="width:14px;height:14px;border-width:2px"></div>
                  <span class="text-slate-400">Running...</span>
                </div>
                <button onclick="clearTerminal()" class="btn btn-ghost text-xs py-1">Clear</button>
              </div>
            </div>
            <div class="terminal">
              <div class="terminal-header">
                <div class="terminal-dot bg-red-500"></div>
                <div class="terminal-dot bg-yellow-500"></div>
                <div class="terminal-dot bg-green-500"></div>
                <span class="text-xs text-slate-400 ml-2 truncate" id="terminal-title">PowerShell Terminal</span>
              </div>
              <div class="terminal-body" id="terminal-output">
                <div class="terminal-line info">RavenSync Automation v1.0</div>
                <div class="terminal-line">Select a script and click Run...</div>
                <div class="terminal-line" style="color:#6366f1">PS> _</div>
              </div>
            </div>
            <div class="mt-3">
              <h3 class="text-xs font-medium text-slate-400 mb-2">Execution History</h3>
              <div id="exec-history" class="space-y-1 max-h-32 overflow-y-auto">
                <div class="text-xs text-slate-600">No executions yet</div>
              </div>
            </div>
          </div>
        </div>

        <!-- System monitoring -->
        <div class="glass rounded-2xl border border-white/8 p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold text-sm sm:text-base">📈 System Monitoring</h2>
            <button onclick="refreshSystemHealth()" class="btn btn-ghost text-xs py-1">
              <i class="fa-solid fa-rotate"></i> Refresh
            </button>
          </div>
          <div id="system-health" class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <div class="text-center py-4"><div class="spinner mx-auto"></div></div>
          </div>
        </div>

        <!-- Backups -->
        <div class="glass rounded-2xl border border-white/8 p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold text-sm sm:text-base">🗄️ Database Backups</h2>
            <div class="flex gap-2">
              <button onclick="loadBackups()" class="btn btn-ghost text-xs py-1">
                <i class="fa-solid fa-rotate"></i>
              </button>
              <button onclick="runScript('db-backup', 'Database Backup')" class="btn btn-primary text-xs py-1 px-2">
                <i class="fa-solid fa-database"></i> <span class="hidden sm:inline">Backup Now</span><span class="sm:hidden">Backup</span>
              </button>
            </div>
          </div>
          <div id="backups-list" class="space-y-2">
            <div class="text-center py-6"><div class="spinner mx-auto"></div></div>
          </div>
        </div>
      </main>
    </div>
  `;

  initSidebar();
  loadScripts();
  refreshSystemHealth();
  loadBackups();

  window.runScript = runScript;
  window.clearTerminal = () => {
    document.getElementById('terminal-output').innerHTML = `
      <div class="terminal-line info">Terminal cleared</div>
      <div class="terminal-line" style="color:#6366f1">PS C:\\RavenSync\\backend\\scripts> _</div>
    `;
  };
  window.refreshSystemHealth = refreshSystemHealth;
  window.loadBackups = loadBackups;
}

async function loadScripts() {
  try {
    const res = await api.get('/system/scripts');
    const list = document.getElementById('scripts-list');
    if (!list) return;

    const categoryColors = {
      backup: 'text-blue-400', xml: 'text-purple-400', maintenance: 'text-yellow-400',
      monitoring: 'text-green-400', messaging: 'text-cyan-400', reports: 'text-orange-400',
      notifications: 'text-pink-400',
    };

    list.innerHTML = res.data.map(script => `
      <div class="flex items-center gap-2 p-2 sm:p-3 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/3 transition-all">
        <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/5 flex items-center justify-center text-base flex-shrink-0">
          ${getCategoryIcon(script.category)}
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-xs sm:text-sm font-medium truncate">${script.name}</div>
          <div class="text-xs text-slate-500 truncate hidden sm:block">${script.description}</div>
        </div>
        <button onclick="runScript('${script.id}', '${script.name}')"
          class="btn btn-primary text-xs py-1 px-2 sm:px-3 flex-shrink-0">
          <i class="fa-solid fa-play"></i> <span class="hidden sm:inline">Run</span>
        </button>
      </div>
    `).join('');
  } catch (err) {
    showToast('Failed to load scripts', 'error');
  }
}

async function runScript(scriptId, scriptName) {
  const terminal = document.getElementById('terminal-output');
  const title = document.getElementById('terminal-title');
  const status = document.getElementById('exec-status');

  if (title) title.textContent = `Running: ${scriptName}`;
  if (status) status.classList.remove('hidden');
  if (status) status.style.display = 'flex';

  // Clear and show running state
  if (terminal) {
    terminal.innerHTML = `
      <div class="terminal-line info">PS C:\\RavenSync\\backend\\scripts> .\\${scriptId}.ps1</div>
      <div class="terminal-line" style="color:#fbbf24">Executing script...</div>
    `;
  }

  try {
    const res = await api.post(`/system/scripts/${scriptId}/run`, undefined, { timeout: 60000 });
    const { output, duration, executedAt } = res.data;

    if (terminal) {
      const lines = output.split('\n').filter(Boolean);
      terminal.innerHTML = `<div class="terminal-line info">PS C:\\RavenSync\\backend\\scripts> .\\${scriptId}.ps1</div>`;

      lines.forEach((line, i) => {
        setTimeout(() => {
          const div = document.createElement('div');
          div.className = `terminal-line ${getLineClass(line)}`;
          div.textContent = line;
          terminal.appendChild(div);
          terminal.scrollTop = terminal.scrollHeight;
        }, i * 80);
      });

      setTimeout(() => {
        const div = document.createElement('div');
        div.className = 'terminal-line';
        div.style.color = '#6366f1';
        div.textContent = `PS C:\\RavenSync\\backend\\scripts> `;
        terminal.appendChild(div);
        terminal.scrollTop = terminal.scrollHeight;
      }, lines.length * 80 + 100);
    }

    // Add to history
    addToHistory(scriptName, duration, 'success');
    showToast(`${scriptName} executed successfully`, 'success');
    if (scriptId === 'db-backup') setTimeout(loadBackups, 500);
  } catch (err) {
    if (terminal) {
      terminal.innerHTML += `<div class="terminal-line error">ERROR: ${err.message}</div>`;
    }
    addToHistory(scriptName, 0, 'error');
    showToast('Script execution failed', 'error');
  } finally {
    if (status) status.style.display = 'none';
    if (title) title.textContent = 'RavenSync PowerShell Terminal';
  }
}

function addToHistory(name, duration, status) {
  const history = document.getElementById('exec-history');
  if (!history) return;
  const item = document.createElement('div');
  item.className = 'flex items-center gap-2 text-xs py-1 border-b border-white/5';
  item.innerHTML = `
    <div class="w-1.5 h-1.5 rounded-full ${status === 'success' ? 'bg-emerald-400' : 'bg-red-400'}"></div>
    <span class="flex-1 text-slate-300">${name}</span>
    <span class="text-slate-500">${duration}ms</span>
    <span class="text-slate-600">${new Date().toLocaleTimeString()}</span>
  `;
  if (history.querySelector('.text-slate-600')) history.innerHTML = '';
  history.insertBefore(item, history.firstChild);
}

async function refreshSystemHealth() {
  try {
    const res = await api.get('/system/system-health');
    const d = res.data;
    const el = document.getElementById('system-health');
    if (!el) return;

    const memUsed = Math.round(d.memory?.heapUsed / 1024 / 1024);
    const memTotal = Math.round(d.memory?.heapTotal / 1024 / 1024);
    const uptime = Math.floor(d.uptime / 60);

    el.innerHTML = [
      { label: 'Database', value: d.database === 'healthy' ? '✅ Healthy' : '❌ Down', color: d.database === 'healthy' ? '#10b981' : '#ef4444' },
      { label: 'WebSocket', value: `${d.websocket?.totalConnections || 0} connections`, color: '#6366f1' },
      { label: 'Memory', value: `${memUsed}MB / ${memTotal}MB`, color: '#f59e0b' },
      { label: 'Uptime', value: `${uptime}m`, color: '#06b6d4' },
    ].map(item => `
      <div class="glass rounded-xl border border-white/8 p-4 text-center">
        <div class="text-lg font-bold" style="color:${item.color}">${item.value}</div>
        <div class="text-xs text-slate-400 mt-1">${item.label}</div>
      </div>
    `).join('');
  } catch (err) {
    const el = document.getElementById('system-health');
    if (el) el.innerHTML = `<div class="col-span-4 text-center text-slate-500 text-sm py-4">Failed to load system health</div>`;
  }
}

function getLineClass(line) {
  if (line.includes('[SUCCESS]') || line.includes('✅')) return 'success';
  if (line.includes('[ERROR]') || line.includes('❌')) return 'error';
  if (line.includes('[WARNING]') || line.includes('⚠️')) return 'warning';
  if (line.includes('[INFO]') || line.includes('[CHECK]') || line.includes('[LISTENING]')) return 'info';
  return '';
}

function getCategoryIcon(cat) {
  const icons = { backup: '💾', xml: '📄', maintenance: '🧹', monitoring: '❤️', messaging: '📨', reports: '📊', notifications: '🔔' };
  return icons[cat] || '⚙️';
}

async function loadBackups() {
  const el = document.getElementById('backups-list');
  if (!el) return;
  try {
    const res = await api.get('/system/backups');
    if (!res.data.length) {
      el.innerHTML = `<div class="text-center py-6 text-slate-500 text-sm">No backups yet — click "Backup Now" to create one</div>`;
      return;
    }
    el.innerHTML = res.data.map((b, i) => `
      <div class="flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:bg-white/3 transition-colors">
        <div class="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-lg flex-shrink-0">💾</div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium truncate">${b.name}</div>
          <div class="text-xs text-slate-500">${(b.size / 1024).toFixed(1)} KB · ${new Date(b.createdAt).toLocaleString()}</div>
        </div>
        ${i === 0 ? '<span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Latest</span>' : ''}
        <button onclick="restoreBackup()" class="btn btn-ghost text-xs py-1.5 px-3 text-yellow-400 hover:bg-yellow-500/10 flex-shrink-0">
          <i class="fa-solid fa-rotate-left"></i> Restore
        </button>
      </div>
    `).join('');
  } catch (err) {
    el.innerHTML = `<div class="text-center py-6 text-slate-500 text-sm">Failed to load backups</div>`;
  }
}

window.restoreBackup = () => {
  if (!confirm('Restore from the LATEST backup? This will overwrite all current data.')) return;
  runScript('db-restore', 'Database Restore');
  setTimeout(loadBackups, 3000);
};
