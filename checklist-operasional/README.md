# BRI Checklist Operasional

Dashboard checklist dan kepatuhan operasional dengan Supabase Auth, Postgres, Row Level Security (RLS), dan Supabase Storage.

## Konfigurasi

1. Nilai URL project dan publishable key Supabase di `.env.local`. Contohnya tersedia di `.env.example`.
2. Di Supabase Dashboard, buka **SQL Editor**, jalankan seluruh isi `supabase/schema.sql`. Jika tabel `public` sebelumnya dihapus, jalankan lagi script lengkap ini untuk membuatnya kembali.
3. Pastikan **Authentication > Providers > Email** aktif. Jika konfirmasi email diaktifkan, pegawai harus mengonfirmasi alamatnya sebelum login.
4. Mulai ulang Vite setelah mengubah `.env.local`.

Jangan masukkan `service_role` key ke aplikasi atau ke file yang dikirim ke browser. Aplikasi hanya memakai publishable key; akses database dibatasi oleh RLS.

## Membuat akun

- Pendaftaran di aplikasi hanya membuat akun **Pegawai**. Pengguna memasukkan nama, email, role pekerjaan, unit kerja, dan password.
- Supabase Auth menangani password. Profil dan checklist pegawai dibuat saat sesi pertama tersedia.
- Setiap user Supabase Auth mendapat baris di `public.profiles` dengan role awal `Pegawai`. Script skema juga mengisi profil untuk user Auth yang sudah ada. Profil dibuat otomatis oleh trigger ketika user baru ditambahkan.
- Ubah role hanya melalui Supabase Dashboard: buka **Table Editor > public.profiles**, cari user, lalu ubah `access_role` ke `Pegawai` atau `Supervisor`. Aplikasi tidak diberi izin untuk mengubah role.
- Alternatifnya, buka `supabase/set_user_role.sql`, isi email dan role tujuan, lalu jalankan di **SQL Editor**. Setelah itu, pengguna perlu keluar lalu masuk kembali.

## Data dan akses

- Data staf, checklist, catatan kendala, dan riwayat aktivitas disimpan di Postgres.
- Bukti foto disimpan di bucket privat `evidence`; aplikasi menggunakan signed URL sementara untuk menampilkan foto.
- Pegawai hanya dapat membaca dan mengubah checklist miliknya. Supervisor dapat melihat seluruh data operasional.
- Skema mengaktifkan RLS dan membuat bucket/policy Storage secara otomatis.
- Data lama yang tersimpan di `localStorage` browser **tidak dimigrasikan otomatis**. Akun lokal sebelumnya juga tidak menjadi akun Supabase; buat akun baru setelah skema dipasang.

## Menjalankan aplikasi

```sh
npm install
npm run dev
```

## Deploy ke Vercel

Project ini sudah memiliki `vercel.json` di folder induk. Impor folder induk project ke Vercel dan biarkan **Root Directory** tetap di root; konfigurasi tersebut mengarahkan output build ke folder Vite yang berada di `checklist-operasional/dist`.

Di **Project Settings > Environment Variables**, tambahkan:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Gunakan nilai project Supabase yang sama dengan `.env.local`, lalu deploy ulang setelah menyimpan variabel.

## Validasi

```sh
npm run lint
npm run build
```
