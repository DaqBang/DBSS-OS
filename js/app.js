// app.js - titik mula aplikasi

import { startRouter } from './core/router.js';
import { initSpatial, toast } from './core/ui.js';
import { store } from './core/storage.js';
import { qs, qsa } from './core/utils.js';

const body = document.body;
const tablet = matchMedia('(max-width: 1024px)'); // termasuk mobile

// Sidebar: desktop = kecilkan jadi rel ikon, tablet/mobile = laci
if (store.get('ui.sidebarCollapsed', false)) body.classList.add('sidebar-collapsed');

const isRail = () => tablet.matches
  ? !body.classList.contains('sidebar-open')
  : body.classList.contains('sidebar-collapsed');

function openGroup(module) {
  qsa('.nav__group').forEach((g) => g.classList.toggle('open', g.dataset.module === module));
}

function expandSidebar() {
  if (tablet.matches) body.classList.add('sidebar-open');
  else {
    body.classList.remove('sidebar-collapsed');
    store.set('ui.sidebarCollapsed', false);
  }
}

qs('#sidebarToggle').addEventListener('click', () => {
  if (tablet.matches) body.classList.toggle('sidebar-open');
  else store.set('ui.sidebarCollapsed', body.classList.toggle('sidebar-collapsed'));
});

tablet.addEventListener('change', () => body.classList.remove('sidebar-open'));

// Klik lapisan gelap (body::after) untuk tutup laci
body.addEventListener('click', (e) => {
  if (e.target === body) body.classList.remove('sidebar-open');
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') body.classList.remove('sidebar-open');
});

// Kumpulan menu: dalam mod rel, klik ikon = buka sidebar + kumpulan tersebut
qs('#sidebar').addEventListener('click', (e) => {
  const title = e.target.closest('.nav__group-title');
  if (!title) return;
  const group = title.parentElement;
  if (isRail()) {
    expandSidebar();
    openGroup(group.dataset.module);
  } else {
    group.classList.toggle('open');
  }
});

// Navigasi bawah (mobile): modul -> buka laci pada kumpulan tersebut
qs('#bottomNav').addEventListener('click', (e) => {
  const item = e.target.closest('button.bottom-nav__item');
  if (!item) return;
  openGroup(item.dataset.module);
  body.classList.add('sidebar-open');
});

// Log keluar - disambung bila auth.js siap
qs('#logoutBtn').addEventListener('click', () => toast('Fungsi log keluar akan datang', 'warning'));

initSpatial();
startRouter();
