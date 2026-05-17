const THEME_KEY = 'rs_theme';

export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(saved);
}

export function toggleTheme() {
  const current = localStorage.getItem(THEME_KEY) || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  return next;
}

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'light';
}

function applyTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.className = document.body.className
      .replace('bg-[#f8fafc]', 'bg-[#0a0a0f]')
      .replace('text-slate-900', 'text-slate-100');
  } else {
    document.documentElement.removeAttribute('data-theme');
    document.body.className = document.body.className
      .replace('bg-[#0a0a0f]', 'bg-[#f8fafc]')
      .replace('text-slate-100', 'text-slate-900');
  }
}
