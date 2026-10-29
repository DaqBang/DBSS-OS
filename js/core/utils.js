// utils.js - fungsi bantu umum

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

// ID unik ringkas, cth: uid('INV') -> "INV-lq3k9x2a7f"
export function uid(prefix = '') {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return prefix ? `${prefix}-${id}` : id;
}

const rm = new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' });
export const formatRM = (n) => rm.format(Number(n) || 0);

export function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  return isNaN(d) ? '-' : d.toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Tarikh tempatan dalam format YYYY-MM-DD (untuk <input type="date">)
const pad = (n) => String(n).padStart(2, '0');
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => isoDate(new Date());

export function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

export function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// Tambah hari pada tarikh YYYY-MM-DD
export function addDays(date, days) {
  const d = new Date(`${date}T00:00`);
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Borang -> objek { name: value }
export const formToObject = (form) => Object.fromEntries(new FormData(form));
