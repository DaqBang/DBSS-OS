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
