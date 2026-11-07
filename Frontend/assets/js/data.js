/**
 * MeowPlace — data & API sementara (mock)
 *
 * Selama backend belum ada, semua data diambil dari sini.
 * Saat backend siap, cukup ganti isi fungsi di MeowAPI dengan fetch(), contoh:
 *
 *   getProducts: () => fetch(`${API_BASE}/products`).then((r) => r.json()),
 *
 * Bentuk objek produk sengaja dibuat sama dengan yang nanti dikirim backend.
 */

'use strict';

(function (global) {
  const API_BASE = '/api'; // dipakai nanti saat backend terhubung

  const CATEGORIES = {
    makanan: 'Makanan',
    camilan: 'Camilan',
    mainan: 'Mainan',
    perlengkapan: 'Perlengkapan',
  };

  /** @type {Array<{id:string,name:string,category:string,price:number,oldPrice?:number,rating:number,reviews:number,badge?:string,art:{type:string,palette:string},tint:string}>} */
  const PRODUCTS = [
    { id: 'p01', name: 'Salmon Kitten Dry Food 1,5 kg', category: 'makanan', price: 145000, oldPrice: 189000, rating: 4.9, reviews: 1240, art: { type: 'bag', palette: 'orange' }, tint: '#FFE9D6' },
    { id: 'p02', name: 'Tuna Pâté in Gravy 85 g', category: 'makanan', price: 18500, rating: 4.8, reviews: 3410, badge: 'Terlaris', art: { type: 'can', palette: 'tangerine' }, tint: '#FFF1CC' },
    { id: 'p03', name: 'Chicken Crunch Treats 60 g', category: 'camilan', price: 32000, oldPrice: 40000, rating: 4.8, reviews: 2120, art: { type: 'pouch', palette: 'rust' }, tint: '#FDE5DC' },
    { id: 'p04', name: 'Tikus Plush Isi Catnip', category: 'mainan', price: 25000, rating: 4.9, reviews: 980, art: { type: 'mouse', palette: 'brown' }, tint: '#F6ECE1' },
    { id: 'p05', name: 'Menara Garukan Sisal 60 cm', category: 'perlengkapan', price: 289000, oldPrice: 349000, rating: 4.8, reviews: 720, art: { type: 'scratcher', palette: 'brown' }, tint: '#FFE9D6' },
    { id: 'p06', name: 'Kasur Donat Fluffy', category: 'perlengkapan', price: 175000, rating: 4.9, reviews: 1930, badge: 'Terlaris', art: { type: 'bed', palette: 'cream' }, tint: '#FDE5DC' },
    { id: 'p07', name: 'Salmon Bites Dental 80 g', category: 'camilan', price: 29000, rating: 4.6, reviews: 540, badge: 'Baru', art: { type: 'pouch', palette: 'honey' }, tint: '#FFF1CC' },
    { id: 'p08', name: 'Pasir Gumpal Lavender 10 L', category: 'perlengkapan', price: 89000, oldPrice: 105000, rating: 4.8, reviews: 2710, art: { type: 'litter', palette: 'honey' }, tint: '#F6ECE1' },
    { id: 'p09', name: 'Adult Indoor Chicken 2 kg', category: 'makanan', price: 168000, rating: 4.7, reviews: 860, art: { type: 'bag', palette: 'brown' }, tint: '#F6ECE1' },
    { id: 'p10', name: 'Tongkat Bulu Interaktif', category: 'mainan', price: 35000, oldPrice: 45000, rating: 4.7, reviews: 1500, art: { type: 'wand', palette: 'rust' }, tint: '#FFE9D6' },
    { id: 'p11', name: 'Air Mancur Minum 2 L', category: 'perlengkapan', price: 219000, rating: 4.7, reviews: 650, badge: 'Baru', art: { type: 'fountain', palette: 'cream' }, tint: '#FDE5DC' },
    { id: 'p12', name: 'Bola Benang Wol Isi 3', category: 'mainan', price: 15000, rating: 4.5, reviews: 410, art: { type: 'yarn', palette: 'orange' }, tint: '#FFF1CC' },
  ];

  /* ---------- pesanan (untuk Lacak Pesanan & Pengembalian) ---------- */

  const ORDER_STEPS = [
    { key: 'dibuat', label: 'Pesanan dibuat' },
    { key: 'dibayar', label: 'Pembayaran diterima' },
    { key: 'dikemas', label: 'Sedang dikemas' },
    { key: 'dikirim', label: 'Dalam pengiriman' },
    { key: 'sampai', label: 'Sampai tujuan' },
  ];

  // Data contoh. Alamat sudah disamarkan, seperti yang nanti juga harus dilakukan backend.
  const ORDERS = [
    {
      id: 'MP-261106', email: 'demo@meowplace.id', status: 'dikemas',
      courier: 'Kurir MeowPlace (Same Day)', resi: null, eta: 'Jumat, 7 Nov 2026',
      address: 'Jl. Me**** No. 12, Jakarta Timur',
      items: [{ productId: 'p01', qty: 1 }, { productId: 'p08', qty: 2 }],
      timeline: { dibuat: '2026-11-06T09:12:00+07:00', dibayar: '2026-11-06T09:15:00+07:00', dikemas: '2026-11-06T10:40:00+07:00' },
    },
    {
      id: 'MP-261104', email: 'demo@meowplace.id', status: 'dikirim',
      courier: 'JNE REG', resi: 'JNE0012345678', eta: 'Sabtu, 8 Nov 2026',
      address: 'Jl. Ce***** Raya No. 4, Bandung',
      items: [{ productId: 'p06', qty: 1 }, { productId: 'p03', qty: 2 }],
      timeline: { dibuat: '2026-11-04T19:02:00+07:00', dibayar: '2026-11-04T19:09:00+07:00', dikemas: '2026-11-05T08:30:00+07:00', dikirim: '2026-11-05T16:45:00+07:00' },
    },
    {
      id: 'MP-261028', email: 'demo@meowplace.id', status: 'sampai',
      courier: 'SiCepat BEST', resi: 'SCP0098765432', eta: 'Diterima 30 Okt 2026',
      address: 'Jl. An***** No. 7, Depok',
      items: [{ productId: 'p02', qty: 6 }, { productId: 'p12', qty: 1 }],
      timeline: { dibuat: '2026-10-28T11:20:00+07:00', dibayar: '2026-10-28T11:22:00+07:00', dikemas: '2026-10-28T14:05:00+07:00', dikirim: '2026-10-29T09:10:00+07:00', sampai: '2026-10-30T13:05:00+07:00' },
    },
  ];

  /** "mp261104", "MP 261104", "mp-261104" -> "MP-261104" */
  const normalizeOrderId = (value) => String(value).trim().toUpperCase().replace(/^MP[\s-]*/, 'MP-');

  /** Cocokkan nomor pesanan + email. Pesan galat sengaja sama untuk "tidak ada" dan
   *  "email salah", supaya orang lain tidak bisa menebak nomor pesanan yang valid. */
  function findOrder(orderId, email) {
    const order = ORDERS.find((o) => o.id === normalizeOrderId(orderId));
    if (!order || order.email !== String(email).trim().toLowerCase()) return null;
    return order;
  }

  const LATENCY = 450; // simulasi waktu tunggu jaringan (ms)
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const clone = (value) => JSON.parse(JSON.stringify(value));

  const MeowAPI = {
    API_BASE,
    CATEGORIES,
    ORDER_STEPS,
    normalizeOrderId,

    async getProducts() {
      await wait(LATENCY);
      return clone(PRODUCTS);
    },

    /** Versi sinkron untuk pencarian & keranjang (tanpa menunggu). */
    getProductsSync() {
      return PRODUCTS;
    },

    async subscribeNewsletter(email) {
      await wait(600);
      return { ok: true, email, voucher: 'MEOW10' };
    },

    /** Nanti: POST /api/orders/track  body { orderId, email } */
    async trackOrder(orderId, email) {
      await wait(700);
      const order = findOrder(orderId, email);
      if (!order) return { ok: false, error: 'not_found' };

      const { email: _hidden, ...safe } = clone(order);
      safe.items = safe.items.map((item) => ({ ...item, product: clone(PRODUCTS.find((p) => p.id === item.productId)) }));
      safe.total = safe.items.reduce((sum, item) => sum + item.qty * item.product.price, 0);
      return { ok: true, order: safe };
    },

    /** Nanti: POST /api/returns  body { orderId, email, reason, note, photo } */
    async requestReturn({ orderId, email }) {
      await wait(800);
      const order = findOrder(orderId, email);
      if (!order) return { ok: false, error: 'not_found' };
      if (order.status !== 'sampai') return { ok: false, error: 'not_delivered', status: order.status };
      return { ok: true, ticket: `RT-${Math.floor(10000 + Math.random() * 90000)}` };
    },
  };

  global.MeowAPI = MeowAPI;
})(window);
