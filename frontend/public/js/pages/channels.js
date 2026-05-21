import { renderSidebar, initSidebar } from '../components/sidebar.js';
import { api } from '../services/api.js';
import { on, subscribeChannel } from '../services/websocket.js';
import { showToast } from '../utils/toast.js';
import { timeAgo } from '../utils/helpers.js';
import { getUser as authGetUser, isAdmin, refreshUser } from '../services/auth.js';

// Client-side bad word list — mirrors the backend base list for instant censoring
const _BAD_WORDS = [
  'fuck','fucker','fucking','fuk','shit','shitty','bitch','bitches','asshole','ass',
  'bastard','damn','crap','dick','cock','pussy','whore','slut','hoe','nigger','nigga',
  'faggot','fag','retard','retarded','idiot','moron','stupid','kill yourself','kys',
  'ugly','loser','worthless','useless',
  'putang ina','putangina','puta','gago','gaga','gagong','bobo','boba','tanga','tangina',
  'ulol','ulul','leche','letse','pakyu','pak yu','pakyo','tarantado','hayop','hayup',
  'inutil','walang kwenta','bwisit','bwiset','lintik','kupal','hindot','kantot','pakshet','siraulo','sira ulo',
];

function _clientCensor(text) {
  let result = text;
  _BAD_WORDS.forEach(word => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '[\\s_-]*');
    result = result.replace(new RegExp(escaped, 'gi'), '####');
  });
  return result;
}

function _hasBadWord(text) {
  return _BAD_WORDS.some(word => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '[\\s_-]*');
    return new RegExp(escaped, 'gi').test(text);
  });
}
let activeChannel = null;
let activeChannelData = null;
let _rateLimitUntil = 0;
let _replyTo = null; // { _id, senderName, content }

