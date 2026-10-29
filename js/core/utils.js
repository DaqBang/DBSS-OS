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

// Tarikh hari ini dalam format YYYY-MM-DD (untuk <input type="date">)
export const today = () => new Date().toISOString().slice(0, 10);

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
