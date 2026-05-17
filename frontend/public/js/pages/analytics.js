import { renderSidebar, initSidebar } from '../components/sidebar.js';
import { api } from '../services/api.js';
import { showToast } from '../utils/toast.js';
import { animateCounter } from '../utils/helpers.js';

let _charts = [];

export function renderAnalytics(app) {
  app.innerHTML = `
    ${renderSidebar('/analytics')}
    <div class="main-content">
      <header class="sticky top-0 z-40 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button onclick="toggleSidebar()" class="mobile-menu-btn btn btn-ghost p-2 mr-1">
            <i class="fa-solid fa-bars"></i>
          </button>
          <div>
            <h1 class="text-lg font-bold">Analytics &amp; Reports</h1>
            <p class="text-xs text-slate-500">Real-time insights and emergency response metrics</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button onclick="refreshAnalytics()" class="btn btn-ghost text-sm">
            <i class="fa-solid fa-rotate"></i> Refresh
          </button>
          <button onclick="exportReport('xml')" class="btn btn-ghost text-sm">
            <i class="fa-solid fa-file-code"></i> Export XML
          </button>
          <button onclick="exportReport('html')" class="btn btn-primary text-sm">
            <i class="fa-solid fa-file-export"></i> Export Report
          </button>
        </div>
      </header>

      <main class="p-6 space-y-6">
        <!-- KPI cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-cards">
          ${[0,1,2,3].map(() => `<div class="stat-card"><div class="skeleton h-8 w-16 mb-2"></div><div class="skeleton h-4 w-24"></div></div>`).join('')}
        </div>

        <!-- Secondary KPIs -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-cards-2">
          ${[0,1,2,3].map(() => `<div class="stat-card"><div class="skeleton h-8 w-16 mb-2"></div><div class="skeleton h-4 w-24"></div></div>`).join('')}
        </div>

        <!-- Charts row 1 -->
        <div class="grid lg:grid-cols-2 gap-6">
          <div class="glass rounded-2xl border border-white/8 p-5">
            <h2 class="font-bold mb-4">📊 Alerts by Type</h2>
            <div class="chart-container" style="height:250px">
              <canvas id="type-chart"></canvas>
            </div>
          </div>
          <div class="glass rounded-2xl border border-white/8 p-5">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-bold">📈 Alert Volume</h2>
              <div class="flex gap-1">
                <button onclick="switchVolume('7d')" id="vol-7d" class="btn btn-primary text-xs py-1 px-2">7 Days</button>
                <button onclick="switchVolume('30d')" id="vol-30d" class="btn btn-ghost text-xs py-1 px-2">30 Days</button>
              </div>
            </div>
            <div class="chart-container" style="height:250px">
              <canvas id="volume-chart"></canvas>
            </div>
          </div>
        </div>

        <!-- Charts row 2 -->
        <div class="grid lg:grid-cols-3 gap-6">
          <div class="glass rounded-2xl border border-white/8 p-5">
            <h2 class="font-bold mb-4">🎯 Severity Breakdown</h2>
            <div class="chart-container" style="height:220px">
              <canvas id="severity-chart"></canvas>
            </div>
          </div>
          <div class="glass rounded-2xl border border-white/8 p-5">
            <h2 class="font-bold mb-4">🙋 Student Response Status</h2>
            <div class="chart-container" style="height:220px">
              <canvas id="response-chart"></canvas>
            </div>
          </div>
          <div class="glass rounded-2xl border border-white/8 p-5">
            <h2 class="font-bold mb-4">⚡ Resolution Time</h2>
            <div id="resolution-stats" class="space-y-4 pt-2">
              <div class="skeleton h-6 w-full rounded"></div>
              <div class="skeleton h-6 w-full rounded"></div>
              <div class="skeleton h-6 w-full rounded"></div>
            </div>
          </div>
        </div>

        <!-- Top Alerts by Response -->
        <div class="glass rounded-2xl border border-white/8 p-5">
          <h2 class="font-bold mb-4">🏆 Most Responded Alerts</h2>
          <div id="top-alerts-list" class="space-y-2">
            <div class="skeleton h-10 w-full rounded-xl"></div>
            <div class="skeleton h-10 w-full rounded-xl"></div>
            <div class="skeleton h-10 w-full rounded-xl"></div>
          </div>
        </div>
      </main>
    </div>
  `;

  initSidebar();
  loadAnalytics();

  window.refreshAnalytics = loadAnalytics;
  window.exportReport = exportReport;
  window.switchVolume = switchVolume;
}

let _analyticsData = null;
let _volumeMode = '7d';
let _volumeChart = null;

async function loadAnalytics() {
  try {
    const res = await api.get('/analytics');
    _analyticsData = res.data;
    renderKPIs(_analyticsData);
    renderCharts(_analyticsData);
    renderResolutionStats(_analyticsData);
    renderTopAlerts(_analyticsData.topAlerts);
  } catch (err) {
    showToast('Failed to load analytics', 'error');
  }
}

