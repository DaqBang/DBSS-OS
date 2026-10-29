// invoice.js - invois & status bayaran

import { db } from '../../js/core/storage.js';
import { toast, confirmDialog, table, badge } from '../../js/core/ui.js';
import { escapeHtml, formatRM, formatDate, debounce } from '../../js/core/utils.js';
import {
  nextNo, getCustomers, byId, paidByInvoice, invoiceState, INVOICE_STATES, openDocForm, openPaymentForm,
} from './shared.js';

function openForm(doc, onSaved) {
  openDocForm({
    title: doc?.id ? `Kemaskini ${doc.no}` : 'Invois Baru',
    doc: doc || {},
    dueKey: 'dueDate',
    dueLabel: 'Tarikh Akhir',
    async onSave(data) {
      if (doc?.id) await db.update('invoices', doc.id, data);
      else await db.insert('invoices', { ...data, no: await nextNo('invoices', 'INV'), status: 'active' }, 'inv');
      toast('Invois disimpan', 'success');
      onSaved();
    },
  });
}

export default {
  title: 'Invois',

  async render(el) {
    el.innerHTML = `
      <div class="page-header">
        <h2>Invois</h2>
        <div class="page-header__actions"><button class="btn" data-action="add">+ Invois</button></div>
      </div>
      <div class="card">
        <div class="summary" data-summary></div>
        <div class="toolbar">
          <input class="form-control" type="search" placeholder="Cari no. atau pelanggan..." data-search>
          <select class="form-control" data-filter>
            <option value="">Semua status</option>
            ${Object.entries(INVOICE_STATES).map(([v, [l]]) => `<option value="${v}">${l}</option>`).join('')}
          </select>
        </div>
        <div data-list></div>
      </div>`;

    const list = el.querySelector('[data-list]');
    const search = el.querySelector('[data-search]');
    const filter = el.querySelector('[data-filter]');
    let rows = [];
    let cust = {};

    const draw = () => {
      const q = search.value.trim().toLowerCase();
      const shown = rows.filter((r) =>
        (!filter.value || r.s.key === filter.value)
        && (!q || r.no.toLowerCase().includes(q) || cust[r.customerId]?.name.toLowerCase().includes(q)));

      list.innerHTML = table({
        rows: shown,
        empty: rows.length ? 'Tiada padanan.' : 'Belum ada invois.',
        columns: [
          { label: 'No.', render: (r) => `<b>${escapeHtml(r.no)}</b>` },
          { label: 'Pelanggan', render: (r) => escapeHtml(cust[r.customerId]?.name || '-') },
          { label: 'Tarikh', render: (r) => formatDate(r.date) },
          { label: 'Tarikh Akhir', render: (r) => formatDate(r.dueDate) },
          { label: 'Jumlah', className: 'text-right', render: (r) => formatRM(r.s.total) },
          { label: 'Baki', className: 'text-right', render: (r) => formatRM(r.s.balance) },
          { label: 'Status', render: (r) => badge(r.s.label, r.s.type) },
          {
            label: '',
            className: 'cell-actions',
            render: (r) => {
              if (r.s.key === 'cancelled') {
                return `<div class="actions"><button class="btn btn--danger btn--sm" data-action="delete" data-id="${r.id}">Padam</button></div>`;
              }
              return `<div class="actions">
                ${r.s.balance > 0 ? `<button class="btn btn--success btn--sm" data-action="pay" data-id="${r.id}">Bayar</button>` : ''}
                ${r.s.paid === 0 ? `
                  <button class="btn btn--ghost btn--sm" data-action="edit" data-id="${r.id}">Edit</button>
                  <button class="btn btn--ghost btn--sm" data-action="cancel" data-id="${r.id}">Batal</button>` : ''}
              </div>`;
            },
          },
        ],
      });

      const active = rows.filter((r) => r.s.key !== 'cancelled');
      const sum = (fn) => formatRM(active.reduce((t, r) => t + fn(r), 0));
      el.querySelector('[data-summary]').innerHTML = `
        <div><div class="text-muted">Jumlah Invois</div><b>${sum((r) => r.s.total)}</b></div>
        <div><div class="text-muted">Diterima</div><b>${sum((r) => r.s.paid)}</b></div>
        <div><div class="text-muted">Tertunggak</div><b>${sum((r) => r.s.balance)}</b></div>`;
    };

    const load = async () => {
      const [invoices, customers, paid] = await Promise.all([db.all('invoices'), getCustomers(), paidByInvoice()]);
      cust = byId(customers);
      rows = invoices
        .map((inv) => ({ ...inv, s: invoiceState(inv, paid[inv.id] || 0) }))
        .sort((a, b) => b.no.localeCompare(a.no));
      draw();
    };

    search.addEventListener('input', debounce(draw, 200));
    filter.addEventListener('change', draw);

    el.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { action, id } = btn.dataset;

      if (action === 'add') openForm(null, load);
      if (action === 'edit') openForm(await db.find('invoices', id), load);
      if (action === 'pay') openPaymentForm({ invoiceId: id, onSaved: load });

      if (action === 'cancel') {
        if (!(await confirmDialog('Batalkan invois ini?', { danger: true, okText: 'Batalkan' }))) return;
        await db.update('invoices', id, { status: 'cancelled' });
        toast('Invois dibatalkan', 'success');
        load();
      }

      if (action === 'delete') {
        if (!(await confirmDialog('Padam invois ini secara kekal?', { danger: true, okText: 'Padam' }))) return;
        await db.remove('invoices', id);
        toast('Invois dipadam', 'success');
        load();
      }
    });

    await load();
  },
};
