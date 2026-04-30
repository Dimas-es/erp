# ADR 001: Stack aplikasi & penyimpanan data

**Status:** Accepted  
**Tanggal:** 2026-04

## Konteks

Diperlukan aplikasi ERP ringan untuk toko bangunan dengan **satu tenant**, antarmuka web untuk kasir dan admin, dan kemungkinan deploy mudah (misalnya Vercel). Data bersifat transaksional dan relasional sederhana (order, stok, master), dengan kebutuhan **konsistensi kuat** saat update stok bersamaan.

## Keputusan

1. **Framework:** Next.js (App Router) + TypeScript — satu codebase untuk UI, Server Actions, dan route API; cocok untuk portfolio dan iterasi cepat.  
2. **Data store:** MongoDB dengan Mongoose — skema fleksibel untuk evolusi model ERP; transaksi multi-dokumen mendukung pola stok + invoice + counter atomik.  
3. **Auth:** NextAuth v5 (credentials + JWT) — integrasi native dengan App Router, session berbasis cookie.  
4. **UI:** Tailwind + komponen headless (shadcn) — konsistensi desain tanpa kit UI monolitik.

## Konsekuensi

- **Positif:** Deploy single-app, DX baik, transaksi Mongo cukup untuk konkurensi kasir, dokumentasi ekosistem luas.  
- **Negatif / trade-off:** Tanpa ORM SQL, laporan ad-hoc sangat kompleks bisa memerlukan agregasi pipeline atau ekspor async di masa depan; multi-cabang belum dipisah di level data.

## Alternatif yang dipertimbangkan

- **PostgreSQL + Prisma** — kuat untuk relational reporting; ditolak untuk MVP agar tetap selaras dengan stack yang sudah dipilih proyek dan kompleksitas migrasi awal.  
- **Backend terpisah (Express)** — ditambahkan hanya bila beban export/async membutuhkan antrean; saat ini monolith cukup.