export function renderChannels(app) {
  app.innerHTML = `
    ${renderSidebar('/channels')}
    <div class="main-content flex flex-col" style="height:100vh">
      <header class="sticky top-0 z-40 glass border-b border-white/5 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div class="flex items-center gap-2">
          <button onclick="toggleSidebar()" class="mobile-menu-btn btn btn-ghost p-2">
            <i class="fa-solid fa-bars"></i>
          </button>
          <button id="back-to-channels" onclick="showChannelList()" class="hidden btn btn-ghost p-2 text-sm">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h1 class="text-base font-bold" id="header-title">Channels</h1>
            <p class="text-xs text-slate-500 hidden sm:block">Real-time messaging</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          ${isAdmin() ? `
          <button id="pending-requests-btn" onclick="openChannelRequests()" class="btn btn-ghost text-sm border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hidden">
            <i class="fa-solid fa-clock"></i> <span class="hidden sm:inline">Requests</span>
          </button>
          <button onclick="openGlobalBroadcast()" class="btn btn-ghost text-sm border border-purple-500/40 text-purple-400 hover:bg-purple-500/10">
            <i class="fa-solid fa-bullhorn"></i> <span class="hidden sm:inline">Broadcast</span>
          </button>
          <button onclick="openCreateChannel()" class="btn btn-primary text-sm">
            <i class="fa-solid fa-plus"></i> <span class="hidden sm:inline">New Channel</span>
          </button>` : `
          <button onclick="openRequestChannel()" class="btn btn-primary text-sm">
            <i class="fa-solid fa-plus"></i> <span class="hidden sm:inline">Request Channel</span>
          </button>`}
        </div>
      </header>

      <div class="flex flex-1 overflow-hidden relative">
        <!-- Channel list -->
        <div id="channel-panel" class="w-full sm:w-72 border-r border-white/5 flex flex-col flex-shrink-0 absolute sm:relative inset-0 sm:inset-auto z-10" style="background:var(--bg-primary)">
          <div class="p-2 border-b border-white/5">
            <input type="text" class="input py-2 text-sm" placeholder="Search channels..." id="channel-search"/>
          </div>
          <div id="channel-list" class="flex-1 overflow-y-auto p-2 space-y-1">
            <div class="text-center py-8"><div class="spinner mx-auto"></div></div>
          </div>
        </div>

        <!-- Chat area -->
        <div id="chat-panel" class="flex-1 flex flex-col overflow-hidden hidden sm:flex">
          <div id="chat-header" class="px-4 py-3 border-b border-white/5 flex items-center gap-3 flex-shrink-0">
            <div class="text-slate-500 text-sm">Select a channel to start messaging</div>
          </div>
          <div id="messages-container" class="flex-1 overflow-y-auto p-3 space-y-2">
            <div class="text-center py-16 text-slate-600">
              <div class="text-5xl mb-3">💬</div>
              <p class="text-sm">Select a channel to view messages</p>
            </div>
          </div>
          <div id="message-input-area" class="p-3 border-t border-white/5 hidden"></div>
        </div>
      </div>
    </div>

    <!-- Request Channel Modal (users) -->
    <div id="request-channel-modal" class="modal-overlay hidden">
      <div class="modal p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold">📋 Request New Channel</h2>
          <button onclick="document.getElementById('request-channel-modal').classList.add('hidden')" class="text-slate-400 hover:text-white text-xl">&times;</button>
        </div>
        <p class="text-sm text-slate-400 mb-4">Your request will be sent to the Super Admin for approval.</p>
        <form id="request-channel-form" class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1">Channel Name *</label>
            <input type="text" id="req-channel-name" class="input" placeholder="e.g. Study Group A" required/>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <input type="text" id="req-channel-desc" class="input" placeholder="What is this channel for?"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1">Icon</label>
            <input type="text" id="req-channel-icon" class="input" value="📡" placeholder="Emoji"/>
          </div>
          <div class="flex gap-3 pt-1">
            <button type="submit" class="btn btn-primary flex-1">Send Request</button>
            <button type="button" onclick="document.getElementById('request-channel-modal').classList.add('hidden')" class="btn btn-ghost">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Pending Channel Requests Modal (superadmin) -->
    <div id="channel-requests-modal" class="modal-overlay hidden">
      <div class="modal p-5" style="max-width:520px">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold">📋 Pending Channel Requests</h2>
          <button onclick="document.getElementById('channel-requests-modal').classList.add('hidden')" class="text-slate-400 hover:text-white text-xl">&times;</button>
        </div>
        <div id="channel-requests-list" class="space-y-3 max-h-96 overflow-y-auto">
          <div class="text-center py-6"><div class="spinner mx-auto"></div></div>
        </div>
      </div>
    </div>

    <!-- Global Broadcast Modal -->
    <div id="global-broadcast-modal" class="modal-overlay hidden">
      <div class="modal p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold">📢 Global Broadcast</h2>
          <button onclick="document.getElementById('global-broadcast-modal').classList.add('hidden')" class="text-slate-400 hover:text-white text-xl">&times;</button>
        </div>
        <p class="text-sm text-slate-400 mb-4">This message will be sent to <strong class="text-white">all connected users</strong> as a pop-up notification instantly.</p>
        <textarea id="global-broadcast-input" class="input resize-none h-28 text-sm" placeholder="Type your message to all users..."></textarea>
        <div class="flex gap-3 mt-4">
          <button onclick="sendGlobalBroadcast()" class="btn btn-primary flex-1"><i class="fa-solid fa-bullhorn"></i> Send to Everyone</button>
          <button onclick="document.getElementById('global-broadcast-modal').classList.add('hidden')" class="btn btn-ghost">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Edit Channel Modal -->
    <div id="edit-channel-modal" class="modal-overlay hidden">
      <div class="modal p-5">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-bold">✏️ Edit Channel</h2>
          <button onclick="document.getElementById('edit-channel-modal').classList.add('hidden')" class="text-slate-400 hover:text-white text-xl">×</button>
        </div>
        <form id="edit-channel-form" class="space-y-4">
          <input type="hidden" id="edit-channel-id"/>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1">Channel Name</label>
            <input type="text" id="edit-channel-name" class="input" required/>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <input type="text" id="edit-channel-desc" class="input"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1">Icon</label>
            <input type="text" id="edit-channel-icon" class="input"/>
          </div>
          <div class="flex gap-3 pt-1">
            <button type="submit" class="btn btn-primary flex-1">Save</button>
            <button type="button" onclick="document.getElementById('edit-channel-modal').classList.add('hidden')" class="btn btn-ghost">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Create Channel Modal -->
    <div id="create-channel-modal" class="modal-overlay hidden">
      <div class="modal p-5">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-bold">📡 Create Channel</h2>
          <button onclick="closeChannelModal()" class="text-slate-400 hover:text-white text-xl">×</button>
        </div>
        <form id="channel-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1">Channel Name</label>
            <input type="text" id="channel-name" class="input" placeholder="e.g. Typhoon Response Team" required/>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <input type="text" id="channel-desc" class="input" placeholder="Channel purpose..."/>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1">Type</label>
              <select id="channel-type" class="input">
                <option value="public">🌐 Public</option>
                <option value="private">🔒 Private</option>
                ${isAdmin() ? `<option value="emergency">🚨 Emergency</option><option value="broadcast">📢 Broadcast</option>` : ''}
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1">Icon</label>
              <input type="text" id="channel-icon" class="input" value="📡" placeholder="Emoji"/>
            </div>
          </div>
          <div class="flex gap-3 pt-1">
            <button type="submit" class="btn btn-primary flex-1">Create</button>
            <button type="button" onclick="closeChannelModal()" class="btn btn-ghost">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;

  initSidebar();
  loadChannels();
  if (isAdmin()) loadChannelRequests();

  // Mobile: show channel list, hide chat
  window.showChannelList = () => {
    document.getElementById('channel-panel')?.classList.remove('hidden');
    document.getElementById('chat-panel')?.classList.add('hidden');
    document.getElementById('chat-panel')?.classList.remove('flex');
    document.getElementById('back-to-channels')?.classList.add('hidden');
    document.getElementById('header-title').textContent = 'Channels';
    if (window.innerWidth < 640) {
      document.getElementById('channel-panel').style.display = 'flex';
      document.getElementById('channel-panel').style.flexDirection = 'column';
    }
  };

  // Mobile: hide channel list, show chat
  window.showChatPanel = (name) => {
    if (window.innerWidth < 640) {
      document.getElementById('channel-panel').style.display = 'none';
      const chat = document.getElementById('chat-panel');
      chat?.classList.remove('hidden');
      chat?.classList.add('flex');
      document.getElementById('back-to-channels')?.classList.remove('hidden');
      document.getElementById('header-title').textContent = name;
    }
  };

  // Auto-subscribe to emergency channel on load
  on('EMERGENCY_CHANNEL', (data) => {
    if (data.channelId) subscribeChannel(data.channelId);
  });

  on('NEW_MESSAGE', (data) => {
    if (activeChannel && data.data) {
      const msgChannelId = data.data.channel?._id || data.data.channel;
      if (msgChannelId === activeChannel) {
        const user = authGetUser();
        const senderId = data.data.sender?._id || data.data.sender;
        if (senderId !== user?._id) appendMessage(data.data);
      }
    }
  });

  on('MESSAGE_EDITED', (data) => {
    if (!data.data) return;
    const el = document.getElementById(`msg-${data.data._id}`);
    if (el) el.outerHTML = renderMessage(data.data);
  });

  on('MESSAGE_DELETED', (data) => {
    if (!data.data?._id) return;
    document.getElementById(`msg-${data.data._id}`)?.remove();
  });

  on('CHAT_WARNING', (data) => {
    showWarningToast({ warningCount: data.warningCount, muted: data.muted, muteMins: data.muteMins, muteEndsAt: data.muteEndsAt });
    if (data.muted) _lockInputMuted(data.muteEndsAt);
  });

  document.getElementById('channel-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api.post('/channels', {
        name: document.getElementById('channel-name').value,
        description: document.getElementById('channel-desc').value,
        type: document.getElementById('channel-type').value,
        icon: document.getElementById('channel-icon').value,
      });
      showToast('Channel created!', 'success');
      closeChannelModal();
      loadChannels();
    } catch (err) {
      showToast(err.message || 'Failed to create channel', 'error');
    }
  });

  window.openCreateChannel = () => document.getElementById('create-channel-modal').classList.remove('hidden');
  window.closeChannelModal = () => document.getElementById('create-channel-modal').classList.add('hidden');
  window.openGlobalBroadcast = () => document.getElementById('global-broadcast-modal').classList.remove('hidden');
  window.sendGlobalBroadcast = async () => {
    const msg = document.getElementById('global-broadcast-input')?.value?.trim();
    if (!msg) { showToast('Please enter a message', 'warning'); return; }
    try {
      await api.post('/channels/global-broadcast', { message: msg });
      document.getElementById('global-broadcast-modal').classList.add('hidden');
      document.getElementById('global-broadcast-input').value = '';
      showToast('📢 Broadcast sent to all users', 'success');
    } catch (err) { showToast(err.message || 'Failed to send broadcast', 'error'); }
  };

  window.openRequestChannel = () => document.getElementById('request-channel-modal').classList.remove('hidden');

  window.openChannelRequests = async () => {
    document.getElementById('channel-requests-modal').classList.remove('hidden');
    await loadChannelRequests();
  };

  window.reviewChannelRequest = async (id, action) => {
    const note = action === 'reject' ? (prompt('Reason for rejection (optional):') || '') : '';
    try {
      await api.patch(`/channels/requests/${id}/review`, { action, reviewNote: note });
      showToast(action === 'approve' ? '✅ Channel approved and created' : '❌ Request rejected', action === 'approve' ? 'success' : 'error');
      await loadChannelRequests();
      loadChannels();
    } catch (err) { showToast(err.message || 'Failed to review request', 'error'); }
  };

  document.getElementById('request-channel-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api.post('/channels/requests', {
        name: document.getElementById('req-channel-name').value,
        description: document.getElementById('req-channel-desc').value,
        icon: document.getElementById('req-channel-icon').value,
      });
      showToast('📋 Request sent! Waiting for Super Admin approval.', 'success');
      document.getElementById('request-channel-modal').classList.add('hidden');
      e.target.reset();
    } catch (err) { showToast(err.message || 'Failed to send request', 'error'); }
  });

  // Superadmin: show pending requests badge on CHANNEL_REQUEST event
  on('CHANNEL_REQUEST', () => {
    const btn = document.getElementById('pending-requests-btn');
    if (btn) btn.classList.remove('hidden');
  });
  window.selectChannel = selectChannel;
  window.sendMessage = sendMessage;

  window.openEditChannel = (id, name, desc, icon) => {
    document.getElementById('edit-channel-id').value = id;
    document.getElementById('edit-channel-name').value = name;
    document.getElementById('edit-channel-desc').value = desc;
    document.getElementById('edit-channel-icon').value = icon;
    document.getElementById('edit-channel-modal').classList.remove('hidden');
  };

  window.confirmDeleteChannel = async (id, name) => {
    if (!confirm(`Delete channel "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/channels/${id}`);
      showToast('Channel deleted', 'success');
      if (activeChannel === id) {
        activeChannel = null;
        document.getElementById('chat-panel').classList.add('hidden');
      }
      loadChannels();
    } catch (err) { showToast(err.message || 'Failed to delete', 'error'); }
  };

  document.getElementById('edit-channel-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-channel-id').value;
    try {
      await api.patch(`/channels/${id}`, {
        name: document.getElementById('edit-channel-name').value,
        description: document.getElementById('edit-channel-desc').value,
        icon: document.getElementById('edit-channel-icon').value,
      });
      showToast('Channel updated', 'success');
      document.getElementById('edit-channel-modal').classList.add('hidden');
      loadChannels();
    } catch (err) { showToast(err.message || 'Failed to update', 'error'); }
  });
}

