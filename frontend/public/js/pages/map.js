import { renderSidebar, initSidebar } from '../components/sidebar.js';
import { renderNotificationBell, initNotificationBell } from '../components/notificationBell.js';
import { getUser } from '../services/auth.js';
import { on } from '../services/websocket.js';
import { showToast } from '../utils/toast.js';
import { api } from '../services/api.js';

const PIN_TYPES = {
  exit:     { label: 'Exit',          emoji: '🚪', color: '#10b981' },
  hazard:   { label: 'Hazard',        emoji: '⚠️',  color: '#f59e0b' },
  assembly: { label: 'Assembly Area', emoji: '🏁', color: '#6366f1' },
  aid:      { label: 'First Aid',     emoji: '🏥', color: '#ef4444' },
  user:     { label: 'User Location', emoji: '📍', color: '#06b6d4' },
};

export function renderMap(app) {
  const user = getUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  app.innerHTML = `
    ${renderSidebar('/map')}
    <div class="main-content">
      <header class="sticky top-0 z-40 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button onclick="toggleSidebar()" class="mobile-menu-btn btn btn-ghost p-2 mr-1">
            <i class="fa-solid fa-bars"></i>
          </button>
          <div>
            <h1 class="text-lg font-bold">🗺️ Campus Map</h1>
            <p class="text-xs text-slate-500">DORSU Emergency Evacuation Map</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          ${renderNotificationBell()}
          ${isAdmin ? `
            <select id="pin-type-select" class="input text-xs py-1.5 px-2 w-auto max-w-[120px] sm:max-w-none">
              ${Object.entries(PIN_TYPES).filter(([k]) => k !== 'user').map(([k, v]) =>
                `<option value="${k}">${v.emoji} ${v.label}</option>`
              ).join('')}
            </select>
            <button id="add-pin-btn" onclick="togglePinMode()" class="btn btn-primary text-xs sm:text-sm px-2 sm:px-3">
              <i class="fa-solid fa-map-pin"></i> <span class="hidden sm:inline">Add Pin</span>
            </button>
            <button onclick="clearAdminPins()" class="btn btn-ghost text-xs px-2 text-red-400">
              <i class="fa-solid fa-trash"></i>
            </button>
          ` : `
            <button onclick="shareMyLocation()" class="btn btn-primary text-xs sm:text-sm px-3">
              <i class="fa-solid fa-location-dot"></i> <span class="hidden sm:inline">Share My Location</span><span class="sm:hidden">Share</span>
            </button>
          `}
        </div>
      </header>

      <main class="p-4 md:p-6 space-y-4">
        ${isAdmin ? `
        <div class="glass rounded-xl border border-white/8 p-2 sm:p-3 flex flex-wrap gap-2 sm:gap-4 text-xs">
          ${Object.entries(PIN_TYPES).map(([, v]) =>
            `<span class="flex items-center gap-1"><span>${v.emoji}</span><span class="text-slate-300 hidden sm:inline">${v.label}</span></span>`
          ).join('')}
          <span class="ml-auto text-slate-500 italic hidden sm:inline">Click map to place pin</span>
        </div>
        ` : `
        <div class="glass rounded-xl border border-white/8 p-2 sm:p-3 text-xs text-slate-400 flex items-center gap-2">
          <i class="fa-solid fa-circle-info text-indigo-400"></i>
          <span>View exits and assembly areas. Tap <strong class="text-white">Share</strong> to mark your location.</span>
        </div>
        `}

        <!-- Zoom controls + map viewport -->
        <div class="glass rounded-2xl border border-white/8 overflow-hidden" style="position:relative;">
          <!-- Zoom buttons -->
          <div style="position:absolute; top:12px; right:12px; z-index:20; display:flex; flex-direction:column; gap:4px;">
            <button onclick="mapZoomIn()" style="width:32px;height:32px;background:rgba(15,15,26,0.85);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#fff;font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;" title="Zoom in">+</button>
            <button onclick="mapZoomOut()" style="width:32px;height:32px;background:rgba(15,15,26,0.85);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#fff;font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;" title="Zoom out">−</button>
            <button onclick="mapReset()" style="width:32px;height:32px;background:rgba(15,15,26,0.85);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#94a3b8;font-size:0.65rem;cursor:pointer;display:flex;align-items:center;justify-content:center;" title="Reset">⊙</button>
          </div>

          <!-- Viewport (clips overflow) -->
          <div id="map-viewport" style="width:100%;height:55vh;overflow:hidden;position:relative;cursor:grab;">
            <!-- Transformable inner wrap -->
            <div id="map-wrap" style="position:absolute;top:0;left:0;width:100%;transform-origin:0 0;will-change:transform;">
              <img id="campus-map" src="/images/dorsu-map.png" alt="DORSU Campus Map"
                style="width:100%;height:auto;display:block;user-select:none;"
                draggable="false"
                onerror="this.parentElement.parentElement.innerHTML='<div style=\'padding:80px;text-align:center;color:#64748b\'><div style=\'font-size:3rem;margin-bottom:1rem\'>🗺️</div><p>Map image not found</p></div>'"
              />
              <div id="pins-layer" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"></div>
            </div>
          </div>
        </div>

        ${isAdmin ? `
        <div class="glass rounded-2xl border border-white/8 p-5">
          <h2 class="font-bold mb-3 flex items-center gap-2">
            <span class="text-cyan-400"><i class="fa-solid fa-users-viewfinder"></i></span>
            Live User Locations
          </h2>
          <div id="user-location-list" class="space-y-2">
            <p class="text-slate-500 text-sm text-center py-4">No user locations shared yet</p>
          </div>
        </div>
        ` : ''}
      </main>
    </div>
  `;

  initSidebar();
  initNotificationBell();
  initMap(isAdmin, user);
}

