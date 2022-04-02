# pcare-vaksin-downloader
Download data vaksin dari PCare BPJS Kesehatan bermodal data NIK dari OpenSID

## Instalasi
- jalankan `npm ci`
- Pastikan anda bisa konek ke database OpenSID
- Jalan kan query create table yg ada di file `db.sql`
- Copy file `.env.example` sebagai `.env`
- Isi kan konfigurasi MySQL dan akses ke PCare

## Note on PCare Password
Password PCare merupakan password yg di enkrip (bukan seperti password asli), untuk mengetahui
password yg di enkrip, buka halaman login pcare dengan chrome, tekan f12 (inspect element),
centang 'preserver log' jika diperlukan,
lalu isikan form login dan lihat pada tab 'network' pada request POST login, pada tab 'payload' akan
terdapat password yg sudah di enkrip.

## Jalankan

`npm run start`

## Tips

set di .env `DATA_DIR` untuk mengganti nama folder default `.data`