# Pembaruan Riskman 1.1 — peserta cukup kode kelas

## Perilaku baru

Pengajar tetap login dengan Clerk, kemudian membuat sesi dan nama kabupaten/kota. Peserta memilih Masuk dengan kode kelas, memasukkan kode, memilih daerah dan satu OPD. Tidak perlu email, password, OTP, atau akun peserta. Empat anggota memakai perangkat/profil browser berbeda. Satu kelompok tetap menghasilkan satu MRI kabupaten/kota.

Sesi peserta disimpan sebagai cookie otomatis selama 30 hari. Muat ulang atau gunakan tombol Lanjutkan permainan di browser ini untuk kembali. Jika berganti perangkat, cookie terhapus, atau akses hilang, pengajar membuka rincian kelompok, memilih OPD, dan menekan Reset akses. Browser lama kehilangan hak membaca/menyimpan; perangkat pengganti dapat mengambil OPD yang dilepas. Jawaban, hasil yang sudah dikumpulkan, dan waktu mulai tidak dihapus. Waktu tetap 120 menit dari anggota pertama masuk. Jika jawaban sudah dikumpulkan, perangkat pengganti hanya dapat melihat hasil.

Kelas ditutup: peserta baru tidak bisa masuk dan jawaban tidak bisa disimpan. Peserta yang masih memiliki sesi dapat melihat jawaban. Jika pengajar mereset akses saat kelas ditutup, buka kelas kembali agar perangkat pengganti dapat masuk; timer tetap berjalan.

## Cara memperbarui instalasi dari ZIP sebelumnya

1. Ekstrak ZIP ini. Gunakan isi folder `riskman-vercel`, bukan mengunggah ZIP sebagai satu file.
2. Di GitHub, perbarui file sesuai struktur folder. Tidak perlu membuat aplikasi Clerk atau database Turso baru.
3. Pastikan file baru dan perubahan berikut ikut terunggah:

| File | Perubahan |
|---|---|
| `app/api/[...path]/route.ts` | Clerk khusus pengajar; route peserta memakai sesi tamu |
| `proxy.ts` | Route peserta dapat diakses tanpa login Clerk |
| `lib/riskman/handler.ts` | Masuk dengan kode, klaim OPD, reset akses oleh pemilik kelas |
| `lib/riskman/guest.ts` | BARU: pembuatan, verifikasi, dan kedaluwarsa sesi browser |
| `db/migrations/0002_guest_sessions.sql` | BARU: tabel sesi peserta |
| `public/portal.js` | Pintu masuk tanpa akun, lanjutkan permainan, tombol reset akses |
| `public/game/class-boot.js` | Mengingat permainan terakhir pada browser |
| `package.json`, `package-lock.json` | Versi 1.1 dan pengujian terbaru |
| `tests/api.test.mjs`, `tests/integration.ts` | Tes peserta tanpa akun, pemulihan dan otorisasi |
| `README.md`, `VALIDASI.md`, `UPDATE_v1.1.md` | Panduan dan hasil validasi |

`lib/database.ts`, `.env.example`, dan file migrasi 0000/0001 tetap digunakan. Jangan mengubah atau menghapus dua migrasi lama. Seluruh file aplikasi sudah disertakan dalam ZIP agar dapat dipasang baru maupun diperbarui.

4. Di komputer, buka terminal pada folder proyek yang berisi `package.json`. Pertahankan file `.env.local` milik Anda. Untuk instalasi baru, salin `.env.example` menjadi `.env.local` dan isi key Turso serta Clerk.
5. Jalankan:

```powershell
npm ci
npm run db:migrate
```

Untuk database yang sudah memakai versi lama, keluaran baru: `Applied 0002_guest_sessions.sql` lalu `Database siap.`. Database kosong akan menerapkan ketiga migrasi. Perintah ini tidak menghapus kelas, jawaban, atau nilai lama. Pastikan URL database pada `.env.local` sama dengan yang digunakan Vercel.

6. Environment variables Vercel tetap sama: dua key Turso, dua key Clerk, pengaturan URL Clerk, dan `TEACHER_EMAILS`. Clerk kini hanya untuk pengajar. Akses Vercel Deployment Protection juga harus mengizinkan peserta membuka situs; pembatasan di tingkat hosting terpisah dari login aplikasi.
7. Commit perubahan GitHub dan tunggu deployment Vercel, atau lakukan Redeploy setelah seluruh file dan migrasi siap.
8. Uji: buka aplikasi dari browser tanpa login, masuk memakai kode, pilih daerah dan OPD, isi sebagian jawaban, muat ulang. Pengajar reset akses OPD tersebut, lalu lanjutkan dari perangkat lain. Periksa jawaban tetap ada dan waktu tidak dimulai ulang.

## Kelas lama yang pernah dipakai peserta login

Kelas dan jawaban tetap tersimpan. Peserta lama beralih ke akses tanpa akun: pengajar mereset akses setiap OPD yang sebelumnya dipegang akun, kemudian peserta masuk menggunakan kode kelas pada browsernya. Jawaban dan nilai tetap dipertahankan. Tidak ada perpindahan otomatis dari identitas Clerk peserta ke sesi tamu.

## Batas verifikasi

Build Next.js dan tes database libSQL lokal tersedia pada paket. Koneksi Turso cloud, login pengajar Clerk, dan deployment Vercel milik Anda perlu diuji setelah konfigurasi pemilik. Paket ini tidak memperbarui repository GitHub atau deployment Vercel Anda secara otomatis.
