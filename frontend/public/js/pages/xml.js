import { renderSidebar, initSidebar } from '../components/sidebar.js';
import { api } from '../services/api.js';
import { showToast } from '../utils/toast.js';

export function renderXML(app) {
  app.innerHTML = `
    ${renderSidebar('/xml')}
    <div class="main-content">
      <header class="sticky top-0 z-40 glass border-b border-white/5 px-6 py-4">
        <div class="flex items-center gap-3">
          <button onclick="toggleSidebar()" class="mobile-menu-btn btn btn-ghost p-2">
            <i class="fa-solid fa-bars"></i>
          </button>
          <div>
            <h1 class="text-lg font-bold">XML Data Center</h1>
            <p class="text-xs text-slate-500">Parse, transform, and manage XML data</p>
          </div>
        </div>
      </header>

      <main class="p-6 space-y-6">
        <!-- Tabs -->
        <div class="flex gap-2 border-b border-white/8 pb-0">
          ${['XML Files', 'Parser', 'XSLT Transform', 'Live Preview'].map((tab, i) => `
            <button onclick="switchTab(${i})" id="tab-${i}"
              class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${i === 0 ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'}">
              ${tab}
            </button>
          `).join('')}
        </div>

        <!-- Tab 0: XML Files -->
        <div id="tab-content-0">
          <div class="grid lg:grid-cols-2 gap-6">
            <div class="glass rounded-2xl border border-white/8 p-5">
              <div class="flex items-center justify-between mb-4">
                <h2 class="font-bold">📁 XML Files</h2>
                <div class="flex gap-2">
                  <button onclick="loadXMLFiles()" class="btn btn-ghost text-xs py-1.5">
                    <i class="fa-solid fa-rotate"></i> Refresh
                  </button>
                  <button onclick="downloadAlertXML()" class="btn btn-primary text-xs py-1.5">
                    <i class="fa-solid fa-download"></i> Export Alerts
                  </button>
                </div>
              </div>
              <div id="xml-files-list" class="space-y-2">
                <div class="text-center py-8"><div class="spinner mx-auto"></div></div>
              </div>
            </div>
            <div class="glass rounded-2xl border border-white/8 p-5">
              <h2 class="font-bold mb-4">📄 File Preview</h2>
              <div id="xml-preview" class="terminal">
                <div class="terminal-header">
                  <div class="terminal-dot bg-red-500"></div>
                  <div class="terminal-dot bg-yellow-500"></div>
                  <div class="terminal-dot bg-green-500"></div>
                  <span class="text-xs text-slate-400 ml-2">XML Preview</span>
                </div>
                <div class="terminal-body text-slate-400 text-xs">
                  Select a file to preview its contents...
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 1: Parser -->
        <div id="tab-content-1" class="hidden">
          <div class="grid lg:grid-cols-2 gap-6">
            <div class="glass rounded-2xl border border-white/8 p-5">
              <h2 class="font-bold mb-4">🔍 XML Parser (DOM)</h2>
              <textarea id="xml-input" class="input h-64 resize-none font-mono text-xs mb-3" placeholder="Paste XML content here to parse..."></textarea>
              <button onclick="parseXML()" class="btn btn-primary w-full">
                <i class="fa-solid fa-code"></i> Parse XML
              </button>
            </div>
            <div class="glass rounded-2xl border border-white/8 p-5">
              <h2 class="font-bold mb-4">📊 Parse Results</h2>
              <div id="parse-results" class="bg-black/30 rounded-xl p-4 h-64 overflow-y-auto font-mono text-xs text-slate-300">
                Parse results will appear here...
              </div>
              <div id="parse-stats" class="mt-3 grid grid-cols-3 gap-2"></div>
            </div>
          </div>
        </div>

        <!-- Tab 2: XSLT Transform -->
        <div id="tab-content-2" class="hidden">
          <div class="glass rounded-2xl border border-white/8 p-5">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-bold">🔄 XSLT Transformation Engine</h2>
              <div class="flex gap-2">
                <select id="transform-format" class="input w-auto py-1.5 text-sm">
                  <option value="html">→ HTML Report</option>
                  <option value="json">→ JSON Format</option>
                </select>
                <button onclick="transformXML()" class="btn btn-primary text-sm">
                  <i class="fa-solid fa-wand-magic-sparkles"></i> Transform
                </button>
              </div>
            </div>
            <div class="grid lg:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-2">Input XML</label>
                <textarea id="xslt-input" class="input h-72 resize-none font-mono text-xs" placeholder="Paste XML to transform..."></textarea>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-2">Transformed Output</label>
                <div id="xslt-output" class="bg-black/30 rounded-xl p-3 h-72 overflow-y-auto font-mono text-xs text-slate-300 border border-white/5">
                  Transformation output will appear here...
                </div>
              </div>
            </div>
            <div class="mt-4 flex gap-3">
              <button onclick="loadSampleXML()" class="btn btn-ghost text-sm">Load Sample XML</button>
              <button onclick="downloadTransformed()" class="btn btn-ghost text-sm">
                <i class="fa-solid fa-download"></i> Download Output
              </button>
            </div>
          </div>
        </div>

        <!-- Tab 3: Live Preview -->
        <div id="tab-content-3" class="hidden">
          <div class="glass rounded-2xl border border-white/8 p-5">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-bold">🌐 Live XML Report Preview</h2>
              <button onclick="generateLiveReport()" class="btn btn-primary text-sm">
                <i class="fa-solid fa-rotate"></i> Generate Report
              </button>
            </div>
            <div id="live-report-frame" class="bg-white rounded-xl overflow-hidden" style="min-height:500px">
              <div class="flex items-center justify-center h-64 text-slate-400">
                <div class="text-center">
                  <div class="text-4xl mb-3">📊</div>
                  <p>Click "Generate Report" to create a live XSLT-transformed report</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  initSidebar();
  loadXMLFiles();
  initXMLPage();
}

function initXMLPage() {
  window.switchTab = (i) => {
    for (let j = 0; j < 4; j++) {
      document.getElementById(`tab-content-${j}`)?.classList.toggle('hidden', j !== i);
      const tab = document.getElementById(`tab-${j}`);
      if (tab) {
        tab.className = `px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${j === i ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`;
      }
    }
  };

  window.loadXMLFiles = loadXMLFiles;
  window.downloadAlertXML = downloadAlertXML;
  window.parseXML = parseXMLContent;
  window.transformXML = transformXMLContent;
  window.loadSampleXML = loadSampleXML;
  window.downloadTransformed = downloadTransformed;
  window.generateLiveReport = generateLiveReport;
  window.previewXMLFile = previewXMLFile;
}

async function loadXMLFiles() {
  try {
    const res = await api.get('/xml/files');
    const list = document.getElementById('xml-files-list');
    if (!list) return;

    if (!res.data.length) {
      list.innerHTML = `<div class="text-center py-8 text-slate-500 text-sm">No XML files found</div>`;
      return;
    }

    list.innerHTML = res.data.map(f => `
      <div class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/8"
           onclick="previewXMLFile('${f.name}')">
        <div class="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-lg">📄</div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium truncate">${f.name}</div>
          <div class="text-xs text-slate-500">${(f.size / 1024).toFixed(1)} KB · ${new Date(f.modified).toLocaleDateString()}</div>
        </div>
        <i class="fa-solid fa-chevron-right text-slate-600 text-xs"></i>
      </div>
    `).join('');
  } catch (err) {
    showToast('Failed to load XML files', 'error');
  }
}

async function previewXMLFile(filename) {
  try {
    const res = await api.get(`/xml/files/${filename}`);
    const preview = document.getElementById('xml-preview');
    if (preview) {
      const body = preview.querySelector('.terminal-body');
      if (body) {
        body.innerHTML = `<pre class="text-green-400 text-xs whitespace-pre-wrap">${escapeHtml(res.data)}</pre>`;
      }
    }
  } catch (err) {
    showToast('Failed to load file', 'error');
  }
}

async function downloadAlertXML() {
  try {
    const token = localStorage.getItem('rs_token');
    const res = await fetch('/api/xml/alerts', { headers: { Authorization: `Bearer ${token}` } });
    const xml = await res.text();
    downloadFile(xml, 'emergency_alerts.xml', 'application/xml');
    showToast('XML exported successfully', 'success');
  } catch (err) {
    showToast('Export failed', 'error');
  }
}

async function parseXMLContent() {
  const input = document.getElementById('xml-input')?.value?.trim();
  if (!input) { showToast('Please enter XML content', 'warning'); return; }

  try {
    const res = await api.post('/xml/parse', { xmlContent: input });
    const results = document.getElementById('parse-results');
    if (results) {
      results.innerHTML = `<pre class="text-green-400 text-xs whitespace-pre-wrap">${JSON.stringify(res.data, null, 2)}</pre>`;
    }

    // Stats
    const stats = document.getElementById('parse-stats');
    if (stats) {
      const nodeCount = JSON.stringify(res.data).split('{').length - 1;
      stats.innerHTML = [
        { label: 'Nodes', value: nodeCount },
        { label: 'Status', value: '✅ Valid' },
        { label: 'Format', value: 'XML 1.0' },
      ].map(s => `
        <div class="bg-white/5 rounded-lg p-2 text-center">
          <div class="text-sm font-bold text-indigo-400">${s.value}</div>
          <div class="text-xs text-slate-500">${s.label}</div>
        </div>
      `).join('');
    }
    showToast('XML parsed successfully', 'success');
  } catch (err) {
    showToast('XML parse error: ' + err.message, 'error');
  }
}

async function transformXMLContent() {
  const input = document.getElementById('xslt-input')?.value?.trim();
  const format = document.getElementById('transform-format')?.value;
  if (!input) { showToast('Please enter XML content', 'warning'); return; }

  try {
    const res = await api.post('/xml/transform', { xmlContent: input, format });
    const output = document.getElementById('xslt-output');
    if (output) {
      output.innerHTML = `<pre class="text-green-400 text-xs whitespace-pre-wrap">${escapeHtml(res.data)}</pre>`;
    }
    showToast(`Transformed to ${format.toUpperCase()} successfully`, 'success');
  } catch (err) {
    showToast('Transform failed: ' + err.message, 'error');
  }
}

function loadSampleXML() {
  const sample = `<?xml version="1.0" encoding="UTF-8"?>
<RavenSyncAlerts version="1.0">
  <Summary>
    <TotalAlerts>3</TotalAlerts>
    <GeneratedAt>${new Date().toISOString()}</GeneratedAt>
  </Summary>
  <Alerts>
    <Alert id="ALT-001" severity="critical">
      <Title>Typhoon Warning</Title>
      <Type>emergency</Type>
      <Status>active</Status>
      <Message>Immediate evacuation required</Message>
    </Alert>
  </Alerts>
</RavenSyncAlerts>`;
  const input = document.getElementById('xslt-input');
  if (input) input.value = sample;
  showToast('Sample XML loaded', 'info');
}

function downloadTransformed() {
  const output = document.getElementById('xslt-output')?.textContent;
  if (!output || output.includes('Transformation output')) {
    showToast('No transformed content to download', 'warning');
    return;
  }
  downloadFile(output, 'transformed_output.html', 'text/html');
  showToast('Downloaded successfully', 'success');
}

async function generateLiveReport() {
  try {
    const token = localStorage.getItem('rs_token');
    const res = await fetch('/api/xml/alerts', { headers: { Authorization: `Bearer ${token}` } });
    const xml = await res.text();

    const transformRes = await api.post('/xml/transform', { xmlContent: xml, format: 'html' });
    const frame = document.getElementById('live-report-frame');
    if (frame) {
      frame.innerHTML = `
        <div style="background:#0f0f1a; color:#e2e8f0; padding:2rem; font-family:Inter,sans-serif; min-height:500px">
          <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:1.5rem;border-radius:12px;margin-bottom:1.5rem">
            <h1 style="font-size:1.5rem;font-weight:700;color:white">🦅 RavenSync Emergency Report</h1>
            <p style="color:rgba(255,255,255,0.7);margin-top:0.25rem;font-size:0.875rem">Generated: ${new Date().toLocaleString()}</p>
          </div>
          <div style="font-size:0.875rem;color:#94a3b8">${transformRes.data}</div>
        </div>
      `;
    }
    showToast('Live report generated', 'success');
  } catch (err) {
    showToast('Failed to generate report', 'error');
  }
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
