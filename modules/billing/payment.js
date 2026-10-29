// payment.js - rekod bayaran diterima

import { db } from '../../js/core/storage.js';
import { toast, confirmDialog, table } from '../../js/core/ui.js';
import { escapeHtml, formatRM, formatDate, debounce, today } from '../../js/core/utils.js';
import { getCustomers, byId, openPaymentForm } from './shared.js';

export default {
  title: 'Bayaran',

  async render(el) {
    el.innerHTML = `
      <div class="page-header">
        <h2>Bayaran</h2>
        <div class="page-header__actions"><button class="btn btn--success" data-action="add">+ Rekod Bayaran</button></div>
      </div>
      <div class="card">
        <div class="summary" data-summary></div>
        <div class="toolbar">
          <input class="form-control" type="search" placeholder="Cari invois, pelanggan, rujukan..." data-search>
        </div>
        <div data-list></div>
      </div>`;

    const list = el.querySelector('[data-list]');
    const search = el.querySelector('[data-search]');
    let rows = [];

    const draw = () => {
      const q = search.value.trim().toLowerCase();
      const shown = q
        ? rows.filter((p) => [p.invNo, p.customer, p.ref, p.method].some((x) => x?.toLowerCase().includes(q)))
        : rows;

      list.innerHTML = table({
        rows: shown,
        empty: rows.length ? 'Tiada padanan.' : 'Belum ada bayaran.',
        columns: [
          { label: 'Tarikh', render: (p) => formatDate(p.date) },
          { label: 'Invois', render: (p) => `<b>${escapeHtml(p.invNo)}</b>` },
          { label: 'Pelanggan', render: (p) => escapeHtml(p.customer) },
          { label: 'Kaedah', render: (p) => escapeHtml(p.method) },
          { label: 'Rujukan', render: (p) => escapeHtml(p.ref || '-') },
          { label: 'Amaun', className: 'text-right', render: (p) => `<b>${formatRM(p.amount)}</b>` },
          {
            label: '',
            className: 'cell-actions',
            render: (p) => `<div class="actions">
              <button class="btn btn--danger btn--sm" data-action="delete" data-id="${p.id}">Padam</button>
            </div>`,
          },
        ],
      });

      const month = today().slice(0, 7);
      const sum = (list) => formatRM(list.reduce((t, p) => t + Number(p.amount), 0));
      el.querySelector('[data-summary]').innerHTML = `
        <div><div class="text-muted">Jumlah Kutipan</div><b>${sum(rows)}</b></div>
        <div><div class="text-muted">Bulan Ini</div><b>${sum(rows.filter((p) => p.date?.startsWith(month)))}</b></div>`;
    };

    const load = async () => {
      const [payments, invoices, customers] = await Promise.all([db.all('payments'), db.all('invoices'), getCustomers()]);
      const inv = byId(invoices);
      const cust = byId(customers);
      rows = payments
        .map((p) => ({
          ...p,
          invNo: inv[p.invoiceId]?.no || '-',
          customer: cust[inv[p.invoiceId]?.customerId]?.name || '-',
        }))
        .sort((a, b) => b.date.localeCompare(a.date));
      draw();
    };

    search.addEventListener('input', debounce(draw, 200));

    el.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { action, id } = btn.dataset;

      if (action === 'add') openPaymentForm({ onSaved: load });
      if (action === 'delete') {
        if (!(await confirmDialog('Padam rekod bayaran ini?', { danger: true, okText: 'Padam' }))) return;
        await db.remove('payments', id);
        toast('Bayaran dipadam', 'success');
        load();
      }
    });

    await load();
  },
};
