# Setup & pengoperasian

## Prasyarat

- **Node.js** 18 atau lebih baru  
- **pnpm** (disarankan; npm/yarn bisa disesuaikan sendiri)  
- **MongoDB** — instance lokal, Docker, atau [MongoDB Atlas](https://www.mongodb.com/atlas)

## Install & environment

```bash
git clone <repo-url>
cd erp
pnpm install
cp .env.local.example .env.local
```

Edit `.env.local`:

| Variabel | Contoh | Catatan |
|----------|--------|---------|
| `MONGODB_URI` | `mongodb://localhost:27017/erp-toko-bangunan` | Database target. |
| `AUTH_SECRET` | string panjang acak | Minimal sekitar 32 karakter; dipakai NextAuth untuk JWT/session. |
| `NEXTAUTH_URL` | `http://localhost:3000` | Di production ganti ke URL publik aplikasi. |

## Seed data demo

```bash
pnpm seed
```

**Peringatan:** script ini memanggil **`dropDatabase()`** pada database yang ditunjuk `MONGODB_URI`, lalu mengisi ulang data contoh (user, produk, transaksi, pelanggan, pengaturan toko). **Jangan jalankan di environment production** atau pada data yang ingin dipertahankan.

Output akhir menampilkan kredensial login demo (selaras dengan [scripts/seed.ts](../scripts/seed.ts)).

## Development

```bash
pnpm dev
```

Buka `http://localhost:3000`. Halaman login: `/login`.

## Production (build)

```bash
pnpm build
pnpm start
```

Pastikan variabel environment yang sama tersedia di host (Vercel, VPS, dll.). Untuk Vercel, set `MONGODB_URI`, `AUTH_SECRET`, dan `NEXTAUTH_URL` di project settings.

## Verifikasi cepat

```bash
pnpm test
```

Saat server jalan, cek koneksi DB:

```bash
curl -s http://localhost:3000/api/health
```

Respons sukses berbentuk JSON dengan `ok: true` dan `db: "connected"`.

## Troubleshooting

### MongoDB tidak terhubung

- Pastikan servis MongoDB berjalan dan `MONGODB_URI` benar (host, port, nama database, user/password untuk Atlas).  
- Cek firewall / IP whitelist di Atlas.

### Login gagal / error auth

- `AUTH_SECRET` wajib ada dan cukup panjang.  
- `NEXTAUTH_URL` harus cocok dengan URL yang dipakai browser (termasuk skema `http` vs `https`).

### Error setelah pull kode baru

- Jalankan ulang `pnpm install`.  
- Jika skema berubah besar, pertimbangkan `pnpm seed` hanya di **development** (ingat: seed menghapus database).

### User tidak bisa login

- Admin bisa menonaktifkan user di Pengaturan → Pengguna; user `active: false` ditolak saat login ([auth](../src/lib/auth.ts)).
