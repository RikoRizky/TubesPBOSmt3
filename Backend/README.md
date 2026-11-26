# MeowPlace — Backend (C#)

Dikerjakan tim backend dengan **C# / ASP.NET Core Web API**.
Dokumen ini berisi kontrak yang sudah dipakai frontend
(`Frontend/src/services/api/`), supaya keduanya langsung cocok saat disambungkan.

## Cara frontend memanggil backend

- Alamat dasar diatur di `Frontend/src/config.ts` (`apiBaseUrl`, default `http://localhost:5000/api`).
  Setelah backend jalan, ubah `useApi: true` lalu `npm run build`.
- JSON memakai **camelCase** (default `System.Text.Json` di ASP.NET Core, jadi properti C#
  `OldPrice` otomatis menjadi `oldPrice`).
- Frontend biasanya dibuka dari alamat lain (mis. `http://localhost:5500`), jadi aktifkan **CORS**:

```csharp
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins("http://localhost:5500", "http://127.0.0.1:5500")
     .AllowAnyHeader()
     .AllowAnyMethod()));
// ...
app.UseCors();
```

## Endpoint

### `GET /api/products` → `200`

```json
[
  {
    "id": "p01",
    "name": "Makanan Kering Kitten Salmon 1,5 kg",
    "pet": "kucing",
    "category": "makanan",
    "price": 145000,
    "oldPrice": 189000,
    "rating": 4.9,
    "reviews": 1240,
    "badge": null,
    "image": "assets/images/products/p01.jpg",
    "stock": 32
  }
]
```

- `pet`: `kucing` | `anjing` | `burung` | `ikan`. **Baru**, MeowPlace sekarang melayani 4 jenis hewan.
- `category`: `makanan` | `camilan` | `mainan` | `perlengkapan`. Frontend memakai nilai ini
  untuk membuat objek `FoodProduct` / `TreatProduct` / `ToyProduct` / `SupplyProduct`.
- `image`: **baru**, URL foto produk. Fotonya sudah ada di frontend
  (`assets/images/products/p01.jpg` s.d. `p23.jpg`), jadi backend cukup menyimpan path ini.
- `stock`: bila `0`, frontend menampilkan "Stok habis" dan tombol tambah ke keranjang nonaktif.
- `oldPrice` dan `badge` opsional. Bila ada `oldPrice`, badge diskon dihitung otomatis.
- `art` dan `tint` (ilustrasi SVG lama) **tidak dipakai lagi** dan boleh dihapus.

> Frontend tetap jalan walau `pet`/`image` belum dikirim: `pet` kosong dianggap kucing,
> `image` kosong memakai foto jenis hewannya. Tetapi supaya filter hewan benar,
> kedua kolom ini perlu ditambahkan.

#### Perubahan yang perlu dilakukan di backend

```csharp
// Models/Enums/Enums.cs
public enum PetType { Kucing, Anjing, Burung, Ikan }

// Models/Entities/Product.cs  (ganti ArtType, ArtPalette, Tint)
public PetType Pet { get; set; } = PetType.Kucing;
public string ImageUrl { get; set; } = string.Empty;

// Models/DTOs/Dtos.cs  -> ProductDto (ganti Art & Tint)
public string Pet { get; set; } = "kucing";
public string Image { get; set; } = string.Empty;

// Services/ModelMappingExtensions.cs  -> ToDto(Product)
Pet = product.Pet.ToString().ToLower(),
Image = product.ImageUrl,
```

Data awal (`DataSeeder`) yang dipakai frontend saat ini ada di
`Frontend/src/services/mock/mockData.ts` (23 produk, id `p01`–`p23`). Samakan isinya
supaya tampilan tidak berubah saat frontend pindah ke API.

### `POST /api/orders/track`: lacak pesanan (tanpa login)

Body: `{ "orderId": "MP-261104", "email": "nama@email.com" }`

| Respons | Kapan |
|---|---|
| `200` + OrderDTO | nomor pesanan **dan** email cocok |
| `404` | tidak ditemukan **atau** email tidak cocok (sengaja disamakan) |

```json
{
  "id": "MP-261104",
  "status": "dikirim",
  "courier": "JNE REG",
  "resi": "JNE0012345678",
  "eta": "Sabtu, 8 Nov 2026",
  "address": "Jl. Ce***** Raya No. 4, Bandung",
  "items": [
    { "productId": "p06", "qty": 1, "product": { "id": "p06", "name": "Kasur Donat Fluffy", "...": "..." } }
  ],
  "timeline": {
    "dibuat": "2026-11-04T19:02:00+07:00",
    "dibayar": "2026-11-04T19:09:00+07:00",
    "dikemas": "2026-11-05T08:30:00+07:00",
    "dikirim": "2026-11-05T16:45:00+07:00"
  }
}
```

- `status`: `dibuat` | `dibayar` | `dikemas` | `dikirim` | `sampai`
- Setiap `items[].product` wajib disertakan (bentuknya sama dengan `GET /api/products`).

### `POST /api/returns`: ajukan pengembalian (tanpa login)

Body **multipart/form-data**: `orderId`, `email`, `reason` (`doyan` | `rusak` | `salah` | `lainnya`),
`note` (boleh kosong), `photo` (opsional, gambar maks. 5 MB)

| Respons | Kapan |
|---|---|
| `200` + `{ "ticket": "RT-48213" }` | pengajuan diterima |
| `404` | pesanan tidak ditemukan / email tidak cocok |
| `409` + `{ "status": "dikirim" }` | pesanan belum sampai, belum bisa diretur |

### `POST /api/newsletter`

Body: `{ "email": "nama@email.com" }` → `200` + `{ "voucher": "MEOW10" }`

## Catatan keamanan untuk lacak & retur tanpa login

- Respons untuk "nomor pesanan tidak ada" dan "email tidak cocok" **harus sama** (404),
  supaya orang tidak bisa menebak nomor pesanan yang valid.
- Beri **rate limit** (mis. 5 percobaan per menit per IP), karena nomor pesanan bisa ditebak berurutan.
- **Samarkan alamat** di respons (contoh: `Jl. Ce***** Raya No. 4, Bandung`).
- Validasi ulang semua input di server; validasi di frontend hanya untuk kenyamanan pengguna.

## Rencana berikutnya

- `POST /api/orders` untuk checkout, bisa sebagai tamu (sekarang tombol checkout masih menampilkan notifikasi).
- Akun member (opsional): riwayat pesanan otomatis, alamat tersimpan, promo "Potongan Rp50rb order pertama".
