// router.js - hash router: #/<modul>/<halaman>/<param...>
// Setiap halaman ialah fail modules/<modul>/<halaman>.js yang export default:
//   { title: 'Invois', render(el, route) {...}, destroy() {...} }

import { qs, qsa, escapeHtml } from './utils.js';

const SAFE = /^[a-z0-9-]+$/;
let current = null;
let seq = 0;

export function parse() {
  const path = location.hash.replace(/^#\/?/, '') || 'dashboard';
  const [module, page = module, ...params] = path.split('/').filter(Boolean);
  const key = module === page ? module : `${module}/${page}`;
  return { path, key, module, page, params };
}

export function navigate(path) {
  location.hash = `#/${path.replace(/^#?\/?/, '')}`;
}

const notFound = {
  title: 'Tidak Dijumpai',
  render(el) {
    el.innerHTML = `
      <div class="card empty">
        <h2>404</h2>
        <p>Halaman tidak wujud.</p>
        <a class="btn" href="#/dashboard">Ke Dashboard</a>
      </div>`;
  },
};

const underConstruction = (route) => ({
  title: route.page,
  render(el) {
    el.innerHTML = `
      <div class="card empty">
        <h2>Dalam Pembinaan</h2>
        <p>Halaman <strong>${escapeHtml(route.key)}</strong> belum siap.</p>
      </div>`;
  },
});

async function loadPage(route) {
  if (!SAFE.test(route.module) || !SAFE.test(route.page)) return notFound;
  try {
    const mod = await import(`../../modules/${route.module}/${route.page}.js`);
    return mod.default || underConstruction(route);
  } catch (err) {
    console.warn('[router]', err);
    return notFound;
  }
}

function updateNav(route) {
  qsa('.nav__link').forEach((a) => a.classList.toggle('active', a.dataset.route === route.key));
  qsa('.bottom-nav__item').forEach((b) => b.classList.toggle('active', b.dataset.module === route.module));
  qs(`.nav__group[data-module="${route.module}"]`)?.classList.add('open');
  document.body.classList.remove('sidebar-open');
}

async function render() {
  const token = ++seq;
  const route = parse();
  const page = await loadPage(route);
  if (token !== seq) return; // hash bertukar semasa memuat

  current?.destroy?.();
  current = page;

  const el = qs('#app');
  el.innerHTML = '';
  el.classList.remove('page-enter');
  void el.offsetWidth; // mula semula animasi
  el.classList.add('page-enter');

  qs('#pageTitle').textContent = page.title;
  document.title = `${page.title} - DBSS-OS`;
  updateNav(route);

  // bekas baru setiap halaman: listener halaman lama dibuang bersama elemennya
  const view = document.createElement('div');
  el.append(view);

  try {
    await page.render(view, route);
  } catch (err) {
    console.error('[router]', err);
    view.innerHTML = `<div class="card empty"><h2>Ralat</h2><p>${escapeHtml(err.message)}</p></div>`;
  }
}

export function startRouter() {
  window.addEventListener('hashchange', render);
  render();
}
