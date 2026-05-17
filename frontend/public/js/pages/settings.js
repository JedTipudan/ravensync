import { renderSidebar, initSidebar } from '../components/sidebar.js';
import { getUser, refreshUser, getToken } from '../services/auth.js';
import { api } from '../services/api.js';
import { showToast } from '../utils/toast.js';

export function renderSettings(container) {
  const user = getUser();
  const roleLabel = user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'admin' ? 'Instructor' : 'Student';
  const avatarContent = user?.avatar
    ? `<img src="${user.avatar}" alt="avatar" class="w-full h-full object-cover"/>`
    : `<span class="text-3xl font-bold">${user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>`;

  container.innerHTML = `
    <div class="app-layout">
      ${renderSidebar('/settings')}
      <main class="main-content">

        <!-- Header -->
        <header class="sticky top-0 z-10 px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-primary)] flex items-center gap-4">
          <button onclick="toggleSidebar()" class="mobile-menu-btn btn btn-ghost p-2">
            <i class="fa-solid fa-bars"></i>
          </button>
          <div>
            <h1 class="text-xl font-bold">Settings</h1>
            <p class="text-xs text-slate-500">Manage your profile and account security</p>
          </div>
        </header>

        <div class="p-6 max-w-3xl space-y-6">

          <!-- Profile Banner Card -->
          <div class="card overflow-hidden">
            <!-- Banner -->
            <div class="h-28 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 relative">
              <div class="absolute inset-0 opacity-20" style="background-image:url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22><circle cx=%2230%22 cy=%2230%22 r=%2220%22 fill=%22none%22 stroke=%22white%22 stroke-width=%221%22 opacity=%220.3%22/></svg>');"></div>
            </div>

            <!-- Avatar + Info -->
            <div class="px-6 pb-6">
              <div class="flex items-end gap-4 -mt-10 mb-4">
                <!-- Avatar with upload overlay -->
                <div class="relative group flex-shrink-0">
                  <div id="avatar-ring" class="w-20 h-20 rounded-full ring-4 ring-[var(--bg-primary)] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden shadow-xl text-white">
                    ${avatarContent}
                  </div>
                  <label for="avatar-input" class="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <i class="fa-solid fa-camera text-white text-lg"></i>
                  </label>
                  <input type="file" id="avatar-input" accept="image/*" class="hidden"/>
                  <div id="avatar-upload-spinner" class="hidden absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                    <i class="fa-solid fa-spinner fa-spin text-white"></i>
                  </div>
                </div>

                <div class="pb-1 flex-1 min-w-0">
                  <div class="font-bold text-lg truncate" id="display-name">${user?.name || ''}</div>
                  <div class="text-sm text-slate-500">@${user?.username || ''}</div>
                </div>

                <div class="pb-1 hidden sm:block">
                  <span class="badge badge-scheduled capitalize">${roleLabel}</span>
                </div>
              </div>

              <p class="text-xs text-slate-500 flex items-center gap-1.5">
                <i class="fa-solid fa-camera text-indigo-400"></i>
                Hover over your avatar to upload a new photo (max 2MB)
              </p>
            </div>
          </div>

          <!-- Profile Info Card -->
          <div class="card">
            <div class="card-header flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <i class="fa-solid fa-user text-indigo-400 text-sm"></i>
              </div>
              <div>
                <h2 class="font-semibold text-sm">Profile Information</h2>
                <p class="text-xs text-slate-500">Update your personal details</p>
              </div>
            </div>
            <div class="card-body">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="sm:col-span-2">
                  <label class="form-label">Full Name <span class="text-red-400">*</span></label>
                  <div class="relative">
                    <i class="fa-solid fa-user absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                    <input id="field-name" type="text" class="form-input pl-9" value="${user?.name || ''}" placeholder="Your full name"/>
                  </div>
                </div>
                <div>
                  <label class="form-label">Organization</label>
                  <div class="relative">
                    <i class="fa-solid fa-building absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                    <input id="field-org" type="text" class="form-input pl-9" value="${user?.organization || ''}" placeholder="School / Company / Barangay"/>
                  </div>
                </div>
                <div>
                  <label class="form-label">Department</label>
                  <div class="relative">
                    <i class="fa-solid fa-sitemap absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                    <input id="field-dept" type="text" class="form-input pl-9" value="${user?.department || ''}" placeholder="Department or Section"/>
                  </div>
                </div>
                <div class="sm:col-span-2">
                  <label class="form-label">Phone</label>
                  <div class="relative">
                    <i class="fa-solid fa-phone absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                    <input id="field-phone" type="text" class="form-input pl-9" value="${user?.phone || ''}" placeholder="+63 9XX XXX XXXX"/>
                  </div>
                </div>
              </div>

              <div class="flex justify-end mt-5">
                <button id="btn-save-profile" class="btn btn-primary gap-2">
                  <i class="fa-solid fa-floppy-disk"></i>Save Changes
                </button>
              </div>
            </div>
          </div>

          <!-- Change Password Card -->
          <div class="card">
            <div class="card-header flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <i class="fa-solid fa-lock text-purple-400 text-sm"></i>
              </div>
              <div>
                <h2 class="font-semibold text-sm">Change Password</h2>
                <p class="text-xs text-slate-500">Keep your account secure</p>
              </div>
            </div>
            <div class="card-body">
              <div class="space-y-4">
                <div>
                  <label class="form-label">Current Password</label>
                  <div class="relative">
                    <i class="fa-solid fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                    <input id="field-current-pw" type="password" class="form-input pl-9 pr-10" placeholder="Enter current password"/>
                    <button type="button" class="pw-toggle absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300" data-target="field-current-pw">
                      <i class="fa-solid fa-eye text-sm"></i>
                    </button>
                  </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="form-label">New Password</label>
                    <div class="relative">
                      <i class="fa-solid fa-key absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                      <input id="field-new-pw" type="password" class="form-input pl-9 pr-10" placeholder="Min 6 characters"/>
                      <button type="button" class="pw-toggle absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300" data-target="field-new-pw">
                        <i class="fa-solid fa-eye text-sm"></i>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label class="form-label">Confirm New Password</label>
                    <div class="relative">
                      <i class="fa-solid fa-key absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                      <input id="field-confirm-pw" type="password" class="form-input pl-9 pr-10" placeholder="Repeat new password"/>
                      <button type="button" class="pw-toggle absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300" data-target="field-confirm-pw">
                        <i class="fa-solid fa-eye text-sm"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Password strength bar -->
                <div id="pw-strength-wrap" class="hidden">
                  <div class="flex gap-1 mt-1">
                    <div class="h-1 flex-1 rounded-full bg-slate-700" id="ps1"></div>
                    <div class="h-1 flex-1 rounded-full bg-slate-700" id="ps2"></div>
                    <div class="h-1 flex-1 rounded-full bg-slate-700" id="ps3"></div>
                    <div class="h-1 flex-1 rounded-full bg-slate-700" id="ps4"></div>
                  </div>
                  <p class="text-xs text-slate-500 mt-1" id="pw-strength-label"></p>
                </div>
              </div>

              <div class="flex justify-end mt-5">
                <button id="btn-change-pw" class="btn btn-primary gap-2">
                  <i class="fa-solid fa-shield-halved"></i>Update Password
                </button>
              </div>
            </div>
          </div>

          <!-- Account Info (read-only) -->
          <div class="card">
            <div class="card-header flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <i class="fa-solid fa-circle-info text-cyan-400 text-sm"></i>
              </div>
              <div>
                <h2 class="font-semibold text-sm">Account Details</h2>
                <p class="text-xs text-slate-500">Read-only account information</p>
              </div>
            </div>
            <div class="card-body">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                ${infoRow('fa-at', 'Username', '@' + (user?.username || '—'))}
                ${infoRow('fa-shield-halved', 'Role', roleLabel)}
                ${infoRow('fa-calendar', 'Member Since', user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—')}
                ${infoRow('fa-circle-check', 'Account Status', user?.isActive ? '<span class="text-emerald-400">Active</span>' : '<span class="text-red-400">Inactive</span>')}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  `;

  initSidebar();
  initAvatarUpload();
  initProfileSave();
  initPasswordChange();
  initPasswordToggles();
  initPasswordStrength();
}