function renderKPIs(d) {
  // Primary KPIs
  const kpi1 = [
    { label: 'Total Alerts', value: d.totalAlerts, icon: '📋', color: '#6366f1' },
    { label: 'Active Now', value: d.activeAlerts, icon: '🔴', color: '#ef4444' },
    { label: 'Resolved', value: d.resolvedAlerts, icon: '✅', color: '#10b981' },
    { label: 'Critical Active', value: d.criticalAlerts, icon: '🚨', color: '#f97316' },
  ];
  document.getElementById('kpi-cards').innerHTML = kpi1.map((k, i) => `
    <div class="stat-card card-hover" style="--accent-color:${k.color}">
      <div class="flex items-start justify-between mb-3">
        <span class="text-3xl">${k.icon}</span>
        <div class="w-2 h-2 rounded-full animate-pulse" style="background:${k.color}"></div>
      </div>
      <div class="text-3xl font-black mb-1" style="color:${k.color}" id="kpi1-${i}">0</div>
      <div class="text-sm text-slate-400">${k.label}</div>
    </div>
  `).join('');
  kpi1.forEach((k, i) => animateCounter(document.getElementById(`kpi1-${i}`), k.value));

  // Secondary KPIs
  const responseRateColor = d.responseRate >= 75 ? '#10b981' : d.responseRate >= 40 ? '#f59e0b' : '#ef4444';
  const kpi2 = [
    { label: 'Total Students', value: d.totalStudents, icon: '👥', color: '#06b6d4' },
    { label: 'Response Rate', value: `${d.responseRate}%`, icon: '📣', color: responseRateColor, raw: true },
    { label: 'Need Help Reports', value: d.helpReports, icon: '🆘', color: '#ef4444' },
    { label: 'Active This Week', value: d.activeUsers, icon: '🟢', color: '#10b981' },
  ];
  document.getElementById('kpi-cards-2').innerHTML = kpi2.map((k, i) => `
    <div class="stat-card card-hover" style="--accent-color:${k.color}">
      <div class="flex items-start justify-between mb-3">
        <span class="text-3xl">${k.icon}</span>
      </div>
      <div class="text-3xl font-black mb-1" style="color:${k.color}" id="kpi2-${i}">${k.raw ? k.value : '0'}</div>
      <div class="text-sm text-slate-400">${k.label}</div>
    </div>
  `).join('');
  kpi2.forEach((k, i) => { if (!k.raw) animateCounter(document.getElementById(`kpi2-${i}`), k.value); });
}

function renderCharts(d) {
  // Destroy old charts
  _charts.forEach(c => c.destroy());
  _charts = [];

  const gridColor = 'rgba(255,255,255,0.05)';
  const tickColor = '#64748b';
  const legendColor = '#94a3b8';

  // Alerts by type
  const ctx1 = document.getElementById('type-chart');
  if (ctx1 && d.alertsByType.length) {
    const typeColors = { emergency: '#ef4444', warning: '#f97316', weather: '#f59e0b', security: '#8b5cf6', announcement: '#06b6d4', drill: '#10b981', info: '#6366f1' };
    const labels = d.alertsByType.map(t => t._id);
    const counts = d.alertsByType.map(t => t.count);
    _charts.push(new Chart(ctx1, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Alerts', data: counts, backgroundColor: labels.map(l => typeColors[l] || '#6366f1'), borderRadius: 6 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: tickColor } },
          y: { grid: { color: gridColor }, ticks: { color: tickColor, stepSize: 1 } },
        },
      },
    }));
  } else if (ctx1) {
    ctx1.parentElement.innerHTML = `<div class="flex items-center justify-center h-full text-slate-500 text-sm">No alert data yet</div>`;
  }

  // Volume chart (7d default)
  _renderVolumeChart(d, _volumeMode);

  // Severity breakdown
  const ctx3 = document.getElementById('severity-chart');
  if (ctx3 && d.alertsBySeverity.length) {
    const sevColors = { critical: 'rgba(239,68,68,0.8)', high: 'rgba(245,158,11,0.8)', medium: 'rgba(59,130,246,0.8)', low: 'rgba(16,185,129,0.8)' };
    const sevLabels = d.alertsBySeverity.map(s => s._id);
    _charts.push(new Chart(ctx3, {
      type: 'doughnut',
      data: {
        labels: sevLabels,
        datasets: [{ data: d.alertsBySeverity.map(s => s.count), backgroundColor: sevLabels.map(l => sevColors[l] || '#6366f1'), borderWidth: 0 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: legendColor, font: { size: 11 }, padding: 10 } } },
        cutout: '60%',
      },
    }));
  } else if (ctx3) {
    ctx3.parentElement.innerHTML = `<div class="flex items-center justify-center h-full text-slate-500 text-sm">No severity data yet</div>`;
  }

  // Student response status
  const ctx4 = document.getElementById('response-chart');
  if (ctx4 && d.totalReports > 0) {
    _charts.push(new Chart(ctx4, {
      type: 'doughnut',
      data: {
        labels: ['Safe', 'Need Help', 'Damage Report'],
        datasets: [{ data: [d.safeReports, d.helpReports, d.damageReports], backgroundColor: ['rgba(16,185,129,0.8)', 'rgba(239,68,68,0.8)', 'rgba(245,158,11,0.8)'], borderWidth: 0 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: legendColor, font: { size: 11 }, padding: 10 } } },
        cutout: '60%',
      },
    }));
  } else if (ctx4) {
    ctx4.parentElement.innerHTML = `<div class="flex items-center justify-center h-full text-slate-500 text-sm">No student responses yet</div>`;
  }
}