function initMap(isAdmin, user) {
  let pinMode = false;
  let pins = [];   // admin pins from DB
  const userPins = [];

  // ── Zoom / Pan state ──────────────────────────────────────────────────────
  let scale = 1;
  let tx = 0, ty = 0;
  let dragging = false;
  let dragStart = { x: 0, y: 0 };
  let lastTx = 0, lastTy = 0;
  const MIN_SCALE = 1, MAX_SCALE = 5;

  const viewport = document.getElementById('map-viewport');
  const wrap = document.getElementById('map-wrap');

  function applyTransform() {
    if (wrap) wrap.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function clampTranslate() {
    if (!viewport || !wrap) return;
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const iw = wrap.clientWidth * scale;
    const ih = wrap.clientHeight * scale;
    // Don't let map go out of bounds
    tx = Math.min(0, Math.max(tx, vw - iw));
    ty = Math.min(0, Math.max(ty, vh - ih));
    // If image smaller than viewport (scale=1), center it
    if (iw <= vw) tx = (vw - iw) / 2;
    if (ih <= vh) ty = (vh - ih) / 2;
  }

  function zoomAt(clientX, clientY, newScale) {
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    // Zoom toward the pointer position
    tx = px - (px - tx) * (newScale / scale);
    ty = py - (py - ty) * (newScale / scale);
    scale = newScale;
    clampTranslate();
    applyTransform();
  }

  window.mapZoomIn  = () => zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, Math.min(scale * 1.3, MAX_SCALE));
  window.mapZoomOut = () => zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, Math.max(scale / 1.3, MIN_SCALE));
  window.mapReset   = () => { scale = 1; tx = 0; ty = 0; clampTranslate(); applyTransform(); };

  // Scroll to zoom
  viewport?.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.85 : 1.18;
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * delta));
    zoomAt(e.clientX, e.clientY, newScale);
  }, { passive: false });

  // Mouse drag to pan
  viewport?.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    dragStart = { x: e.clientX - tx, y: e.clientY - ty };
    viewport.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    tx = e.clientX - dragStart.x;
    ty = e.clientY - dragStart.y;
    clampTranslate();
    applyTransform();
  });
  window.addEventListener('mouseup', () => {
    dragging = false;
    if (viewport) viewport.style.cursor = pinMode ? 'crosshair' : 'grab';
  });

  // Touch pinch-to-zoom + drag
  let lastTouches = null;
  viewport?.addEventListener('touchstart', (e) => {
    lastTouches = e.touches;
    if (e.touches.length === 1) {
      dragStart = { x: e.touches[0].clientX - tx, y: e.touches[0].clientY - ty };
    }
  }, { passive: true });

  viewport?.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && lastTouches?.length === 2) {
      // Pinch zoom
      const prevDist = Math.hypot(
        lastTouches[0].clientX - lastTouches[1].clientX,
        lastTouches[0].clientY - lastTouches[1].clientY
      );
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * (newDist / prevDist)));
      zoomAt(midX, midY, newScale);
    } else if (e.touches.length === 1) {
      // Pan
      tx = e.touches[0].clientX - dragStart.x;
      ty = e.touches[0].clientY - dragStart.y;
      clampTranslate();
      applyTransform();
    }
    lastTouches = e.touches;
  }, { passive: true });

  // ── Pins ──────────────────────────────────────────────────────────────────

  // Load admin pins (all users see them)
  api.get('/map/admin-pins').then(res => {
    pins = (res.data || []).map(p => ({ _id: p._id, type: p.type, x: p.x, y: p.y, label: p.label }));
    renderPins();
  }).catch(() => {});

  // Load persisted user pins from DB (admin only)
  if (isAdmin) {
    api.get('/map/pins').then(res => {
      (res.data || []).forEach(p => {
        userPins.push({ type: 'user', x: p.x, y: p.y, label: p.name, userId: String(p.userId), time: p.time });
      });
      renderPins();
      updateUserLocationList();
    }).catch(() => {});
  }

  function renderPins() {
    const layer = document.getElementById('pins-layer');
    if (!layer) return;
    layer.innerHTML = [...pins, ...userPins].map((pin) => {
      const type = PIN_TYPES[pin.type] || PIN_TYPES.exit;
      const isUserPin = pin.type === 'user';
      return `
        <div style="
          position:absolute;
          left:${pin.x}%;
          top:${pin.y}%;
          transform:translate(-50%,-100%);
          pointer-events:all;
          cursor:${isAdmin && !isUserPin ? 'pointer' : 'default'};
          z-index:10;
          text-align:center;
        "
        title="${type.label}${pin.label ? ': ' + pin.label : ''}"
        ${isAdmin && !isUserPin && pin._id ? `onclick="removePin('${pin._id}')"` : ''}
        >
          <div style="font-size:1.6rem;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.6));">${type.emoji}</div>
          ${pin.label ? `<div style="background:rgba(0,0,0,0.75);color:#fff;font-size:0.6rem;padding:1px 5px;border-radius:4px;white-space:nowrap;margin-top:2px;">${pin.label}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  function updateUserLocationList() {
    const el = document.getElementById('user-location-list');
    if (!el) return;
    if (!userPins.length) {
      el.innerHTML = `<p class="text-slate-500 text-sm text-center py-4">No user locations shared yet</p>`;
      return;
    }
    el.innerHTML = userPins.map(p => `
      <div class="flex items-center gap-3 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
        <span class="text-xl">📍</span>
        <div class="flex-1">
          <div class="text-sm font-medium">${p.label || 'Unknown User'}</div>
          <div class="text-xs text-slate-400">${p.time || ''}</div>
        </div>
        <button onclick="removeUserPin('${p.userId}')" class="text-xs text-red-400 hover:text-red-300" title="Remove pin">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `).join('');
  }

  // ── Convert screen click → % position on original image ──────────────────
  function screenToMapPercent(clientX, clientY) {
    const rect = viewport.getBoundingClientRect();
    // Position relative to viewport
    const vx = clientX - rect.left;
    const vy = clientY - rect.top;
    // Undo translate + scale to get position on original image
    const ix = (vx - tx) / scale;
    const iy = (vy - ty) / scale;
    const imgW = wrap.clientWidth;
    const imgH = wrap.querySelector('img')?.clientHeight || wrap.clientHeight;
    return { x: (ix / imgW) * 100, y: (iy / imgH) * 100 };
  }

  // Admin: place pin on click — save to DB
  if (wrap && isAdmin) {
    viewport.addEventListener('click', (e) => {
      if (!pinMode) return;
      const { x, y } = screenToMapPercent(e.clientX, e.clientY);
      const type = document.getElementById('pin-type-select')?.value || 'exit';
      const label = prompt(`Label for this ${PIN_TYPES[type].label} pin? (optional)`);
      api.post('/map/admin-pins', { type, x, y, label: label?.trim() || '' })
        .then(res => {
          pins.push({ _id: res.data._id, type, x, y, label: label?.trim() || '' });
          renderPins();
          showToast(`${PIN_TYPES[type].emoji} ${PIN_TYPES[type].label} pin added`, 'success');
        }).catch(() => showToast('Failed to save pin', 'error'));
    });
  }

  window.togglePinMode = () => {
    pinMode = !pinMode;
    const btn = document.getElementById('add-pin-btn');
    if (btn) {
      btn.innerHTML = pinMode ? '<i class="fa-solid fa-check"></i> Done' : '<i class="fa-solid fa-map-pin"></i> Add Pin';
      btn.className = pinMode ? 'btn btn-success text-sm' : 'btn btn-primary text-sm';
    }
    if (viewport) viewport.style.cursor = pinMode ? 'crosshair' : 'grab';
  };

  window.removePin = (id) => {
    api.delete(`/map/admin-pins/${id}`).then(() => {
      pins = pins.filter(p => p._id !== id);
      renderPins();
    }).catch(() => showToast('Failed to remove pin', 'error'));
  };

  window.clearAdminPins = () => {
    if (!confirm('Remove all admin pins?')) return;
    api.delete('/map/admin-pins').then(() => {
      pins = [];
      renderPins();
      showToast('All pins cleared', 'success');
    }).catch(() => showToast('Failed to clear pins', 'error'));
  };

  // User: share location
  window.shareMyLocation = () => {
    showToast('Click on the map where you are right now', 'info');
    if (viewport) viewport.style.cursor = 'crosshair';

    function onMapClick(e) {
      viewport.style.cursor = 'grab';
      viewport.removeEventListener('click', onMapClick);
      const { x, y } = screenToMapPercent(e.clientX, e.clientY);
      const user = getUser();
      const time = new Date().toLocaleTimeString();
      const payload = {
        type: 'LOCATION_SHARE',
        data: { x, y, name: user?.name || 'Unknown', userId: user?._id, time }
      };
      import('../services/websocket.js').then(({ sendRaw }) => {
        sendRaw(payload);
        showToast('📍 Location shared with admin', 'success');
      });
      api.post('/map/pins', { x, y, time }).catch(() => {});
    }

    viewport.addEventListener('click', onMapClick);
  };

  window.removeUserPin = (userId) => {
    api.delete(`/map/pins/${userId}`).catch(() => {});
    const i = userPins.findIndex(p => p.userId === userId);
    if (i !== -1) userPins.splice(i, 1);
    renderPins();
    updateUserLocationList();
  };

  // All users: receive live admin pin updates
  const offAdminPins = on('ADMIN_PINS_UPDATE', (msg) => {
    pins = (msg.data || []).map(p => ({ _id: p._id, type: p.type, x: p.x, y: p.y, label: p.label }));
    renderPins();
    if (!isAdmin) showToast('🗺️ Map updated by admin', 'info');
  });

  // Admin: receive live location updates
  let offLocationShare;
  if (isAdmin) {
    offLocationShare = on('LOCATION_SHARE', (msg) => {
      const d = msg.data;
      const existing = userPins.findIndex(p => p.userId === d.userId);
      if (existing !== -1) userPins.splice(existing, 1);
      userPins.push({ type: 'user', x: d.x, y: d.y, label: d.name, userId: d.userId, time: d.time });
      renderPins();
      updateUserLocationList();
      showToast(`📍 ${d.name} shared their location`, 'success');
    });
  }

  // Cleanup listeners when SPA navigates away
  const cleanup = () => {
    offAdminPins?.();
    offLocationShare?.();
    document.removeEventListener('spa:navigate', cleanup);
  };
  document.addEventListener('spa:navigate', cleanup);

  renderPins();
  applyTransform();
}
