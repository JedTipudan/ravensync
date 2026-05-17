import { animateCounter } from '../utils/helpers.js';
import { initTheme, getTheme, toggleTheme } from '../services/theme.js';

export function renderLanding(app) {
  const isDark = getTheme() === 'dark';

  app.innerHTML = `
    <div class="min-h-screen" style="background: var(--bg-primary); color: var(--text-primary);">

      <!-- Navbar -->
      <nav class="fixed top-0 left-0 right-0 z-50 border-b" style="background: var(--glass-bg); backdrop-filter: blur(20px); border-color: var(--border);">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <img src="/images/logo.png" alt="RavenSync" class="w-8 h-8 object-contain" onerror="this.outerHTML='🦅'"/>
              </div>
              <span class="font-bold text-lg gradient-text">RavenSync</span>
            </div>
            <div class="hidden md:flex items-center gap-6 text-sm" style="color: var(--text-secondary);">
              <a href="#features" class="hover:text-indigo-500 transition-colors">Features</a>
              <a href="#why" class="hover:text-indigo-500 transition-colors">Why RavenSync</a>
              <a href="#stats" class="hover:text-indigo-500 transition-colors">Impact</a>
              <a href="#team" class="hover:text-indigo-500 transition-colors">Team</a>
              <a href="#faq" class="hover:text-indigo-500 transition-colors">FAQ</a>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="landingToggleTheme()" id="landing-theme-btn"
                class="btn btn-ghost text-sm px-3 py-2" title="Toggle theme">
                <i class="fa-solid ${isDark ? 'fa-sun text-yellow-400' : 'fa-moon text-indigo-500'}"></i>
              </button>
              <button onclick="navigate('/login')" class="btn btn-ghost text-sm">Sign In</button>
              <button onclick="navigate('/register')" class="btn btn-primary text-sm">Get Started</button>
            </div>
          </div>
        </div>
      </nav>

      <!-- Hero -->
      <section class="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden animated-bg">
        <div id="particles-container" class="absolute inset-0 pointer-events-none overflow-hidden"></div>
        <div class="relative z-10 text-center max-w-5xl mx-auto px-4">

          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm mb-8"
               style="background: var(--nav-active-bg); border-color: rgba(99,102,241,0.3); color: var(--nav-active-color);">
            <div class="live-indicator">
              <div class="live-bar"></div><div class="live-bar"></div><div class="live-bar"></div>
              <div class="live-bar"></div><div class="live-bar"></div>
            </div>
            <span>Live Emergency Communication System</span>
          </div>

          <h1 class="text-5xl sm:text-7xl font-black mb-6 leading-tight">
            <span class="gradient-text">RavenSync</span><br/>
            <span class="text-4xl sm:text-5xl font-bold" style="color: var(--text-primary);">School Emergency</span><br/>
            <span class="text-3xl sm:text-4xl font-semibold" style="color: var(--text-secondary);">Communication Platform</span>
          </h1>

          <p class="text-lg sm:text-xl max-w-3xl mx-auto mb-10 leading-relaxed" style="color: var(--text-secondary);">
            Real-time emergency alerts for schools — instructors broadcast alerts instantly, students respond with their safety status, and admins see who needs help in real time.
          </p>

          <div class="flex flex-wrap items-center justify-center gap-4 mb-16">
            <button onclick="navigate('/register')" class="btn btn-primary text-base px-8 py-3">
              <i class="fa-solid fa-rocket"></i> Get Started Free
            </button>
            <button onclick="navigate('/login')" class="btn btn-ghost text-base px-8 py-3">
              <i class="fa-solid fa-gauge-high"></i> View Live Dashboard
            </button>
            <a href="#features" class="btn btn-ghost text-base px-8 py-3">
              <i class="fa-solid fa-play"></i> Learn More
            </a>
          </div>

          <!-- Hero preview card -->
          <div class="rounded-2xl border p-4 max-w-4xl mx-auto shadow-2xl"
               style="background: var(--card-bg); border-color: var(--border);">
            <div class="flex items-center gap-2 mb-3 px-2">
              <div class="w-3 h-3 rounded-full bg-red-500"></div>
              <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div class="w-3 h-3 rounded-full bg-green-500"></div>
              <span class="text-xs ml-2" style="color: var(--text-secondary);">RavenSync Dashboard — Live</span>
              <div class="ml-auto flex items-center gap-1.5">
                <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span class="text-xs text-emerald-600 font-medium">3 Active Alerts</span>
              </div>
            </div>
            <div class="grid grid-cols-4 gap-3 mb-3">
              ${['🚨 Critical Alert', '📢 Broadcast', '👥 2,847 Users', '📡 12 Channels'].map(item => `
                <div class="rounded-xl p-3 text-center" style="background: var(--input-bg);">
                  <div class="text-sm font-semibold" style="color: var(--text-primary);">${item}</div>
                </div>
              `).join('')}
            </div>
            <div class="space-y-2">
              ${[
                { color: 'red', title: 'Typhoon Warning — Immediate Evacuation', time: '2m ago', sev: 'CRITICAL' },
                { color: 'yellow', title: 'Campus Lockdown — Building C', time: '15m ago', sev: 'HIGH' },
                { color: 'blue', title: 'Water Interruption — Zone B', time: '1h ago', sev: 'MEDIUM' },
              ].map(a => `
                <div class="flex items-center gap-3 rounded-lg px-3 py-2" style="background: var(--input-bg);">
                  <div class="w-2 h-2 rounded-full bg-${a.color}-500 animate-pulse flex-shrink-0"></div>
                  <span class="text-sm flex-1" style="color: var(--text-primary);">${a.title}</span>
                  <span class="text-xs" style="color: var(--text-secondary);">${a.time}</span>
                  <span class="badge badge-${a.sev.toLowerCase()}">${a.sev}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </section>

      <!-- Stats -->
      <section id="stats" class="py-20 border-y" style="border-color: var(--border);">
        <div class="max-w-7xl mx-auto px-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            ${[
              { value: 50000, label: 'Users Protected', suffix: '+', icon: '👥' },
              { value: 99.9, label: 'Uptime SLA', suffix: '%', icon: '⚡', decimal: true },
              { value: 2500, label: 'Alerts Sent', suffix: '+', icon: '🚨' },
              { value: 150, label: 'Organizations', suffix: '+', icon: '🏢' },
            ].map((stat, i) => `
              <div class="stat-counter" data-target="${stat.value}" data-decimal="${stat.decimal || false}">
                <div class="text-4xl mb-2">${stat.icon}</div>
                <div class="text-4xl font-black gradient-text counter" id="counter-${i}">0</div>
                <div class="mt-1" style="color: var(--text-secondary);">${stat.label}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- Features -->
      <section id="features" class="py-24 max-w-7xl mx-auto px-4">
        <div class="text-center mb-16">
          <div class="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4"
               style="background: var(--nav-active-bg); color: var(--nav-active-color); border: 1px solid rgba(99,102,241,0.2);">
            Platform Features
          </div>
          <h2 class="text-4xl font-bold mb-4" style="color: var(--text-primary);">
            Everything You Need for <span class="gradient-text">Emergency Response</span>
          </h2>
          <p class="max-w-2xl mx-auto" style="color: var(--text-secondary);">
            A complete ecosystem for real-time communication, automated alerts, and disaster management.
          </p>
        </div>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${[
            { icon: '🚨', title: 'Real-Time Emergency Alerts', desc: 'Broadcast critical alerts instantly to thousands of users with priority queuing and guaranteed delivery via Kafka message broker.' },
            { icon: '📡', title: 'WebSocket Live Updates', desc: 'Persistent WebSocket connections ensure zero-latency updates. Every alert, message, and status change appears instantly.' },
            { icon: '📄', title: 'XML Data Processing', desc: 'Structured XML data management with DOM/SAX parsing, XSLT transformations, and automated report generation.' },
            { icon: '🤖', title: 'Automation Center', desc: 'PowerShell scripts for XML backups, log cleanup, health checks, DB backup & restore — all executable from the web UI.' },
            { icon: '📊', title: 'Advanced Analytics', desc: 'Interactive dashboards with real-time charts, alert trends, and exportable XML/HTML reports.' },
            { icon: '🔐', title: 'Enterprise Security', desc: 'JWT authentication, bcrypt hashing (12 rounds), rate limiting, input sanitization, RBAC, and full audit trails.' },
            { icon: '💬', title: 'Communication Channels', desc: 'Create public, private, and emergency broadcast channels for organizations, departments, and communities.' },
            { icon: '📱', title: 'PWA & Offline Support', desc: 'Progressive Web App with offline caching, installable on any device, and sync when connectivity is restored.' },
            { icon: '🌗', title: 'Light & Dark Mode', desc: 'Light mode is the clean default. Dark mode is high-contrast — readable even in a completely dark environment.' },
          ].map(f => `
            <div class="rounded-2xl border p-6 card-hover transition-all"
                 style="background: var(--card-bg); border-color: var(--border);">
              <div class="text-4xl mb-4">${f.icon}</div>
              <h3 class="text-lg font-bold mb-2" style="color: var(--text-primary);">${f.title}</h3>
              <p class="text-sm leading-relaxed" style="color: var(--text-secondary);">${f.desc}</p>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Why RavenSync -->
      <section id="why" class="py-24" style="background: var(--bg-secondary);">
        <div class="max-w-7xl mx-auto px-4">
          <div class="text-center mb-16">
            <h2 class="text-4xl font-bold mb-4" style="color: var(--text-primary);">
              Why <span class="gradient-text">RavenSync Matters</span>
            </h2>
            <p class="max-w-2xl mx-auto" style="color: var(--text-secondary);">
              In emergencies, every second counts. Traditional communication systems fail when they're needed most.
            </p>
          </div>
          <div class="grid md:grid-cols-2 gap-12 items-center">
            <div class="space-y-6">
              ${[
                { icon: '⚡', title: 'Sub-second Alert Delivery', desc: 'WebSocket + Kafka ensures alerts reach all subscribers in under 500ms, even under heavy load.' },
                { icon: '🌐', title: 'Works Offline', desc: 'Service workers cache critical data. Users receive alerts even with intermittent connectivity.' },
                { icon: '📋', title: 'Structured Data with XML', desc: 'All emergency data is stored as structured XML, enabling automated processing, XSLT reports, and data portability.' },
                { icon: '🔄', title: 'Automated Operations', desc: 'Cron jobs and PowerShell scripts automate backups, cleanup, and monitoring — reducing manual overhead.' },
                { icon: '💾', title: 'Real Database Backup & Restore', desc: 'One-click MongoDB backup exports all collections to a zip archive. Restore from any backup instantly via the Automation Center.' },
              ].map(item => `
                <div class="flex gap-4">
                  <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                       style="background: var(--nav-active-bg); border: 1px solid rgba(99,102,241,0.2);">${item.icon}</div>
                  <div>
                    <h3 class="font-semibold mb-1" style="color: var(--text-primary);">${item.title}</h3>
                    <p class="text-sm" style="color: var(--text-secondary);">${item.desc}</p>
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="rounded-2xl p-6 border" style="background: var(--card-bg); border-color: var(--border);">
              <div class="text-sm font-semibold mb-4 flex items-center gap-2" style="color: var(--text-secondary);">
                <div class="live-indicator">
                  <div class="live-bar"></div><div class="live-bar"></div><div class="live-bar"></div>
                  <div class="live-bar"></div><div class="live-bar"></div>
                </div>
                Live System Activity
              </div>
              <div id="live-feed" class="space-y-2 max-h-64 overflow-hidden">
                ${generateLiveFeed()}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Testimonials -->
      <section class="py-24 max-w-7xl mx-auto px-4">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold mb-4" style="color: var(--text-primary);">
            Trusted by <span class="gradient-text">Communities</span>
          </h2>
        </div>
        <div class="grid md:grid-cols-3 gap-6">
          ${[
            { name: 'Barangay Captain Maria Santos', org: 'Barangay 15, Quezon City', quote: 'RavenSync transformed how we communicate during typhoons. We can now reach all 5,000 residents instantly.', avatar: 'MS' },
            { name: 'Dr. Jose Reyes', org: 'University of Manila', quote: 'The campus lockdown feature saved lives during a security incident. Real-time alerts reached all 12,000 students in seconds.', avatar: 'JR' },
            { name: 'Engr. Ana Cruz', org: 'Metro DRRM Office', quote: 'The XML reporting and XSLT transformation features make our disaster documentation process 10x faster.', avatar: 'AC' },
          ].map(t => `
            <div class="rounded-2xl p-6 border card-hover" style="background: var(--card-bg); border-color: var(--border);">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white">${t.avatar}</div>
                <div>
                  <div class="font-semibold text-sm" style="color: var(--text-primary);">${t.name}</div>
                  <div class="text-xs" style="color: var(--text-secondary);">${t.org}</div>
                </div>
              </div>
              <p class="text-sm leading-relaxed italic" style="color: var(--text-secondary);">"${t.quote}"</p>
              <div class="flex gap-1 mt-3 text-yellow-500 text-xs">★★★★★</div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Team -->
      <section id="team" class="py-24" style="background: var(--bg-secondary);">
        <div class="max-w-7xl mx-auto px-4">
          <div class="text-center mb-16">
            <h2 class="text-4xl font-bold mb-4" style="color: var(--text-primary);">
              Meet the <span class="gradient-text">Team</span>
            </h2>
            <p style="color: var(--text-secondary);">The engineers behind RavenSync's emergency communication platform.</p>
          </div>
          <div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            ${[
              { name: 'Backend Developer', role: 'APIs · Auth · Database · Messaging', icon: '⚙️', color: 'from-indigo-500 to-blue-600' },
              { name: 'Frontend Developer', role: 'UI/UX · Dashboard · Animations', icon: '🎨', color: 'from-purple-500 to-pink-600' },
              { name: 'XML/XSLT Specialist', role: 'XML Modeling · Parsing · XSLT', icon: '📄', color: 'from-cyan-500 to-teal-600' },
              { name: 'Scripting & DevOps', role: 'Automation · Monitoring · Deploy', icon: '🤖', color: 'from-orange-500 to-red-600' },
              { name: 'QA & Documentation', role: 'Testing · Reports · Presentation', icon: '📋', color: 'from-green-500 to-emerald-600' },
            ].map(m => `
              <div class="rounded-2xl p-6 text-center border card-hover" style="background: var(--card-bg); border-color: var(--border);">
                <div class="w-16 h-16 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">${m.icon}</div>
                <div class="font-bold text-sm mb-1" style="color: var(--text-primary);">${m.name}</div>
                <div class="text-xs" style="color: var(--text-secondary);">${m.role}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section id="faq" class="py-24 max-w-4xl mx-auto px-4">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold mb-4" style="color: var(--text-primary);">
            Frequently Asked <span class="gradient-text">Questions</span>
          </h2>
        </div>
        <div class="space-y-4" id="faq-list">
          ${[
            { q: 'What messaging system does RavenSync use?', a: 'RavenSync uses Kafka as its message broker with dedicated topics for emergency alerts, notifications, and broadcasts. It falls back to an offline queue when Kafka is unavailable, ensuring reliable delivery.' },
            { q: 'How does the XML system work?', a: 'All emergency data is stored as structured XML. The platform supports DOM parsing (xml2js) and SAX event-driven parsing, XSLT transformations to HTML/JSON, and automated XML report generation with real DB data.' },
            { q: 'Can it work offline?', a: 'Yes. RavenSync is a Progressive Web App (PWA) with service workers that cache critical data locally. Users can view recent alerts and announcements even without internet connectivity.' },
            { q: 'What automation scripts are included?', a: 'The Automation Center includes 9 PowerShell scripts: XML backup, XML transform, log cleanup, health check, queue consumer, report generator, database backup, database restore, and notification processor — all runnable from the web UI.' },
            { q: 'How does database backup and restore work?', a: 'The db-backup.ps1 script exports all MongoDB collections (users, alerts, channels, messages, etc.) to a timestamped ZIP archive. The db-restore.ps1 script restores from any backup with a single click from the Automation Center.' },
            { q: 'Is it secure?', a: 'RavenSync implements JWT authentication, bcrypt password hashing (12 rounds), rate limiting (100 req/15min), MongoDB injection sanitization, Helmet security headers, role-based access control (superadmin/admin/user), and comprehensive audit logging.' },
            { q: 'What organizations can use RavenSync?', a: 'RavenSync is designed for schools, universities, barangays, government offices, hospitals, corporate offices, and any local community that needs reliable emergency communication.' },
          ].map((item, i) => `
            <div class="rounded-xl border overflow-hidden" style="background: var(--card-bg); border-color: var(--border);">
              <button class="w-full text-left px-6 py-4 flex items-center justify-between font-medium transition-colors"
                      style="color: var(--text-primary);"
                      onmouseover="this.style.background='var(--nav-hover)'" onmouseout="this.style.background=''"
                      onclick="toggleFAQ(${i})">
                <span>${item.q}</span>
                <i class="fa-solid fa-chevron-down transition-transform" style="color: var(--text-secondary);" id="faq-icon-${i}"></i>
              </button>
              <div id="faq-answer-${i}" class="hidden px-6 pb-4 text-sm leading-relaxed" style="color: var(--text-secondary);">${item.a}</div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- CTA -->
      <section class="py-24">
        <div class="max-w-4xl mx-auto px-4 text-center">
          <div class="rounded-3xl border p-12 relative overflow-hidden"
               style="background: var(--card-bg); border-color: rgba(99,102,241,0.3);">
            <div class="absolute inset-0 pointer-events-none" style="background: linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05));"></div>
            <div class="relative z-10">
              <div class="text-5xl mb-6">🦅</div>
              <h2 class="text-4xl font-bold mb-4" style="color: var(--text-primary);">
                Ready to <span class="gradient-text">Protect Your Community?</span>
              </h2>
              <p class="mb-8 max-w-xl mx-auto" style="color: var(--text-secondary);">
                Join thousands of organizations using RavenSync for real-time emergency communication and disaster response.
              </p>
              <div class="flex flex-wrap gap-4 justify-center">
                <button onclick="navigate('/register')" class="btn btn-primary text-base px-10 py-3">
                  <i class="fa-solid fa-rocket"></i> Start for Free
                </button>
                <button onclick="navigate('/login')" class="btn btn-ghost text-base px-10 py-3">
                  <i class="fa-solid fa-sign-in-alt"></i> Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="border-t py-12" style="border-color: var(--border);">
        <div class="max-w-7xl mx-auto px-4">
          <div class="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div class="flex items-center gap-2 mb-4">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm">🦅</div>
                <span class="font-bold gradient-text">RavenSync</span>
              </div>
              <p class="text-sm" style="color: var(--text-secondary);">Real-time emergency communication platform for modern communities.</p>
            </div>
            ${[
              { title: 'Platform', links: ['Dashboard', 'Emergency Alerts', 'Channels', 'Analytics'] },
              { title: 'Technology', links: ['XML Processing', 'XSLT Reports', 'Message Queue', 'Automation'] },
              { title: 'Resources', links: ['Documentation', 'API Reference', 'Security', 'Status'] },
            ].map(col => `
              <div>
                <h4 class="font-semibold text-sm mb-3" style="color: var(--text-primary);">${col.title}</h4>
                <ul class="space-y-2">
                  ${col.links.map(l => `<li><a href="#" class="text-sm transition-colors hover:text-indigo-500" style="color: var(--text-secondary);">${l}</a></li>`).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
          <div class="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style="border-color: var(--border);">
            <p class="text-sm" style="color: var(--text-secondary);">© 2025 RavenSync. Enterprise Emergency Communication Platform.</p>
            <div class="flex items-center gap-2 text-xs" style="color: var(--text-secondary);">
              <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              All systems operational
            </div>
          </div>
        </div>
      </footer>

    </div>
  `;

  initLanding();
}

function generateLiveFeed() {
  return [
    { icon: '🚨', text: 'Emergency alert broadcast to 1,247 users', time: '2s ago' },
    { icon: '✅', text: 'Alert ALT-003 resolved by Admin', time: '45s ago' },
    { icon: '📡', text: 'New channel: Typhoon Response Team', time: '2m ago' },
    { icon: '💾', text: 'Database backup completed (2.6KB)', time: '5m ago' },
    { icon: '👤', text: '3 new users joined the platform', time: '8m ago' },
    { icon: '📊', text: 'Analytics report generated', time: '12m ago' },
  ].map(e => `
    <div class="flex items-center gap-3 text-sm py-1.5 border-b" style="border-color: var(--border);">
      <span>${e.icon}</span>
      <span class="flex-1 text-xs" style="color: var(--text-secondary);">${e.text}</span>
      <span class="text-xs whitespace-nowrap" style="color: var(--text-secondary); opacity: 0.6;">${e.time}</span>
    </div>
  `).join('');
}

function initLanding() {
  // Theme toggle on landing page
  window.landingToggleTheme = () => {
    const next = toggleTheme();
    const btn = document.getElementById('landing-theme-btn');
    if (btn) {
      btn.innerHTML = `<i class="fa-solid ${next === 'dark' ? 'fa-sun text-yellow-400' : 'fa-moon text-indigo-500'}"></i>`;
    }
    // Re-render landing to apply new theme vars
    import('./landing.js').then(m => m.renderLanding(document.getElementById('app')));
  };

  // Particles
  const container = document.getElementById('particles-container');
  if (container) {
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 4 + 2;
      p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;background:${['#6366f1','#8b5cf6','#06b6d4'][Math.floor(Math.random()*3)]};animation-duration:${Math.random()*15+10}s;animation-delay:${Math.random()*10}s;`;
      container.appendChild(p);
    }
  }

  // Counter animation on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.stat-counter').forEach((el, i) => {
          const target = parseFloat(el.dataset.target);
          const isDecimal = el.dataset.decimal === 'true';
          const counterEl = document.getElementById(`counter-${i}`);
          if (counterEl) {
            if (isDecimal) {
              counterEl.textContent = target.toFixed(1) + '%';
            } else {
              animateCounter(counterEl, target);
              setTimeout(() => { if (counterEl.textContent !== '0') counterEl.textContent += '+'; }, 1600);
            }
          }
        });
        observer.disconnect();
      }
    });
  }, { threshold: 0.3 });

  const statsSection = document.getElementById('stats');
  if (statsSection) observer.observe(statsSection);

  // FAQ toggle
  window.toggleFAQ = (i) => {
    const answer = document.getElementById(`faq-answer-${i}`);
    const icon = document.getElementById(`faq-icon-${i}`);
    answer?.classList.toggle('hidden');
    icon?.classList.toggle('rotate-180');
  };

  // Live feed animation
  let feedIndex = 0;
  const feedEvents = [
    { icon: '🚨', text: 'Critical alert: Typhoon Signal No.3 broadcast' },
    { icon: '👤', text: 'User joined Emergency Response channel' },
    { icon: '✅', text: 'Alert resolved: Water interruption ended' },
    { icon: '📄', text: 'XML report generated for 2025' },
    { icon: '💾', text: 'Automated DB backup completed' },
    { icon: '🔐', text: 'New admin user verified' },
  ];

  setInterval(() => {
    const feed = document.getElementById('live-feed');
    if (!feed) return;
    const event = feedEvents[feedIndex % feedEvents.length];
    const item = document.createElement('div');
    item.className = 'flex items-center gap-3 text-sm py-1.5 border-b opacity-0 transition-opacity';
    item.style.borderColor = 'var(--border)';
    item.innerHTML = `<span>${event.icon}</span><span class="flex-1 text-xs" style="color:var(--text-secondary);">${event.text}</span><span class="text-xs" style="color:var(--text-secondary);opacity:0.6;">just now</span>`;
    feed.insertBefore(item, feed.firstChild);
    setTimeout(() => item.style.opacity = '1', 50);
    if (feed.children.length > 6) feed.removeChild(feed.lastChild);
    feedIndex++;
  }, 3000);
}
