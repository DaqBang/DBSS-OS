// app.js - titik mula aplikasi

import { startRouter } from './core/router.js';
import { initSpatial, toast } from './core/ui.js';
import { store } from './core/storage.js';
import { qs } from './core/utils.js';

const body = document.body;
const isMobile = () => matchMedia('(max-width: 900px)').matches;

// Sidebar: kecilkan (desktop) / buka-tutup (mudah alih)
if (store.get('ui.sidebarCollapsed', false)) body.classList.add('sidebar-collapsed');

qs('#sidebarToggle').addEventListener('click', () => {
  if (isMobile()) body.classList.toggle('sidebar-open');
  else store.set('ui.sidebarCollapsed', body.classList.toggle('sidebar-collapsed'));
});

// Klik lapisan gelap (body::after) untuk tutup sidebar mudah alih
body.addEventListener('click', (e) => {
  if (e.target === body) body.classList.remove('sidebar-open');
});

// Kumpulan menu buka/tutup
qs('#sidebar').addEventListener('click', (e) => {
  const title = e.target.closest('.nav__group-title');
  if (title) title.parentElement.classList.toggle('open');
});

// Log keluar - disambung bila auth.js siap
qs('#logoutBtn').addEventListener('click', () => toast('Fungsi log keluar akan datang', 'warning'));

initSpatial();
startRouter();
