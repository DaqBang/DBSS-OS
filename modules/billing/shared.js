// shared.js - fungsi dikongsi modul Billing (nombor dokumen, jumlah, borang dokumen & bayaran)

import { db } from '../../js/core/storage.js';
import { modal, toast } from '../../js/core/ui.js';
import { escapeHtml, formatRM, today, addDays, round2, formToObject } from '../../js/core/utils.js';

export const PAY_METHODS = ['Tunai', 'Pindahan Bank', 'FPX', 'Kad', 'Cek', 'E-Wallet'];

export const byId = (list) => Object.fromEntries(list.map((r) => [r.id, r]));

// Nombor seterusnya, cth: nextNo('invoices', 'INV') -> "INV-0007"
export async function nextNo(col, prefix) {
  const rows = await db.all(col);
  const max = rows.reduce((m, r) => Math.max(m, parseInt(String(r.no).split('-')[1], 10) || 0), 0);
  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
}

export function calcTotals({ items = [], discount = 0, taxRate = 0 }) {
  const subtotal = round2(items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0));
  const disc = round2(Math.min(Number(discount) || 0, subtotal));
  const tax = round2(((subtotal - disc) * (Number(taxRate) || 0)) / 100);
  return { subtotal, discount: disc, tax, total: round2(subtotal - disc + tax) };
}

export async function getCustomers() {
  return (await db.all('customers')).sort((a, b) => a.name.localeCompare(b.name));
}

// { invoiceId: jumlahDibayar }
export async function paidByInvoice() {
  const pays = await db.all('payments');
  return pays.reduce((m, p) => {
    m[p.invoiceId] = round2((m[p.invoiceId] || 0) + Number(p.amount));
    return m;
  }, {});
}

export const INVOICE_STATES = {
  unpaid: ['Belum Bayar', 'info'],
  partial: ['Separa', 'warning'],
  overdue: ['Lewat', 'danger'],
  paid: ['Dibayar', 'success'],
  cancelled: ['Batal', ''],
};

export function invoiceState(inv, paid = 0) {
  const { total } = calcTotals(inv);
  const balance = round2(Math.max(total - paid, 0));
  let key = 'unpaid';
  if (inv.status === 'cancelled') key = 'cancelled';
  else if (balance === 0) key = 'paid';
  else if (inv.dueDate && inv.dueDate < today()) key = 'overdue';
  else if (paid > 0) key = 'partial';
  const [label, type] = INVOICE_STATES[key];
  return { total, paid, balance, key, label, type };
}