function infoRow(icon, label, value) {
  return `
    <div class="flex items-center gap-3 p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--border)]">
      <i class="fa-solid ${icon} text-slate-400 w-4 text-center text-sm"></i>
      <div class="min-w-0">
        <div class="text-xs text-slate-500">${label}</div>
        <div class="text-sm font-medium truncate">${value}</div>
      </div>
    </div>`;
}

function initAvatarUpload() {
  const input = document.getElementById('avatar-input');
  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return showToast('Image must be under 2MB', 'error');

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('avatar-ring').innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover"/>`;
    };
    reader.readAsDataURL(file);

    // Upload
    const spinner = document.getElementById('avatar-upload-spinner');
    spinner.classList.remove('hidden');
    spinner.classList.add('flex');

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch('/api/auth/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      await refreshUser();
      // Update sidebar avatar initial too
      showToast('Profile photo updated', 'success');
    } catch (e) {
      showToast(e.message || 'Upload failed', 'error');
    } finally {
      spinner.classList.add('hidden');
      spinner.classList.remove('flex');
    }
  });
}

function initProfileSave() {
  document.getElementById('btn-save-profile').addEventListener('click', async () => {
    const btn = document.getElementById('btn-save-profile');
    const name = document.getElementById('field-name').value.trim();
    if (!name) return showToast('Name cannot be empty', 'error');

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>Saving...';
    try {
      await api.put('/auth/profile', {
        name,
        organization: document.getElementById('field-org').value.trim(),
        department: document.getElementById('field-dept').value.trim(),
        phone: document.getElementById('field-phone').value.trim(),
      });
      await refreshUser();
      document.getElementById('display-name').textContent = name;
      showToast('Profile updated successfully', 'success');
    } catch (e) {
      showToast(e.message || 'Failed to update profile', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>Save Changes';
    }
  });
}

function initPasswordChange() {
  document.getElementById('btn-change-pw').addEventListener('click', async () => {
    const btn = document.getElementById('btn-change-pw');
    const currentPassword = document.getElementById('field-current-pw').value;
    const newPassword = document.getElementById('field-new-pw').value;
    const confirmPassword = document.getElementById('field-confirm-pw').value;

    if (!currentPassword || !newPassword) return showToast('Fill in all password fields', 'error');
    if (newPassword.length < 6) return showToast('New password must be at least 6 characters', 'error');
    if (newPassword !== confirmPassword) return showToast('Passwords do not match', 'error');

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>Updating...';
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      showToast('Password updated successfully', 'success');
      ['field-current-pw', 'field-new-pw', 'field-confirm-pw'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('pw-strength-wrap').classList.add('hidden');
    } catch (e) {
      showToast(e.message || 'Failed to update password', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-shield-halved"></i>Update Password';
    }
  });
}

function initPasswordToggles() {
  document.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const isText = input.type === 'text';
      input.type = isText ? 'password' : 'text';
      btn.querySelector('i').className = `fa-solid ${isText ? 'fa-eye' : 'fa-eye-slash'} text-sm`;
    });
  });
}

function initPasswordStrength() {
  document.getElementById('field-new-pw').addEventListener('input', (e) => {
    const val = e.target.value;
    const wrap = document.getElementById('pw-strength-wrap');
    if (!val) { wrap.classList.add('hidden'); return; }
    wrap.classList.remove('hidden');

    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 10) score++;
    if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const colors = ['bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400'];
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    for (let i = 1; i <= 4; i++) {
      const bar = document.getElementById(`ps${i}`);
      bar.className = `h-1 flex-1 rounded-full ${i <= score ? colors[score - 1] : 'bg-slate-700'}`;
    }
    document.getElementById('pw-strength-label').textContent = `Password strength: ${labels[score - 1] || 'Too short'}`;
  });
}
