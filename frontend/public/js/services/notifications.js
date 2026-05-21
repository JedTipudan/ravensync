import { on } from './websocket.js';
import { getUser } from './auth.js';
import { showToast } from '../utils/toast.js';

const MAX = 50;
let notifications = JSON.parse(localStorage.getItem('rs_notifications') || '[]');
let unreadCount = notifications.filter(n => !n.read).length;
const listeners = [];

function save() {
  localStorage.setItem('rs_notifications', JSON.stringify(notifications.slice(0, MAX)));
  localStorage.setItem('rs_notif_unread', String(unreadCount));
}

function push(notif) {
  notifications.unshift({ ...notif, id: Date.now(), time: new Date().toISOString(), read: false });
  unreadCount++;
  save();
  listeners.forEach(fn => fn());
  triggerBrowserNotif(notif);
}

function triggerBrowserNotif(notif) {
  if (document.visibilityState === 'visible') return; // only when tab is hidden
  if (Notification.permission === 'granted') {
    new Notification(notif.title, { body: notif.body, icon: '/images/logo.png' });
  }
}

export function initNotifications() {
  // Request browser notification permission
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // When WebSocket reconnects (server restarted), clear old notifications
  on('connected', () => {
    const lastConnect = localStorage.getItem('rs_last_connect');
    const now = Date.now().toString();
    if (lastConnect && (Date.now() - parseInt(lastConnect)) > 10000) {
      notifications = [];
      unreadCount = 0;
      save();
      listeners.forEach(fn => fn());
    }
    localStorage.setItem('rs_last_connect', now);
  });
  on('NEW_ALERT', (data) => {
    const a = data.data;
    if (!a) return;
    push({
      type: 'alert',
      icon: '🚨',
      title: `Emergency: ${a.title}`,
      body: a.message,
      severity: a.severity,
      link: '/alerts',
    });
    // Show prominent banner for ALL users (not just students)
    showEmergencyBanner(a);
  });

  on('NEW_ANNOUNCEMENT', (data) => {
    const a = data.data;
    if (!a) return;
    push({
      type: 'announcement',
      icon: '📢',
      title: `Announcement: ${a.title}`,
      body: a.content,
      link: '/announcements',
    });
  });

  on('NEW_MESSAGE', (data) => {
    const m = data.data;
    if (!m) return;
    const user = getUser();
    const senderId = m.sender?._id || m.sender;
    if (senderId === user?._id) return; // don't notify own messages

    // Alert-type system message
    if (m.type === 'alert') {
      showToast(`🚨 ${m.content.split('\n')[0].replace(/\*\*/g, '')}`, 'error');
    }

    // Admin/superadmin message — show prominent toast for users not in that channel
    if (data.fromAdmin && m.type !== 'alert') {
      showAdminMessageBanner(m);
    }

    push({
      type: 'message',
      icon: m.type === 'alert' ? '🚨' : (data.fromAdmin ? '📣' : '💬'),
      title: m.type === 'alert' ? 'Emergency Alert' : (data.fromAdmin ? `📣 ${m.sender?.name || 'Admin'} (Instructor)` : `New message from ${m.sender?.name || 'Someone'}`),
      body: m.content.split('\n')[0].replace(/\*\*/g, ''),
      link: '/channels',
    });
  });

  on('GLOBAL_BROADCAST', (data) => {
    const d = data.data;
    if (!d) return;
    const user = getUser();
    // Don't notify the sender
    if (d.from === user?.name) return;
    push({
      type: 'announcement',
      icon: '📣',
      title: `Global Message from ${d.from}`,
      body: d.message,
      link: '/channels',
    });
    showGlobalBroadcastBanner(d);
  });

  on('STUDENT_REPORT', (data) => {
    const user = getUser();
    if (user?.role !== 'admin' && user?.role !== 'superadmin') return;
    const r = data.data;
    if (!r) return;
    const cfg = {
      safe:          { icon: '✅', type: 'help', title: `${r.user?.name || 'A user'} is safe`, body: r.message || 'Marked themselves as safe' },
      need_help:     { icon: '🆘', type: 'help', title: `${r.user?.name || 'A user'} needs help!`, body: r.message || 'Tap to view details' },
      damage_report: { icon: '⚠️', type: 'help', title: `${r.user?.name || 'A user'} reported damage`, body: r.message || 'Tap to view details' },
    }[r.status];
    if (!cfg) return;
    push({ ...cfg, link: '/dashboard' });
    if (r.status === 'need_help') showToast(`🆘 ${r.user?.name || 'A user'} needs help!`, 'error');
    else if (r.status === 'safe') showToast(`✅ ${r.user?.name || 'A user'} is safe`, 'success');
    else showToast(`⚠️ ${r.user?.name || 'A user'} reported damage`, 'warning');
  });

  on('CHANNEL_MESSAGE_NOTIFY', (data) => {
    const d = data.data;
    if (!d) return;
    const user = getUser();
    push({
      type: 'message',
      icon: d.channelIcon || '💬',
      title: `${d.fromAdmin ? '📣 ' : ''}${d.senderName} in ${d.channelName}`,
      body: d.preview,
      link: '/channels',
    });
    if (d.fromAdmin) showAdminMessageBanner({ sender: { name: d.senderName }, content: d.preview, channelName: d.channelName });
  });

  on('CHANNEL_REQUEST', (data) => {
    const user = getUser();
    if (user?.role !== 'superadmin' && user?.role !== 'admin') return;
    const r = data.data;
    if (!r) return;
    push({
      type: 'announcement',
      icon: '📋',
      title: `Channel Request: "${r.name}"`,
      body: `${r.requestedBy?.name} wants to create a channel`,
      link: '/channels',
    });
    showToast(`📋 ${r.requestedBy?.name} requested a new channel: "${r.name}"`, 'info');
  });

  on('CHANNEL_REQUEST_REVIEWED', (data) => {
    const user = getUser();
    const d = data.data;
    if (!d) return;
    if (d.targetUserId !== user?._id) return;
    const approved = d.status === 'approved';
    push({
      type: 'announcement',
      icon: approved ? '✅' : '❌',
      title: approved ? `Channel "${d.channelName}" Approved!` : `Channel "${d.channelName}" Rejected`,
      body: d.reviewNote || (approved ? 'Your channel is now live.' : 'Your request was not approved.'),
      link: '/channels',
    });
    showToast(approved ? `✅ Your channel "${d.channelName}" was approved!` : `❌ Channel request "${d.channelName}" was rejected`, approved ? 'success' : 'error');
  });

  on('ALERT_RESOLVED', (data) => {
    const user = getUser();
    const a = data.data;
    if (user?.role === 'admin' || user?.role === 'superadmin') return; // admins resolve, don't need notif
    push({
      type: 'alert',
      icon: '✅',
      title: 'Alert Resolved',
      body: a?.title ? `"${a.title}" has been resolved` : 'An emergency alert has been resolved',
      link: '/alerts',
    });
    showToast('✅ Emergency alert has been resolved', 'success');
  });

  on('GUIDE_MESSAGE', (data) => {
    const user = getUser();
    if (user?.role === 'admin' || user?.role === 'superadmin') return;
    const d = data.data;
    if (!d) return;
    push({
      type: 'announcement',
      icon: '🧭',
      title: `Guidance from ${d.from || 'Admin'}`,
      body: d.message,
      link: '/map',
    });
  });

  on('ADMIN_PINS_UPDATE', (data) => {
    const user = getUser();
    if (user?.role === 'admin' || user?.role === 'superadmin') return;
    const pins = data.data;
    if (!Array.isArray(pins)) return;
    push({
      type: 'announcement',
      icon: '🗺️',
      title: 'Campus Map Updated',
      body: 'Admin has updated the emergency map. Tap to view.',
      link: '/map',
    });
    showToast('🗺️ Map updated by admin', 'info');
  });
}

