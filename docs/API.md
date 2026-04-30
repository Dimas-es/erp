# API HTTP (`app/api`)

Semua route di bawah relatif terhadap origin aplikasi (contoh `http://localhost:3000`).

## Ringkasan

| Method | Path | Auth | Keterangan |
|--------|------|------|------------|
| `*` | `/api/auth/*` | Campuran | NextAuth: login, session, CSRF, dll. Jangan di-bypass di proxy tanpa memahami flow Auth.js. |
| `GET` | `/api/health` | Tidak | Cek koneksi MongoDB. `200` + `{ ok: true, db: "connected" }` atau `503` jika gagal. |
| `GET` | `/api/products/search?q=` | Tidak* | JSON array produk (`stock > 0`), filter opsional nama/SKU/barcode. Dipakai autocomplete POS. |
| `GET` | `/api/customers/search?q=` | Session | JSON array pelanggan; `q` opsional. `401` tanpa session. |
| `GET` | `/api/reports/sales?from=&to=` | Admin | Stream **CSV** penjualan. Query `from` / `to` opsional (ISO date). `403` jika bukan `ADMIN`. |

\*Endpoint pencarian produk saat ini **tidak** memeriksa session; asumsikan dipakai di lingkungan terpercaya atau dalam jaringan kasir. Jika di-expose publik ketat, pertimbangkan menambah auth.

## Detail

### `GET /api/health`

- **Response sukses:** `{ "ok": true, "db": "connected" }`  
- **Response gagal:** `{ "ok": false, "error": "<pesan>" }` dengan status `503`

### `GET /api/products/search`

- **Query:** `q` — substring pencarian (kosong = semua yang stok > 0, dibatasi).  
- **Response:** array objek ringkas: `_id`, `sku`, `name`, `sellPrice`, `stock`, `unit`  
- Implementasi: [`app/api/products/search/route.ts`](../app/api/products/search/route.ts)

### `GET /api/customers/search`

- **Header:** cookie session NextAuth (user sudah login).  
- **Query:** `q` — opsional; jika diisi, filter nama/telepon.  
- **Response:** array `{ _id, name, phone }`  
- **401** jika tidak login.  
- Implementasi: [`app/api/customers/search/route.ts`](../app/api/customers/search/route.ts)

### `GET /api/reports/sales`

- **Admin saja** (`403` untuk kasir).  
- **Query:** `from`, `to` — opsional, filter `createdAt` order.  
- **Response:** `text/csv` dengan header kolom penjualan.  
- Implementasi: [`app/api/reports/sales/route.ts`](../app/api/reports/sales/route.ts)

## Catatan: tautan di halaman Laporan

Halaman **Laporan** ([`app/(dashboard)/laporan/page.tsx`](../app/(dashboard)/laporan/page.tsx)) memuat tombol yang mengarah ke:

- `/api/reports/purchases`  
- `/api/reports/margin`  

Pada snapshot repo saat pembuatan dokumen ini, **file route untuk kedua path tersebut belum ada**; permintaan akan menghasilkan **404** sampai endpoint diimplementasikan. Export **penjualan** CSV sudah tersedia lewat `/api/reports/sales` di atas.

## NextAuth

Endpoint resmi biasanya termasuk:

- `POST /api/auth/signin` (credentials)  
- `GET/POST /api/auth/signout`  
- `GET /api/auth/session`  

Rujukan: dokumentasi [Auth.js / NextAuth](https://authjs.dev/).
