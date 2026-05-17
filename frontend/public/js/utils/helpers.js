export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(date) {
  return new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function severityColor(severity) {
  const map = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#10b981' };
  return map[severity] || '#6366f1';
}

export function severityBadge(severity) {
  return `<span class="badge badge-${severity}">${severity}</span>`;
}

export function statusBadge(status) {
  return `<span class="badge badge-${status}">${status}</span>`;
}

export function typeIcon(type) {
  const icons = {
    emergency: '🚨', warning: '⚠️', info: 'ℹ️', drill: '🔔',
    announcement: '📢', weather: '🌪️', security: '🔒',
  };
  return icons[type] || '📋';
}

export function animateCounter(el, target, duration = 1500) {
  const start = 0;
  const startTime = performance.now();
  const update = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(start + (target - start) * eased).toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

export function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

export function skeleton(lines = 3) {
  return Array(lines).fill(0).map((_, i) =>
    `<div class="skeleton h-4 mb-2" style="width:${70 + Math.random() * 30}%"></div>`
  ).join('');
}
