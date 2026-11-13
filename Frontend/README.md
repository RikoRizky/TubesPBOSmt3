# MeowPlace — Frontend (TypeScript + OOP)

Tampilan memakai HTML + CSS, sedangkan seluruh logikanya ditulis dalam
**TypeScript berorientasi objek**. TypeScript dipilih karena punya `class`,
`interface`, `abstract`, `private`/`protected`, dan `enum`, dengan sintaks
yang sangat mirip C# (backend).

## Menjalankan

```bash
npm install        # sekali saja (memasang TypeScript & esbuild)
npm run build      # cek tipe (tsc) + gabungkan src/ menjadi assets/js/app.js
npm run dev        # build otomatis setiap kali file di src/ disimpan
```

Lalu buka `index.html` lewat Live Server atau `python -m http.server 5500`.
File `assets/js/app.js` adalah **hasil kompilasi**. Yang diedit selalu file di `src/`.

## Struktur `src/`

```
src/
├── main.ts                 titik masuk: pilih service (Mock/Api) & halaman
├── config.ts               useApi: false/true, alamat backend
├── app/App.ts              merakit semua objek bersama (dependency injection)
├── pages/                  Page (abstract) → HomePage, HelpPage
├── models/                 Product (abstract) & turunannya, ProductFactory, Order, enum, DTO
├── contracts/              semua interface (IProductRepository, IOrderService, IStorage, ...)
├── services/               Cart, Wishlist, ProductCatalog, ProductNavigator
│   ├── mock/               implementasi interface dengan data contoh
│   ├── api/                implementasi interface ke backend C# (HttpClient)
│   └── storage/            LocalStorageService, MemoryStorage, StorageFactory
├── ui/                     Component (abstract) & semua komponen tampilan
│   ├── layers/             Layer (abstract) → MobileNav, SearchPanel, CartDrawer
│   ├── forms/              AsyncForm (abstract), FormField, Validators, NewsletterForm
│   └── help/               TrackOrderForm, ReturnForm, FaqAccordion, HelpNav
├── effects/                ScrollEffect (abstract) & 10 animasi gulir + ScrollEngine
└── core/                   Observable<T>, Formatter, Motion, utilitas DOM
```

## Konsep OOP dan letaknya

| Konsep | Contoh di kode |
|---|---|
| **Class & Object** | `new Cart(storage, catalog)`, `new ProductGrid(...)`: setiap fitur adalah objek |
| **Encapsulation** | `Product` menyimpan harga di `private _price`, hanya bisa dibaca lewat getter `price`. Isi `Cart` (`private quantities`) hanya bisa diubah lewat `add()`, `setQuantity()`, `remove()` |
| **Inheritance** | `FoodProduct extends Product`, lalu `TreatProduct extends FoodProduct` (bertingkat). `CartDrawer extends Layer extends Component`. `HttpError extends Error` |
| **Abstraction** | Kelas `abstract`: `Product`, `Component`, `Layer`, `AsyncForm`, `ScrollEffect`, `Page`, `Observable<T>`. Masing-masing punya method/getter `abstract` yang wajib diisi turunannya |
| **Polymorphism** | `ScrollEngine` memanggil `effect.update(state)` pada 10 efek berbeda. `product.categoryLabel` dan `product.returnWindowDays` memberi hasil berbeda per jenis produk ("retur 14 hari" vs "30 hari" di keranjang). `NewsletterForm` meng-`override` `showAlert()` |
| **Interface** | `IProductRepository`, `IOrderService`, `INewsletterService`, `IStorage`, `INotifier`, `IProductNavigator`, `IMeasurable`, `IValidator`. Satu kelas bisa mengimplementasikan dua interface: `ProductGrid implements IProductNavigator, IMeasurable` |
| **Generics** | `Observable<T>`, `IStorage.read<T>()`, `HttpClient.get<T>()` |
| **Enum** | `Category`, `OrderStatus`, `ReturnReason` |
| **Static** | `ProductFactory.create()`, `Formatter.rupiah()`, `Cart.FREE_SHIPPING_MIN` |
| **Composition** | `FormField` berisi daftar `IValidator`. `LayerManager` menyimpan elemen overlay (karena sudah mewarisi `Observable`) |

### Design pattern yang dipakai

