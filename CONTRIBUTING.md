# Kontribusi

Terima kasih atas minat Anda memperbaiki atau memperluas proyek ini.

## Lingkungan kerja

1. Ikuti [docs/SETUP.md](docs/SETUP.md) untuk install, `.env.local`, dan seed **hanya di lingkungan development**.  
2. Sebelum PR, jalankan:

```bash
pnpm lint
pnpm test
```

3. Untuk perubahan UI/server yang besar, `pnpm build` membantu menangkap error tipe Next.js.

## Branch & commit

- **Utamakan branch `develop`** untuk fitur dan perbaikan; **`main`** untuk rilis yang stabil (fast-forward atau merge setelah review).  
- Commit **kecil dan fokus** satu topik; pesan jelas dalam bahasa yang konsisten dengan tim (contoh: `fix: piutang filter tanggal`, `feat: export sales CSV header`).

## Pull request

- Jelaskan **apa** yang berubah dan **mengapa** (bukan hanya diff panjang).  
- Jika menambah route `app/api/**`, perbarui [docs/API.md](docs/API.md).  
- Jika menambah langkah setup atau merusak kompatibilitas seed, perbarui [docs/SETUP.md](docs/SETUP.md) atau [README.md](README.md).

## Gaya kode

- Ikuti pola existing: Server Actions di `src/actions/`, model di `src/models/`, halaman di `app/(dashboard)/`.  
- Hindari meneruskan **fungsi** dari Server Component ke Client Component sebagai props (event handler); bungkus dalam client component atau panggil action dari form/`startTransition` sesuai pola Next.js.

## Keamanan

- Jangan commit secret (`.env.local`, kunci Atlas, `AUTH_SECRET`). Gunakan [.env.local.example](.env.local.example) sebagai template.
