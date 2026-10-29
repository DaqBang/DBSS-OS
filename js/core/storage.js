// storage.js - lapisan data (localStorage buat masa ini)
// API `db` sengaja async supaya bila tukar ke backend nanti, kod modul tak perlu diubah.

import { uid } from './utils.js';

const PREFIX = 'dbss:';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

// Tetapan kecil (UI, sesi) - segerak
export const store = {
  get: read,
  set: write,
  remove: (key) => localStorage.removeItem(PREFIX + key),
};

// Koleksi rekod - cth: await db.insert('invoices', {...})
export const db = {
  async all(col) {
    return read(col, []);
  },

  async find(col, id) {
    return read(col, []).find((r) => r.id === id) || null;
  },

  async where(col, fn) {
    return read(col, []).filter(fn);
  },

  async insert(col, data, prefix = '') {
    const rows = read(col, []);
    const now = new Date().toISOString();
    const row = { id: uid(prefix), ...data, createdAt: now, updatedAt: now };
    rows.push(row);
    write(col, rows);
    return row;
  },

  async update(col, id, patch) {
    const rows = read(col, []);
    const i = rows.findIndex((r) => r.id === id);
    if (i === -1) return null;
    rows[i] = { ...rows[i], ...patch, id, updatedAt: new Date().toISOString() };
    write(col, rows);
    return rows[i];
  },

  async remove(col, id) {
    const rows = read(col, []);
    const next = rows.filter((r) => r.id !== id);
    write(col, next);
    return next.length !== rows.length;
  },

  async count(col) {
    return read(col, []).length;
  },
};
