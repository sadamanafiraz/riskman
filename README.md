# Riskman Simulation — GitHub + Vercel

Paket sumber aplikasi, bukan ZIP yang diunggah langsung ke Vercel. Ekstrak ZIP, unggah **isi folder** ke repository GitHub, kemudian import repository di Vercel.

## Yang tersedia

- Risk Specialist dan Risk Assurer dalam sesi kelas terpisah.
- Login email pengajar dan peserta melalui Clerk; akun ChatGPT tidak diperlukan.
- Pengajar menambahkan nama kabupaten/kota. Setiap daerah otomatis memiliki empat tugas: Bappeda, BPKAD, PU, PDAM.
- Empat anggota memakai akun berbeda. Setiap anggota mengambil satu OPD per kelas.
- Timer bersama 120 menit sejak anggota pertama bergabung.
- Penyimpanan jawaban, perhitungan di server, dan dashboard detail kesalahan.
- MRI kabupaten/kota = rata-rata skor tertimbang empat OPD / 20. Tiap OPD berbobot 25%. Hasil final hanya muncul setelah keempat tugas dikumpulkan.
- Ekspor hasil CSV dari dashboard; ilustrasi Riskman dan Riskwoman serta bank kasus ikut dalam paket.

## Persiapan

Siapkan akun GitHub, Vercel, Clerk (https://clerk.com), dan Turso (https://turso.tech). Node.js **22** diperlukan untuk menyiapkan database melalui komputer atau GitHub Codespaces. Akun layanan dan API keys dibuat oleh pemilik aplikasi; ZIP tidak memuat kredensial.

Versi ini memakai **Next.js + Turso/libSQL + Clerk**, menggantikan runtime Cloudflare D1 dan login ChatGPT di versi sebelumnya. Database dibuat kosong: riwayat kelas pada situs sebelumnya **tidak otomatis berpindah**. Situs lama tidak diubah.

## 1. Buat database Turso

1. Buat database di dashboard Turso.
2. Salin database URL (`libsql://...`) dan database auth token ke tempat aman.
3. Keduanya menjadi `TURSO_DATABASE_URL` dan `TURSO_AUTH_TOKEN`.

## 2. Buat aplikasi Clerk

1. Buat aplikasi di dashboard Clerk. Aktifkan pendaftaran/login email dan verifikasi alamat email; gunakan pengaturan email yang didukung dashboard.
2. Salin Publishable Key dan Secret Key dari halaman API Keys.
3. Gunakan development instance untuk uji coba. Untuk penggunaan produksi, ikuti checklist produksi Clerk, konfigurasi domain yang diminta, dan gunakan kunci production dari instance yang sama.
4. Pengajar harus masuk memakai **email utama terverifikasi** yang ada dalam `TEACHER_EMAILS`.
5. Peserta membuat akun masing-masing. Satu kelompok membutuhkan empat akun berbeda.

## 3. Upload ke GitHub

1. Buat repository baru; **Private disarankan karena source berisi bank kasus dan kunci penilaian**.
2. Ekstrak ZIP. Unggah seluruh isi folder `riskman-vercel`, termasuk `.gitignore` dan `.env.example`. Pastikan `package.json`, `app`, `public`, dan `lib` berada di root repository.
3. Jangan unggah ZIP sebagai satu file. Jangan unggah `node_modules`, `.next`, atau `.env.local`.
4. Alternatif melalui Git dari folder hasil ekstrak:

```bash
git init
git add .
git commit -m "Initial Riskman Vercel version"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

Ganti USERNAME/REPOSITORY dengan repository milik Anda. Jika memakai upload browser GitHub, periksa file tersembunyi ikut terunggah.

## 4. Siapkan tabel sekali sebelum kelas pertama

Di terminal komputer, atau terminal GitHub Codespaces pada repository:

```bash
npm ci
cp .env.example .env.local
```

Windows PowerShell: gunakan `Copy-Item .env.example .env.local` menggantikan `cp`.

Edit `.env.local`, isi semua nilai dengan konfigurasi Anda. Jalankan:

```bash
npm run db:migrate
```

Migrasi membuat tabel, menyimpan versi migrasi, dan aman dijalankan ulang. Tidak menghapus jawaban. Jangan mengedit SQL migrasi yang sudah diterapkan; buat migrasi baru bila skema diubah. Migrasi tidak otomatis berjalan pada setiap request atau build.

## 5. Import di Vercel

1. Vercel → Add New / Project → import repository GitHub tersebut.
2. Framework: **Next.js**. Root Directory: folder yang memuat `package.json` (biasanya default).
3. Node.js: **22.x**. Install: `npm ci`. Build: `npm run build`. Output Directory: biarkan default Next.js.
4. Masukkan environment variables berikut, sebelum deploy:

| Variable | Nilai |
|---|---|
| `TURSO_DATABASE_URL` | URL database dari Turso |
| `TURSO_AUTH_TOKEN` | Token database dari Turso |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Publishable Key Clerk |
| `CLERK_SECRET_KEY` | Secret Key Clerk dari instance yang sama |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/` |
| `TEACHER_EMAILS` | Email utama terverifikasi pengajar, pisahkan dengan koma |

5. Deploy. Buka URL yang diberikan Vercel. Jika mengganti environment variables, lakukan **Redeploy** agar konfigurasi baru digunakan.
6. Untuk preview/testing terpisah, gunakan database dan instance Clerk pengujian agar hasil uji tidak masuk ke data kelas produksi.

## 6. Uji sebelum pelatihan

1. Daftar/login dengan email pengajar yang terdaftar, lalu buka ruang pengajar.
2. Buat kelas, isi nama kota/kabupaten, dan salin kode kelas.
3. Login dengan empat akun peserta berbeda (gunakan profil browser atau perangkat berbeda).
4. Masukkan kode yang sama, pilih daerah yang sama, lalu masing-masing pilih OPD berbeda.
5. Pastikan OPD yang sudah diambil tidak bisa diambil anggota lain; satu akun tidak bisa memegang dua OPD pada kelas yang sama.
6. Kerjakan dan kumpulkan tugas. Dashboard harus menampilkan 1/4, 2/4, 3/4, lalu 4/4 selesai. MRI daerah baru tampil pada 4/4.
7. Buka rincian OPD, periksa tahap penilaian, jawaban keliru, acuan, dan alasan. Uji unduh CSV.

## Menjalankan lokal

```bash
npm ci
# Isi .env.local dahulu, lalu:
npm run db:migrate
npm run dev
```

Buka http://localhost:3000. Untuk pemeriksaan kode:

```bash
npm test
npm run typecheck
npm run build
```

`npm test` menggunakan database lokal sementara, bukan database kelas. Identitas uji disuntikkan hanya di test harness; route produksi selalu membaca sesi Clerk, tidak mempercayai header identitas kiriman browser.

## Troubleshooting

- **Tidak dapat masuk / Clerk key invalid:** pastikan kedua key berasal dari instance Clerk yang sama, konfigurasi domain sesuai instance, dan redeploy setelah perubahan.
- **Akun peserta, akses pengajar belum diberikan:** masukkan email utama terverifikasi ke `TEACHER_EMAILS`, redeploy, lalu login ulang.
- **Gangguan penyimpanan:** cek Turso URL/token dan pastikan `npm run db:migrate` berhasil pada database yang sama dengan Vercel.
- **OPD sudah dipegang:** lanjutkan dengan akun anggota yang memilihnya. Setiap OPD hanya dipegang satu akun.
- **Waktu habis:** kumpulkan jawaban yang sudah tersimpan. Mengganti perangkat tidak mengulang timer.
- **MRI daerah belum muncul:** pastikan keempat OPD sudah mengumpulkan, lalu perbarui dashboard.
- **Build gagal karena env:** isi semua Clerk environment variables sebelum build/deploy; contoh placeholder bukan kunci yang valid.

## Catatan data dan operasional

Bank kasus berada di `lib/riskman/bank.json`; kunci tidak disajikan sebagai berkas publik. Data kasus adalah simulasi. MRI permainan bukan asesmen maturitas organisasi yang sebenarnya. Aplikasi tidak menyediakan pemulihan/penggantian anggota OPD melalui UI; rencanakan akun anggota sebelum mulai. Pengajar dapat menutup/membuka kelas, tetapi timer tidak diulang.

Paket ini bukan hasil deploy ke akun Vercel Anda. Uji login nyata dan koneksi database cloud perlu dilakukan setelah Anda mengisi kredensial dan deploy. Tarif/kuota layanan mengikuti akun dan paket masing-masing penyedia.

## Dokumentasi penyedia

- Vercel Next.js: https://vercel.com/docs/frameworks/full-stack/nextjs
- Vercel environment variables: https://vercel.com/docs/environment-variables
- Clerk Next.js: https://clerk.com/docs/nextjs/getting-started/quickstart
- Clerk production: https://clerk.com/docs/guides/development/deployment/production
- Turso TypeScript: https://docs.turso.tech/sdk/ts/quickstart
