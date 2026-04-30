# Toko Bangunan ERP

Sistem manajemen toko bangunan berbasis web dibangun dengan **Next.js 16**, **MongoDB**, dan **TypeScript** — dibuat sebagai portfolio project.

## Demo

- **URL**: _(deploy ke Vercel setelah setup MongoDB Atlas)_
- **Admin**: `admin@toko.test` / `admin123`
- **Kasir**: `kasir@toko.test` / `kasir123`

---

## Fitur

| Modul | Deskripsi |
|-------|-----------|
| **Auth & RBAC** | Login/logout, 2 role: `ADMIN` & `KASIR`, proteksi route via NextAuth v5 |
| **POS / Kasir** | Cari produk by nama/SKU, keranjang, diskon, hitung kembalian, keyboard shortcut (F2) |
| **Invoice** | Auto-generate `INV/YYYY/MM/0001`, detail invoice printable (Ctrl+P → Save as PDF) |
| **Pembelian** | Form penerimaan barang dari supplier, stok otomatis bertambah |
| **Manajemen Stok** | Daftar stok, filter low-stock, riwayat mutasi IN/OUT per produk |
| **Dashboard** | KPI hari ini, grafik penjualan 7 hari (Recharts), top 5 produk |
| **Laporan** | Laporan penjualan dengan filter tanggal + export CSV |
| **Master Data** | CRUD Kategori, Satuan, Supplier, Produk |

---

## Tech Stack

- **Framework**: Next.js 16.2.4 (App Router, Server Components, Server Actions)
- **Language**: TypeScript
- **Database**: MongoDB + Mongoose 9
- **Auth**: NextAuth v5 (Auth.js) — credentials + JWT
- **UI**: Tailwind CSS v4 + shadcn/ui + lucide-react
- **Forms**: react-hook-form + Zod
- **Charts**: Recharts
- **Data fetching**: SWR (POS autocomplete)

---

## Arsitektur

```
Browser (React Client)
    │
    ├── Server Components ──► Mongoose ──► MongoDB
    │   (halaman, read)
    │
    ├── Server Actions ──────► Mongoose ──► MongoDB
    │   (mutasi/write + Zod validate)
    │
    └── Route Handlers (/api)
        ├── /api/products/search  ← SWR POS autocomplete
        └── /api/reports/sales    ← CSV export stream
```

### Poin Teknis Kunci

**Transaksi Atomik MongoDB** — dipakai di POS (`createSale`) dan Pembelian (`createPurchase`):

```typescript
const session = await mongoose.startSession();
await session.withTransaction(async () => {
  // 1. Generate invoiceNumber race-safe via counter doc ($inc atomic)
  const counter = await Counter.findOneAndUpdate(
    { _id: "invoice-2026-04" },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, session }
  );
  // 2. Insert SaleOrder
  // 3. Decrement Product.stock ($inc: { stock: -qty })
  // 4. Insert StockMovement log
  // → Jika salah satu gagal, semua rollback. Stok tidak pernah "korupsi".
});
```

**Race-safe Invoice Number**: `Counter.findOneAndUpdate` + `$inc` di dalam transaksi yang sama memastikan tidak ada dua kasir bisa mendapat nomor invoice yang sama meski submit bersamaan.

---

## Cara Menjalankan

### Prerequisites
- Node.js 18+, pnpm
- MongoDB (lokal atau Atlas)

### Setup

```bash
# 1. Clone & install
git clone <repo-url>
cd erp
pnpm install

# 2. Konfigurasi environment
cp .env.local.example .env.local
# Edit MONGODB_URI sesuai setup Anda

# 3. Seed data demo (50 produk, 5 supplier, 30 transaksi)
pnpm seed

# 4. Jalankan development server
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000).

### Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/erp-toko-bangunan
AUTH_SECRET=your-super-secret-key-min-32-chars
NEXTAUTH_URL=http://localhost:3000
```

---

## Struktur Folder

```
src/
  app/
    (auth)/login/          ← Halaman login
    (dashboard)/           ← Layout sidebar + semua halaman
      pos/                 ← Kasir / POS
      invoice/[id]/        ← Detail invoice printable
      pembelian/           ← Form pembelian
      stok/                ← Manajemen stok
      laporan/             ← Laporan + export CSV
      produk/ kategori/ satuan/ supplier/
    api/
      products/search/     ← SWR autocomplete
      reports/sales/       ← CSV stream
  lib/       ← db.ts, auth.ts, rbac.ts, utils.ts
  models/    ← Mongoose schemas
  actions/   ← Server Actions (sale, purchase, product, ...)
  schemas/   ← Zod schemas (shared client & server)
  components/← UI components
scripts/
  seed.ts    ← Data demo realistis
```

---

## Future Work

Fitur yang sengaja tidak diimplementasikan di MVP ini (akan ditambahkan iterasi berikutnya):

- **Docker** — `Dockerfile` + `docker-compose.yml` (mongo service) → 1 jam, ROI tinggi
- **Redis** — Cache dashboard aggregation pipeline
- **BullMQ** — Async jobs: generate laporan PDF mingguan, notifikasi low-stock
- **Express microservice** — Pisahkan Reports Service sebagai API terpisah
- Multi-cabang / multi-gudang
- Akuntansi (COA, jurnal otomatis, neraca, laba rugi)
- Hutang/Piutang & pembayaran berkala
- Retur penjualan/pembelian & void invoice
- Surat jalan & manajemen pengiriman
- Quotation / Sales Order workflow

> Catatan: Redis, BullMQ, dan Express adalah bagian dari stack yang akan diadopsi pada iterasi berikutnya untuk menangani async jobs (generate laporan PDF, low-stock alert queue, export besar) — selaras dengan best practices arsitektur microservice.

---

## License

MIT