// ---------- Borang dokumen (sebut harga / invois) ----------
// openDocForm({ title, doc, dueKey: 'dueDate', dueLabel: 'Tarikh Akhir', statuses: {v: label}, onSave(data) })
export async function openDocForm({ title, doc = {}, dueKey, dueLabel, statuses, onSave }) {
  const customers = await getCustomers();
  if (!customers.length) {
    toast('Tambah pelanggan dahulu', 'warning');
    return;
  }

  const form = document.createElement('form');
  form.className = 'form-grid';
  form.id = 'docForm';
  form.innerHTML = `
    <div class="form-group form-group--full">
      <label class="form-label">Pelanggan *</label>
      <select class="form-control" name="customerId" required>
        <option value="">-- Pilih --</option>
        ${customers.map((c) => `<option value="${c.id}" ${c.id === doc.customerId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Tarikh</label>
      <input class="form-control" type="date" name="date" value="${doc.date || today()}" required>
    </div>
    <div class="form-group">
      <label class="form-label">${dueLabel}</label>
      <input class="form-control" type="date" name="${dueKey}" value="${doc[dueKey] || addDays(today(), 30)}">
    </div>
    ${statuses ? `
    <div class="form-group">
      <label class="form-label">Status</label>
      <select class="form-control" name="status">
        ${Object.entries(statuses).map(([v, l]) => `<option value="${v}" ${doc.status === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
    </div>` : ''}
    <div class="doc-items">
      <div class="item-row item-row--head"><span>Perkara</span><span>Kuantiti</span><span>Harga (RM)</span><span class="text-right">Jumlah</span><span></span></div>
      <div data-rows></div>
      <button class="btn btn--ghost btn--sm" type="button" data-add>+ Tambah Item</button>
    </div>
    <div class="form-group">
      <label class="form-label">Diskaun (RM)</label>
      <input class="form-control" type="number" name="discount" min="0" step="0.01" value="${Number(doc.discount) || 0}">
    </div>
    <div class="form-group">
      <label class="form-label">Cukai (%)</label>
      <input class="form-control" type="number" name="taxRate" min="0" step="0.01" value="${Number(doc.taxRate) || 0}">
    </div>
    <div class="form-group form-group--full">
      <label class="form-label">Nota</label>
      <textarea class="form-control" name="notes">${escapeHtml(doc.notes || '')}</textarea>
    </div>
    <div class="totals">
      <div><span>Subtotal</span><span data-t="subtotal"></span></div>
      <div><span>Diskaun</span><span data-t="discount"></span></div>
      <div><span>Cukai</span><span data-t="tax"></span></div>
      <div class="totals__grand"><b>Jumlah</b><b data-t="total"></b></div>
    </div>`;

  const rowsEl = form.querySelector('[data-rows]');

  const addRow = (it = { desc: '', qty: 1, price: 0 }) => {
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
      <input class="form-control" data-f="desc" placeholder="Perkara" value="${escapeHtml(it.desc)}">
      <input class="form-control" data-f="qty" type="number" min="0" step="any" placeholder="Kuantiti" value="${Number(it.qty) || 0}">
      <input class="form-control" data-f="price" type="number" min="0" step="0.01" placeholder="Harga" value="${Number(it.price) || 0}">
      <span class="item-row__total"></span>
      <button class="item-row__remove" type="button" data-remove aria-label="Buang item">&times;</button>`;
    rowsEl.append(row);
  };

  const readItems = () => [...rowsEl.children].map((r) => ({
    desc: r.querySelector('[data-f="desc"]').value.trim(),
    qty: Number(r.querySelector('[data-f="qty"]').value) || 0,
    price: Number(r.querySelector('[data-f="price"]').value) || 0,
  }));

  const update = () => {
    const items = readItems();
    [...rowsEl.children].forEach((r, i) => {
      r.querySelector('.item-row__total').textContent = formatRM(items[i].qty * items[i].price);
    });
    const t = calcTotals({ items, discount: form.discount.value, taxRate: form.taxRate.value });
    Object.entries(t).forEach(([k, v]) => { form.querySelector(`[data-t="${k}"]`).textContent = formatRM(v); });
  };

  (doc.items?.length ? doc.items : [undefined]).forEach((it) => addRow(it));
  update();

  form.addEventListener('input', update);
  form.addEventListener('click', (e) => {
    if (e.target.closest('[data-add]')) {
      addRow();
      rowsEl.lastElementChild.querySelector('input').focus();
    }
    const rm = e.target.closest('[data-remove]');
    if (rm) {
      if (rowsEl.children.length > 1) rm.parentElement.remove();
      else rm.parentElement.querySelectorAll('input').forEach((i) => { i.value = i.dataset.f === 'desc' ? '' : 0; });
    }
    update();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const items = readItems().filter((i) => i.desc);
    if (!items.length) return toast('Masukkan sekurang-kurangnya satu item', 'warning');
    const data = formToObject(form);
    await onSave({ ...data, discount: Number(data.discount) || 0, taxRate: Number(data.taxRate) || 0, items });
    m.close();
  });

  const m = modal({
    title,
    size: 'lg',
    body: form,
    footer: `
      <button class="btn btn--ghost" type="button" data-close>Batal</button>
      <button class="btn" type="submit" form="docForm">Simpan</button>`,
  });
}

// ---------- Borang bayaran ----------
export async function openPaymentForm({ invoiceId = '', onSaved } = {}) {
  const [invoices, customers, paid] = await Promise.all([db.all('invoices'), getCustomers(), paidByInvoice()]);
  const cust = byId(customers);
  const open = invoices
    .map((inv) => ({ inv, s: invoiceState(inv, paid[inv.id]) }))
    .filter((x) => x.s.key !== 'cancelled' && x.s.balance > 0);

  if (!open.length) {
    toast('Tiada invois tertunggak', 'info');
    return;
  }
  const balanceOf = Object.fromEntries(open.map((x) => [x.inv.id, x.s.balance]));
  const selected = balanceOf[invoiceId] ? invoiceId : open[0].inv.id;

  const form = document.createElement('form');
  form.className = 'form-grid';
  form.id = 'payForm';
  form.innerHTML = `
    <div class="form-group form-group--full">
      <label class="form-label">Invois *</label>
      <select class="form-control" name="invoiceId" required>
        ${open.map(({ inv, s }) => `<option value="${inv.id}" ${inv.id === selected ? 'selected' : ''}>
          ${escapeHtml(inv.no)} - ${escapeHtml(cust[inv.customerId]?.name || '?')} (Baki ${formatRM(s.balance)})</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Tarikh</label>
      <input class="form-control" type="date" name="date" value="${today()}" required>
    </div>
    <div class="form-group">
      <label class="form-label">Amaun (RM) *</label>
      <input class="form-control" type="number" name="amount" min="0.01" step="0.01" required>
    </div>
    <div class="form-group">
      <label class="form-label">Kaedah</label>
      <select class="form-control" name="method">${PAY_METHODS.map((p) => `<option>${p}</option>`).join('')}</select>
    </div>
    <div class="form-group">
      <label class="form-label">No. Rujukan</label>
      <input class="form-control" name="ref" placeholder="cth: no. transaksi">
    </div>`;

  const setAmount = () => {
    const bal = balanceOf[form.invoiceId.value];
    form.amount.value = bal.toFixed(2);
    form.amount.max = bal;
  };
  setAmount();
  form.invoiceId.addEventListener('change', setAmount);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = formToObject(form);
    const amount = round2(data.amount);
    if (amount <= 0 || amount > balanceOf[data.invoiceId]) return toast('Amaun tidak sah', 'warning');
    await db.insert('payments', { ...data, amount }, 'pay');
    toast('Bayaran direkod', 'success');
    m.close();
    onSaved?.();
  });

  const m = modal({
    title: 'Rekod Bayaran',
    body: form,
    footer: `
      <button class="btn btn--ghost" type="button" data-close>Batal</button>
      <button class="btn btn--success" type="submit" form="payForm">Simpan</button>`,
  });
}