export function getNotifications() { return notifications; }
export function getUnreadCount() { return unreadCount; }

export function markAllRead() {
  notifications = notifications.map(n => ({ ...n, read: true }));
  unreadCount = 0;
  save();
  listeners.forEach(fn => fn());
}

export function clearAll() {
  notifications = [];
  unreadCount = 0;
  save();
  listeners.forEach(fn => fn());
}

export function onNotifChange(fn) {
  listeners.push(fn);
  return () => { const i = listeners.indexOf(fn); if (i > -1) listeners.splice(i, 1); };
}

function showEmergencyBanner(alert) {
  document.getElementById('rs-emergency-banner')?.remove();
  const el = document.createElement('div');
  el.id = 'rs-emergency-banner';
  el.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;animation:slideDown .3s ease';
  const colors = { critical: '#dc2626', high: '#ea580c', medium: '#2563eb', low: '#16a34a' };
  const bg = colors[alert.severity] || '#dc2626';
  el.innerHTML = `
    <div style="background:${bg};color:#fff;padding:1rem 1.5rem;display:flex;align-items:center;gap:1rem;box-shadow:0 4px 24px rgba(0,0,0,.5)">
      <span style="font-size:2rem;flex-shrink:0">🚨</span>
      <div style="flex:1;min-width:0">
        <div style="font-weight:900;font-size:1rem">${alert.title}</div>
        <div style="font-size:.85rem;opacity:.9;margin-top:.15rem">${alert.message}</div>
        ${alert.instructions ? `<div style="font-size:.8rem;margin-top:.25rem;opacity:.85">📋 ${alert.instructions}</div>` : ''}
      </div>
      <button onclick="navigate('/alerts');document.getElementById('rs-emergency-banner')?.remove()"
        style="background:rgba(255,255,255,.2);border:none;color:#fff;padding:.4rem .9rem;border-radius:8px;cursor:pointer;font-weight:700;flex-shrink:0">View</button>
      <button onclick="document.getElementById('rs-emergency-banner')?.remove()"
        style="background:none;border:none;color:rgba(255,255,255,.7);font-size:1.4rem;cursor:pointer;flex-shrink:0">&times;</button>
    </div>
  `;
  document.body.prepend(el);
  setTimeout(() => el?.remove(), 15000);
}