- **Factory**: `ProductFactory` membuat `FoodProduct`/`ToyProduct`/... sesuai kategori.
- **Observer**: `Cart`, `Wishlist`, `LayerManager` mewarisi `Observable<T>`. Ikon header & drawer berlangganan perubahan.
- **Template Method**: `AsyncForm.handleSubmit()` (validasi → loading → kirim → galat) dan `Layer` (`onOpen`/`onClose`).
- **Proxy**: `ProductNavigator` meneruskan perintah ke `ProductGrid` (halaman toko) atau `RedirectNavigator` (halaman lain).
- **Repository + Dependency Injection**: `App` menerima service lewat constructor, jadi pindah dari Mock ke API cukup ubah `config.ts`.

## Diagram kelas

### Model & service

```mermaid
classDiagram
  direction LR
  class Product {
    <<abstract>>
    +id: string
    +name: string
    -_price: number
    +price: number
    +category()* Category
    +categoryLabel()* string
    +returnWindowDays()* number
    +getBadge() Badge
    +matches(query) boolean
  }
  Product <|-- FoodProduct
  FoodProduct <|-- TreatProduct
  Product <|-- ToyProduct
  Product <|-- SupplyProduct
  ProductFactory ..> Product : membuat

  class IProductRepository {
    <<interface>>
    +getAll() Promise
  }
  IProductRepository <|.. MockProductRepository
  IProductRepository <|.. ApiProductRepository
  ProductCatalog --> IProductRepository

  class IOrderService {
    <<interface>>
    +track(orderId, email) Promise
    +requestReturn(request) Promise
  }
  IOrderService <|.. MockOrderService
  IOrderService <|.. ApiOrderService

  class IStorage {
    <<interface>>
    +read(key, fallback)
    +write(key, value)
  }
  IStorage <|.. LocalStorageService
  IStorage <|.. MemoryStorage

  class Observable~T~ {
    <<abstract>>
    +subscribe(listener)
    #notify(value)
  }
  Observable <|-- Cart
  Observable <|-- Wishlist
  Cart --> ProductCatalog
  Cart --> IStorage
  Wishlist --> IStorage
```

### Komponen tampilan

```mermaid
classDiagram
  class Component {
    <<abstract>>
    #root: HTMLElement
    +mount()*
  }
  Component <|-- Layer
  Component <|-- ProductGrid
  Component <|-- HeaderActions
  Component <|-- PrimaryNav
  Component <|-- AsyncForm
  Component <|-- FaqAccordion

  class Layer {
    <<abstract>>
    +show()
    +hide()
    #onOpen()
    #onClose()
  }
  Layer <|-- MobileNav
  Layer <|-- SearchPanel
  Layer <|-- CartDrawer
  LayerManager o-- Layer : mengatur

  class AsyncForm {
    <<abstract>>
    #validate()* boolean
    #send()* Promise
    #showAlert(html)
  }
  AsyncForm <|-- NewsletterForm
  AsyncForm <|-- TrackOrderForm
  AsyncForm <|-- ReturnForm
  FormField o-- IValidator
  class IValidator {
    <<interface>>
    +validate(value) string
  }
  IValidator <|.. RequiredValidator
  IValidator <|.. EmailValidator
  IValidator <|.. OrderIdValidator

  class IProductNavigator {
    <<interface>>
    +showProduct(id)
    +showFavorites()
  }
  IProductNavigator <|.. ProductGrid
  IProductNavigator <|.. RedirectNavigator
  IProductNavigator <|.. ProductNavigator
```

### Animasi gulir & halaman

```mermaid
classDiagram
  class ScrollEffect {
    <<abstract>>
    +isDecorative() boolean
    +measure()
    +update(state)*
  }
  ScrollEngine o-- ScrollEffect : update tiap frame
  ScrollEffect <|-- ProgressBar
  ScrollEffect <|-- BackToTop
  ScrollEffect <|-- SmartHeader
  ScrollEffect <|-- HeroParallax
  ScrollEffect <|-- Marquee
  ScrollEffect <|-- OfferParallax
  ScrollEffect <|-- GalleryScroll
  ScrollEffect <|-- CtaExpand
  ScrollEffect <|-- PawTrail
  ScrollEffect <|-- StepsTimeline

  class Page {
    <<abstract>>
    #app: App
    +init()*
  }
  Page <|-- HomePage
  Page <|-- HelpPage
  App --> Page : start(page)
```
