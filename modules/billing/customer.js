// customer.js - senarai & borang pelanggan

import { db } from '../../js/core/storage.js';
import { modal, toast, confirmDialog, table } from '../../js/core/ui.js';
import { escapeHtml, debounce, formToObject } from '../../js/core/utils.js';

const esc = (v) => escapeHtml(v || '-');

function openForm(c = {}, onSaved) {
  const v = (k) => escapeHtml(c[k] || '');
  const form = document.createElement('form');
  form.className = 'form-grid';
  form.id = 'customerForm';
  form.innerHTML = `
    <div class="form-group form-group--full">
      <label class="form-label">Nama *</label>
      <input class="form-control" name="name" value="${v('name')}" required>
    </div>
    <div class="form-group">
      <label class="form-label">Syarikat</label>
      <input class="form-control" name="company" value="${v('company')}">
    </div>
    <div class="form-group">
      <label class="form-label">No. SSM / IC</label>
      <input class="form-control" name="regNo" value="${v('regNo')}">
    </div>
    <div class="form-group">
      <label class="form-label">Telefon</label>
      <input class="form-control" name="phone" type="tel" value="${v('phone')}">
    </div>
    <div class="form-group">
      <label class="form-label">E-mel</label>
      <input class="form-control" name="email" type="email" value="${v('email')}">
    </div>
    <div class="form-group form-group--full">
      <label class="form-label">Alamat</label>
      <textarea class="form-control" name="address">${v('address')}</textarea>
    </div>`;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = formToObject(form);
    if (c.id) await db.update('customers', c.id, data);
    else await db.insert('customers', data, 'cus');
    toast('Pelanggan disimpan', 'success');
    m.close();
    onSaved();
  });

  const m = modal({
    title: c.id ? 'Kemaskini Pelanggan' : 'Pelanggan Baru',
    body: form,
    footer: `
      <button class="btn btn--ghost" type="button" data-close>Batal</button>
      <button class="btn" type="submit" form="customerForm">Simpan</button>`,
  });
}

export default {
  title: 'Pelanggan',

  async render(el) {
    el.innerHTML = `
      <div class="page-header">
        <h2>Pelanggan</h2>
        <div class="page-header__actions"><button class="btn" data-action="add">+ Pelanggan</button></div>
      </div>
      <div class="card">
        <div class="toolbar">
          <input class="form-control" type="search" placeholder="Cari nama, syarikat, telefon..." data-search>
        </div>
        <div data-list></div>
      </div>`;

    const list = el.querySelector('[data-list]');
    const search = el.querySelector('[data-search]');
    let rows = [];

    const draw = () => {
      const q = search.value.trim().toLowerCase();
      const shown = q
        ? rows.filter((c) => [c.name, c.company, c.phone, c.email].some((x) => x?.toLowerCase().includes(q)))
        : rows;
      list.innerHTML = table({
        rows: shown,
        empty: q ? 'Tiada padanan.' : 'Belum ada pelanggan.',
        columns: [
          { label: 'Nama', render: (c) => `<div><b>${esc(c.name)}</b>${c.company ? `<div class="text-muted">${esc(c.company)}</div>` : ''}</div>` },
          { label: 'Telefon', render: (c) => esc(c.phone) },
          { label: 'E-mel', render: (c) => esc(c.email) },
          {
            label: '',
            className: 'cell-actions',
            render: (c) => `<div class="actions">
              <button class="btn btn--ghost btn--sm" data-action="edit" data-id="${c.id}">Edit</button>
              <button class="btn btn--danger btn--sm" data-action="delete" data-id="${c.id}">Padam</button>
            </div>`,
          },
        ],
      });
    };

    const load = async () => {
      rows = (await db.all('customers')).sort((a, b) => a.name.localeCompare(b.name));
      draw();
    };

    search.addEventListener('input', debounce(draw, 200));

    el.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { action, id } = btn.dataset;

      if (action === 'add') openForm({}, load);
      if (action === 'edit') openForm(await db.find('customers', id), load);
      if (action === 'delete') {
        const used = (await db.where('invoices', (r) => r.customerId === id)).length
          + (await db.where('quotations', (r) => r.customerId === id)).length;
        if (used) return toast('Pelanggan ini ada dokumen - tidak boleh dipadam', 'danger');
        if (!(await confirmDialog('Padam pelanggan ini?', { danger: true, okText: 'Padam' }))) return;
        await db.remove('customers', id);
        toast('Pelanggan dipadam', 'success');
        load();
      }
    });

    await load();
  },
};
