import { renderSidebar, initSidebar } from '../components/sidebar.js';
import { api } from '../services/api.js';
import { showToast } from '../utils/toast.js';
import { getUser } from '../services/auth.js';
import { timeAgo, debounce } from '../utils/helpers.js';

export function renderUsers(app) {
  const currentUser = getUser();
  const isSuperAdmin = currentUser?.role === 'superadmin';

  app.innerHTML = `
    ${renderSidebar('/users')}
    <div class="main-content">
      <header class="sticky top-0 z-40 glass border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <button onclick="toggleSidebar()" class="mobile-menu-btn btn btn-ghost p-2">
            <i class="fa-solid fa-bars"></i>
          </button>
          <div>
            <h1 class="text-base font-bold">User Management</h1>
          </div>
        </div>
        <div class="flex items-center gap-2">
          ${isSuperAdmin ? `<button onclick="showWordFilterPanel()" class="btn btn-ghost text-xs px-2 py-1.5"><i class="fa-solid fa-shield-halved"></i> <span class="hidden sm:inline">Filter</span></button>` : ''}
          ${isSuperAdmin ? `<button onclick="showCreateUserModal()" class="btn btn-primary text-xs px-2 py-1.5"><i class="fa-solid fa-user-plus"></i> <span class="hidden sm:inline">Create</span></button>` : ''}
        </div>
      </header>
      </header>

      <main class="p-3 sm:p-6 space-y-4">
        <div class="glass rounded-xl border border-white/8 p-3 flex flex-wrap gap-2">
          <div class="relative flex-1 min-w-0">
            <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
            <input type="text" id="user-search" class="input pl-9 py-2 text-sm" placeholder="Search users..."/>
          </div>
          ${isSuperAdmin ? `
          <select id="role-filter" class="input w-auto py-2 text-sm">
            <option value="">All Roles</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Instructor</option>
            <option value="user">Student</option>
          </select>` : ''}
        </div>

        <!-- Desktop table -->
        <div class="glass rounded-2xl border border-white/8 overflow-hidden hidden sm:block">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="users-table">
                <tr><td colspan="6" class="text-center py-8"><div class="spinner mx-auto"></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Mobile card list -->
        <div id="users-cards" class="space-y-2 sm:hidden">
          <div class="text-center py-8"><div class="spinner mx-auto"></div></div>
        </div>

        <div id="user-pagination" class="flex justify-center gap-2"></div>
      </main>
    </div>

    <!-- Create User Modal -->
    <div id="create-user-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div class="glass rounded-2xl border border-white/10 p-6 w-full max-w-md shadow-2xl">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-bold text-lg">Create New User</h2>
          <button onclick="hideCreateUserModal()" class="btn btn-ghost p-2"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form id="create-user-form" class="space-y-4">
          <div>
            <label class="block text-sm text-slate-300 mb-1">Full Name</label>
            <input type="text" id="cu-name" class="input" placeholder="e.g. Prof. Juan dela Cruz" required/>
          </div>
          <div>
            <label class="block text-sm text-slate-300 mb-1">Username</label>
            <input type="text" id="cu-username" class="input" placeholder="e.g. jdelacruz" required/>
          </div>
          <div>
            <label class="block text-sm text-slate-300 mb-1">Role</label>
            <select id="cu-role" class="input">
              <option value="user">Student (User)</option>
              <option value="admin">Instructor (Admin)</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-slate-300 mb-1">Organization</label>
            <input type="text" id="cu-org" class="input" placeholder="e.g. RavenSync School"/>
          </div>
          <div>
            <label class="block text-sm text-slate-300 mb-1">Department / Section</label>
            <input type="text" id="cu-dept" class="input" placeholder="e.g. Grade 10 - Section A"/>
          </div>
          <div>
            <label class="block text-sm text-slate-300 mb-1">Password</label>
            <input type="password" id="cu-password" class="input" placeholder="Min. 6 characters" required minlength="6"/>
          </div>
          <button type="submit" class="btn btn-primary w-full">Create User</button>
        </form>
      </div>
    </div>

    <!-- Word Filter Modal (superadmin only) -->
    ${isSuperAdmin ? `
    <div id="word-filter-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div class="glass rounded-2xl border border-white/10 p-6 w-full max-w-2xl shadow-2xl">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="font-bold text-lg flex items-center gap-2"><i class="fa-solid fa-shield-halved text-indigo-400"></i> Word Filter Manager</h2>
            <p class="text-xs text-slate-500 mt-0.5">Block words from being sent in any channel</p>
          </div>
          <button onclick="hideWordFilterPanel()" class="btn btn-ghost p-2"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <!-- Add word -->
        <div class="flex gap-3 mb-5">
          <input type="text" id="new-word-input" class="input flex-1" placeholder="Type a word or phrase to block..."
            onkeydown="if(event.key==='Enter') addFilterWord()"/>
          <button onclick="addFilterWord()" class="btn btn-primary px-5">
            <i class="fa-solid fa-plus"></i> Add
          </button>
        </div>

        <!-- Tabs -->
        <div class="flex gap-2 mb-4">
          <button onclick="switchFilterTab('custom')" id="tab-custom"
            class="btn text-xs py-1.5 px-3 btn-primary">Custom Words <span id="custom-count" class="ml-1 px-1.5 py-0.5 rounded-full bg-white/10 text-xs">0</span></button>
          <button onclick="switchFilterTab('base')" id="tab-base"
            class="btn text-xs py-1.5 px-3 btn-ghost">Built-in Words <span class="ml-1 px-1.5 py-0.5 rounded-full bg-white/10 text-xs" id="base-count">0</span></button>
        </div>

        <!-- Word list -->
        <div id="filter-word-list" class="max-h-72 overflow-y-auto space-y-2">
          <div class="text-center py-6"><div class="spinner mx-auto"></div></div>
        </div>
      </div>
    </div>` : ''}
  `;

  initSidebar();
  loadUsers();

  document.getElementById('user-search')?.addEventListener('input', debounce((e) => {
    loadUsers({ search: e.target.value, role: document.getElementById('role-filter')?.value });
  }, 400));

  document.getElementById('role-filter')?.addEventListener('change', (e) => {
    loadUsers({ role: e.target.value, search: document.getElementById('user-search').value });
  });

  document.getElementById('create-user-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', {
        name: document.getElementById('cu-name').value,
        username: document.getElementById('cu-username').value,
        role: document.getElementById('cu-role').value,
        organization: document.getElementById('cu-org').value,
        department: document.getElementById('cu-dept').value,
        password: document.getElementById('cu-password').value,
      });
      showToast('User created successfully', 'success');
      hideCreateUserModal();
      loadUsers();
    } catch (err) {
      showToast(err.message || 'Failed to create user', 'error');
    }
  });

  window.toggleUserStatus = toggleUserStatus;
  window.changeUserRole = changeUserRole;
  window.showCreateUserModal = () => document.getElementById('create-user-modal')?.classList.remove('hidden');
  window.hideCreateUserModal = () => document.getElementById('create-user-modal')?.classList.add('hidden');
}

