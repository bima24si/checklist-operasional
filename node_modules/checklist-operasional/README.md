# BRI Checklist Operasional

Dashboard checklist dan kepatuhan operasional dengan Supabase Auth, Postgres, Row Level Security (RLS), dan Supabase Storage.

## Konfigurasi

1. Nilai URL project dan publishable key Supabase di `.env.local`. Contohnya tersedia di `.env.example`.
2. Di Supabase Dashboard, buka **SQL Editor**, jalankan seluruh isi `supabase/schema.sql`. Jalankan ulang script ini untuk menerapkan pembaruan skema, termasuk penyimpanan referensi foto di riwayat aktivitas; jika tabel `public` sebelumnya dihapus, script lengkap ini akan membuatnya kembali.
3. Pastikan **Authentication > Providers > Email** aktif. Jika konfirmasi email diaktifkan, pegawai harus mengonfirmasi alamatnya sebelum login.
4. Mulai ulang Vite setelah mengubah `.env.local`.

Jangan masukkan `service_role` key ke aplikasi atau ke file yang dikirim ke browser. Aplikasi hanya memakai publishable key; akses database dibatasi oleh RLS.

## Membuat akun

- Pendaftaran di aplikasi hanya membuat akun **Pegawai**. Pengguna memasukkan nama, email, role pekerjaan, dan password. Unit kerja pegawai baru otomatis ditetapkan ke **kcp iskandar**.
- Pendaftaran pegawai berstatus **menunggu persetujuan**. Pegawai belum dapat membuka aplikasi sampai supervisor menyetujui pendaftaran melalui menu **Persetujuan pegawai**.
- Setelah disetujui, pegawai dapat masuk dan profil staf serta checklist dibuat saat sesi pertama.
- Jadwal checklist Satpam, Teller, dan Customer Service mengikuti jadwal operasional terbaru di aplikasi. Menjalankan ulang `supabase/schema.sql` akan mengarsipkan tugas lama dan membuat tugas pengganti untuk pegawai yang sudah terdaftar; catatan, status, dan bukti foto lama tetap disimpan.
- Profil yang sudah ada saat skema persetujuan dipasang tetap berstatus disetujui. Profil untuk akun Auth baru dibuat otomatis oleh trigger dengan status menunggu.
- Siapkan setidaknya satu akun supervisor sebelum menerima pendaftaran pegawai baru. Buka `supabase/set_user_role.sql`, isi email akun yang sudah ada dan role `Supervisor`, lalu jalankan di **SQL Editor**. Script ini menetapkan akun supervisor sebagai disetujui untuk kebutuhan bootstrap.
- Aplikasi tidak memberi izin kepada pengguna untuk mengubah role atau status persetujuan secara langsung. Persetujuan dilakukan melalui fungsi database yang hanya dapat dipanggil supervisor yang sudah disetujui.

## Data dan akses

- Data staf, checklist, catatan kendala, dan riwayat aktivitas disimpan di Postgres.
- Bukti foto disimpan di bucket privat `evidence`; aplikasi menggunakan signed URL sementara untuk menampilkan foto.
- Pegawai yang sudah disetujui hanya dapat membaca dan mengubah checklist miliknya. Supervisor yang sudah disetujui dapat melihat seluruh data operasional dan menyetujui pendaftaran.
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
