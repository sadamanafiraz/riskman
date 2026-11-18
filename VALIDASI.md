# Validasi paket 1.1

- Dua mode permainan dan empat OPD: jawaban sempurna MRI 5; jawaban salah menghasilkan rincian kesalahan: lulus.
- Ketiga migrasi libSQL, termasuk menjalankan ulang dan mempertahankan data versi sebelumnya: lulus.
- Peserta masuk tanpa akun dengan kode kelas: lulus.
- Cookie acak HttpOnly/SameSite/Secure, token di-hash pada database, cookie palsu dan kedaluwarsa ditolak: lulus.
- Empat browser memegang empat OPD dalam satu daerah, satu OPD per browser per kelas, muat ulang, konflik revisi, penguncian identifikasi: lulus.
- Reset oleh pemilik kelas mencabut browser lama; browser pengganti melanjutkan jawaban dan timer yang sama: lulus.
- Reset setelah pengumpulan mempertahankan hasil dan status terkunci: lulus.
- Penolakan akses pengajar untuk peserta, kelas milik pengajar lain, permintaan dari origin lain: lulus.
- MRI kabupaten/kota tersedia setelah 4 OPD selesai dan sesuai rata-rata skor tertimbang: lulus.
- Kelas ditutup menolak klaim baru/simpan; pengumpulan lewat waktu menilai jawaban tersimpan: lulus.
- Klaim OPD bersamaan menghasilkan tepat satu pemegang: lulus.
- Syntax JavaScript, TypeScript, build produksi Next.js 16.4.6: lulus.
- Belum diuji menggunakan kredensial Clerk, database Turso cloud, atau deployment Vercel pemilik. Pemeriksaan visual browser tidak termasuk validasi paket ini.

Environment pengujian: Node.js 24.22.1; target package/Vercel: Node.js 22.x. Build menggunakan publishable key dummy khusus validasi dan tidak memasukkannya ke konfigurasi yang dikirim.
