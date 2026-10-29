// ui.js - toast, modal, confirm & kesan spatial (cahaya kaca + tilt)

import { escapeHtml } from './utils.js';

// ---------- Toast ----------
// toast('Disimpan', 'success') | jenis: info, success, warning, danger
export function toast(message, type = 'info', ms = 3000) {
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = message;
  document.getElementById('toastRoot').append(el);
  setTimeout(() => {
    el.classList.add('is-leaving');
    setTimeout(() => el.remove(), 300);
  }, ms);
}

// ---------- Modal ----------
// const m = modal({ title, body, footer, size: 'lg' }); m.el, m.close()
// body/footer boleh jadi string HTML atau elemen DOM.
export function modal({ title = '', body = '', footer = '', size = '', onClose } = {}) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal ${size ? `modal--${size}` : ''}" role="dialog" aria-modal="true">
      <div class="modal__header">
        <h3 class="modal__title">${escapeHtml(title)}</h3>
        <button class="modal__close" type="button" aria-label="Tutup">&times;</button>
      </div>
      <div class="modal__body"></div>
      ${footer ? '<div class="modal__footer"></div>' : ''}
    </div>`;

  const el = backdrop.querySelector('.modal');
  const fill = (target, content) => {
    if (!target) return;
    if (content instanceof Node) target.append(content);
    else target.innerHTML = content;
  };
  fill(el.querySelector('.modal__body'), body);
  fill(el.querySelector('.modal__footer'), footer);

  const onKey = (e) => e.key === 'Escape' && close();
  function close() {
    document.removeEventListener('keydown', onKey);
    backdrop.remove();
    onClose?.();
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop || e.target.closest('.modal__close, [data-close]')) close();
  });
  document.addEventListener('keydown', onKey);
  document.getElementById('modalRoot').append(backdrop);
  el.querySelector('input, select, textarea, button:not(.modal__close)')?.focus();

  return { el, close };
}

// ---------- Confirm ----------
// if (await confirmDialog('Padam rekod ini?', { danger: true })) {...}
export function confirmDialog(message, { title = 'Pengesahan', okText = 'Ya', danger = false } = {}) {
  return new Promise((resolve) => {
    let result = false;
    const m = modal({
      title,
      body: `<p>${escapeHtml(message)}</p>`,
      footer: `
        <button class="btn btn--ghost" type="button" data-close>Batal</button>
        <button class="btn ${danger ? 'btn--danger' : ''}" type="button" data-ok>${escapeHtml(okText)}</button>`,
      onClose: () => resolve(result),
    });
    m.el.querySelector('[data-ok]').addEventListener('click', () => {
      result = true;
      m.close();
    });
  });
}

// ---------- Kesan spatial ----------
const GLASS = '.glass, .sidebar, .topbar, .card, .modal';
const MAX_TILT = 6; // darjah

export function initSpatial() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let tilted = null;

  document.addEventListener('pointermove', (e) => {
    // cahaya kaca ikut kursor
    const glass = e.target.closest?.(GLASS);
    if (glass) {
      const r = glass.getBoundingClientRect();
      glass.style.setProperty('--mx', `${e.clientX - r.left}px`);
      glass.style.setProperty('--my', `${e.clientY - r.top}px`);
    }

    // kad condong 3D
    const tilt = e.target.closest?.('[data-tilt]');
    if (tilted && tilted !== tilt) resetTilt(tilted);
    tilted = tilt;
    if (!tilt) return;
    const r = tilt.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    tilt.style.transform =
      `rotateX(${(-y * MAX_TILT).toFixed(2)}deg) rotateY(${(x * MAX_TILT).toFixed(2)}deg) translateZ(10px)`;
  });

  document.addEventListener('pointerleave', () => tilted && resetTilt(tilted));
}

function resetTilt(el) {
  el.style.transform = '';
}
