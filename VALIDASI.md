# Validasi paket

- Perhitungan sempurna dan jawaban salah untuk dua mode, empat OPD: lulus.
- Database lokal libSQL dengan dua migrasi, termasuk menjalankan migrasi ulang: lulus.
- Buat kelas, empat anggota, kunci pemilihan OPD, waktu bersama, simpan/muat ulang, konflik revisi, kumpulkan, MRI gabungan, detail kesalahan, tutup kelas: lulus.
- Identitas kosong meskipun header identitas palsu dikirim: ditolak. Peserta tidak dapat mengakses pengelolaan kelas. Pengajar lain tidak dapat mengakses kelas pemilik: lulus.
- TypeScript dan build produksi Next.js 16.4.6: lulus dengan publishable key dummy khusus pemeriksaan build (tidak disertakan sebagai konfigurasi aplikasi).
- Belum diuji: login dengan akun Clerk nyata, database Turso cloud milik pengguna, dan deploy di akun Vercel pengguna. Ketiganya memerlukan konfigurasi pemilik.
- Tidak ada migrasi riwayat kelas dari situs ChatGPT; paket membuat database baru.

Environment pengujian: Node.js 24.22.1. Target package/Vercel: Node.js 22.x.
