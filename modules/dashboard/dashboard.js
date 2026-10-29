// dashboard.js - ringkasan sistem

import { db } from '../../js/core/storage.js';

export default {
  title: 'Dashboard',

  async render(el) {
    const [customers, invoices, employees, leaves] = await Promise.all([
      db.count('customers'),
      db.count('invoices'),
      db.count('employees'),
      db.where('leaves', (l) => l.status === 'pending').then((r) => r.length),
    ]);

    const stat = (label, value, href) => `
      <a class="card" data-tilt href="${href}" style="color:inherit;text-decoration:none">
        <div class="stat__label">${label}</div>
        <div class="stat__value">${value}</div>
      </a>`;

    el.innerHTML = `
      <div class="page-header">
        <h2>Selamat datang ke DBSS-OS</h2>
      </div>
      <div class="stats">
        ${stat('Pelanggan', customers, '#/billing/customer')}
        ${stat('Invois', invoices, '#/billing/invoice')}
        ${stat('Pekerja', employees, '#/hr/employee')}
        ${stat('Cuti Menunggu', leaves, '#/hr/leave')}
      </div>
      <div class="card">
        <h3 class="card__title">Akses Pantas</h3>
        <div class="page-header__actions" style="flex-wrap:wrap">
          <a class="btn" href="#/billing/invoice">+ Invois Baru</a>
          <a class="btn btn--ghost" href="#/hr/employee">+ Pekerja</a>
          <a class="btn btn--ghost" href="#/report/sales">Laporan Jualan</a>
        </div>
      </div>`;
  },
};
