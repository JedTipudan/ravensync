import { renderSidebar, initSidebar } from '../components/sidebar.js';
import { renderNotificationBell, initNotificationBell } from '../components/notificationBell.js';
import { api } from '../services/api.js';
import { on } from '../services/websocket.js';
import { showToast } from '../utils/toast.js';
import { isAdmin } from '../services/auth.js';
import { timeAgo } from '../utils/helpers.js';

export function renderAnnouncements(app) {
  app.innerHTML = `
    ${renderSidebar('/announcements')}
    <div class="main-content">
      <header class="sticky top-0 z-40 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button onclick="toggleSidebar()" class="mobile-menu-btn btn btn-ghost p-2 mr-1">
            <i class="fa-solid fa-bars"></i>
          </button>
          <div>
            <h1 class="text-lg font-bold">Announcements</h1>
            <p class="text-xs text-slate-500">College notices, events & reminders</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          ${renderNotificationBell()}
          ${isAdmin() ? `
            <button onclick="openCreateModal()" class="btn btn-primary text-sm">
              <i class="fa-solid fa-plus"></i> Post Announcement
            </button>
          ` : ''}
        </div>
      </header>

      <main class="p-6 space-y-4">
        <!-- Category filter -->
        <div class="flex gap-2 flex-wrap">
          ${['all','academic','event','reminder','urgent','general'].map(c => `
            <button onclick="filterCategory('${c}')" id="cat-${c}"
              class="px-3 py-1.5 rounded-full text-xs font-medium border transition-all
              ${c === 'all' ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'border-white/10 text-slate-400 hover:border-white/20'}">
              ${categoryIcon(c)} ${c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          `).join('')}
        </div>

        <div id="announcements-list" class="space-y-4">
          <div class="text-center py-12"><div class="spinner mx-auto"></div></div>
        </div>
      </main>
    </div>

    <!-- Create Announcement Modal -->
    <div id="create-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div class="glass rounded-2xl border border-white/10 p-6 w-full max-w-lg shadow-2xl">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-bold text-lg">📢 Post Announcement</h2>
          <button onclick="closeCreateModal()" class="btn btn-ghost p-2"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form id="announcement-form" class="space-y-4">
          <div>
            <label class="block text-sm text-slate-300 mb-1">Title</label>
            <input type="text" id="ann-title" class="input" placeholder="e.g. Final Exam Schedule Released" required/>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-slate-300 mb-1">Category</label>
              <select id="ann-category" class="input">
                <option value="general">📋 General</option>
                <option value="academic">📚 Academic</option>
                <option value="event">🎉 Event</option>
                <option value="reminder">⏰ Reminder</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-slate-300 mb-1">Target</label>
              <input type="text" id="ann-dept" class="input" placeholder="all or e.g. BSIT"/>
            </div>
          </div>
          <div>
            <label class="block text-sm text-slate-300 mb-1">Content</label>
            <textarea id="ann-content" class="input resize-none" rows="4" placeholder="Write your announcement here..." required></textarea>
          </div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="ann-pinned" class="rounded border-white/20 bg-white/5"/>
            <span class="text-sm text-slate-300">📌 Pin this announcement</span>
          </label>
          <button type="submit" class="btn btn-primary w-full">
            <i class="fa-solid fa-paper-plane"></i> Post & Notify Students
          </button>
        </form>
      </div>
    </div>
  `;

  initSidebar();
  initNotificationBell();
  loadAnnouncements();

  on('NEW_ANNOUNCEMENT', () => loadAnnouncements());

  document.getElementById('announcement-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api.post('/announcements', {
        title: document.getElementById('ann-title').value,
        content: document.getElementById('ann-content').value,
        category: document.getElementById('ann-category').value,
        targetDepartment: document.getElementById('ann-dept').value || 'all',
        isPinned: document.getElementById('ann-pinned').checked,
      });
      showToast('Announcement posted! Students notified.', 'success');
      closeCreateModal();
      loadAnnouncements();
    } catch (err) {
      showToast(err.message || 'Failed to post', 'error');
    }
  });

  window.openCreateModal = () => document.getElementById('create-modal')?.classList.remove('hidden');
  window.closeCreateModal = () => document.getElementById('create-modal')?.classList.add('hidden');
  window.filterCategory = filterCategory;
  window.deleteAnnouncement = deleteAnnouncement;
}

