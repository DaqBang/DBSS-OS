// quotation.js - sebut harga (boleh ditukar jadi invois)

import { db } from '../../js/core/storage.js';
import { toast, confirmDialog, table, badge } from '../../js/core/ui.js';
import { navigate } from '../../js/core/router.js';
import { escapeHtml, formatRM, formatDate, debounce, today, addDays } from '../../js/core/utils.js';
import { nextNo, calcTotals, getCustomers, byId, openDocForm } from './shared.js';

const STATUSES = { draft: 'Draf', sent: 'Dihantar', accepted: 'Diterima', rejected: 'Ditolak' };
const LABELS = { ...STATUSES, converted: 'Jadi Invois' };
const TYPES = { draft: '', sent: 'info', accepted: 'success', rejected: 'danger', converted: 'success' };

function openForm(doc, onSaved) {
  openDocForm({
    title: doc?.id ? `Kemaskini ${doc.no}` : 'Sebut Harga Baru',
    doc: doc || { status: 'draft' },
    dueKey: 'validUntil',
    dueLabel: 'Sah Hingga',
    statuses: STATUSES,
    async onSave(data) {
      if (doc?.id) await db.update('quotations', doc.id, data);
      else await db.insert('quotations', { ...data, no: await nextNo('quotations', 'QT') }, 'qt');
      toast('Sebut harga disimpan', 'success');
      onSaved();
    },
  });
}

export default {
  title: 'Sebut Harga',

  async render(el) {
    el.innerHTML = `
      <div class="page-header">
        <h2>Sebut Harga</h2>
        <div class="page-header__actions"><button class="btn" data-action="add">+ Sebut Harga</button></div>
      </div>
      <div class="card">
        <div class="toolbar">
          <input class="form-control" type="search" placeholder="Cari no. atau pelanggan..." data-search>
          <select class="form-control" data-filter>
            <option value="">Semua status</option>
            ${Object.entries(LABELS).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}
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
        (!filter.value || r.status === filter.value)
        && (!q || r.no.toLowerCase().includes(q) || cust[r.customerId]?.name.toLowerCase().includes(q)));

      list.innerHTML = table({
        rows: shown,
        empty: rows.length ? 'Tiada padanan.' : 'Belum ada sebut harga.',
        columns: [
          { label: 'No.', render: (r) => `<b>${escapeHtml(r.no)}</b>` },
          { label: 'Pelanggan', render: (r) => escapeHtml(cust[r.customerId]?.name || '-') },
          { label: 'Tarikh', render: (r) => formatDate(r.date) },
          { label: 'Sah Hingga', render: (r) => formatDate(r.validUntil) },
          { label: 'Jumlah', className: 'text-right', render: (r) => formatRM(calcTotals(r).total) },
          { label: 'Status', render: (r) => badge(LABELS[r.status] || r.status, TYPES[r.status]) },
          {
            label: '',
            className: 'cell-actions',
            render: (r) => `<div class="actions">
              ${r.status !== 'converted' ? `<button class="btn btn--ghost btn--sm" data-action="edit" data-id="${r.id}">Edit</button>` : ''}
              ${!['converted', 'rejected'].includes(r.status) ? `<button class="btn btn--success btn--sm" data-action="convert" data-id="${r.id}">Jadi Invois</button>` : ''}
              <button class="btn btn--danger btn--sm" data-action="delete" data-id="${r.id}">Padam</button>
            </div>`,
          },
        ],
      });
    };

    const load = async () => {
      const [quotes, customers] = await Promise.all([db.all('quotations'), getCustomers()]);
      cust = byId(customers);
      rows = quotes.sort((a, b) => b.no.localeCompare(a.no));
      draw();
    };

    search.addEventListener('input', debounce(draw, 200));
    filter.addEventListener('change', draw);

    el.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { action, id } = btn.dataset;

      if (action === 'add') openForm(null, load);
      if (action === 'edit') openForm(await db.find('quotations', id), load);

      if (action === 'convert') {
        const q = await db.find('quotations', id);
        if (!(await confirmDialog(`Tukar ${q.no} kepada invois?`, { okText: 'Tukar' }))) return;
        const inv = await db.insert('invoices', {
          no: await nextNo('invoices', 'INV'),
          customerId: q.customerId,
          date: today(),
          dueDate: addDays(today(), 30),
          items: q.items,
          discount: q.discount,
          taxRate: q.taxRate,
          notes: q.notes,
          quotationId: q.id,
          status: 'active',
        }, 'inv');
        await db.update('quotations', id, { status: 'converted', invoiceId: inv.id });
        toast(`Invois ${inv.no} dicipta`, 'success');
        navigate('billing/invoice');
      }

      if (action === 'delete') {
        if (!(await confirmDialog('Padam sebut harga ini?', { danger: true, okText: 'Padam' }))) return;
        await db.remove('quotations', id);
        toast('Sebut harga dipadam', 'success');
        load();
      }
    });

    await load();
  },
};
