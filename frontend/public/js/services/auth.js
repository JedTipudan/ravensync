import { api } from './api.js';

export async function login(username, password) {
  const data = await api.post('/auth/login', { username, password });
  localStorage.setItem('rs_token', data.token);
  localStorage.setItem('rs_user', JSON.stringify(data.user));
  return data;
}

export async function refreshUser() {
  try {
    const data = await api.get('/auth/me');
    localStorage.setItem('rs_user', JSON.stringify(data.user));
    return data.user;
  } catch { return null; }
}

export async function register(userData) {
  const data = await api.post('/auth/register', userData);
  localStorage.setItem('rs_token', data.token);
  localStorage.setItem('rs_user', JSON.stringify(data.user));
  return data;
}

export function logout() {
  localStorage.removeItem('rs_token');
  localStorage.removeItem('rs_user');
  window.navigate('/');
}

export function getToken() {
  return localStorage.getItem('rs_token');
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('rs_user'));
  } catch { return null; }
}

export function isAdmin() {
  const role = getUser()?.role;
  return role === 'admin' || role === 'superadmin';
}

export function isSuperAdmin() {
  return getUser()?.role === 'superadmin';
}