async function loadChannelRequests() {
  const list = document.getElementById('channel-requests-list');
  if (!list) return;
  try {
    const res = await api.get('/channels/requests', { status: 'pending' });
    const requests = res.data.filter(r => r.status === 'pending');
    // Update badge visibility
    const btn = document.getElementById('pending-requests-btn');
    if (btn) btn.classList.toggle('hidden', requests.length === 0);
    if (!requests.length) {
      list.innerHTML = `<div class="text-center py-8 text-slate-500 text-sm">✅ No pending requests</div>`;
      return;
    }
    list.innerHTML = requests.map(r => `
      <div class="glass rounded-xl border border-white/8 p-4">
        <div class="flex items-start gap-3">
          <span class="text-2xl">${r.icon || '📡'}</span>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-sm">${r.name}</div>
            <div class="text-xs text-slate-400">${r.description || 'No description'}</div>
            <div class="text-xs text-slate-500 mt-1">Requested by <span class="text-indigo-400">${r.requestedBy?.name}</span> · ${new Date(r.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
        <div class="flex gap-2 mt-3">
          <button onclick="reviewChannelRequest('${r._id}', 'approve')" class="btn btn-primary text-xs flex-1 py-1.5">✅ Approve</button>
          <button onclick="reviewChannelRequest('${r._id}', 'reject')" class="btn btn-ghost text-xs flex-1 py-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/10">❌ Reject</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = `<div class="text-center py-8 text-red-400 text-sm">Failed to load requests</div>`;
  }
}

async function loadChannels() {
  try {
    const res = await api.get('/channels');
    const list = document.getElementById('channel-list');
    if (!list) return;

    if (!res.data.length) {
      list.innerHTML = `<div class="text-center py-8 text-slate-500 text-sm">No channels yet</div>`;
      return;
    }

    // Auto-subscribe to all emergency channels for real-time alert messages
    res.data.filter(ch => ch.type === 'emergency').forEach(ch => subscribeChannel(ch._id));

    const typeBadge = (ch) => {
      const cfg = {
        emergency: 'bg-red-500/20 text-red-400',
        broadcast: 'bg-orange-500/20 text-orange-400',
        private: 'bg-purple-500/20 text-purple-400',
        public: 'bg-white/5 text-slate-500',
      };
      return `<span class="text-xs px-1.5 py-0.5 rounded-full ${cfg[ch.type] || 'bg-white/5 text-slate-500'}">${ch.type}</span>`;
    };

    list.innerHTML = res.data.map(ch => `
      <div class="nav-item cursor-pointer group/ch ${activeChannel === ch._id ? 'active' : ''}" id="ch-${ch._id}">
        <span class="text-lg" onclick="selectChannel('${ch._id}', '${ch.name.replace(/'/g, "\\'")}'  , '${ch.icon || '📡'}')">${ch.icon || '📡'}</span>
        <div class="flex-1 min-w-0" onclick="selectChannel('${ch._id}', '${ch.name.replace(/'/g, "\\'")}'  , '${ch.icon || '📡'}')">
          <div class="text-sm font-medium truncate">${ch.name}</div>
          <div class="text-xs text-slate-500">${ch.members?.length || 0} members</div>
        </div>
        ${typeBadge(ch)}
        ${isAdmin() ? `
        <div class="flex gap-1 opacity-0 group-hover/ch:opacity-100 transition-opacity flex-shrink-0">
          <button onclick="event.stopPropagation();openEditChannel('${ch._id}','${ch.name.replace(/'/g,"\\'")}'  ,'${ch.description?.replace(/'/g,"\\'") || ''}','${ch.icon || '📡'}')" 
            class="w-6 h-6 rounded-full bg-white/10 hover:bg-amber-500/40 flex items-center justify-center text-slate-400 hover:text-amber-300" title="Edit">
            <i class="fa-solid fa-pen text-xs"></i>
          </button>
          <button onclick="event.stopPropagation();confirmDeleteChannel('${ch._id}','${ch.name.replace(/'/g,"\\'")}'  )" 
            class="w-6 h-6 rounded-full bg-white/10 hover:bg-red-500/40 flex items-center justify-center text-slate-400 hover:text-red-400" title="Delete">
            <i class="fa-solid fa-trash text-xs"></i>
          </button>
        </div>` : ''}
      </div>
    `).join('');
  } catch (err) {
    showToast('Failed to load channels', 'error');
  }
}

async function selectChannel(id, name, icon) {
  activeChannel = id;
  subscribeChannel(id);

  // Show chat panel on mobile
  window.showChatPanel?.(name);

  const listRes = await api.get('/channels').catch(() => ({ data: [] }));
  activeChannelData = listRes.data.find(c => c._id === id) || { _id: id, name, icon, type: 'public' };

  document.querySelectorAll('[id^="ch-"]').forEach(el => el.classList.remove('active'));
  document.getElementById(`ch-${id}`)?.classList.add('active');

  // Make chat panel visible on desktop too
  const chatPanel = document.getElementById('chat-panel');
  chatPanel?.classList.remove('hidden');
  chatPanel?.classList.add('flex');

  const readOnly = !isAdmin() && (activeChannelData.type === 'emergency' || activeChannelData.type === 'broadcast');
  const typeLabels = { emergency: '🚨 Emergency', broadcast: '📢 Broadcast', public: '🌐 Public', private: '🔒 Private' };

  document.getElementById('chat-header').innerHTML = `
    <span class="text-xl">${icon}</span>
    <div class="flex-1 min-w-0">
      <div class="font-bold text-sm truncate">${name}</div>
      <div class="text-xs text-slate-500">${typeLabels[activeChannelData.type] || activeChannelData.type}</div>
    </div>
    ${readOnly ? `<div class="px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-1"><i class="fa-solid fa-lock text-xs"></i> Read-only</div>` : ''}
    <div class="flex items-center gap-1.5 flex-shrink-0">
      <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
      <span class="text-xs text-emerald-400">Live</span>
    </div>
  `;

  const inputArea = document.getElementById('message-input-area');
  if (readOnly) {
    inputArea.classList.remove('hidden');
    inputArea.innerHTML = `
      <div class="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
        <i class="fa-solid fa-lock"></i>
        <span>This channel is read-only. Only instructors can post here.</span>
        <button onclick="navigate('/dashboard')" class="ml-auto btn btn-danger text-xs py-1.5 px-3">📣 Report Status</button>
      </div>
    `;
  } else {
    inputArea.classList.remove('hidden');

    // Check mute state from fresh user data
    const freshUser = await refreshUser();
    const mutedUntil = freshUser?.mutedUntil ? new Date(freshUser.mutedUntil) : null;
    const isMuted = mutedUntil && mutedUntil > new Date();

    if (isMuted) {
      _lockInputMuted(mutedUntil);
    } else {
      inputArea.innerHTML = `
        <div class="flex gap-2 items-center">
          <input type="text" id="message-input" class="input flex-1 text-sm" placeholder="Message..." maxlength="500"/>
          <span id="char-count" class="text-xs text-slate-600 w-10 text-right flex-shrink-0 hidden sm:block">0/500</span>
          <button onclick="sendMessage()" class="btn btn-primary px-3">
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      `;
      const input = document.getElementById('message-input');
      input?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
      input?.addEventListener('input', () => {
        const count = document.getElementById('char-count');
        if (count) count.textContent = `${input.value.length}/500`;
      });
    }
  }

  await loadMessages(id);
}

async function loadMessages(channelId) {
  const container = document.getElementById('messages-container');
  container.innerHTML = `<div class="text-center py-8"><div class="spinner mx-auto"></div></div>`;
  try {
    const res = await api.get(`/channels/${channelId}/messages`);
    const messages = res.data;
    if (!messages.length) {
      container.innerHTML = `<div class="text-center py-12 text-slate-500"><div class="text-4xl mb-2">💬</div><p>No messages yet.</p></div>`;
      return;
    }
    container.innerHTML = messages.map(m => renderMessage(m)).join('');
    container.scrollTop = container.scrollHeight;
  } catch (err) {
    container.innerHTML = `<div class="text-center py-8 text-red-400">Failed to load messages</div>`;
  }
}

function renderMessage(msg) {
  const user = authGetUser();
  const isOwn = msg.sender?._id === user?._id || msg.sender === user?._id;
  const isAlert = msg.type === 'alert';
  const isAdminUser = isAdmin();
  const canDelete = isOwn || isAdminUser;
  const canEdit = isOwn || isAdminUser;
  const priorityBorder = { critical: 'border-l-4 border-red-500', high: 'border-l-4 border-yellow-500' }[msg.priority] || '';

  const quotedBubble = msg.replyTo?._id ? `
    <div class="mb-2 px-3 py-2 rounded-xl border-l-4 border-indigo-400 bg-white/5 cursor-pointer"
         onclick="document.getElementById('msg-${msg.replyTo._id}')?.scrollIntoView({behavior:'smooth',block:'center'})">
      <div class="text-xs font-bold text-indigo-400 mb-0.5">${msg.replyTo.senderName || 'Unknown'}</div>
      <div class="text-xs text-slate-400 line-clamp-2">${msg.replyTo.content || ''}</div>
    </div>
  ` : '';

  const actionBtns = !isAlert ? `
    <div class="absolute ${isOwn ? '-left-20' : '-right-20'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
      <button onclick="setReply('${msg._id}', '${(msg.sender?.name || 'Unknown').replace(/'/g, "\\'")}')"
        class="w-7 h-7 rounded-full bg-white/10 hover:bg-indigo-500/40 flex items-center justify-center text-slate-400 hover:text-white" title="Reply">
        <i class="fa-solid fa-reply text-xs"></i>
      </button>
      ${canEdit ? `
      <button onclick="startEditMessage('${msg._id}')"
        class="w-7 h-7 rounded-full bg-white/10 hover:bg-amber-500/40 flex items-center justify-center text-slate-400 hover:text-amber-300" title="Edit">
        <i class="fa-solid fa-pen text-xs"></i>
      </button>` : ''}
      ${canDelete ? `
      <button onclick="confirmDeleteMessage('${msg._id}')"
        class="w-7 h-7 rounded-full bg-white/10 hover:bg-red-500/40 flex items-center justify-center text-slate-400 hover:text-red-400" title="Delete">
        <i class="fa-solid fa-trash text-xs"></i>
      </button>` : ''}
    </div>
  ` : '';

  return `
    <div class="flex ${isOwn ? 'justify-end' : 'justify-start'} gap-2 group" id="msg-${msg._id}">
      ${!isOwn ? `<div class="w-7 h-7 rounded-full ${isAlert ? 'bg-red-500' : 'bg-gradient-to-br from-indigo-500 to-purple-600'} flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">${isAlert ? '🚨' : (msg.sender?.name?.charAt(0) || '?')}</div>` : ''}
      <div class="max-w-[72vw] sm:max-w-xs lg:max-w-md">
        ${!isOwn ? `<div class="text-xs text-slate-500 mb-1 ml-1">${isAlert ? '🚨 Emergency Alert' : (msg.sender?.name || 'Unknown')}</div>` : ''}
        <div class="relative">
          <div class="px-3 py-2 rounded-2xl text-sm ${isOwn ? 'bg-indigo-600 text-white rounded-tr-sm' : `glass border border-white/8 rounded-tl-sm ${isAlert ? 'border-red-500/40 bg-red-500/5' : ''}`} ${priorityBorder}">
            ${isAlert ? '<div class="text-xs font-bold text-red-400 mb-1">🚨 EMERGENCY</div>' : (msg.priority === 'critical' ? '<div class="text-xs font-bold text-red-400 mb-1">⚠️ CRITICAL</div>' : '')}
            ${quotedBubble}
            <p class="text-sm whitespace-pre-line break-words">${msg.content}</p>
            ${msg.hasProfanity ? '<div class="text-xs text-amber-400/70 mt-1"><i class="fa-solid fa-triangle-exclamation text-xs"></i> Censored</div>' : ''}
            ${msg.isEdited ? `<div class="text-xs text-slate-500 mt-0.5 italic">edited</div>` : ''}
          </div>
          <!-- Action buttons — shown below message on mobile, hover on desktop -->
          ${!isAlert ? `
          <div class="flex gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'} sm:hidden">
            <button onclick="setReply('${msg._id}', '${(msg.sender?.name || 'Unknown').replace(/'/g, "\\'")}')"
              class="px-2 py-0.5 rounded-full bg-white/10 text-slate-400 text-xs">↩ Reply</button>
            ${canEdit ? `<button onclick="startEditMessage('${msg._id}')" class="px-2 py-0.5 rounded-full bg-white/10 text-slate-400 text-xs">✏️</button>` : ''}
            ${canDelete ? `<button onclick="confirmDeleteMessage('${msg._id}')" class="px-2 py-0.5 rounded-full bg-white/10 text-red-400 text-xs">🗑️</button>` : ''}
          </div>
          <div class="absolute ${isOwn ? '-left-20' : '-right-20'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity gap-1 hidden sm:flex">
            <button onclick="setReply('${msg._id}', '${(msg.sender?.name || 'Unknown').replace(/'/g, "\\'")}')"
              class="w-7 h-7 rounded-full bg-white/10 hover:bg-indigo-500/40 flex items-center justify-center text-slate-400 hover:text-white" title="Reply">
              <i class="fa-solid fa-reply text-xs"></i>
            </button>
            ${canEdit ? `
            <button onclick="startEditMessage('${msg._id}')"
              class="w-7 h-7 rounded-full bg-white/10 hover:bg-amber-500/40 flex items-center justify-center text-slate-400 hover:text-amber-300" title="Edit">
              <i class="fa-solid fa-pen text-xs"></i>
            </button>` : ''}
            ${canDelete ? `
            <button onclick="confirmDeleteMessage('${msg._id}')"
              class="w-7 h-7 rounded-full bg-white/10 hover:bg-red-500/40 flex items-center justify-center text-slate-400 hover:text-red-400" title="Delete">
              <i class="fa-solid fa-trash text-xs"></i>
            </button>` : ''}
          </div>` : ''}
        </div>
        <div class="text-xs text-slate-600 mt-0.5 ${isOwn ? 'text-right' : 'ml-1'}">${timeAgo(msg.createdAt)}</div>
      </div>
    </div>
  `;
}

function appendMessage(msg) {
  const container = document.getElementById('messages-container');
  if (!container) return;
  const emptyState = container.querySelector('.text-center');
  if (emptyState) container.innerHTML = '';
  container.insertAdjacentHTML('beforeend', renderMessage(msg));
  container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
  if (!activeChannel) return;
  const input = document.getElementById('message-input');
  const content = input?.value?.trim();
  if (!content) return;

  // Client-side rate limit feedback
  if (Date.now() < _rateLimitUntil) {
    const wait = Math.ceil((_rateLimitUntil - Date.now()) / 1000);
    showToast(`⏳ Wait ${wait}s before sending again`, 'error');
    return;
  }

  input.value = '';
  const countEl = document.getElementById('char-count');
  if (countEl) countEl.textContent = '0/500';

  const user = authGetUser();
  const tempId = 'temp-' + Date.now();
  const hasBad = _hasBadWord(content);
  const displayContent = hasBad ? _clientCensor(content) : content;
  const replySnapshot = _replyTo ? { ..._replyTo } : null;

  // Clear reply state immediately
  cancelReply();

  // Show censored version immediately — sender never sees the original word
  appendMessage({
    _id: tempId,
    channel: activeChannel,
    sender: { _id: user?._id, name: user?.name },
    content: displayContent,
    hasProfanity: hasBad,
    replyTo: replySnapshot,
    priority: 'normal',
    createdAt: new Date().toISOString(),
  });

  // Show warning toast instantly to the sender (server will confirm and send CHAT_WARNING via WS)
  if (hasBad) showWarningToast({ warningCount: null, muted: false });

  try {
    const res = await api.post(`/channels/${activeChannel}/messages`, {
      content,
      ...(replySnapshot ? { replyTo: replySnapshot } : {}),
    });
    if (!isAdmin()) _rateLimitUntil = Date.now() + 5000;
    const tempEl = document.getElementById(`msg-${tempId}`);
    if (tempEl) tempEl.outerHTML = renderMessage(res.data);
    if (res.warned) showWarningToast(res.warningInfo);
  } catch (err) {
    // If muted, show mute banner instead of generic error
    if (err.message?.includes('muted') || err.message?.includes('You are muted')) {
      showMuteBanner(err.message);
    } else {
      showToast(err.message || 'Failed to send message', 'error');
    }
    document.getElementById(`msg-${tempId}`)?.remove();
    input.value = content;
  }
}

window.setReply = (msgId, senderName) => {
  const msgEl = document.getElementById(`msg-${msgId}`);
  const content = msgEl?.querySelector('p')?.textContent?.trim() || '';
  _replyTo = { _id: msgId, senderName, content };

  // Show reply preview bar above input
  let bar = document.getElementById('reply-bar');
  if (!bar) {
    const inputArea = document.getElementById('message-input-area');
    bar = document.createElement('div');
    bar.id = 'reply-bar';
    inputArea.prepend(bar);
  }
  bar.innerHTML = `
    <div class="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
      <i class="fa-solid fa-reply text-indigo-400 text-xs"></i>
      <div class="flex-1 min-w-0">
        <div class="text-xs font-bold text-indigo-400">${senderName}</div>
        <div class="text-xs text-slate-400 truncate">${content}</div>
      </div>
      <button onclick="cancelReply()" class="text-slate-500 hover:text-white text-sm">&times;</button>
    </div>
  `;
  document.getElementById('message-input')?.focus();
};

window.cancelReply = () => {
  _replyTo = null;
  document.getElementById('reply-bar')?.remove();
};

window.startEditMessage = (msgId) => {
  const msgEl = document.getElementById(`msg-${msgId}`);
  if (!msgEl) return;
  const p = msgEl.querySelector('p');
  const currentText = p?.textContent?.trim() || '';

  // Replace the <p> with an inline edit input
  const bubble = p.closest('.px-3');
  const originalHTML = bubble.innerHTML;

  bubble.innerHTML = `
    <div class="space-y-2">
      <textarea id="edit-input-${msgId}" class="w-full bg-white/10 rounded-xl px-3 py-2 text-sm text-white resize-none border border-indigo-400/50 focus:outline-none focus:border-indigo-400" rows="2" maxlength="500">${currentText}</textarea>
      <div class="flex gap-2 justify-end">
        <button onclick="submitEdit('${msgId}')"
          class="btn btn-primary text-xs py-1 px-3">Save</button>
        <button onclick="cancelEdit('${msgId}', \`${originalHTML.replace(/`/g, '\\`')}\`)"
          class="btn btn-ghost text-xs py-1 px-3">Cancel</button>
      </div>
    </div>
  `;
  const ta = document.getElementById(`edit-input-${msgId}`);
  ta?.focus();
  ta?.setSelectionRange(ta.value.length, ta.value.length);
  ta?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit(msgId); }
    if (e.key === 'Escape') cancelEdit(msgId, originalHTML);
  });
};

window.cancelEdit = (msgId, originalHTML) => {
  const msgEl = document.getElementById(`msg-${msgId}`);
  const bubble = msgEl?.querySelector('.px-4');
  if (bubble) bubble.innerHTML = originalHTML;
};

window.submitEdit = async (msgId) => {
  const content = document.getElementById(`edit-input-${msgId}`)?.value?.trim();
  if (!content) return;
  try {
    const res = await api.patch(`/channels/messages/${msgId}`, { content });
    const msgEl = document.getElementById(`msg-${msgId}`);
    if (msgEl) msgEl.outerHTML = renderMessage(res.data);
    if (res.warned) showWarningToast();
  } catch (err) {
    showToast(err.message || 'Failed to edit message', 'error');
  }
};

window.confirmDeleteMessage = async (msgId) => {
  if (!confirm('Delete this message?')) return;
  try {
    await api.delete(`/channels/messages/${msgId}`);
    document.getElementById(`msg-${msgId}`)?.remove();
  } catch (err) {
    showToast(err.message || 'Failed to delete message', 'error');
  }
};

function showWarningToast(info) {
  document.getElementById('profanity-warning')?.remove();
  const count = info?.warningCount || 1;
  const muted = info?.muted || false;
  const muteMins = info?.muteMins || 0;

  const el = document.createElement('div');
  el.id = 'profanity-warning';
  el.className = 'fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-sm';

  if (muted) {
    el.innerHTML = `
      <div class="flex items-start gap-4 px-5 py-4 rounded-2xl bg-red-600 text-white shadow-2xl border border-red-400">
        <span class="text-3xl flex-shrink-0">🔇</span>
        <div class="flex-1">
          <div class="font-black text-base">You have been muted for ${muteMins} minutes!</div>
          <div class="text-sm mt-0.5 opacity-90">This is warning #${count}. You used prohibited language too many times. You cannot send messages until the mute expires.</div>
        </div>
        <button onclick="document.getElementById('profanity-warning').remove()" class="text-white/60 hover:text-white text-xl">&times;</button>
      </div>
    `;
    // Also lock the input
    _lockInputMuted(info?.muteEndsAt);
  } else {
    const remaining = 3 - count;
    el.innerHTML = `
      <div class="flex items-start gap-4 px-5 py-4 rounded-2xl bg-amber-500 text-slate-900 shadow-2xl border border-amber-400">
        <span class="text-3xl flex-shrink-0">⚠️</span>
        <div class="flex-1">
          <div class="font-black text-base">Language Warning ${count}/3</div>
          <div class="text-sm mt-0.5 font-medium opacity-80">Your message was censored. ${remaining > 0 ? `${remaining} more warning${remaining > 1 ? 's' : ''} before you get muted.` : 'Next violation will mute you.'}</div>
        </div>
        <button onclick="document.getElementById('profanity-warning').remove()" class="text-slate-900/60 hover:text-slate-900 text-xl">&times;</button>
      </div>
    `;
  }
  document.body.appendChild(el);
  setTimeout(() => el?.remove(), muted ? 10000 : 7000);
}

function showMuteBanner(message) {
  document.getElementById('profanity-warning')?.remove();
  const el = document.createElement('div');
  el.id = 'profanity-warning';
  el.className = 'fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-sm';
  el.innerHTML = `
    <div class="flex items-start gap-4 px-5 py-4 rounded-2xl bg-red-600 text-white shadow-2xl border border-red-400">
      <span class="text-3xl flex-shrink-0">🔇</span>
      <div class="flex-1">
        <div class="font-black text-base">You are muted</div>
        <div class="text-sm mt-0.5 opacity-90">${message}</div>
      </div>
      <button onclick="document.getElementById('profanity-warning').remove()" class="text-white/60 hover:text-white text-xl">&times;</button>
    </div>
  `;
  document.body.appendChild(el);
  setTimeout(() => el?.remove(), 10000);
}

function _lockInputMuted(muteEndsAt) {
  const inputArea = document.getElementById('message-input-area');
  if (!inputArea) return;
  const endsAt = muteEndsAt ? new Date(muteEndsAt) : null;

  const render = () => {
    const remaining = endsAt ? Math.max(0, endsAt - Date.now()) : 0;
    if (remaining <= 0) {
      inputArea.innerHTML = `
        <div class="flex gap-2 items-center">
          <input type="text" id="message-input" class="input flex-1 text-sm" placeholder="Message..." maxlength="500"/>
          <span id="char-count" class="text-xs text-slate-600 w-10 text-right flex-shrink-0 hidden sm:block">0/500</span>
          <button onclick="sendMessage()" class="btn btn-primary px-3"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
      `;
      const input = document.getElementById('message-input');
      input?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
      input?.addEventListener('input', () => {
        const count = document.getElementById('char-count');
        if (count) count.textContent = `${input.value.length}/500`;
      });
      return;
    }
    inputArea.innerHTML = `
      <div class="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
        <i class="fa-solid fa-microphone-slash"></i>
        <span>You are muted. Chat unlocks in <span id="mute-countdown" class="font-bold">${_fmtMs(remaining)}</span></span>
      </div>
    `;
    setTimeout(render, 1000);
  };
  render();
}

function _fmtMs(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
