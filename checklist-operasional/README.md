# RuangPatuh

Prototipe dashboard checklist dan kepatuhan operasional harian perbankan.

## Menjalankan aplikasi

```sh
npm install
npm run dev
```

## Menggunakan prototipe

- Untuk pegawai baru, pilih **Daftar**, lalu isi nama lengkap, email, role pekerjaan, unit kerja, dan password.
- Checklist pagi dan sore dibuat otomatis mengikuti role pekerjaan pegawai.
- Pendaftaran meminta role akun, email unik, dan password minimal 4 karakter. Pendaftaran pegawai juga memerlukan role pekerjaan dan unit.
- Masuk memakai role akun, email, dan password yang terdaftar.
- Status tugas berubah menjadi terlambat setelah deadline WIB terlewati jika belum selesai.
- Tugas yang memerlukan foto hanya dapat diselesaikan setelah bukti gambar diunggah.
- Pegawai dapat menambahkan catatan kendala per tugas; catatan tersimpan dan terlihat oleh supervisor di dashboard.
- Bukti foto dapat dibuka dalam pratinjau besar. Ukuran unggahan maksimal 2 MB per foto.
- Pilih role **Supervisor** untuk melihat dashboard kepatuhan. Supervisor tidak dapat mengisi checklist dari tampilan ini.
- Supervisor dapat membuka **Riwayat aktivitas** untuk melihat pegawai, tugas, aksi, dan waktu WIB saat checklist diselesaikan, foto diunggah, atau penyelesaian dibatalkan.
- Pegawai dapat masuk kembali dengan nama, role pekerjaan, dan unit kerja yang sama untuk melanjutkan checklist.
- Data staf, status checklist, bukti foto, dan riwayat aktivitas disimpan di penyimpanan browser perangkat ini.

**Penting:** akun dan verifikasi password saat ini hanya berlaku di browser lokal yang sama. Password disimpan sebagai hash PBKDF2, bukan teks biasa, tetapi tidak ada autentikasi atau otorisasi server; siapa pun dapat mendaftar sebagai Supervisor dan memodifikasi data lokal. Ini bukan kontrol akses yang aman untuk perbankan. Data tidak tersinkron antarperangkat/browser. Integrasikan dengan backend, otorisasi role server-side, dan penyimpanan terkelola sebelum memakai data operasional atau kredensial asli.

## Validasi

```sh
npm run lint
npm run build
```
