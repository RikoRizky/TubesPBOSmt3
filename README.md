# MeowPlace 🐾

Petshop online untuk **kucing, anjing, burung, dan ikan** dengan nuansa oranye.
Namanya MeowPlace (merujuk kucing), tetapi isinya untuk semua hewan rumahan.
Terinspirasi dari struktur [Kitter](https://github.com/codewithsadee/kitter), tetapi tampilan
dan seluruh animasi gulirnya dibuat ulang.

```
MeowPlace/
├── Frontend/          ← HTML + CSS + TypeScript (OOP)
│   ├── index.html                halaman utama toko
│   ├── bantuan.html              Pusat Bantuan (cara belanja, lacak, retur, FAQ, S&K)
│   ├── src/                      kode TypeScript berorientasi objek  → lihat Frontend/README.md
│   ├── assets/js/app.js          hasil kompilasi src/ (jangan diedit langsung)
│   ├── assets/css/               style.css (bersama) + bantuan.css
│   └── assets/images/
└── Backend/           ← C# (ASP.NET Core), dikerjakan tim backend (lihat Backend/README.md)
```

Penjelasan konsep OOP di frontend (class, interface, abstract, inheritance,
polymorphism, encapsulation) beserta diagram kelasnya ada di
**[Frontend/README.md](Frontend/README.md)**.

## Menjalankan frontend

`assets/js/app.js` sudah ikut tersimpan, jadi website bisa langsung dibuka tanpa build:

```bash
cd Frontend
python -m http.server 5500
# buka http://localhost:5500
```

Ekstensi **Live Server** di VS Code juga bisa.

Kalau mengubah kode di `src/`, kompilasi ulang dulu (butuh Node.js):

```bash
npm install        # sekali saja
npm run build      # cek tipe + buat ulang assets/js/app.js
npm run dev        # atau: build otomatis setiap file disimpan
```

## Yang berbeda dari Kitter

**Animasi gulir**
- Progress bar tipis di atas halaman.
- Header pintar: transparan di hero, berubah jadi kaca buram setelah digulir,
  sembunyi saat gulir ke bawah dan muncul lagi saat gulir ke atas.
- Hero parallax berlapis (lingkaran, kucing, kartu melayang, jejak kaki), ditambah sedikit ikut kursor.
- Marquee oranye yang kecepatan dan arahnya mengikuti gulir.
- Elemen muncul bertahap (fade/naik/clip-reveal) dengan jeda berjenjang 40ms.
- Foto promo bergeser di dalam bingkainya (parallax dalam kartu).
- Ikon layanan "tergambar" garis demi garis saat muncul.
- Jejak kaki muncul satu per satu mengikuti progres gulir.
- Galeri testimoni: dua baris polaroid bergerak horizontal berlawanan arah mengikuti gulir.
- Kartu CTA "mengembang" saat masuk layar, stiker garansinya berputar.
- Tombol kembali ke atas dengan cincin progres.
- Semua animasi menghormati `prefers-reduced-motion`.

**Tampilan & fitur**
- Nuansa oranye, font Fredoka & Plus Jakarta Sans, bahasa Indonesia, harga Rupiah.
- 23 produk contoh untuk 4 jenis hewan, semuanya dengan **foto asli** (bukan ilustrasi).
- Kartu "Belanja per hewan" (Kucing, Anjing, Burung, Ikan).
- Filter dua lapis: **jenis hewan** (tab dengan indikator geser) + **kategori** (chip berisi
  jumlah produk; chip yang kosong otomatis nonaktif). Ada juga filter Favorit.
- Stok habis ditandai badge "Stok habis", foto dipudarkan, dan tombol tambah nonaktif.
- Skeleton loading, empty state, tombol "tampilkan lebih banyak".
- Favorit (wishlist) dan keranjang tersimpan di `localStorage`, termasuk drawer keranjang,
  progres gratis ongkir, dan animasi produk "terbang" ke ikon keranjang.
- Pencarian (`/` untuk membuka) dengan sorotan kata kunci.
- Newsletter dengan validasi email.

## Pusat Bantuan (`bantuan.html`)

Semua fitur bantuan bisa dipakai **tanpa login**:

| Bagian | Cara kerja |
|---|---|
| Cara belanja | Timeline 5 langkah, garisnya terisi mengikuti gulir |
| Lacak pesanan | Nomor pesanan + email saat checkout → status, kurir, resi, isi paket |
| Pengembalian | Nomor pesanan + email + alasan (+ foto opsional) → nomor tiket |
| FAQ | Akordeon + kolom saring (juga bisa dari kolom cari di hero) |
| Syarat & ketentuan | Contoh teks, sesuaikan sebelum dipakai sungguhan |

Data demo (email `demo@meowplace.id`): `MP-261106` (dikemas), `MP-261104` (dikirim),
`MP-261028` (sampai, bisa diretur). Ada tombol "Mode demo" di tiap formulir.

Tautan antarhalaman: `index.html?hewan=anjing#belanja` dan `index.html?kategori=mainan#belanja`
membuka toko dengan filter aktif, `index.html?produk=p01` langsung menggulir ke produk tersebut.

## Menyambungkan ke backend nanti

Frontend sudah punya dua versi service untuk setiap interface: **Mock** (data contoh,
dipakai sekarang) dan **Api** (memanggil backend C#). Setelah backend jalan, cukup ubah
`Frontend/src/config.ts`:

```ts
useApi: true,
apiBaseUrl: 'http://localhost:5000/api',   // sesuaikan port backend
```

lalu `npm run build`. Kontrak endpoint-nya ada di `Backend/README.md`.

## Kredit gambar

- Foto produk, hewan, promo, dan testimoni: [Unsplash](https://unsplash.com) (Unsplash License,
  bebas dipakai, termasuk untuk komersial). Foto produk adalah foto suasana (mis. mangkuk
  berisi makanan kering), bukan kemasan merek tertentu.
- `hero-cat.webp`: potongan gambar dari repo Kitter (codewithsadee). Ganti dengan foto milikmu
  sendiri bila proyek ini akan dipublikasikan secara komersial.
