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

    // If it's an alert-type message from the emergency channel, show prominent toast
    if (m.type === 'alert') {
      showToast(`🚨 ${m.content.split('\n')[0].replace(/\*\*/g, '')}`, 'error');
    }

    push({
      type: 'message',
      icon: m.type === 'alert' ? '🚨' : '💬',
      title: m.type === 'alert' ? 'Emergency Alert' : `New message from ${m.sender?.name || 'Someone'}`,
      body: m.content.split('\n')[0].replace(/\*\*/g, ''),
      link: '/channels',
    });
  });

  on('STUDENT_REPORT', (data) => {
    const user = getUser();
    if (user?.role !== 'admin' && user?.role !== 'superadmin') return;
    const r = data.data;
    if (!r || r.status !== 'need_help') return;
    push({
      type: 'help',
      icon: '🆘',
      title: `${r.user?.name || 'A student'} needs help!`,
      body: r.message || 'Tap to view details',
      link: '/dashboard',
    });
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
