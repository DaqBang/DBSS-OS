# Cara Kerja

- Stack: vanilla HTML / CSS / JS sahaja. Tiada framework, tiada build tool, tiada npm kecuali diminta.
- Jimat token: jawapan ringkas, tiada penerangan panjang, tiada fail yang tidak perlu.
- Projek baru: tunggu info projek dahulu, kemudian sediakan struktur fail yang sesuai.

## Struktur asas (ubah ikut projek)

```
nama-projek/
├── index.html
├── css/style.css
├── js/main.js
└── assets/        # gambar, ikon, font
```

## Projek: DBSS-OS (ERP)

SPA hash router (`#/billing/invoice`), ES modules, data dalam localStorage (`js/core/storage.js`).
Jalankan guna Live Server (ES modules tak jalan melalui `file://`).

```
index.html          shell: sidebar + topbar + #app
login.html
css/                base, layout, components
js/app.js           mula app, daftar modul
js/core/            router, storage, auth, utils, ui
modules/<modul>/    index.js (menu & route) + satu fail per halaman
  billing/          customer, invoice, quotation, payment
  hr/               employee, attendance, leave, payroll
  admin/            users, roles, company, settings
  report/           sales, finance, hr, audit
assets/             img, icons
```

## Konvensi

- UI: liquid glass + spatial. Token dalam `css/base.css` (`:root`, ada dark mode). Panel kaca: `.glass/.card/.modal`. Kad condong 3D: `data-tilt`.
- Halaman: `modules/<modul>/<halaman>.js` → `export default { title, render(el, route), destroy? }`. Fail tanpa export = "Dalam Pembinaan".
- Data: `await db.all/find/where/insert/update/remove/count(koleksi)` dari `js/core/storage.js` (async, sedia untuk backend).
- UI helper: `toast`, `modal`, `confirmDialog` dari `js/core/ui.js`.
- Responsif: desktop >1024 (sidebar penuh/rel), tablet 641-1024 (rel ikon + laci), mobile <=640 (laci + `.bottom-nav`, modal jadi bottom sheet).
- Jadual: guna `table({ columns, rows })` dari `ui.js` (jadi senarai kad di mobile). Butang tindakan: kolum `className: 'cell-actions'` + `<div class="actions">`.
- Listener halaman pasang pada `el` yang router beri (bekas baru setiap halaman).
- PWA: `manifest.webmanifest` + ikon dalam `assets/icons/`. Service worker dibuat di peringkat akhir.
