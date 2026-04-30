# Toko Bangunan ERP

Sistem manajemen toko bangunan berbasis web: **Next.js 16**, **MongoDB**, **TypeScript** — portfolio project.

**Dokumentasi lanjutan:** [Setup & troubleshooting](docs/SETUP.md) · [Arsitektur](docs/ARCHITECTURE.md) · [API HTTP](docs/API.md) · [Panduan operator](docs/USER_GUIDE.md) · [Kontribusi](CONTRIBUTING.md)

## Demo

- **URL**: _(setelah deploy, contoh Vercel + MongoDB Atlas)_
- **Admin**: `admin@toko.test` / `admin123`
- **Kasir**: `kasir@toko.test` / `kasir123`  
  (sama dengan user yang dibuat `pnpm seed`, lihat [scripts/seed.ts](scripts/seed.ts))

## Fitur (ringkas)

| Area | Modul | Deskripsi |
|------|--------|-----------|
| **Akses** | Auth & RBAC | Login NextAuth v5 (credentials + JWT). Role `ADMIN` dan `KASIR`. User nonaktif ditolak login. |
| **Operasional** | Kasir / POS | Pencarian produk (nama/SKU/barcode), keranjang, diskon (batas kasir), pajak, tunai & kredit, pelanggan. Kasir wajib shift terbuka sebelum jual. |
| | Invoice | Daftar & detail cetak (print / PDF dari browser). Nomor invoice race-safe. |
| | Pembelian | Penerimaan dari supplier; stok naik; hutang (admin). |
| | Stok | Daftar, filter low-stock, mutasi IN/OUT, penyesuaian ber alasan (admin). |
| | Piutang / Hutang | Piutang penjualan kredit; hutang ke supplier (admin). |
| | Kas & Shift | Buka/tutup shift kasir; riwayat (admin lihat global). |
| **Master** | Data referensi | Kategori, Satuan, Supplier, Produk (termasuk barcode), Pelanggan — mayoritas mutasi oleh **admin**. |
| **Pengaturan** | Toko | Pajak default & batas diskon kasir. |
| | Pengguna | Manajemen user & role (admin). |
| | Audit | Log mutasi penting ([`writeAuditLog`](src/lib/audit.ts)). |
| **Analisis** | Dashboard | KPI, grafik, top produk. |
| | Laporan | Filter periode, tabel penjualan; export CSV penjualan (lihat [docs/API.md](docs/API.md)). |

### Peran (RBAC)

- **ADMIN**: semua menu termasuk Pembelian, Piutang, Hutang, Master, Pengaturan, Laporan.
- **KASIR**: Dashboard, POS, Invoice, Stok, Kas & Shift — tidak mengelola master/pembelian/laporan/admin.  
  Detail di [`src/lib/rbac.ts`](src/lib/rbac.ts) (`requireAdmin`, `requireAuth`).

## Tech stack

- Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript  
- MongoDB + Mongoose 9 · NextAuth v5  
- Tailwind v4, shadcn/ui, react-hook-form + Zod, Recharts, SWR (autocomplete POS)

## Arsitektur (ringkas)

```
Browser
  ├── Server Components → Mongoose → MongoDB (baca)
  ├── Server Actions    → Mongoose → MongoDB (tulis + validasi Zod)
  └── Route handlers /api/* (autocomplete, health, export CSV, NextAuth)
```

Transaksi penjualan/pembelian memakai **MongoDB session + `withTransaction`**; nomor dokumen lewat koleksi **Counter** (`$inc` atomik). Penjelasan dan diagram: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Cara menjalankan

**Prasyarat:** Node.js 18+, pnpm, MongoDB (lokal atau Atlas).

```bash
git clone <repo-url>
cd erp
pnpm install
cp .env.local.example .env.local
# Edit .env.local — setidaknya MONGODB_URI dan AUTH_SECRET (≥32 karakter)
pnpm seed    # HATI-HATI: mengosongkan DB lalu mengisi data demo — jangan di produksi
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000).

### Quality checks

```bash
pnpm test              # Vitest
curl -s http://localhost:3000/api/health   # { "ok": true, "db": "connected" } jika DB jalan
```

### Environment variables

| Variabel | Keterangan |
|----------|------------|
| `MONGODB_URI` | Connection string MongoDB |
| `AUTH_SECRET` | Secret NextAuth; panjang aman, jangan di-commit |
| `NEXTAUTH_URL` | Origin aplikasi (dev: `http://localhost:3000`) |

Contoh lengkap: [.env.local.example](.env.local.example)

## Struktur folder

```
app/
  (auth)/login/
  (dashboard)/     # halaman ERP (pos, invoice, stok, laporan, pengaturan, …)
  api/               # NextAuth, health, products/search, customers/search, reports/sales
src/
  actions/           # Server Actions per domain
  components/       # UI + client widgets
  lib/               # db, auth, rbac, audit, utils, …
  models/            # skema Mongoose
  schemas/           # Zod
scripts/
  seed.ts            # reset DB + seed demo
```

## Future work

- Docker (`Dockerfile`, `docker-compose` dengan MongoDB)
- Cache (Redis) untuk agregasi dashboard; antrean kerja (BullMQ) untuk export/PDF besar
- Multi-cabang / multi-gudang
- Akuntansi (COA, jurnal, laporan keuangan)
- Retur & void transaksi; quotation / SO workflow; surat jalan
- Route API tambahan untuk export laporan yang belum tersedia (lihat catatan di [docs/API.md](docs/API.md))

## License

MIT