async function loadUsers(filters = {}) {
  const tbody = document.getElementById('users-table');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8"><div class="spinner mx-auto"></div></td></tr>`;

  try {
    const res = await api.get('/admin/users', { limit: 20, ...filters });
    const users = res.data;

    if (!users.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-500">No users found</td></tr>`;
      return;
    }

    const roleLabel = { superadmin: 'Super Admin', admin: 'Instructor', user: 'Student' };
    const roleBadge = { superadmin: 'bg-purple-500/20 text-purple-400', admin: 'bg-indigo-500/20 text-indigo-400', user: 'bg-slate-500/20 text-slate-400' };

    tbody.innerHTML = users.map(u => `
      <tr>
        <td>
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
              ${u.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <div class="font-medium text-sm">${u.name}</div>
              <div class="text-xs text-slate-500">@${u.username || '—'}</div>
            </div>
          </div>
        </td>
        <td><span class="px-2 py-1 rounded-full text-xs font-medium ${roleBadge[u.role] || roleBadge.user}">${roleLabel[u.role] || u.role}</span></td>
        <td class="text-sm text-slate-400">${u.course ? `${u.course}<br><span class="text-xs text-slate-500">${u.department || ''}</span>` : (u.department || u.organization || '—')}</td>
        <td>
          <div class="flex items-center gap-1.5">
            <div class="w-2 h-2 rounded-full ${u.isActive ? 'bg-emerald-400' : 'bg-red-400'}"></div>
            <span class="text-xs ${u.isActive ? 'text-emerald-400' : 'text-red-400'}">${u.isActive ? 'Active' : 'Inactive'}</span>
          </div>
        </td>
        <td class="text-xs text-slate-500">${u.lastLogin ? timeAgo(u.lastLogin) : 'Never'}</td>
        <td>
          <button onclick="toggleUserStatus('${u._id}', ${u.isActive})"
            class="btn btn-ghost text-xs py-1 px-2 ${u.isActive ? 'text-red-400 hover:bg-red-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}">
            ${u.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </td>
      </tr>
    `).join('');

    // Mobile cards
    const cards = document.getElementById('users-cards');
    if (cards) {
      cards.innerHTML = users.map(u => `
        <div class="glass rounded-xl border border-white/8 p-3 flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
            ${u.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm truncate">${u.name}</div>
            <div class="text-xs text-slate-500">@${u.username} · <span class="${roleBadge[u.role]?.split(' ')[1] || 'text-slate-400'}">${roleLabel[u.role] || u.role}</span></div>
            <div class="text-xs text-slate-500 truncate">${u.department || u.organization || ''}</div>
          </div>
          <div class="flex flex-col items-end gap-1.5">
            <div class="flex items-center gap-1">
              <div class="w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-400' : 'bg-red-400'}"></div>
              <span class="text-xs ${u.isActive ? 'text-emerald-400' : 'text-red-400'}">${u.isActive ? 'Active' : 'Off'}</span>
            </div>
            <button onclick="toggleUserStatus('${u._id}', ${u.isActive})"
              class="text-xs ${u.isActive ? 'text-red-400' : 'text-emerald-400'}">
              ${u.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-red-400">Failed to load users</td></tr>`;
  }
}

async function toggleUserStatus(userId, isActive) {
  try {
    await api.put(`/admin/users/${userId}`, { isActive: !isActive });
    showToast(`User ${isActive ? 'deactivated' : 'activated'}`, 'success');
    loadUsers();
  } catch (err) {
    showToast('Failed to update user', 'error');
  }
}

async function changeUserRole(userId, role) {
  try {
    await api.put(`/admin/users/${userId}`, { role });
    showToast(`Role updated to ${role}`, 'success');
  } catch (err) {
    showToast('Failed to update role', 'error');
  }
}

// ─── WORD FILTER ─────────────────────────────────────────────────────────────

let _filterData = { custom: [], base: [] };
let _activeTab = 'custom';

async function loadFilterWords() {
  try {
    const res = await api.get('/admin/word-filter');
    _filterData = res.data;
    document.getElementById('custom-count').textContent = _filterData.custom.length;
    document.getElementById('base-count').textContent = _filterData.base.length;
    renderFilterList();
  } catch (err) {
    document.getElementById('filter-word-list').innerHTML =
      `<p class="text-center text-red-400 text-sm py-4">Failed to load word list</p>`;
  }
}

function renderFilterList() {
  const list = document.getElementById('filter-word-list');
  if (!list) return;

  if (_activeTab === 'custom') {
    if (!_filterData.custom.length) {
      list.innerHTML = `<div class="text-center py-8 text-slate-500 text-sm"><div class="text-3xl mb-2">🛡️</div>No custom words added yet.<br/>Add words above to block them.</div>`;
      return;
    }
    list.innerHTML = _filterData.custom.map(w => `
      <div class="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 group">
        <div class="flex items-center gap-3">
          <span class="text-red-400 text-sm">🚫</span>
          <span class="font-mono text-sm text-slate-200">${w.word}</span>
          <span class="text-xs text-slate-500">added by ${w.addedBy?.name || 'system'}</span>
        </div>
        <button onclick="removeFilterWord('${w._id}', '${w.word}')"
          class="btn btn-ghost text-xs py-1 px-2 text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity">
          <i class="fa-solid fa-trash"></i> Remove
        </button>
      </div>
    `).join('');
  } else {
    list.innerHTML = _filterData.base.map(w => `
      <div class="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/3 border border-white/5">
        <span class="text-slate-500 text-sm">🔒</span>
        <span class="font-mono text-sm text-slate-400">${w}</span>
        <span class="text-xs text-slate-600 ml-auto">built-in</span>
      </div>
    `).join('');
  }
}

window.switchFilterTab = (tab) => {
  _activeTab = tab;
  document.getElementById('tab-custom').className = `btn text-xs py-1.5 px-3 ${tab === 'custom' ? 'btn-primary' : 'btn-ghost'}`;
  document.getElementById('tab-base').className = `btn text-xs py-1.5 px-3 ${tab === 'base' ? 'btn-primary' : 'btn-ghost'}`;
  renderFilterList();
};

window.addFilterWord = async () => {
  const input = document.getElementById('new-word-input');
  const word = input?.value?.trim();
  if (!word) return;
  try {
    await api.post('/admin/word-filter', { word });
    showToast(`"${word}" added to filter`, 'success');
    input.value = '';
    _activeTab = 'custom';
    window.switchFilterTab('custom');
    await loadFilterWords();
  } catch (err) {
    showToast(err.message || 'Failed to add word', 'error');
  }
};

window.removeFilterWord = async (id, word) => {
  if (!confirm(`Remove "${word}" from the filter?`)) return;
  try {
    await api.delete(`/admin/word-filter/${id}`);
    showToast(`"${word}" removed from filter`, 'success');
    await loadFilterWords();
  } catch (err) {
    showToast(err.message || 'Failed to remove word', 'error');
  }
};

window.showWordFilterPanel = () => {
  document.getElementById('word-filter-modal')?.classList.remove('hidden');
  loadFilterWords();
};

window.hideWordFilterPanel = () => {
  document.getElementById('word-filter-modal')?.classList.add('hidden');
};