let activeCategory = 'all';

function filterCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll('[id^="cat-"]').forEach(b => {
    b.className = 'px-3 py-1.5 rounded-full text-xs font-medium border transition-all border-white/10 text-slate-400 hover:border-white/20';
  });
  const active = document.getElementById(`cat-${cat}`);
  if (active) active.className = 'px-3 py-1.5 rounded-full text-xs font-medium border transition-all bg-indigo-500/20 border-indigo-500/40 text-indigo-300';
  loadAnnouncements();
}

async function loadAnnouncements() {
  const list = document.getElementById('announcements-list');
  if (!list) return;
  list.innerHTML = `<div class="text-center py-12"><div class="spinner mx-auto"></div></div>`;
  try {
    const params = activeCategory !== 'all' ? { category: activeCategory } : {};
    const res = await api.get('/announcements', params);
    const items = res.data;

    if (!items.length) {
      list.innerHTML = `<div class="text-center py-16 text-slate-500"><div class="text-5xl mb-3">📭</div><p>No announcements yet</p></div>`;
      return;
    }

    list.innerHTML = items.map(a => {
      const catColor = { academic: 'indigo', event: 'purple', reminder: 'amber', urgent: 'red', general: 'slate' }[a.category] || 'slate';
      return `
        <div class="glass rounded-2xl border border-white/8 p-5 card-hover ${a.isPinned ? 'border-indigo-500/30' : ''}"
             data-id="${a._id}"
             onclick="markRead('${a._id}')">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3 flex-1 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-${catColor}-500/10 border border-${catColor}-500/20 flex items-center justify-center text-xl flex-shrink-0">
                ${categoryIcon(a.category)}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  ${a.isPinned ? '<span class="text-xs text-indigo-400">📌 Pinned</span>' : ''}
                  <span class="px-2 py-0.5 rounded-full text-xs bg-${catColor}-500/20 text-${catColor}-400 capitalize">${a.category}</span>
                  ${a.targetDepartment !== 'all' ? `<span class="text-xs text-slate-500">→ ${a.targetDepartment}</span>` : ''}
                </div>
                <h3 class="font-bold text-base mb-1">${a.title}</h3>
                <p class="text-sm text-slate-400 leading-relaxed">${a.content}</p>
                <div class="flex items-center gap-3 mt-3 text-xs text-slate-500">
                  <span>👤 ${a.author?.name || 'Admin'}</span>
                  <span>🕐 ${timeAgo(a.createdAt)}</span>
                  <span>👁️ ${a.readBy?.length || 0} read</span>
                </div>
              </div>
            </div>
            ${isAdmin() ? `
              <button onclick="event.stopPropagation(); deleteAnnouncement('${a._id}')"
                class="btn btn-ghost text-xs p-2 text-red-400 hover:bg-red-500/10 flex-shrink-0">
                <i class="fa-solid fa-trash"></i>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    window.markRead = async (id) => {
      await api.patch(`/announcements/${id}/read`).catch(() => {});
    };
  } catch (err) {
    list.innerHTML = `<div class="text-center py-12 text-red-400">Failed to load announcements</div>`;
  }
}

async function deleteAnnouncement(id) {
  if (!confirm('Delete this announcement?')) return;
  try {
    // Optimistically remove from DOM immediately
    const card = document.querySelector(`[data-id="${id}"]`);
    if (card) card.remove();

    await api.delete(`/announcements/${id}`);
    showToast('Announcement deleted', 'success');

    // Check if list is now empty
    const list = document.getElementById('announcements-list');
    if (list && !list.children.length) {
      list.innerHTML = `<div class="text-center py-16 text-slate-500"><div class="text-5xl mb-3">📭</div><p>No announcements yet</p></div>`;
    }
  } catch (err) {
    showToast('Failed to delete', 'error');
    loadAnnouncements(); // reload to restore if delete failed
  }
}

function categoryIcon(cat) {
  return { academic: '📚', event: '🎉', reminder: '⏰', urgent: '🔴', general: '📋', all: '📣' }[cat] || '📋';
}
