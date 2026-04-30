# Panduan operator (alur di aplikasi)

Dokumen ini menjelaskan **langkah di layar**, bukan detail teknis. Menu mengikuti sidebar; nama dapat sedikit berbeda pada mobile, tetapi jalurnya sama.

## Peran

- **Admin**: akses penuh — master data, pembelian, piutang, hutang, laporan, pengaturan, log audit.  
- **Kasir**: operasional harian — dashboard, POS, daftar invoice, stok (baca/monitor), **Kas & Shift** untuk buka/tutup shift.

## Harian kasir: shift → jual → tutup (disarankan)

1. **Login** dengan akun kasir.  
2. Buka **Kas & Shift** (`/kas`).  
3. **Buka shift** — isi modal pembukaan (uang modal awal jika diminta). Tanpa shift terbuka, **POS** akan menolak penjualan dengan pesan untuk membuka shift di menu ini.  
4. Buka **Kasir / POS** (`/pos`).  
5. Cari produk (nama, SKU, atau barcode), tambah ke keranjang, atur qty, diskon dalam batas yang diizinkan, pajak mengikuti pengaturan toko.  
6. Pilih **pembayaran tunai** atau **kredit**; jika kredit, **pilih pelanggan** (master Pelanggan diisi admin).  
7. Selesaikan transaksi; nomor invoice muncul dan bisa dicetak lewat **Invoice**.  
8. Di akhir hari (atau saat ganti kasir), kembali ke **Kas & Shift** dan **tutup shift** dengan rekonsiliasi yang sesuai kebijakan toko.

## Admin: master data

Urutan yang wajar:

1. **Satuan** & **Kategori** — referensi untuk produk.  
2. **Supplier** — untuk pembelian dan hutang.  
3. **Produk** — SKU, harga beli/jual, stok awal, barcode opsional, tautan kategori & satuan.  
4. **Pelanggan** — untuk penjualan kredit dan pelacakan piutang.

Perubahan di master biasanya tercatat di **Log Audit** untuk audit internal.

## Pembelian & hutang supplier

1. **Pembelian** — catat barang masuk dari supplier; stok produk bertambah.  
2. **Hutang Supplier** — pantau daftar hutang dan pelunasan (sesuai implementasi form di aplikasi).  
3. Lihat **Stok** untuk mutasi dan **low stock** jika tersedia filter.

## Penjualan kredit & piutang

1. Di POS pilih metode **kredit** dan pelanggan.  
2. **Piutang** (admin) — pantau saldo/pelunasan per invoice atau pelanggan sesuai layar aplikasi.  
3. **Invoice** — bukti dan riwayat transaksi untuk pelanggan.

## Pengaturan toko

- **Pajak & Diskon** — tarif pajak default dan batas diskon yang boleh diberikan kasir tanpa intervensi admin.  
- **Pengguna** — buat/nonaktifkan admin & kasir; user nonaktif tidak bisa login.

## Laporan & export (admin)

- **Laporan** — filter periode, ringkasan penjualan di layar.  
- Tombol **Export penjualan CSV** memakai API resmi (lihat [API.md](API.md)). Tombol export lain di halaman yang sama mungkin baru aktif setelah endpoint backend tersedia — lihat catatan di dokumentasi API.

## Bantuan singkat

- **Lupa membuka shift:** POS menampilkan peringatan — buka shift di **Kas & Shift** dulu.  
- **Diskon ditolak:** cek **Pajak & Diskon**; kasir dibatasi persentase tertentu.  
- **Butuh bantuan IT:** beri tahu URL error, peran user, dan langkah terakhir sebelum masalah muncul.
