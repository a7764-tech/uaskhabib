# RuangKampus

Aplikasi web untuk pencarian, pemesanan, persetujuan, pembayaran, dan pelaporan penyewaan ruang kampus.

## Teknologi

- Next.js App Router, React, TypeScript, dan Tailwind CSS
- PostgreSQL (Neon) dan Prisma ORM
- NextAuth Credentials dengan password bcrypt
- Vercel Blob private storage untuk unggahan persisten
- Zod untuk validasi data
- jsPDF dan fflate untuk ekspor laporan PDF dan Excel

## Deploy ke Vercel dengan Neon

1. Buat database PostgreSQL di [Neon](https://neon.tech/). Siapkan dua URL koneksi ber-SSL:
   - URL pooled (`-pooler` pada hostname) untuk `DATABASE_URL` saat aplikasi berjalan.
   - URL direct (tanpa `-pooler`) untuk `DIRECT_URL` saat Prisma menyiapkan skema.
2. Buat **private Blob store** dari tab Storage di project Vercel dan hubungkan ke project. Dokumen pemesanan dan bukti pembayaran disimpan privat; route aplikasi memeriksa pemilik atau peran petugas sebelum menyajikannya. Untuk menjalankan aplikasi lokal, buat token read/write untuk store itu dan isi `BLOB_READ_WRITE_TOKEN` di `.env`.
3. Hubungkan repository ke Vercel dan pilih **Root Directory** `UAS PAK ZAKI` (folder ini berisi `package.json` dan aplikasi Next.js). Gunakan preset Next.js. Tambahkan `DATABASE_URL`, `DIRECT_URL`, dan `NEXTAUTH_SECRET` pada environment yang digunakan. Atur `NEXTAUTH_URL` ke domain final, misalnya `https://domain-produksi-anda`, hanya untuk Production; untuk Preview biarkan kosong agar NextAuth memakai URL deployment Vercel.

   ```env
   DATABASE_URL=<Neon pooled URL>
   DIRECT_URL=<Neon direct URL>
   NEXTAUTH_URL=https://domain-produksi-anda
   NEXTAUTH_SECRET=<secret acak panjang>
   ```

   Buat secret, misalnya dengan `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. Jangan commit `.env` atau membagikan URL database/token. Vercel Blob yang terhubung menyediakan otorisasi runtime untuk private store.
4. Siapkan skema Neon sebelum deploy pertama dari folder project:

   ```bash
   npm install
   npm run db:push
   ```

   Deployment menjalankan `prisma generate` saat instalasi dependency dan `next build` saat build. Tidak perlu menjalankan seed untuk produksi; akun demo memakai kata sandi publik `password123`.
5. Setelah aplikasi tersedia, daftarkan akun penyewa, lalu promosikan akun petugas pertama melalui Neon SQL Editor:

   ```sql
   UPDATE users SET role = 'PETUGAS' WHERE email = 'email-petugas-anda';
   ```

   Ganti contoh email dengan email yang sudah terdaftar. Setelah itu petugas dapat mengelola akun berikutnya dari aplikasi.
6. Untuk mengembangkan lokal, salin `.env.example` menjadi `.env`, gunakan URL pooled Neon sebagai `DATABASE_URL`, URL direct sebagai `DIRECT_URL`, `NEXTAUTH_URL=http://localhost:3000`, lalu isi token Blob lokal. Jalankan `npm run dev`. Node.js 20.9 atau yang lebih baru diperlukan.

### Memindahkan data lokal yang sudah ada

Sebelum migrasi, siapkan Neon serta private Blob store. Pertahankan `DATABASE_URL` lokal sebagai sumber dan tambahkan URL direct Neon sebagai `DIRECT_URL` dan `NEON_DATABASE_URL` di `.env`. Jalankan:

```bash
npm run db:generate
npx tsx scripts/migrate-to-neon.ts
```

Skrip menampilkan jumlah baris dan meminta konfirmasi `MIGRATE`, membuat skema, menolak database Neon yang berisi tabel/data aplikasi, lalu menyalin semua baris dengan ID yang sama. Setelah berhasil, atur `DATABASE_URL` ke URL pooled Neon, `DIRECT_URL` ke URL direct Neon, dan `BLOB_READ_WRITE_TOKEN` ke token private Blob lokal. Pindahkan unggahan lokal yang direferensikan database:

```bash
npm run migrate:uploads
```

Skrip hanya memindahkan file terdaftar di `public/uploads` dan memperbarui URL-nya setelah upload berhasil. Simpan backup database dan file lokal sampai verifikasi selesai. Untuk melihat data Neon di DBeaver, buat koneksi PostgreSQL dengan SSL mode `require`.

## Menjalankan aplikasi dengan PostgreSQL lokal

1. Gunakan Node.js 20.9 atau yang lebih baru dan siapkan server PostgreSQL.
2. DBeaver adalah aplikasi klien untuk mengelola PostgreSQL, bukan pengganti PostgreSQL. Di DBeaver, buat koneksi PostgreSQL ke server (umumnya host `localhost`, port `5432`). Hubungkan ke database bawaan `postgres`, lalu jalankan:

   ```sql
   CREATE DATABASE ruang_kampus;
   ```

3. Salin `.env.example` menjadi `.env`. Atur `DATABASE_URL` dan `DIRECT_URL` dengan host, port, nama pengguna, kata sandi, dan database yang sama seperti koneksi DBeaver. Isi `NEXTAUTH_SECRET` dengan nilai acak yang panjang. Jangan gunakan tanda kutip atau karakter khusus pada kata sandi tanpa URL-encoding. Pertahankan secret yang sama setiap kali menjalankan aplikasi.
4. Pasang dependensi dan siapkan skema serta data demo:

   ```bash
   npm install
   npm run db:push
   npm run seed
   npm run dev
   ```

5. Buka `http://localhost:3000`. Untuk upload lokal, isi `BLOB_READ_WRITE_TOKEN` dengan token private Blob.

## Akun demo

Kedua akun menggunakan kata sandi `password123`. Gunakan hanya untuk development, jangan seed ke produksi.

| Peran | Email |
|---|---|
| Penyewa | `rina.putri@mhs.unugiri.ac.id` |
| Petugas | `budi.santoso@unugiri.ac.id` |

## Alur utama

- Penyewa mencari ruangan, mengisi formulir berdasarkan kepentingan, dan mengirim pengajuan.
- Server memvalidasi kapasitas, dokumen wajib, tarif, serta bentrok jadwal dengan pemesanan yang telah disetujui atau terkonfirmasi.
- Petugas menyetujui atau menolak pengajuan dengan alasan.
- Penyewa mengunggah bukti transfer setelah disetujui; petugas memeriksa nominal dan bukti sebelum konfirmasi.
- Petugas mengelola ruangan dan pengguna, serta mengekspor laporan PDF atau Excel.

Unggahan dibatasi 4 MB agar sesuai batas request function serverless dan disimpan pada private Vercel Blob. Berkas bawaan gambar ruangan berada di `public/rooms`.