function showAdminMessageBanner(msg) {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;bottom:5rem;right:1.5rem;z-index:9999;max-width:320px;animation:slideUp .3s ease';
  el.innerHTML = `
    <div style="background:#1e1e3a;border:1px solid #6366f1;border-radius:14px;padding:1rem 1.25rem;box-shadow:0 8px 32px rgba(0,0,0,.5);display:flex;gap:.75rem;align-items:flex-start">
      <span style="font-size:1.5rem;flex-shrink:0">📣</span>
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:.9rem;color:#a78bfa">${msg.sender?.name || 'Instructor'} <span style="font-size:.75rem;color:#6366f1;font-weight:400">(Instructor)</span></div>
        <div style="font-size:.85rem;color:#cbd5e1;margin-top:.2rem;word-break:break-word">${msg.content.split('\n')[0]}</div>
        <button onclick="navigate('/channels');this.closest('[style]').remove()"
          style="margin-top:.5rem;background:#6366f1;border:none;color:#fff;padding:.3rem .8rem;border-radius:6px;cursor:pointer;font-size:.8rem">Open Channel</button>
      </div>
      <button onclick="this.closest('[style]').remove()"
        style="background:none;border:none;color:#475569;font-size:1.2rem;cursor:pointer;flex-shrink:0">&times;</button>
    </div>
  `;
  document.body.appendChild(el);
  setTimeout(() => el?.remove(), 8000);
}

function showGlobalBroadcastBanner(d) {
  document.getElementById('rs-global-banner')?.remove();
  const el = document.createElement('div');
  el.id = 'rs-global-banner';
  el.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99998;animation:slideDown .3s ease';
  el.innerHTML = `
    <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;padding:.85rem 1.5rem;display:flex;align-items:center;gap:1rem;box-shadow:0 4px 24px rgba(0,0,0,.4)">
      <span style="font-size:1.5rem;flex-shrink:0">📢</span>
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:.9rem">${d.from} <span style="opacity:.7;font-weight:400;font-size:.8rem">(${d.role})</span></div>
        <div style="font-size:.9rem;opacity:.95">${d.message}</div>
      </div>
      <button onclick="document.getElementById('rs-global-banner')?.remove()"
        style="background:none;border:none;color:rgba(255,255,255,.7);font-size:1.4rem;cursor:pointer;flex-shrink:0">&times;</button>
    </div>
  `;
  document.body.prepend(el);
  setTimeout(() => el?.remove(), 12000);
}