function _renderVolumeChart(d, mode) {
  if (_volumeChart) { _volumeChart.destroy(); _charts = _charts.filter(c => c !== _volumeChart); }
  const ctx2 = document.getElementById('volume-chart');
  if (!ctx2) return;

  const volumeData = mode === '7d' ? d.volume7d : d.volume30d;
  const labels = volumeData.map(v => {
    const dt = new Date(v.date);
    return mode === '7d'
      ? dt.toLocaleDateString('en', { weekday: 'short' })
      : dt.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  });
  const counts = volumeData.map(v => v.count);
  const hasData = counts.some(c => c > 0);

  _volumeChart = new Chart(ctx2, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Alerts',
        data: counts,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.15)',
        tension: 0.4, fill: true,
        pointRadius: hasData ? 4 : 0,
        pointBackgroundColor: '#6366f1',
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', maxTicksLimit: mode === '30d' ? 10 : 7 } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', stepSize: 1 }, min: 0 },
      },
    },
  });
  _charts.push(_volumeChart);
}

window.switchVolume = (mode) => {
  _volumeMode = mode;
  document.getElementById('vol-7d').className = `btn text-xs py-1 px-2 ${mode === '7d' ? 'btn-primary' : 'btn-ghost'}`;
  document.getElementById('vol-30d').className = `btn text-xs py-1 px-2 ${mode === '30d' ? 'btn-primary' : 'btn-ghost'}`;
  if (_analyticsData) _renderVolumeChart(_analyticsData, mode);
};

function renderResolutionStats(d) {
  const el = document.getElementById('resolution-stats');
  if (!el) return;

  if (d.avgResolutionMins === null) {
    el.innerHTML = `<div class="text-center py-6 text-slate-500 text-sm">No resolved alerts yet.<br/>Resolution time will appear here once alerts are resolved.</div>`;
    return;
  }

  const fmt = (mins) => {
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  el.innerHTML = [
    { label: 'Average', value: fmt(d.avgResolutionMins), color: '#6366f1', icon: '⚡' },
    { label: 'Fastest', value: fmt(d.minResolutionMins), color: '#10b981', icon: '🏃' },
    { label: 'Slowest', value: fmt(d.maxResolutionMins), color: '#ef4444', icon: '🐢' },
  ].map(s => `
    <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/8">
      <div class="flex items-center gap-2">
        <span>${s.icon}</span>
        <span class="text-sm text-slate-400">${s.label} Resolution</span>
      </div>
      <span class="font-bold text-sm" style="color:${s.color}">${s.value}</span>
    </div>
  `).join('');
}

function renderTopAlerts(topAlerts) {
  const el = document.getElementById('top-alerts-list');
  if (!el) return;

  if (!topAlerts.length) {
    el.innerHTML = `<div class="text-center py-6 text-slate-500 text-sm">No student responses recorded yet.</div>`;
    return;
  }

  const sevColor = { critical: 'text-red-400', high: 'text-yellow-400', medium: 'text-blue-400', low: 'text-emerald-400' };
  el.innerHTML = topAlerts.map((a, i) => `
    <div class="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/8">
      <div class="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 flex-shrink-0">${i + 1}</div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium truncate">${a.title}</div>
        <div class="text-xs text-slate-500 mt-0.5 capitalize">${a.type} · <span class="${sevColor[a.severity] || 'text-slate-400'}">${a.severity}</span></div>
      </div>
      <div class="text-right flex-shrink-0">
        <div class="text-sm font-bold text-indigo-400">${a.responseCount} responses</div>
        ${a.helpCount > 0 ? `<div class="text-xs text-red-400">${a.helpCount} needed help</div>` : `<div class="text-xs text-emerald-400">No help needed</div>`}
      </div>
    </div>
  `).join('');
}

async function exportReport(format) {
  try {
    const token = localStorage.getItem('rs_token');
    const url = format === 'xml' ? '/api/xml/report' : '/api/xml/alerts';
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const content = await res.text();
    const blob = new Blob([content], { type: format === 'xml' ? 'application/xml' : 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ravensync_report_${Date.now()}.${format}`;
    a.click();
    showToast(`Report exported as ${format.toUpperCase()}`, 'success');
  } catch (err) {
    showToast('Export failed', 'error');
  }
}
