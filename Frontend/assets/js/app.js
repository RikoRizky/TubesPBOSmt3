"use strict";
(() => {
  // src/core/dom.ts
  function $(selector, root = document) {
    return root.querySelector(selector);
  }
  function $$(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }
  function required(selector, root = document) {
    const element = root.querySelector(selector);
    if (!element) throw new Error(`Elemen "${selector}" tidak ditemukan di halaman.`);
    return element;
  }
  function restartAnimation(element, className) {
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
  }
  var HTML_ESCAPES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
  }

  // src/effects/ScrollEffect.ts
  var ScrollEffect = class {
    /**
     * Efek dekoratif dimatikan saat pengguna memilih "kurangi gerakan".
     * Efek fungsional (progress bar, header) meng-override menjadi false.
     */
    get isDecorative() {
      return true;
    }
    /** Hitung ulang ukuran saat layar berubah. Default: tidak melakukan apa-apa. */
    measure() {
    }
  };

  // src/effects/BackToTop.ts
  var BackToTop = class extends ScrollEffect {
    constructor(button, ring) {
      super();
      this.button = button;
      this.ring = ring;
    }
    button;
    ring;
    get isDecorative() {
      return false;
    }
    update({ y, progress, viewportHeight }) {
      this.ring.style.setProperty("--p", (1 - progress).toFixed(4));
      this.button.classList.toggle("is-visible", y > viewportHeight * 0.8);
    }
  };

  // src/effects/ProgressBar.ts
  var ProgressBar = class extends ScrollEffect {
    constructor(bar) {
      super();
      this.bar = bar;
    }
    bar;
    get isDecorative() {
      return false;
    }
    update({ progress }) {
      this.bar.style.transform = `scaleX(${progress.toFixed(4)})`;
    }
  };

  // src/core/Motion.ts
  var Motion = class _Motion {
    static reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    static desktopQuery = window.matchMedia("(min-width: 992px)");
    static finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    constructor() {
    }
    /** true bila pengguna meminta animasi dikurangi */
    static get reduced() {
      return _Motion.reducedQuery.matches;
    }
    static get isDesktop() {
      return _Motion.desktopQuery.matches;
    }
    static get scrollBehavior() {
      return _Motion.reduced ? "auto" : "smooth";
    }
  };

  // src/core/utils.ts
  var clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  var lerp = (a, b, t) => a + (b - a) * t;
  var delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // src/effects/ScrollEngine.ts
  var ScrollEngine = class {
    effects = [];
    measurables = [];
    lastY = 0;
    ticking = false;
    started = false;
    resizeTimer = 0;
    /** Tambah efek gulir (otomatis juga diukur ulang saat resize). */
    add(...effects) {
      this.effects.push(...effects);
      return this.watch(...effects);
    }
    /** Daftarkan objek yang hanya perlu diukur ulang saat resize. */
    watch(...items) {
      this.measurables.push(...items);
      if (this.started) {
        items.forEach((item) => item.measure());
        this.requestUpdate();
      }
      return this;
    }
    start() {
      if (this.started) return;
      this.started = true;
      this.lastY = window.scrollY;
      this.measureAll();
      window.addEventListener("scroll", () => this.requestUpdate(), { passive: true });
      window.addEventListener("resize", () => {
        window.clearTimeout(this.resizeTimer);
        this.resizeTimer = window.setTimeout(() => this.relayout(), 150);
      });
      window.addEventListener("load", () => this.relayout());
      document.fonts?.ready.then(() => this.relayout());
      this.update();
    }
    relayout() {
      this.measureAll();
      this.requestUpdate();
    }
    requestUpdate() {
      if (this.ticking) return;
      this.ticking = true;
      requestAnimationFrame(() => this.update());
    }
    measureAll() {
      this.measurables.forEach((item) => item.measure());
    }
    update() {
      this.ticking = false;
      const y = window.scrollY;
      const viewportHeight = window.innerHeight;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - viewportHeight);
      const state = {
        y,
        dy: y - this.lastY,
        viewportHeight,
        progress: clamp(y / maxScroll, 0, 1)
      };
      const reduced = Motion.reduced;
      for (const effect of this.effects) {
        if (reduced && effect.isDecorative) continue;
        effect.update(state);
      }
      this.lastY = y;
    }
  };

  // src/effects/SmartHeader.ts
  var SmartHeader = class _SmartHeader extends ScrollEffect {
    constructor(header, layers) {
      super();
      this.header = header;
      this.layers = layers;
      header.addEventListener("focusin", () => this.show());
      layers.subscribe((layer) => {
        if (layer) this.show();
      });
    }
    header;
    layers;
    static THRESHOLD = 48;
    directionTotal = 0;
    holdUntil = 0;
    get isDecorative() {
      return false;
    }
    get element() {
      return this.header;
    }
    update({ y, dy, viewportHeight }) {
      this.header.classList.toggle("is-scrolled", y > 24);
      this.directionTotal = Math.sign(dy) === Math.sign(this.directionTotal) ? this.directionTotal + dy : dy;
      if (this.layers.current || performance.now() < this.holdUntil) return;
      if (y < viewportHeight * 0.5 || this.directionTotal < -_SmartHeader.THRESHOLD) this.show();
      else if (this.directionTotal > _SmartHeader.THRESHOLD) this.hide();
    }
    /** Tampilkan header dan tahan agar tidak langsung tersembunyi lagi. */
    reveal(holdMs = 0) {
      this.show();
      this.holdUntil = performance.now() + holdMs;
    }
    show() {
      this.header.classList.remove("is-hidden");
    }
    hide() {
      this.header.classList.add("is-hidden");
    }
  };

  // src/core/Observable.ts
  var Observable = class {
    listeners = /* @__PURE__ */ new Set();
    /** Daftarkan listener. Mengembalikan fungsi untuk berhenti berlangganan. */
    subscribe(listener) {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }
    /** Hanya kelas turunan yang boleh mengumumkan perubahan. */
    notify(value) {
      this.listeners.forEach((listener) => listener(value));
    }
  };

  // src/services/Cart.ts
  var CartLine = class {
    constructor(product, quantity) {
      this.product = product;
      this.quantity = quantity;
    }
    product;
    quantity;
    get total() {
      return this.product.price * this.quantity;
    }
  };
  var Cart = class _Cart extends Observable {
    constructor(storage, catalog) {
      super();
      this.storage = storage;
      this.catalog = catalog;
      this.quantities = new Map(storage.read(_Cart.STORAGE_KEY, []));
    }
    storage;
    catalog;
    static FREE_SHIPPING_MIN = 15e4;
    static STORAGE_KEY = "cart";
    quantities;
    /* ---------- perintah ---------- */
    add(productId, quantity = 1) {
      if (quantity <= 0) throw new Error("Jumlah yang ditambahkan harus lebih dari 0.");
      this.quantities.set(productId, this.quantityOf(productId) + quantity);
      this.commit();
    }
    setQuantity(productId, quantity) {
      if (quantity <= 0) {
        this.remove(productId);
        return;
      }
      this.quantities.set(productId, Math.floor(quantity));
      this.commit();
    }
    remove(productId) {
      if (this.quantities.delete(productId)) this.commit();
    }
    /* ---------- pertanyaan ---------- */
    quantityOf(productId) {
      return this.quantities.get(productId) ?? 0;
    }
    get totalQuantity() {
      let total = 0;
      this.quantities.forEach((quantity) => total += quantity);
      return total;
    }
    /** Baris keranjang beserta datanya (butuh katalog sudah dimuat). */
    get lines() {
      const lines = [];
      this.quantities.forEach((quantity, id) => {
        const product = this.catalog.find(id);
        if (product) lines.push(new CartLine(product, quantity));
      });
      return lines;
    }
    get subtotal() {
      return this.lines.reduce((sum, line) => sum + line.total, 0);
    }
    get remainingForFreeShipping() {
      return Math.max(0, _Cart.FREE_SHIPPING_MIN - this.subtotal);
    }
    /** 0..1 untuk progress bar gratis ongkir */
    get freeShippingProgress() {
      return Math.min(1, this.subtotal / _Cart.FREE_SHIPPING_MIN);
    }
    /* ---------- internal ---------- */
    commit() {
      this.storage.write(_Cart.STORAGE_KEY, [...this.quantities.entries()]);
      this.notify(this);
    }
  };

  // src/services/ProductCatalog.ts
  var ProductCatalog = class {
    constructor(repository) {
      this.repository = repository;
    }
    repository;
    products = [];
    loaded = false;
    pending = null;
    get isLoaded() {
      return this.loaded;
    }
    get all() {
      return this.products;
    }
    /** Aman dipanggil berkali-kali: permintaan ke server hanya terjadi sekali. */
    load() {
      if (this.loaded) return Promise.resolve(this.products);
      if (this.pending) return this.pending;
      this.pending = this.repository.getAll().then((products) => {
        this.products = products;
        this.loaded = true;
        return products;
      }).finally(() => {
        this.pending = null;
      });
      return this.pending;
    }
    find(id) {
      return this.products.find((product) => product.id === id);
    }
    search(query, limit = 6) {
      return this.products.filter((product) => product.matches(query)).slice(0, limit);
    }
  };

  // src/services/ProductNavigator.ts
  var RedirectNavigator = class {
    showProduct(productId) {
      location.href = `index.html?produk=${encodeURIComponent(productId)}`;
    }
    showFavorites() {
      location.href = "index.html?kategori=favorit#belanja";
    }
  };
  var ProductNavigator = class {
    target;
    constructor(fallback) {
      this.target = fallback;
    }
    use(target) {
      this.target = target;
    }
    showProduct(productId) {
      this.target.showProduct(productId);
    }
    showFavorites() {
      this.target.showFavorites();
    }
  };

  // src/services/Wishlist.ts
  var Wishlist = class _Wishlist extends Observable {
    constructor(storage) {
      super();
      this.storage = storage;
      this.ids = new Set(storage.read(_Wishlist.STORAGE_KEY, []));
    }
    storage;
    static STORAGE_KEY = "wishlist";
    ids;
    has(productId) {
      return this.ids.has(productId);
    }
    get size() {
      return this.ids.size;
    }
    /** Tambah bila belum ada, hapus bila sudah ada. Mengembalikan status baru. */
    toggle(productId) {
      const added = !this.ids.has(productId);
      if (added) this.ids.add(productId);
      else this.ids.delete(productId);
      this.storage.write(_Wishlist.STORAGE_KEY, [...this.ids]);
      this.notify(this);
      return added;
    }
  };

  // src/core/Formatter.ts
  var Formatter = class _Formatter {
    static rupiahFormat = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    });
    static dateTimeFormat = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
    constructor() {
    }
    /** 145000 -> "Rp145.000" */
    static rupiah(amount) {
      return _Formatter.rupiahFormat.format(amount).replace(/\s/g, "");
    }
    /** 1240 -> "1,2rb" */
    static compact(value) {
      if (value < 1e3) return String(value);
      return `${(value / 1e3).toFixed(1).replace(".", ",").replace(",0", "")}rb`;
    }
    /** 4.9 -> "4,9" */
    static decimal(value, digits = 0) {
      return value.toLocaleString("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits });
    }
    /** ISO -> "4 Nov, 19.02" */
    static dateTime(iso) {
      return _Formatter.dateTimeFormat.format(new Date(iso)).replace(" pukul", ",");
    }
  };

  // src/ui/CountUp.ts
  var CountUp = class _CountUp {
    static DURATION_MS = 1600;
    start() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          window.setTimeout(() => this.animate(entry.target), 500);
        });
      }, { threshold: 0.6 });
      $$("[data-count]").forEach((element) => observer.observe(element));
    }
    animate(element) {
      const target = parseFloat(element.dataset.count ?? "0");
      const digits = parseInt(element.dataset.decimals ?? "0", 10);
      if (Motion.reduced) {
        element.textContent = Formatter.decimal(target, digits);
        return;
      }
      const start = performance.now();
      const tick = (now) => {
        const t = clamp((now - start) / _CountUp.DURATION_MS, 0, 1);
        const eased = 1 - Math.pow(1 - t, 4);
        element.textContent = Formatter.decimal(target * eased, digits);
        if (t < 1) requestAnimationFrame(tick);
      };
      element.textContent = Formatter.decimal(0, digits);
      requestAnimationFrame(tick);
    }
  };

  // src/ui/ProductArt.ts
  var INK = "#2B1B12";
  var ProductArt = class _ProductArt {
    static palettes = {
      orange: { main: "#F97316", dark: "#C2410C", light: "#FFF4E6", soft: "#FDBA74" },
      tangerine: { main: "#FB923C", dark: "#EA580C", light: "#FFF7ED", soft: "#FED7AA" },
      brown: { main: "#9A5B34", dark: "#6B3A1E", light: "#FBEBDD", soft: "#D9A47C" },
      honey: { main: "#F5B342", dark: "#C77D12", light: "#FFF8E6", soft: "#FCD98F" },
      rust: { main: "#DC5A2A", dark: "#9F3A16", light: "#FFF1EA", soft: "#F4A383" },
      cream: { main: "#F1DEC6", dark: "#B98B5E", light: "#FFFFFF", soft: "#E3C7A4" }
    };
    static templates = {
      bag: (c) => `
      ${_ProductArt.shadow(100, 186, 60)}
      <path d="M54 44h92l10 128a10 10 0 0 1-10 11H54a10 10 0 0 1-10-11Z" fill="${c.main}"/>
      <path d="M146 44l10 128a10 10 0 0 1-10 11h-14l10-139Z" fill="${c.dark}" opacity=".22"/>
      <rect x="49" y="28" width="102" height="22" rx="5" fill="${c.dark}"/>
      <path d="M60 34v10M70 34v10M80 34v10M90 34v10M100 34v10M110 34v10M120 34v10M130 34v10M140 34v10" stroke="#fff" stroke-opacity=".28" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="100" cy="104" r="36" fill="${c.light}"/>
      ${_ProductArt.catFace(100, 104, 1.15, c.main)}
      <rect x="68" y="152" width="64" height="9" rx="4.5" fill="${c.light}"/>
      <rect x="80" y="166" width="40" height="6" rx="3" fill="${c.light}" opacity=".6"/>
      ${_ProductArt.gloss("M62 58l-5 104")}`,
      can: (c) => `
      ${_ProductArt.shadow(100, 182, 54)}
      <path d="M54 76v86c0 9 20.6 16 46 16s46-7 46-16V76Z" fill="${c.main}"/>
      <path d="M54 98c0 9 20.6 16 46 16s46-7 46-16v44c0 9-20.6 16-46 16s-46-7-46-16Z" fill="${c.light}"/>
      <ellipse cx="100" cy="76" rx="46" ry="16" fill="#EDE3D8"/>
      <ellipse cx="100" cy="76" rx="38" ry="12" fill="#DCCBBB"/>
      <rect x="88" y="66" width="24" height="9" rx="4.5" fill="#fff" opacity=".9"/>
      <path d="M78 133c8-10 24-10 32 0-8 10-24 10-32 0Z" fill="${c.main}"/>
      <path d="M108 133l12-8v16Z" fill="${c.main}"/>
      <circle cx="86" cy="131" r="2" fill="${INK}"/>
      ${_ProductArt.gloss("M64 90v66")}`,
      pouch: (c) => `
      ${_ProductArt.shadow(100, 186, 54)}
      <path d="M60 40h80l8 132a9 9 0 0 1-9 10H61a9 9 0 0 1-9-10Z" fill="${c.main}"/>
      <rect x="56" y="30" width="88" height="16" rx="4" fill="${c.dark}"/>
      <path d="M64 56h72" stroke="${c.dark}" stroke-opacity=".5" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 6"/>
      <rect x="70" y="70" width="60" height="10" rx="5" fill="${c.light}"/>
      <rect x="68" y="92" width="64" height="52" rx="26" fill="${c.light}"/>
      <circle cx="86" cy="112" r="7" fill="${c.soft}"/>
      <circle cx="102" cy="122" r="8" fill="${c.dark}" opacity=".75"/>
      <circle cx="116" cy="110" r="6" fill="${c.soft}"/>
      <circle cx="94" cy="130" r="5" fill="${c.dark}" opacity=".6"/>
      <circle cx="113" cy="130" r="4.5" fill="${c.soft}"/>
      <rect x="80" y="156" width="40" height="6" rx="3" fill="${c.light}" opacity=".7"/>
      ${_ProductArt.gloss("M66 62l-4 100")}`,
      mouse: (c) => `
      ${_ProductArt.shadow(108, 170, 64)}
      <path d="M52 150c-18 2-28-8-24-18 4-12 22-10 20 2" fill="none" stroke="${c.dark}" stroke-width="5" stroke-linecap="round"/>
      <path d="M48 154C48 116 78 90 116 90c30 0 56 32 56 50 0 10-8 14-18 14Z" fill="${c.main}"/>
      <circle cx="122" cy="86" r="18" fill="${c.main}"/>
      <circle cx="122" cy="86" r="10" fill="${c.soft}"/>
      <circle cx="148" cy="122" r="4.5" fill="${INK}"/>
      <circle cx="149.5" cy="120.5" r="1.4" fill="#fff"/>
      <circle cx="171" cy="141" r="6" fill="${c.soft}"/>
      <path d="M160 147l18 4M158 151l14 10" stroke="${INK}" stroke-opacity=".45" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M66 148c4-22 18-38 38-46" fill="none" stroke="${c.light}" stroke-opacity=".8" stroke-width="2.5" stroke-dasharray="3 6" stroke-linecap="round"/>`,
      yarn: (c) => `
      ${_ProductArt.shadow(100, 178, 56)}
      <path d="M146 140c18 8 28 24 20 40" fill="none" stroke="${c.main}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="100" cy="110" r="58" fill="${c.main}"/>
      <g fill="none" stroke="${c.dark}" stroke-width="4" stroke-linecap="round" opacity=".5">
        <path d="M48 86c34 6 66 36 76 76"/>
        <path d="M56 142c22-34 54-62 92-64"/>
        <path d="M80 56c-6 34 6 76 40 108"/>
        <path d="M122 56c10 34 2 76-30 108"/>
      </g>
      <path d="M66 82a44 44 0 0 1 28-22" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="7" stroke-linecap="round"/>`,
      wand: (c) => `
      ${_ProductArt.shadow(100, 186, 50)}
      <path d="M46 178 150 52" stroke="${c.dark}" stroke-width="6" stroke-linecap="round"/>
      <path d="M46 178l20-24" stroke="${INK}" stroke-opacity=".75" stroke-width="9" stroke-linecap="round"/>
      <path d="M150 52c18 8 22 28 12 46" fill="none" stroke="${INK}" stroke-opacity=".5" stroke-width="1.8"/>
      <g transform="translate(162 100)">
        <path d="M0 0c-14 10-18 34-8 52 10-14 14-36 8-52Z" fill="${c.main}"/>
        <path d="M0 0c10 8 18 30 10 50-10-12-14-34-10-50Z" fill="${c.soft}"/>
        <path d="M0 0c-2 14 0 40 2 56" stroke="${c.dark}" stroke-width="1.5" fill="none"/>
      </g>
      <circle cx="162" cy="100" r="4" fill="${c.dark}"/>`,
      scratcher: (c) => {
        let sisal = "";
        for (let y = 70; y <= 158; y += 8) sisal += `M80 ${y}h40`;
        return `
      ${_ProductArt.shadow(100, 188, 66)}
      <rect x="36" y="164" width="128" height="20" rx="7" fill="${c.dark}"/>
      <rect x="80" y="62" width="40" height="104" fill="#E9C99B"/>
      <path d="${sisal}" stroke="#C99B62" stroke-width="2"/>
      <rect x="44" y="44" width="112" height="22" rx="7" fill="${c.main}"/>
      <rect x="48" y="47" width="104" height="6" rx="3" fill="#fff" opacity=".2"/>
      <path d="M140 66v34" stroke="${INK}" stroke-opacity=".6" stroke-width="2"/>
      <circle cx="140" cy="108" r="9" fill="#F97316"/>
      <path d="M134 104a8 8 0 0 1 8-4" stroke="#fff" stroke-opacity=".6" stroke-width="2.5" stroke-linecap="round" fill="none"/>`;
      },
      bed: (c) => `
      ${_ProductArt.shadow(100, 172, 84)}
      <ellipse cx="100" cy="132" rx="82" ry="42" fill="${c.dark}"/>
      <ellipse cx="100" cy="126" rx="82" ry="40" fill="${c.main}"/>
      <ellipse cx="100" cy="122" rx="56" ry="24" fill="${c.dark}" opacity=".35"/>
      <ellipse cx="100" cy="126" rx="54" ry="22" fill="${c.light}"/>
      <g transform="translate(100 118)">
        <path d="M-40 10C-40-14-18-26 4-26c22 0 36 14 36 32 0 8-6 10-14 10h-60c-4 0-6-2-6-6Z" fill="#FB923C"/>
        <path d="M0-24q4 8 0 14M14-22q4 8 0 14M26-16q3 7 0 12" stroke="#EA580C" stroke-opacity=".55" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M-46 4l-2-16 9 7h12l9-7-2 16c0 8-6 12-13 12s-13-4-13-12Z" fill="#FB923C"/>
        <path d="M-41 5q2.5 2 5 0M-30 5q2.5 2 5 0" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <path d="M38 8c-4 12-30 14-56 10" stroke="#EA580C" stroke-width="7" fill="none" stroke-linecap="round"/>
      </g>
      <path d="M30 112c14-22 42-34 70-34s56 12 70 34" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="6" stroke-linecap="round"/>`,
      litter: (c) => `
      ${_ProductArt.shadow(100, 188, 56)}
      <path d="M66 64c0-34 68-34 68 0" fill="none" stroke="${c.dark}" stroke-width="6" stroke-linecap="round"/>
      <path d="M52 66h96l-8 108a9 9 0 0 1-9 8H69a9 9 0 0 1-9-8Z" fill="${c.main}"/>
      <rect x="46" y="56" width="108" height="18" rx="6" fill="${c.dark}"/>
      <rect x="66" y="94" width="68" height="60" rx="14" fill="${c.light}"/>
      <rect x="78" y="104" width="44" height="7" rx="3.5" fill="${c.main}" opacity=".7"/>
      <g fill="${c.soft}">
        <circle cx="84" cy="130" r="5"/><circle cx="96" cy="136" r="4"/><circle cx="108" cy="128" r="5.5"/>
        <circle cx="119" cy="138" r="4"/><circle cx="92" cy="122" r="3.5"/><circle cx="105" cy="143" r="3"/>
      </g>
      ${_ProductArt.gloss("M62 82l5 84")}`,
      fountain: (c) => `
      ${_ProductArt.shadow(100, 186, 60)}
      <path d="M46 118h108l-9 56a10 10 0 0 1-10 8H65a10 10 0 0 1-10-8Z" fill="${c.main}"/>
      <ellipse cx="100" cy="118" rx="54" ry="14" fill="${c.dark}"/>
      <ellipse cx="100" cy="118" rx="46" ry="10" fill="#A8DCEB"/>
      <rect x="93" y="70" width="14" height="48" rx="7" fill="${c.light}"/>
      <path d="M100 74c-4-18-26-22-34 6M100 74c4-18 26-22 34 6" fill="none" stroke="#A8DCEB" stroke-width="5" stroke-linecap="round"/>
      <circle cx="64" cy="96" r="3" fill="#A8DCEB"/><circle cx="136" cy="96" r="3" fill="#A8DCEB"/>
      <rect x="86" y="148" width="28" height="6" rx="3" fill="${c.light}" opacity=".8"/>
      ${_ProductArt.gloss("M58 132l5 36")}`
    };
    constructor() {
    }
    /** Hasilkan string <svg> untuk sebuah produk. */
    static render(spec) {
      const template = _ProductArt.templates[spec.type] ?? _ProductArt.templates.bag;
      const palette = _ProductArt.palettes[spec.palette] ?? _ProductArt.palettes.orange;
      return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${template(palette)}</svg>`;
    }
    /** Isi semua elemen [data-art="jenis:palet"] di dalam root. */
    static hydrate(root = document) {
      root.querySelectorAll("[data-art]").forEach((element) => {
        if (element.dataset.artReady) return;
        const [type, palette] = (element.dataset.art ?? "").split(":");
        element.innerHTML = _ProductArt.render({ type, palette });
        element.dataset.artReady = "true";
      });
    }
    /* ---------- potongan gambar yang dipakai ulang ---------- */
    static shadow(cx, cy, rx) {
      return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="7" fill="${INK}" opacity=".1"/>`;
    }
    static gloss(d) {
      return `<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="7" stroke-linecap="round"/>`;
    }
    static catFace(cx, cy, scale, fill) {
      return `
      <g transform="translate(${cx} ${cy}) scale(${scale})">
        <path d="M-16 -6 L-18 -22 L-6 -14 H6 L18 -22 L16 -6 C19 -2 20 1 20 5 C20 14 11 20 0 20 S-20 14 -20 5 C-20 1 -19 -2 -16 -6 Z" fill="${fill}"/>
        <circle cx="-7" cy="3" r="2.6" fill="${INK}"/>
        <circle cx="7" cy="3" r="2.6" fill="${INK}"/>
        <path d="M-2.5 9 H2.5 L0 11.8 Z" fill="${INK}"/>
      </g>`;
    }
  };

  // src/ui/FlyToCart.ts
  var FlyToCart = class _FlyToCart {
    constructor(target, header, onArrive) {
      this.target = target;
      this.header = header;
      this.onArrive = onArrive;
    }
    target;
    header;
    onArrive;
    static SIZE = 44;
    launch(from, product) {
      if (Motion.reduced) {
        this.onArrive();
        return;
      }
      this.header.reveal(1400);
      const half = _FlyToCart.SIZE / 2;
      const a = from.getBoundingClientRect();
      const b = this.target.getBoundingClientRect();
      const headerOffset = this.header.element.getBoundingClientRect().top;
      const x0 = a.left + a.width / 2 - half;
      const y0 = a.top + a.height / 2 - half;
      const x1 = b.left + b.width / 2 - half;
      const y1 = b.top - headerOffset + b.height / 2 - half;
      const xm = (x0 + x1) / 2;
      const ym = Math.min(y0, y1) - 120;
      const dot = document.createElement("div");
      dot.className = "fly-dot";
      dot.style.left = "0px";
      dot.style.top = "0px";
      dot.innerHTML = ProductArt.render(product.art);
      document.body.append(dot);
      const animation = dot.animate(
        [
          { transform: `translate(${x0}px, ${y0}px) scale(.6)`, opacity: 0 },
          { transform: `translate(${x0}px, ${y0 - 24}px) scale(1)`, opacity: 1, offset: 0.15 },
          { transform: `translate(${xm}px, ${ym}px) scale(.85)`, offset: 0.55 },
          { transform: `translate(${x1}px, ${y1}px) scale(.3)`, opacity: 0.5 }
        ],
        { duration: 820, easing: "cubic-bezier(.45, 0, .25, 1)" }
      );
      animation.onfinish = () => {
        dot.remove();
        this.onArrive();
      };
    }
  };

  // src/ui/Component.ts
  var Component = class {
    constructor(root) {
      this.root = root;
    }
    root;
    find(selector) {
      return this.root.querySelector(selector);
    }
    findAll(selector) {
      return Array.from(this.root.querySelectorAll(selector));
    }
    require(selector) {
      const element = this.find(selector);
      if (!element) throw new Error(`[${this.constructor.name}] elemen "${selector}" tidak ditemukan.`);
      return element;
    }
  };

  // src/ui/forms/AsyncForm.ts
  var AsyncForm = class extends Component {
    submitButton;
    alertElement = null;
    busy = false;
    constructor(root) {
      super(root);
      this.submitButton = this.require('[type="submit"]');
    }
    mount() {
      this.root.addEventListener("submit", (event) => {
        event.preventDefault();
        void this.handleSubmit();
      });
      this.setup();
    }
    /** Kait opsional untuk event listener tambahan milik turunan. */
    setup() {
    }
    /** Template method: urutan langkah yang sama untuk semua formulir. */
    async handleSubmit() {
      if (this.busy) return;
      this.hideAlert();
      if (!this.validate()) return;
      this.setLoading(true);
      try {
        await this.send();
      } catch {
        this.showAlert("Gagal terhubung ke server. Coba lagi sebentar lagi.");
      } finally {
        this.setLoading(false);
      }
    }
    /** Bisa di-override (POLYMORPHISM): newsletter memakai baris pesan sendiri. */
    showAlert(html) {
      if (!this.alertElement) return;
      this.alertElement.innerHTML = `<svg class="icon"><use href="#i-alert"/></svg><p>${html}</p>`;
      this.alertElement.hidden = false;
    }
    hideAlert() {
      if (this.alertElement) this.alertElement.hidden = true;
    }
    setLoading(loading) {
      const button = this.submitButton;
      const label = button.querySelector("span:not(.spinner)");
      this.busy = loading;
      button.disabled = loading;
      button.classList.toggle("is-loading", loading);
      if (loading) {
        if (label) {
          button.dataset.label = label.textContent ?? "";
          label.textContent = this.loadingLabel;
        }
        button.insertAdjacentHTML("afterbegin", '<span class="spinner" aria-hidden="true"></span>');
      } else {
        if (label && button.dataset.label) label.textContent = button.dataset.label;
        button.querySelector(".spinner")?.remove();
      }
    }
  };

  // src/models/enums.ts
  var Category = /* @__PURE__ */ ((Category2) => {
    Category2["Makanan"] = "makanan";
    Category2["Camilan"] = "camilan";
    Category2["Mainan"] = "mainan";
    Category2["Perlengkapan"] = "perlengkapan";
    return Category2;
  })(Category || {});

  // src/models/Order.ts
  var OrderLine = class {
    constructor(product, quantity) {
      this.product = product;
      this.quantity = quantity;
    }
    product;
    quantity;
    get total() {
      return this.product.price * this.quantity;
    }
  };
  var Order = class _Order {
    static STEPS = [
      { status: "dibuat" /* Dibuat */, label: "Pesanan dibuat" },
      { status: "dibayar" /* Dibayar */, label: "Pembayaran diterima" },
      { status: "dikemas" /* Dikemas */, label: "Sedang dikemas" },
      { status: "dikirim" /* Dikirim */, label: "Dalam pengiriman" },
      { status: "sampai" /* Sampai */, label: "Sampai tujuan" }
    ];
    static ID_PATTERN = /^MP-\d{6}$/;
    id;
    status;
    courier;
    trackingNumber;
    eta;
    maskedAddress;
    lines;
    timeline;
    constructor(dto, lines) {
      this.id = dto.id;
      this.status = dto.status;
      this.courier = dto.courier;
      this.trackingNumber = dto.resi;
      this.eta = dto.eta;
      this.maskedAddress = dto.address;
      this.lines = lines;
      this.timeline = dto.timeline;
    }
    /** "mp261104", "MP 261104", "mp-261104" -> "MP-261104" */
    static normalizeId(raw) {
      return raw.trim().toUpperCase().replace(/^MP[\s-]*/, "MP-");
    }
    static isValidId(id) {
      return _Order.ID_PATTERN.test(id);
    }
    get stepIndex() {
      return _Order.STEPS.findIndex((step) => step.status === this.status);
    }
    get statusLabel() {
      return _Order.STEPS[this.stepIndex]?.label ?? this.status;
    }
    get isDelivered() {
      return this.status === "sampai" /* Sampai */;
    }
    get total() {
      return this.lines.reduce((sum, line) => sum + line.total, 0);
    }
    /** Waktu suatu tahap tercapai, atau null bila belum. */
    timeOf(status) {
      return this.timeline[status] ?? null;
    }
    canBeReturned() {
      return this.isDelivered;
    }
  };

  // src/ui/forms/Validators.ts
  var RequiredValidator = class {
    constructor(message) {
      this.message = message;
    }
    message;
    validate(value) {
      return value.trim() ? null : this.message;
    }
  };
  var EmailValidator = class _EmailValidator {
    constructor(message = "Format email belum benar. Contoh: nama@email.com") {
      this.message = message;
    }
    message;
    static PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    validate(value) {
      const email = value.trim();
      return !email || _EmailValidator.PATTERN.test(email) ? null : this.message;
    }
  };
  var OrderIdValidator = class {
    validate(value) {
      if (!value.trim()) return null;
      return Order.isValidId(Order.normalizeId(value)) ? null : "Format nomor pesanan: MP-123456.";
    }
  };

  // src/ui/forms/NewsletterForm.ts
  var NewsletterForm = class extends AsyncForm {
    constructor(root, service) {
      super(root);
      this.service = service;
      this.emailInput = this.require('input[type="email"]');
      this.message = this.require("[data-newsletter-msg]");
    }
    service;
    loadingLabel = "Mendaftar\u2026";
    emailInput;
    message;
    validators = [
      new RequiredValidator("Email-nya diisi dulu, ya."),
      new EmailValidator()
    ];
    setup() {
      this.emailInput.addEventListener("input", () => {
        if (this.root.classList.contains("is-error")) this.hideAlert();
      });
    }
    validate() {
      for (const validator of this.validators) {
        const error = validator.validate(this.emailInput.value);
        if (error) {
          restartAnimation(this.root, "is-error");
          this.emailInput.setAttribute("aria-invalid", "true");
          this.message.textContent = error;
          this.emailInput.focus();
          return false;
        }
      }
      return true;
    }
    async send() {
      const result = await this.service.subscribe(this.emailInput.value.trim());
      this.root.innerHTML = `
      <div class="newsletter-done" style="grid-column: 1 / -1" role="status">
        <svg class="icon"><use href="#i-check"/></svg>
        <p>Berhasil! Pakai kode <code>${escapeHtml(result.voucher)}</code> untuk diskon 10% di pesanan pertamamu.</p>
      </div>`;
    }
    /* POLYMORPHISM: override cara menampilkan pesan dari kelas induk */
    showAlert(text) {
      this.message.textContent = text;
    }
    hideAlert() {
      this.root.classList.remove("is-error");
      this.emailInput.removeAttribute("aria-invalid");
      this.message.textContent = "";
    }
  };

  // src/ui/HeaderActions.ts
  var HeaderActions = class extends Component {
    constructor(root, cart, wishlist, navigator) {
      super(root);
      this.cart = cart;
      this.wishlist = wishlist;
      this.navigator = navigator;
      this.wishButton = this.require("[data-wish-open]");
      this.wishCount = this.require("[data-wish-count]");
      this.cartButton = this.require("[data-cart-open]");
      this.cartCount = this.require("[data-cart-count]");
    }
    cart;
    wishlist;
    navigator;
    wishButton;
    wishCount;
    cartCount;
    cartButton;
    mount() {
      this.wishButton.addEventListener("click", () => this.navigator.showFavorites());
      this.cart.subscribe(() => this.renderCart());
      this.wishlist.subscribe(() => {
        this.renderWishlist();
        restartAnimation(this.wishCount, "is-bump");
      });
      this.renderCart();
      this.renderWishlist();
    }
    /** Dipanggil saat animasi produk "mendarat" di ikon keranjang. */
    bumpCart() {
      restartAnimation(this.cartCount, "is-bump");
    }
    renderCart() {
      const qty = this.cart.totalQuantity;
      this.cartCount.textContent = String(qty);
      this.cartCount.hidden = qty === 0;
      this.cartButton.setAttribute("aria-label", qty ? `Buka keranjang, ${qty} barang` : "Buka keranjang");
    }
    renderWishlist() {
      this.wishCount.textContent = String(this.wishlist.size);
      this.wishCount.hidden = this.wishlist.size === 0;
    }
  };

  // src/ui/layers/Layer.ts
  var Layer = class extends Component {
    constructor(root, layers) {
      super(root);
      this.layers = layers;
    }
    layers;
    /** Panel yang tertutup dibuat `inert` agar tidak bisa difokus. Bisa di-override. */
    get usesInert() {
      return true;
    }
    get isOpen() {
      return this.layers.current === this;
    }
    get element() {
      return this.root;
    }
    /** Minta LayerManager membuka panel ini (menutup panel lain bila ada). */
    show() {
      this.layers.open(this);
    }
    hide(options) {
      if (this.isOpen) this.layers.close(options);
    }
    /* ---------- dipanggil oleh LayerManager ---------- */
    activate() {
      if (this.usesInert) this.root.inert = false;
      this.root.classList.add("is-open");
      this.onOpen();
    }
    deactivate() {
      this.root.classList.remove("is-open");
      if (this.usesInert) this.root.inert = true;
      this.onClose();
    }
    focusInitial() {
      const target = this.initialFocus;
      window.setTimeout(() => target?.focus({ preventScroll: true }), 80);
    }
    /* ---------- kait (hook) untuk turunan ---------- */
    onOpen() {
    }
    onClose() {
    }
  };

  // src/ui/layers/CartDrawer.ts
  var CartDrawer = class _CartDrawer extends Layer {
    constructor(root, layers, deps) {
      super(root, layers);
      this.deps = deps;
      this.list = this.require("[data-cart-list]");
      this.empty = this.require("[data-cart-empty]");
      this.foot = this.require("[data-cart-foot]");
      this.subtotal = this.require("[data-cart-subtotal]");
      this.totalQty = this.require("[data-cart-total-qty]");
      this.ship = this.require("[data-ship]");
      this.shipText = this.require("[data-ship-text]");
      this.shipBar = this.require("[data-ship-bar]");
    }
    deps;
    list;
    empty;
    foot;
    subtotal;
    totalQty;
    ship;
    shipText;
    shipBar;
    get initialFocus() {
      return this.find("[data-cart-close]");
    }
    mount() {
      this.deps.trigger.addEventListener("click", () => this.openDrawer());
      this.findAll("[data-cart-close]").forEach(
        (button) => button.addEventListener("click", () => this.hide({ restoreFocus: false }))
      );
      this.list.addEventListener("click", (event) => this.handleListClick(event));
      this.find("[data-checkout]")?.addEventListener(
        "click",
        () => this.deps.notifier.notify("Checkout akan aktif setelah backend terhubung. Sabar ya, meong!", { duration: 3600 })
      );
      this.deps.cart.subscribe(() => this.render());
      this.render();
    }
    openDrawer() {
      this.render();
      this.show();
      this.deps.catalog.load().then(() => this.render()).catch(() => this.deps.notifier.notify("Gagal memuat keranjang.", { type: "error" }));
    }
    /* ---------- tampilan ---------- */
    render() {
      const { cart } = this.deps;
      const left = cart.remainingForFreeShipping;
      this.totalQty.textContent = cart.totalQuantity ? `(${cart.totalQuantity})` : "";
      this.subtotal.textContent = Formatter.rupiah(cart.subtotal);
      this.shipText.innerHTML = left ? `Tambah <strong>${Formatter.rupiah(left)}</strong> lagi untuk gratis ongkir` : "Yeay! Pesananmu dapat <strong>gratis ongkir</strong>";
      this.shipBar.style.setProperty("--p", cart.freeShippingProgress.toFixed(3));
      this.ship.classList.toggle("is-free", left === 0);
      this.syncList();
    }
    /** Perbarui daftar per item (bukan dibuat ulang) supaya animasi tidak berulang. */
    syncList() {
      const { cart, catalog } = this.deps;
      const lines = cart.lines;
      const ids = new Set(lines.map((line) => line.product.id));
      const loading = !catalog.isLoaded && cart.totalQuantity > 0;
      this.list.querySelectorAll(".cart-item").forEach((item) => {
        if (!ids.has(item.dataset.id ?? "") && !item.classList.contains("is-removing")) item.remove();
      });
      this.list.querySelector(".cart-loading")?.remove();
      if (loading) this.list.insertAdjacentHTML("afterbegin", '<li class="cart-loading">Memuat keranjang\u2026</li>');
      for (const line of lines) {
        const existing = this.list.querySelector(`.cart-item[data-id="${line.product.id}"]`);
        if (existing) {
          existing.querySelector("[data-qty-value]").textContent = String(line.quantity);
          existing.querySelector("[data-line-total]").textContent = Formatter.rupiah(line.total);
        } else {
          const item = document.createElement("li");
          item.className = "cart-item";
          item.dataset.id = line.product.id;
          item.innerHTML = _CartDrawer.lineHTML(line);
          this.list.append(item);
        }
      }
      const isEmpty = lines.length === 0 && !loading;
      const animatingOut = this.list.querySelector(".is-removing") !== null;
      this.list.hidden = isEmpty && !animatingOut;
      this.empty.classList.toggle("is-visible", isEmpty && !animatingOut);
      this.foot.hidden = lines.length === 0;
      this.ship.hidden = lines.length === 0;
    }
    static lineHTML(line) {
      const { product } = line;
      const name = escapeHtml(product.name);
      return `
      <div class="cart-thumb" style="--tint:${product.tint}">${ProductArt.render(product.art)}</div>
      <div>
        <p class="cart-name">${name}</p>
        <p class="cart-unit">${Formatter.rupiah(product.price)} \xB7 retur ${product.returnWindowDays} hari</p>
      </div>
      <div class="cart-side">
        <p class="cart-line-total" data-line-total>${Formatter.rupiah(line.total)}</p>
        <div class="qty" role="group" aria-label="Jumlah ${name}">
          <button type="button" data-qty="-1" aria-label="Kurangi jumlah ${name}"><svg class="icon"><use href="#i-minus"/></svg></button>
          <span class="qty-value" data-qty-value>${line.quantity}</span>
          <button type="button" data-qty="1" aria-label="Tambah jumlah ${name}"><svg class="icon"><use href="#i-plus"/></svg></button>
        </div>
        <button class="cart-remove" type="button" data-remove aria-label="Hapus ${name} dari keranjang">
          <svg class="icon"><use href="#i-trash"/></svg> Hapus
        </button>
      </div>`;
    }
    /* ---------- interaksi ---------- */
    handleListClick(event) {
      const target = event.target;
      const item = target.closest(".cart-item");
      const id = item?.dataset.id;
      if (!item || !id) return;
      const qtyButton = target.closest("[data-qty]");
      if (qtyButton) {
        const next = this.deps.cart.quantityOf(id) + Number(qtyButton.dataset.qty);
        if (next <= 0) this.removeLine(item, id);
        else this.deps.cart.setQuantity(id, next);
      } else if (target.closest("[data-remove]")) {
        this.removeLine(item, id);
      }
    }
    removeLine(item, id) {
      if (!Motion.reduced) {
        item.classList.add("is-removing");
        item.addEventListener("animationend", () => {
          item.remove();
          this.syncList();
        }, { once: true });
      }
      this.deps.cart.remove(id);
    }
  };

  // src/ui/layers/LayerManager.ts
  var LayerManager = class extends Observable {
    constructor(overlay) {
      super();
      this.overlay = overlay;
    }
    overlay;
    active = null;
    returnFocus = null;
    get current() {
      return this.active;
    }
    mount() {
      this.overlay.addEventListener("click", () => this.close());
      document.addEventListener("keydown", (event) => {
        if (!this.active) return;
        if (event.key === "Escape") this.close();
        else if (event.key === "Tab") this.trapFocus(event);
      });
    }
    open(layer) {
      if (this.active === layer) return;
      if (this.active) this.close({ restoreFocus: false });
      this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.active = layer;
      layer.activate();
      document.body.classList.add("is-locked");
      this.showOverlay();
      this.notify(layer);
      layer.focusInitial();
    }
    close({ restoreFocus = true } = {}) {
      const layer = this.active;
      if (!layer) return;
      this.active = null;
      layer.deactivate();
      document.body.classList.remove("is-locked");
      this.hideOverlay();
      this.notify(null);
      if (restoreFocus) this.returnFocus?.focus({ preventScroll: true });
    }
    showOverlay() {
      this.overlay.hidden = false;
      requestAnimationFrame(() => this.overlay.classList.add("is-visible"));
    }
    hideOverlay() {
      this.overlay.classList.remove("is-visible");
      window.setTimeout(() => {
        if (!this.active) this.overlay.hidden = true;
      }, 300);
    }
    trapFocus(event) {
      if (!this.active) return;
      const focusables = $$("a[href], button:not([disabled]), input:not([disabled])", this.active.element).filter((element) => element.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  // src/ui/layers/MobileNav.ts
  var MobileNav = class extends Layer {
    constructor(root, layers, header, toggle) {
      super(root, layers);
      this.header = header;
      this.toggle = toggle;
    }
    header;
    toggle;
    /** Di desktop menu selalu tampil, jadi jangan pernah di-inert. */
    get usesInert() {
      return false;
    }
    get initialFocus() {
      return this.find("[data-nav-close]");
    }
    mount() {
      this.toggle.addEventListener("click", () => this.show());
      this.find("[data-nav-close]")?.addEventListener("click", () => this.hide());
      this.findAll("[data-nav-link]").forEach(
        (link) => link.addEventListener("click", () => this.hide({ restoreFocus: false }))
      );
      Motion.desktopQuery.addEventListener("change", () => this.hide({ restoreFocus: false }));
    }
    onOpen() {
      this.header.classList.add("is-nav-open");
      this.toggle.setAttribute("aria-expanded", "true");
    }
    onClose() {
      this.header.classList.remove("is-nav-open");
      this.toggle.setAttribute("aria-expanded", "false");
    }
  };

  // src/ui/layers/SearchPanel.ts
  var SearchPanel = class _SearchPanel extends Layer {
    constructor(root, layers, catalog, navigator, trigger) {
      super(root, layers);
      this.catalog = catalog;
      this.navigator = navigator;
      this.trigger = trigger;
      this.input = this.require("[data-search-input]");
      this.results = this.require("[data-search-results]");
    }
    catalog;
    navigator;
    trigger;
    static POPULAR = ["Salmon", "Kasur", "Pasir", "Catnip", "Camilan"];
    input;
    results;
    get initialFocus() {
      return this.input;
    }
    mount() {
      this.trigger?.addEventListener("click", () => this.openPanel());
      this.find("[data-search-close]")?.addEventListener("click", () => this.hide());
      this.input.addEventListener("input", () => void this.render(this.input.value));
      this.find("[data-search-form]")?.addEventListener("submit", (event) => {
        event.preventDefault();
        this.results.querySelector("[data-result]")?.click();
      });
      this.results.addEventListener("click", (event) => {
        const target = event.target;
        const chip = target.closest("[data-chip]");
        const result = target.closest("[data-result]");
        if (chip) {
          this.input.value = chip.dataset.chip ?? "";
          void this.render(this.input.value);
          this.input.focus();
        } else if (result?.dataset.result) {
          this.hide({ restoreFocus: false });
          this.navigator.showProduct(result.dataset.result);
        }
      });
      document.addEventListener("keydown", (event) => {
        const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? "");
        if (event.key === "/" && !this.layers.current && !typing) {
          event.preventDefault();
          this.openPanel();
        }
      });
    }
    openPanel() {
      void this.render(this.input.value);
      this.show();
    }
    async render(raw) {
      const query = raw.trim().toLowerCase();
      if (!query) {
        this.results.innerHTML = `
        <p class="search-label">Pencarian populer</p>
        <div class="search-chips">
          ${_SearchPanel.POPULAR.map((word) => `<button type="button" class="chip" data-chip="${word}">${word}</button>`).join("")}
        </div>`;
        return;
      }
      try {
        await this.catalog.load();
      } catch {
        this.results.innerHTML = '<p class="search-empty">Gagal memuat produk. Coba lagi sebentar lagi.</p>';
        return;
      }
      if (this.input.value.trim().toLowerCase() !== query) return;
      const hits = this.catalog.search(query, 6);
      if (!hits.length) {
        this.results.innerHTML = `<p class="search-empty">Belum ada yang cocok dengan \u201C${escapeHtml(raw.trim())}\u201D. Coba kata lain, misalnya \u201Ctuna\u201D.</p>`;
        return;
      }
      this.results.innerHTML = `
      <p class="search-label">${hits.length} produk ditemukan</p>
      <div class="search-results">${hits.map((product, i) => _SearchPanel.resultHTML(product, query, i)).join("")}</div>`;
    }
    static resultHTML(product, query, index) {
      return `
      <button type="button" class="search-result" data-result="${product.id}" style="animation-delay:${index * 30}ms">
        <span class="search-thumb" style="--tint:${product.tint}">${ProductArt.render(product.art)}</span>
        <span>
          <span class="search-result-name">${_SearchPanel.highlight(product.name, query)}</span>
          <span class="search-result-meta">${product.categoryLabel} \xB7 ${Formatter.rupiah(product.price)}</span>
        </span>
      </button>`;
    }
    static highlight(text, query) {
      const index = text.toLowerCase().indexOf(query);
      if (index === -1) return escapeHtml(text);
      const end = index + query.length;
      return `${escapeHtml(text.slice(0, index))}<mark>${escapeHtml(text.slice(index, end))}</mark>${escapeHtml(text.slice(end))}`;
    }
  };

  // src/ui/PrimaryNav.ts
  var PrimaryNav = class _PrimaryNav extends Component {
    links;
    indicator;
    activeId = "beranda";
    constructor(root) {
      super(root);
      this.links = this.findAll(".navbar-link");
      this.indicator = this.find("[data-nav-indicator]");
    }
    mount() {
      this.links.forEach((link) => link.addEventListener("pointerenter", () => this.place(link)));
      this.root.addEventListener("pointerleave", () => this.place(this.activeLink));
      Motion.desktopQuery.addEventListener("change", () => this.place(this.activeLink));
      const ids = new Set(this.links.map((link) => _PrimaryNav.sectionId(link)).filter((id) => id !== null));
      const spy = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && ids.has(entry.target.id)) this.setActive(entry.target.id);
        });
      }, { rootMargin: "-40% 0px -55% 0px" });
      $$("[data-section][id]").forEach((section) => spy.observe(section));
      this.setActive(this.activeId);
    }
    measure() {
      this.place(this.activeLink);
    }
    get activeLink() {
      return this.links.find((link) => _PrimaryNav.sectionId(link) === this.activeId);
    }
    setActive(id) {
      this.activeId = id;
      const current = this.activeLink;
      this.links.forEach((link) => {
        const on = link === current;
        link.classList.toggle("is-active", on);
        if (on) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
      this.place(current);
    }
    place(link) {
      if (!this.indicator) return;
      if (!link || !Motion.isDesktop) {
        this.indicator.style.setProperty("--o", "0");
        return;
      }
      this.indicator.style.setProperty("--x", `${link.offsetLeft}px`);
      this.indicator.style.setProperty("--w", `${link.offsetWidth}px`);
      this.indicator.style.setProperty("--o", "1");
    }
    /** "#kategori" -> "kategori"; link ke halaman lain -> null */
    static sectionId(link) {
      const href = link.getAttribute("href") ?? "";
      return href.startsWith("#") ? href.slice(1) : null;
    }
  };

  // src/ui/RevealOnScroll.ts
  var RevealOnScroll = class _RevealOnScroll {
    static STAGGER_MS = 40;
    static MAX_DELAY_MS = 300;
    start() {
      $$("[data-stagger]").forEach((group) => {
        $$("[data-reveal]", group).forEach((element, i) => {
          const delay2 = Math.min(i * _RevealOnScroll.STAGGER_MS, _RevealOnScroll.MAX_DELAY_MS);
          element.style.setProperty("--d", `${delay2}ms`);
        });
      });
      const items = $$("[data-reveal]");
      if (Motion.reduced || !("IntersectionObserver" in window)) {
        items.forEach((element) => element.classList.add("is-in"));
        return;
      }
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target;
          observer.unobserve(element);
          element.classList.add("is-in");
          const delay2 = parseFloat(element.style.getPropertyValue("--d")) || 0;
          window.setTimeout(() => {
            element.removeAttribute("data-reveal");
            element.style.removeProperty("--d");
          }, 1200 + delay2);
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
      items.forEach((element) => observer.observe(element));
    }
  };

  // src/ui/ToastNotifier.ts
  var ToastNotifier = class _ToastNotifier {
    constructor(stack) {
      this.stack = stack;
    }
    stack;
    static MAX_VISIBLE = 2;
    notify(message, options = {}) {
      const { type = "info", action, onAction, duration = 2800 } = options;
      const icon = _ToastNotifier.iconFor(type);
      const toast = document.createElement("div");
      toast.className = `toast toast--${type}`;
      toast.setAttribute("role", "status");
      toast.innerHTML = `
      <span class="toast-icon"><svg class="icon ${icon === "i-paw" ? "icon--fill" : ""}"><use href="#${icon}"/></svg></span>
      <span class="toast-msg"></span>`;
      toast.querySelector(".toast-msg").textContent = message;
      let timer = 0;
      const dismiss = () => {
        if (toast.classList.contains("is-leaving")) return;
        window.clearTimeout(timer);
        toast.classList.add("is-leaving");
        toast.addEventListener("animationend", () => toast.remove(), { once: true });
        window.setTimeout(() => toast.remove(), 400);
      };
      if (action) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "toast-action";
        button.textContent = action;
        button.addEventListener("click", () => {
          onAction?.();
          dismiss();
        });
        toast.append(button);
      }
      this.stack.append(toast);
      while (this.stack.children.length > _ToastNotifier.MAX_VISIBLE) this.stack.firstElementChild?.remove();
      timer = window.setTimeout(dismiss, duration);
      toast.addEventListener("pointerenter", () => window.clearTimeout(timer));
      toast.addEventListener("pointerleave", () => {
        timer = window.setTimeout(dismiss, 1200);
      });
    }
    static iconFor(type) {
      if (type === "success") return "i-check";
      if (type === "error") return "i-alert";
      return "i-paw";
    }
  };

  // src/app/App.ts
  var App = class {
    catalog;
    cart;
    wishlist;
    orders;
    notifier;
    layers;
    engine = new ScrollEngine();
    navigator = new ProductNavigator(new RedirectNavigator());
    header;
    headerActions;
    cartDrawer;
    fly;
    newsletterService;
    constructor(services) {
      this.catalog = new ProductCatalog(services.products);
      this.cart = new Cart(services.storage, this.catalog);
      this.wishlist = new Wishlist(services.storage);
      this.orders = services.orders;
      this.newsletterService = services.newsletter;
      this.notifier = new ToastNotifier(required("[data-toasts]"));
      this.layers = new LayerManager(required("[data-overlay]"));
      this.header = new SmartHeader(required("[data-header]"), this.layers);
      this.headerActions = new HeaderActions(required(".header-actions"), this.cart, this.wishlist, this.navigator);
      this.cartDrawer = new CartDrawer(required("[data-cart]"), this.layers, {
        cart: this.cart,
        catalog: this.catalog,
        notifier: this.notifier,
        trigger: this.headerActions.cartButton
      });
      this.fly = new FlyToCart(this.headerActions.cartButton, this.header, () => this.headerActions.bumpCart());
    }
    /** Jalankan komponen bersama, lalu komponen khusus halaman. */
    start(page) {
      ProductArt.hydrate();
      const year = $("[data-year]");
      if (year) year.textContent = String((/* @__PURE__ */ new Date()).getFullYear());
      this.mountSharedComponents();
      this.engine.add(
        new ProgressBar(required("[data-progress-bar]")),
        new BackToTop(required("[data-back-top]"), required("[data-back-top-ring]")),
        this.header
      );
      page.init();
      new RevealOnScroll().start();
      new CountUp().start();
      this.engine.start();
      if (this.cart.totalQuantity > 0) this.catalog.load().catch(() => void 0);
    }
    mountSharedComponents() {
      this.layers.mount();
      this.headerActions.mount();
      this.cartDrawer.mount();
      new MobileNav(
        required("[data-navbar]"),
        this.layers,
        required("[data-header]"),
        required("[data-nav-open]")
      ).mount();
      new SearchPanel(
        required("[data-search]"),
        this.layers,
        this.catalog,
        this.navigator,
        $("[data-search-open]")
      ).mount();
      const primaryNav = new PrimaryNav(required("[data-nav-list]"));
      primaryNav.mount();
      this.engine.watch(primaryNav);
      const newsletter = $("[data-newsletter]");
      if (newsletter) new NewsletterForm(newsletter, this.newsletterService).mount();
    }
  };

  // src/config.ts
  var config = {
    useApi: false,
    apiBaseUrl: "http://localhost:5000/api"
  };

  // src/effects/StepsTimeline.ts
  var StepsTimeline = class extends ScrollEffect {
    constructor(list) {
      super();
      this.list = list;
      const fill = list.querySelector("[data-steps-fill]");
      if (!fill?.parentElement) throw new Error("Timeline membutuhkan [data-steps-fill].");
      this.fill = fill;
      this.line = fill.parentElement;
      this.steps = Array.from(list.querySelectorAll(".step"));
    }
    list;
    fill;
    line;
    steps;
    /** Bukan sekadar hiasan: saat gerakan dikurangi, timeline langsung penuh. */
    get isDecorative() {
      return false;
    }
    update({ viewportHeight: vh }) {
      const reduced = Motion.reduced;
      const reader = vh * 0.6 - this.list.getBoundingClientRect().top;
      const p = reduced ? 1 : clamp((reader - this.line.offsetTop) / this.line.offsetHeight, 0, 1);
      this.fill.style.transform = `scaleY(${p.toFixed(4)})`;
      for (const step of this.steps) {
        const center = step.offsetTop + 36;
        step.classList.toggle("is-done", reduced || reader >= center);
      }
    }
  };

  // src/ui/help/FaqAccordion.ts
  var FaqAccordion = class extends Component {
    constructor(root, searchInput, heroSearch) {
      super(root);
      this.searchInput = searchInput;
      this.heroSearch = heroSearch;
      this.items = this.findAll(".faq-item");
      this.groups = this.findAll(".faq-group");
      this.empty = this.find("[data-faq-empty]");
      this.queryLabel = this.find("[data-faq-query]");
    }
    searchInput;
    heroSearch;
    items;
    groups;
    empty;
    queryLabel;
    debounce = 0;
    mount() {
      this.items.forEach((item) => {
        this.setOpen(item, false);
        item.querySelector(".faq-q")?.addEventListener("click", () => this.setOpen(item, !this.isOpen(item)));
      });
      this.searchInput?.addEventListener("input", () => {
        window.clearTimeout(this.debounce);
        this.debounce = window.setTimeout(() => this.filter(this.searchInput?.value ?? ""), 120);
      });
      this.heroSearch?.addEventListener("submit", (event) => {
        event.preventDefault();
        const value = this.heroSearch?.querySelector("input")?.value ?? "";
        if (this.searchInput) this.searchInput.value = value;
        this.filter(value);
        document.getElementById("faq")?.scrollIntoView({ behavior: Motion.scrollBehavior });
      });
    }
    filter(raw) {
      const query = raw.trim().toLowerCase();
      let firstMatch = null;
      for (const item of this.items) {
        const match = !query || (item.textContent ?? "").toLowerCase().includes(query);
        item.hidden = !match;
        if (match && query && !firstMatch) firstMatch = item;
      }
      for (const group of this.groups) {
        group.hidden = Array.from(group.querySelectorAll(".faq-item")).every((item) => item.hidden);
      }
      if (this.empty) this.empty.hidden = !(query && !firstMatch);
      if (this.queryLabel) this.queryLabel.textContent = raw.trim();
      this.items.forEach((item) => this.setOpen(item, item === firstMatch));
    }
    isOpen(item) {
      return item.querySelector(".faq-q")?.getAttribute("aria-expanded") === "true";
    }
    setOpen(item, open) {
      const button = item.querySelector(".faq-q");
      const panel = item.querySelector(".faq-a");
      button?.setAttribute("aria-expanded", String(open));
      if (panel) {
        panel.classList.toggle("is-open", open);
        panel.inert = !open;
      }
    }
  };

  // src/ui/help/HelpNav.ts
  var HelpNav = class extends Component {
    list;
    links;
    constructor(root) {
      super(root);
      this.list = this.require("[data-help-nav-list]");
      this.links = this.findAll("[data-help-link]");
    }
    mount() {
      const topics = this.links.map((link) => document.getElementById((link.getAttribute("href") ?? "").slice(1))).filter((section) => section !== null);
      const spy = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) this.setActive(entry.target.id);
        });
      }, { rootMargin: "-30% 0px -65% 0px" });
      topics.forEach((section) => spy.observe(section));
    }
    setActive(id) {
      for (const link of this.links) {
        const on = link.getAttribute("href") === `#${id}`;
        link.classList.toggle("is-active", on);
        if (on) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
        if (on && this.list.scrollWidth > this.list.clientWidth) {
          const item = link.parentElement ?? link;
          const left = item.offsetLeft - (this.list.clientWidth - link.offsetWidth) / 2;
          this.list.scrollTo({ left, behavior: Motion.scrollBehavior });
        }
      }
    }
  };

  // src/ui/forms/FormField.ts
  var FormField = class {
    constructor(input, validators = [], normalizer) {
      this.input = input;
      this.validators = validators;
      this.normalizer = normalizer;
      const field = input.closest(".field");
      if (!field) throw new Error(`Input #${input.id} harus berada di dalam .field`);
      this.field = field;
      this.error = field.querySelector(".field-error");
      input.addEventListener("input", () => {
        if (this.field.classList.contains("is-invalid")) this.clearError();
      });
    }
    input;
    validators;
    normalizer;
    field;
    error;
    get value() {
      return this.input.value.trim();
    }
    set value(value) {
      this.input.value = value;
      this.clearError();
    }
    /** Jalankan semua validator berurutan; berhenti di galat pertama. */
    validate() {
      for (const validator of this.validators) {
        const message = validator.validate(this.input.value);
        if (message) {
          this.showError(message);
          return false;
        }
      }
      if (this.normalizer) this.input.value = this.normalizer(this.input.value);
      this.clearError();
      return true;
    }
    showError(message) {
      this.field.classList.add("is-invalid");
      if (this.error) this.error.textContent = message;
      this.input.setAttribute("aria-invalid", "true");
    }
    clearError() {
      this.field.classList.remove("is-invalid");
      if (this.error) this.error.textContent = "";
      this.input.removeAttribute("aria-invalid");
    }
    focus() {
      this.input.focus();
    }
  };

  // src/ui/help/ReturnForm.ts
  var DEMO_EMAIL = "demo@meowplace.id";
  var ReturnForm = class _ReturnForm extends AsyncForm {
    constructor(root, orders, notifier, alert) {
      super(root);
      this.orders = orders;
      this.notifier = notifier;
      this.alertElement = alert;
      this.orderField = new FormField(
        this.require("#return-order"),
        [new RequiredValidator("Nomor pesanan wajib diisi."), new OrderIdValidator()],
        Order.normalizeId
      );
      this.emailField = new FormField(
        this.require("#return-email"),
        [new RequiredValidator("Email wajib diisi."), new EmailValidator()]
      );
      this.note = this.require("#return-note");
      this.charCount = this.require("[data-char-count]");
      this.reasons = this.findAll('input[name="reason"]');
      this.reasonError = this.require("#return-reason-error");
      this.photo = this.require("[data-return-photo]");
      this.fileName = this.require("[data-file-name]");
      this.photoError = this.require("#return-photo-error");
      this.card = root.closest("[data-return-card]") ?? root;
    }
    orders;
    notifier;
    static MAX_PHOTO_BYTES = 5 * 1024 * 1024;
    static PHOTO_TYPE = /^image\/(png|jpe?g|webp)$/;
    loadingLabel = "Mengirim\u2026";
    orderField;
    emailField;
    note;
    charCount;
    reasons;
    reasonError;
    photo;
    fileName;
    photoError;
    card;
    /** Isi otomatis dari hasil lacak pesanan. */
    prefill(orderId, email) {
      this.orderField.value = orderId;
      this.emailField.value = email;
    }
    setup() {
      this.note.addEventListener("input", () => {
        this.charCount.textContent = String(this.note.value.length);
      });
      this.reasons.forEach((radio) => radio.addEventListener("change", () => this.setReasonError("")));
      this.photo.addEventListener("change", () => this.validatePhoto());
      this.findAll("[data-demo-return]").forEach(
        (chip) => chip.addEventListener("click", () => {
          this.prefill(chip.dataset.demoReturn ?? "", DEMO_EMAIL);
          if (!this.selectedReason) this.reasons[0].checked = true;
          this.setReasonError("");
        })
      );
      this.card.addEventListener("click", (event) => {
        if (event.target.closest("[data-return-again]")) this.reset();
      });
    }
    validate() {
      const orderOk = this.orderField.validate();
      const emailOk = this.emailField.validate();
      const reasonOk = this.selectedReason !== null;
      this.setReasonError(reasonOk ? "" : "Pilih salah satu alasan.");
      const photoOk = this.validatePhoto();
      const valid = orderOk && emailOk && reasonOk && photoOk;
      if (!valid) this.root.querySelector(".is-invalid input")?.focus();
      return valid;
    }
    async send() {
      const orderId = this.orderField.value;
      const email = this.emailField.value;
      const result = await this.orders.requestReturn({
        orderId,
        email,
        reason: this.selectedReason ?? "lainnya" /* Lainnya */,
        note: this.note.value.trim(),
        photo: this.photo.files?.[0] ?? null
      });
      if (!result.ok) {
        const id = escapeHtml(orderId);
        if (result.error === "not_delivered") {
          const label = Order.STEPS.find((step) => step.status === result.status)?.label.toLowerCase() ?? result.status;
          this.showAlert(`Pesanan <strong>${id}</strong> masih <strong>${label}</strong>.
          Pengembalian bisa diajukan setelah pesanan sampai.`);
        } else {
          this.showAlert(`Pesanan <strong>${id}</strong> tidak ditemukan untuk email tersebut.
          Pastikan nomor pesanan dan email sama dengan yang dipakai saat checkout.`);
        }
        return;
      }
      this.root.hidden = true;
      this.alertElement?.insertAdjacentHTML("afterend", _ReturnForm.successHTML(result.ticket, orderId, email));
      this.notifier.notify(`Pengajuan ${result.ticket} terkirim`, { type: "success" });
    }
    /* ---------- bantuan ---------- */
    get selectedReason() {
      const checked = this.reasons.find((radio) => radio.checked);
      return checked ? checked.value : null;
    }
    setReasonError(message) {
      this.reasonError.textContent = message;
      this.reasonError.closest(".field")?.classList.toggle("is-invalid", Boolean(message));
    }
    validatePhoto() {
      const file = this.photo.files?.[0];
      const field = this.photo.closest(".field");
      this.photoError.textContent = "";
      field?.classList.remove("is-invalid");
      if (!file) {
        this.fileName.textContent = "Pilih foto";
        return true;
      }
      this.fileName.textContent = file.name;
      let message = "";
      if (!_ReturnForm.PHOTO_TYPE.test(file.type)) message = "File harus berupa gambar JPG, PNG, atau WEBP.";
      else if (file.size > _ReturnForm.MAX_PHOTO_BYTES) {
        message = `Ukuran foto ${(file.size / 1048576).toFixed(1).replace(".", ",")} MB. Maksimal 5 MB.`;
      }
      if (message) {
        this.photoError.textContent = message;
        field?.classList.add("is-invalid");
        return false;
      }
      return true;
    }
    reset() {
      this.card.querySelector(".success-card")?.remove();
      this.root.reset();
      this.charCount.textContent = "0";
      this.fileName.textContent = "Pilih foto";
      this.root.hidden = false;
      this.orderField.focus();
    }
    static successHTML(ticket, orderId, email) {
      return `
      <div class="success-card" role="status">
        <span class="success-icon"><svg class="icon"><use href="#i-check"/></svg></span>
        <h3>Pengajuan diterima!</h3>
        <p>Nomor tiket kamu <code>${escapeHtml(ticket)}</code> untuk pesanan <strong>${escapeHtml(orderId)}</strong>.</p>
        <p>Kami cek dalam 48 jam dan mengabari lewat <strong>${escapeHtml(email)}</strong>. Simpan nomor tiketnya, ya.</p>
        <button type="button" class="btn btn-ghost btn-sm" data-return-again>Ajukan pengembalian lain</button>
      </div>`;
    }
  };

  // src/ui/help/TrackOrderForm.ts
  var DEMO_EMAIL2 = "demo@meowplace.id";
  var TrackOrderForm = class extends AsyncForm {
    constructor(root, orders, alert, result) {
      super(root);
      this.orders = orders;
      this.result = result;
      this.alertElement = alert;
      this.orderField = new FormField(
        this.require("#track-order"),
        [new RequiredValidator("Nomor pesanan wajib diisi."), new OrderIdValidator()],
        Order.normalizeId
      );
      this.emailField = new FormField(
        this.require("#track-email"),
        [new RequiredValidator("Email wajib diisi."), new EmailValidator()]
      );
    }
    orders;
    result;
    loadingLabel = "Mencari\u2026";
    /** Dipanggil saat pengguna klik "Ajukan pengembalian" dari hasil lacak. */
    onReturnRequested = null;
    orderField;
    emailField;
    setup() {
      this.findAll("[data-demo-track]").forEach(
        (chip) => chip.addEventListener("click", () => {
          this.orderField.value = chip.dataset.demoTrack ?? "";
          this.emailField.value = DEMO_EMAIL2;
          this.root.requestSubmit();
        })
      );
      this.result.addEventListener("click", (event) => {
        const link = event.target.closest("[data-goto-return]");
        if (link?.dataset.gotoReturn) this.onReturnRequested?.(link.dataset.gotoReturn, this.emailField.value);
      });
    }
    validate() {
      const orderOk = this.orderField.validate();
      const emailOk = this.emailField.validate();
      if (!orderOk) this.orderField.focus();
      else if (!emailOk) this.emailField.focus();
      return orderOk && emailOk;
    }
    async send() {
      const orderId = this.orderField.value;
      const result = await this.orders.track(orderId, this.emailField.value);
      if (!result.ok) {
        this.result.hidden = true;
        this.showAlert(`Pesanan <strong>${escapeHtml(orderId)}</strong> tidak ditemukan untuk email tersebut.
        Pastikan nomor pesanan dan email sama persis dengan yang dipakai saat checkout.`);
        return;
      }
      this.renderOrder(result.order);
      this.result.scrollIntoView({ behavior: Motion.scrollBehavior, block: "nearest" });
    }
    renderOrder(order) {
      const current = order.stepIndex;
      const steps = Order.STEPS;
      const stepsHTML = steps.map((step, i) => {
        const state = i < current || order.isDelivered ? "is-done" : i === current ? "is-current" : "is-pending";
        const time = order.timeOf(step.status);
        return `
        <li class="track-step ${state}" style="--sd:${i * 180}ms">
          <span class="track-dot"><svg class="icon"><use href="#i-check"/></svg></span>
          <p class="track-step-label">${step.label}</p>
          <p class="track-step-time">${time ? Formatter.dateTime(time) : "Menunggu"}</p>
        </li>`;
      }).join("");
      const itemsHTML = order.lines.map((line) => `
      <li class="track-item">
        <span class="track-thumb" style="--tint:${line.product.tint}">${ProductArt.render(line.product.art)}</span>
        <p class="track-item-name">${escapeHtml(line.product.name)}<span>${line.quantity} \xD7 ${Formatter.rupiah(line.product.price)}</span></p>
        <p class="track-item-price">${Formatter.rupiah(line.total)}</p>
      </li>`).join("");
      this.result.innerHTML = `
      <div class="track-head">
        <div>
          <p class="track-label">Nomor pesanan</p>
          <p class="track-id">${escapeHtml(order.id)}</p>
        </div>
        <span class="status-pill status-pill--${order.status}">${order.statusLabel}</span>
      </div>

      <ol class="track-steps" style="--p:0">${stepsHTML}</ol>

      <dl class="track-meta">
        <div><dt>Kurir</dt><dd>${escapeHtml(order.courier)}</dd></div>
        <div><dt>No. resi</dt><dd>${order.trackingNumber ? escapeHtml(order.trackingNumber) : "Tersedia setelah dikirim"}</dd></div>
        <div><dt>${order.isDelivered ? "Status" : "Estimasi tiba"}</dt><dd>${escapeHtml(order.eta)}</dd></div>
        <div><dt>Alamat</dt><dd>${escapeHtml(order.maskedAddress)}</dd></div>
      </dl>

      <ul class="track-items">${itemsHTML}</ul>
      <p class="track-total"><span>Total belanja</span><strong>${Formatter.rupiah(order.total)}</strong></p>

      ${order.canBeReturned() ? `
        <div class="track-actions">
          <a href="#pengembalian" class="btn btn-ghost btn-sm" data-goto-return="${escapeHtml(order.id)}">
            Ajukan pengembalian <svg class="icon icon-arrow"><use href="#i-arrow-right"/></svg>
          </a>
        </div>` : ""}`;
      this.result.hidden = false;
      const list = this.result.querySelector(".track-steps");
      requestAnimationFrame(() => requestAnimationFrame(() => {
        list?.style.setProperty("--p", (current / (steps.length - 1)).toFixed(3));
        list?.classList.add("is-ready");
      }));
    }
  };

  // src/pages/Page.ts
  var Page = class {
    constructor(app2) {
      this.app = app2;
    }
    app;
  };

  // src/pages/HelpPage.ts
  var HelpPage = class extends Page {
    init() {
      const { app: app2 } = this;
      const nav = $("[data-help-nav]");
      if (nav) new HelpNav(nav).mount();
      const steps = $("[data-steps]");
      if (steps) app2.engine.add(new StepsTimeline(steps));
      const returnForm = new ReturnForm(
        required("[data-return-form]"),
        app2.orders,
        app2.notifier,
        required("[data-return-alert]")
      );
      returnForm.mount();
      const trackForm = new TrackOrderForm(
        required("[data-track-form]"),
        app2.orders,
        required("[data-track-alert]"),
        required("[data-track-result]")
      );
      trackForm.onReturnRequested = (orderId, email) => returnForm.prefill(orderId, email);
      trackForm.mount();
      new FaqAccordion(
        required("[data-faq]"),
        $("[data-faq-search]"),
        $("[data-help-search]")
      ).mount();
    }
  };

  // src/effects/CtaExpand.ts
  var CtaExpand = class extends ScrollEffect {
    constructor(section, card, sticker) {
      super();
      this.section = section;
      this.card = card;
      this.sticker = sticker;
    }
    section;
    card;
    sticker;
    update({ y, viewportHeight: vh }) {
      const rect = this.section.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return;
      const p = clamp((vh - rect.top) / (vh * 0.7), 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      this.card.style.setProperty("--cta-scale", (0.9 + 0.1 * eased).toFixed(4));
      this.card.style.setProperty("--cta-radius", `${(64 - 32 * eased).toFixed(1)}px`);
      if (this.sticker) this.sticker.style.transform = `rotate(${(y * 0.12 % 360).toFixed(2)}deg)`;
    }
  };

  // src/effects/GalleryScroll.ts
  var GalleryScroll = class extends ScrollEffect {
    constructor(section) {
      super();
      this.section = section;
      this.rows = $$("[data-gallery-row]", section);
      this.buildSecondRow();
    }
    section;
    rows;
    shifts = [];
    measure() {
      this.shifts = this.rows.map((row) => Math.max(0, row.offsetWidth - window.innerWidth));
    }
    update({ viewportHeight: vh }) {
      const rect = this.section.getBoundingClientRect();
      if (rect.bottom < -100 || rect.top > vh + 100) return;
      const p = clamp((vh - rect.top) / (vh + rect.height), 0, 1);
      const [first, second] = this.rows;
      if (first) first.style.transform = `translate3d(${(-p * (this.shifts[0] ?? 0)).toFixed(1)}px, 0, 0)`;
      if (second) second.style.transform = `translate3d(${(-(1 - p) * (this.shifts[1] ?? 0)).toFixed(1)}px, 0, 0)`;
    }
    /** Baris kedua = salinan dekoratif baris pertama dengan urutan berbeda. */
    buildSecondRow() {
      const [first, second] = this.rows;
      if (!first || !second || second.children.length) return;
      const items = Array.from(first.children);
      const half = Math.ceil(items.length / 2);
      [...items.slice(half), ...items.slice(0, half)].forEach((item, i) => {
        const copy = item.cloneNode(true);
        copy.style.setProperty("--r", `${i % 2 ? 1.5 : -1.5}deg`);
        copy.querySelector("img")?.setAttribute("alt", "");
        second.append(copy);
      });
    }
  };

  // src/effects/HeroParallax.ts
  var HeroParallax = class extends ScrollEffect {
    constructor(hero) {
      super();
      this.hero = hero;
      this.layers = $$("[data-parallax]", hero).map((element) => ({
        element,
        speed: parseFloat(element.dataset.parallax ?? "0") || 0
      }));
      if (Motion.finePointer) this.listenToPointer();
    }
    hero;
    layers;
    pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    frame = 0;
    update({ y }) {
      this.apply(y);
    }
    apply(y) {
      if (y > window.innerHeight * 1.3) return;
      const strength = Motion.isDesktop ? 1 : 0.35;
      for (const { element, speed } of this.layers) {
        const depth = speed * 140;
        const tx = this.pointer.x * depth;
        const ty = -y * speed * strength + this.pointer.y * depth;
        element.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
      }
    }
    listenToPointer() {
      this.hero.addEventListener("pointermove", (event) => {
        if (Motion.reduced) return;
        const rect = this.hero.getBoundingClientRect();
        this.pointer.targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        this.pointer.targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        this.startLoop();
      });
      this.hero.addEventListener("pointerleave", () => {
        this.pointer.targetX = 0;
        this.pointer.targetY = 0;
        this.startLoop();
      });
    }
    startLoop() {
      if (!this.frame) this.frame = requestAnimationFrame(this.loop);
    }
    /** Arrow function supaya `this` tetap menunjuk ke objek ini. */
    loop = () => {
      const p = this.pointer;
      p.x = lerp(p.x, p.targetX, 0.08);
      p.y = lerp(p.y, p.targetY, 0.08);
      this.apply(window.scrollY);
      const settled = Math.abs(p.x - p.targetX) < 1e-3 && Math.abs(p.y - p.targetY) < 1e-3;
      this.frame = settled ? 0 : requestAnimationFrame(this.loop);
    };
  };

  // src/effects/Marquee.ts
  var Marquee = class _Marquee extends ScrollEffect {
    constructor(root, track) {
      super();
      this.root = root;
      this.track = track;
      new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting && !Motion.reduced;
        if (this.visible && !this.frame) {
          this.lastTime = 0;
          this.frame = requestAnimationFrame(this.loop);
        }
      }).observe(this.root);
    }
    root;
    track;
    static BASE_SPEED = 42;
    // px per detik
    static MAX_BOOST = 900;
    groupWidth = 0;
    offset = 0;
    boost = 0;
    direction = 1;
    visible = false;
    lastTime = 0;
    frame = 0;
    /** Gandakan grup teks secukupnya agar pita tidak pernah terlihat putus. */
    measure() {
      if (Motion.reduced) return;
      const group = this.track.firstElementChild;
      if (!group) return;
      this.track.querySelectorAll(".marquee-group[aria-hidden]").forEach((copy) => copy.remove());
      this.groupWidth = group.offsetWidth;
      let guard = 0;
      while (this.track.offsetWidth < window.innerWidth * 1.2 + this.groupWidth && guard++ < 10) {
        const copy = group.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        this.track.append(copy);
      }
    }
    /** Gulir memberi "dorongan" kecepatan searah gulir. */
    update({ dy }) {
      if (Math.abs(dy) < 0.5) return;
      this.direction = dy > 0 ? 1 : -1;
      this.boost = Math.min(_Marquee.MAX_BOOST, this.boost + Math.abs(dy) * 9);
    }
    loop = (now) => {
      const dt = this.lastTime ? Math.min(0.05, (now - this.lastTime) / 1e3) : 0;
      this.lastTime = now;
      this.boost *= Math.pow(0.03, dt);
      this.offset += this.direction * (_Marquee.BASE_SPEED + this.boost) * dt;
      if (this.groupWidth) {
        const x = -((this.offset % this.groupWidth + this.groupWidth) % this.groupWidth);
        this.track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
      }
      this.frame = this.visible ? requestAnimationFrame(this.loop) : 0;
    };
  };

  // src/effects/OfferParallax.ts
  var OfferParallax = class extends ScrollEffect {
    constructor(images) {
      super();
      this.images = images;
    }
    images;
    update({ viewportHeight: vh }) {
      for (const image of this.images) {
        const frame = image.parentElement;
        if (!frame) continue;
        const rect = frame.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) continue;
        const p = (rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2);
        image.style.setProperty("--py", `${(p * rect.height * 0.06).toFixed(1)}px`);
      }
    }
  };

  // src/effects/PawTrail.ts
  var PawTrail = class extends ScrollEffect {
    constructor(trail) {
      super();
      this.trail = trail;
    }
    trail;
    paws = [];
    visibleCount = 0;
    /** Jejak tetap tampil (tanpa animasi) saat gerakan dikurangi. */
    get isDecorative() {
      return false;
    }
    measure() {
      const width = this.trail.offsetWidth;
      const height = this.trail.offsetHeight;
      const parent = this.trail.parentElement;
      const pad = parent && parseFloat(getComputedStyle(parent).paddingBottom) || 64;
      const count = clamp(Math.round(width / 84), 6, 18);
      const baseY = height - pad / 2 - 13;
      this.trail.innerHTML = "";
      this.paws = [];
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        const side = i % 2 ? 1 : -1;
        const x = width * 0.04 + t * width * 0.9;
        const y = baseY - Math.sin(t * Math.PI) * pad * 0.18 + side * 9;
        const paw = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        paw.classList.add("paw");
        paw.innerHTML = '<use href="#i-paw"/>';
        paw.style.left = `${x.toFixed(1)}px`;
        paw.style.top = `${y.toFixed(1)}px`;
        paw.style.transform = `rotate(${90 + side * 8}deg)`;
        this.trail.append(paw);
        this.paws.push(paw);
      }
      this.visibleCount = 0;
    }
    update({ viewportHeight: vh }) {
      if (!this.paws.length) return;
      if (Motion.reduced) {
        this.show(this.paws.length);
        return;
      }
      const rect = this.trail.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return;
      const p = clamp((vh * 0.95 - rect.top) / rect.height, 0, 1);
      this.show(Math.round(p * this.paws.length));
    }
    show(count) {
      if (count === this.visibleCount) return;
      this.paws.forEach((paw, i) => paw.classList.toggle("is-on", i < count));
      this.visibleCount = count;
    }
  };

  // src/ui/ProductCardView.ts
  var BADGE_CLASS = { sale: "badge", new: "badge badge--new", hot: "badge badge--hot" };
  var ProductCardView = class {
    constructor() {
    }
    static render(product, options) {
      const { wished, index } = options;
      const name = escapeHtml(product.name);
      const badge = product.getBadge();
      return `
      <article class="product-card is-entering" data-id="${product.id}" style="--d:${Math.min(index * 40, 300)}ms">
        <div class="product-media" style="--tint:${product.tint}">
          ${badge ? `<span class="${BADGE_CLASS[badge.variant]}">${escapeHtml(badge.label)}</span>` : ""}
          <button class="wish-btn" type="button" data-wish="${product.id}" aria-pressed="${wished}"
            aria-label="${wished ? "Hapus dari" : "Simpan ke"} favorit: ${name}">
            <svg class="icon"><use href="#i-heart"/></svg>
          </button>
          <div class="product-art">${ProductArt.render(product.art)}</div>
        </div>
        <div class="product-body">
          <p class="product-cat">${product.categoryLabel}</p>
          <h3 class="product-name">${name}</h3>
          <p class="product-rating">
            <svg class="icon icon--fill"><use href="#i-star"/></svg>
            ${Formatter.decimal(product.rating, 1)} <span>(${Formatter.compact(product.reviews)} ulasan)</span>
          </p>
          <div class="product-foot">
            <p class="price">
              <strong>${Formatter.rupiah(product.price)}</strong>${product.oldPrice ? `<s>${Formatter.rupiah(product.oldPrice)}</s>` : ""}
            </p>
            <button class="add-btn" type="button" data-add="${product.id}" aria-label="Tambah ke keranjang: ${name}">
              <svg class="icon"><use href="#i-bag-plus"/></svg>
            </button>
          </div>
        </div>
      </article>`;
    }
    static skeleton() {
      return `
      <div class="product-card is-skeleton" aria-hidden="true">
        <div class="product-media skeleton"></div>
        <div class="product-body">
          <span class="skeleton sk-line" style="width:40%"></span>
          <span class="skeleton sk-line sk-line--lg" style="width:88%"></span>
          <span class="skeleton sk-line" style="width:56%"></span>
          <div class="product-foot">
            <span class="skeleton sk-line sk-line--lg" style="width:46%"></span>
            <span class="skeleton sk-btn"></span>
          </div>
        </div>
      </div>`;
    }
  };

  // src/ui/ProductGrid.ts
  var FILTERS = ["semua", "favorit", ...Object.values(Category)];
  var ProductGrid = class _ProductGrid extends Component {
    constructor(root, deps) {
      super(root);
      this.deps = deps;
      this.section = root.closest("section");
      this.tabsWrap = $("[data-filter-tabs]");
      this.tabs = this.tabsWrap ? $$("[data-filter]", this.tabsWrap) : [];
      this.indicator = $("[data-filter-indicator]");
      this.loadMoreButton = $("[data-load-more]");
      this.loadMoreCount = $("[data-load-more-count]");
    }
    deps;
    static PAGE_SIZE = 8;
    filter = "semua";
    visible = _ProductGrid.PAGE_SIZE;
    rendered = false;
    loading = null;
    resetTimers = /* @__PURE__ */ new WeakMap();
    section;
    tabsWrap;
    tabs;
    indicator;
    loadMoreButton;
    loadMoreCount;
    /* ==================== siklus hidup ==================== */
    mount() {
      this.root.id = "produk-grid";
      this.tabs.forEach((tab, i) => {
        tab.setAttribute("aria-controls", this.root.id);
        tab.addEventListener("click", () => this.setFilter(tab.dataset.filter));
        tab.addEventListener("keydown", (event) => {
          if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
          event.preventDefault();
          const next = this.tabs[(i + (event.key === "ArrowRight" ? 1 : -1) + this.tabs.length) % this.tabs.length];
          next.focus();
          this.setFilter(next.dataset.filter);
        });
      });
      $$("[data-filter-link]").forEach(
        (link) => link.addEventListener("click", () => {
          this.setFilter(link.dataset.filterLink);
          void this.load();
        })
      );
      this.loadMoreButton?.addEventListener("click", () => this.loadMore());
      this.root.addEventListener("click", (event) => this.handleClick(event));
      this.root.addEventListener("animationend", (event) => {
        const target = event.target;
        target.classList.remove("is-entering", "is-flash");
      });
      new IntersectionObserver(([entry], observer) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        void this.load();
      }, { rootMargin: "0px 0px -10% 0px" }).observe(this.root);
      this.syncTabs(false);
    }
    measure() {
      this.syncTabs(false);
    }
    /** Tautan dari halaman lain: ?kategori=mainan atau ?produk=p01 */
    applyUrlParams(params) {
      const kategori = params.get("kategori");
      const produk = params.get("produk");
      if (kategori && _ProductGrid.isFilter(kategori)) {
        this.filter = kategori;
        this.syncTabs(false);
      }
      if (produk) window.setTimeout(() => this.showProduct(produk), 300);
      if (kategori || produk) history.replaceState(null, "", location.pathname + location.hash);
    }
    /* ==================== IProductNavigator ==================== */
    showProduct(productId) {
      void this.revealProduct(productId);
    }
    showFavorites() {
      this.setFilter("favorit");
      void this.load();
      this.section?.scrollIntoView({ behavior: Motion.scrollBehavior });
    }
    /* ==================== filter & render ==================== */
    setFilter(filter) {
      if (filter === this.filter && this.rendered) return;
      this.filter = filter;
      this.visible = _ProductGrid.PAGE_SIZE;
      this.syncTabs(true);
      if (!this.rendered) return;
      if (Motion.reduced) {
        this.render();
        return;
      }
      this.root.classList.add("is-swapping");
      window.setTimeout(() => {
        this.render();
        this.root.classList.remove("is-swapping");
      }, 180);
    }
    load() {
      if (this.rendered) return Promise.resolve();
      if (this.loading) return this.loading;
      if (!this.deps.catalog.isLoaded) {
        this.root.innerHTML = ProductCardView.skeleton().repeat(_ProductGrid.PAGE_SIZE);
        this.root.setAttribute("aria-busy", "true");
      }
      this.loading = this.deps.catalog.load().then(() => {
        this.rendered = true;
        this.render();
      }).catch(() => {
        this.root.innerHTML = _ProductGrid.errorHTML();
        this.root.setAttribute("aria-busy", "false");
      }).finally(() => {
        this.loading = null;
      });
      return this.loading;
    }
    /** Produk yang lolos filter aktif. Memakai getter `category` milik tiap objek. */
    filtered() {
      const all = this.deps.catalog.all;
      if (this.filter === "semua") return [...all];
      if (this.filter === "favorit") return all.filter((product) => this.deps.wishlist.has(product.id));
      return all.filter((product) => product.category === this.filter);
    }
    render(animate = true) {
      const list = this.filtered();
      this.root.innerHTML = list.length ? list.slice(0, this.visible).map((product, index) => ProductCardView.render(product, { wished: this.deps.wishlist.has(product.id), index })).join("") : this.emptyHTML();
      if (!animate) this.root.querySelectorAll(".product-card").forEach((card) => card.classList.remove("is-entering"));
      this.root.setAttribute("aria-busy", "false");
      this.updateLoadMore(list);
    }
    loadMore() {
      const list = this.filtered();
      const start = this.visible;
      this.visible += _ProductGrid.PAGE_SIZE;
      const html = list.slice(start, this.visible).map((product, index) => ProductCardView.render(product, { wished: this.deps.wishlist.has(product.id), index })).join("");
      this.root.insertAdjacentHTML("beforeend", html);
      this.updateLoadMore(list);
    }
    updateLoadMore(list) {
      if (!this.loadMoreButton || !this.loadMoreCount) return;
      const remaining = list.length - Math.min(list.length, this.visible);
      this.loadMoreButton.hidden = remaining <= 0;
      this.loadMoreCount.textContent = remaining > 0 ? `(${remaining} lagi)` : "";
    }
    async revealProduct(productId) {
      await this.load();
      let index = this.filtered().findIndex((product) => product.id === productId);
      if (index === -1) {
        this.filter = "semua";
        this.syncTabs(true);
        index = this.deps.catalog.all.findIndex((product) => product.id === productId);
      }
      if (index === -1) return;
      const size = _ProductGrid.PAGE_SIZE;
      this.visible = Math.max(size, Math.ceil((index + 1) / size) * size);
      this.render(false);
      const card = this.find(`[data-id="${productId}"]`);
      if (!card) return;
      card.scrollIntoView({ behavior: Motion.scrollBehavior, block: "center" });
      restartAnimation(card, "is-flash");
    }
    /* ==================== tab filter ==================== */
    syncTabs(scrollTab) {
      this.tabs.forEach((tab) => {
        const on = tab.dataset.filter === this.filter;
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
      });
      const active = this.tabs.find((tab) => tab.dataset.filter === this.filter);
      if (!active || !this.indicator || !this.tabsWrap) return;
      this.indicator.style.setProperty("--x", `${active.offsetLeft}px`);
      this.indicator.style.setProperty("--w", `${active.offsetWidth}px`);
      if (scrollTab && this.tabsWrap.scrollWidth > this.tabsWrap.clientWidth) {
        const left = active.offsetLeft - (this.tabsWrap.clientWidth - active.offsetWidth) / 2;
        this.tabsWrap.scrollTo({ left, behavior: Motion.scrollBehavior });
      }
    }
    /* ==================== aksi pada kartu ==================== */
    handleClick(event) {
      const target = event.target;
      const wishButton = target.closest("[data-wish]");
      const addButton = target.closest("[data-add]");
      if (wishButton?.dataset.wish) this.toggleWish(wishButton.dataset.wish, wishButton);
      else if (addButton?.dataset.add) this.addToCart(addButton.dataset.add, addButton);
      else if (target.closest("[data-retry]")) void this.load();
      else if (target.closest("[data-go-all]")) this.setFilter("semua");
    }
    toggleWish(productId, button) {
      const product = this.deps.catalog.find(productId);
      if (!product) return;
      const added = this.deps.wishlist.toggle(productId);
      button.setAttribute("aria-pressed", String(added));
      button.setAttribute("aria-label", `${added ? "Hapus dari" : "Simpan ke"} favorit: ${product.name}`);
      restartAnimation(button, "is-pop");
      if (added) {
        this.deps.notifier.notify(`${product.name} disimpan ke favorit`, { action: "Lihat", onAction: () => this.showFavorites() });
      } else if (this.filter === "favorit") {
        window.setTimeout(() => this.render(false), 300);
      }
    }
    addToCart(productId, button) {
      const product = this.deps.catalog.find(productId);
      if (!product) return;
      this.deps.cart.add(productId);
      button.classList.add("is-added");
      button.innerHTML = '<svg class="icon"><use href="#i-check"/></svg>';
      window.clearTimeout(this.resetTimers.get(button));
      this.resetTimers.set(button, window.setTimeout(() => {
        button.classList.remove("is-added");
        button.innerHTML = '<svg class="icon"><use href="#i-bag-plus"/></svg>';
      }, 1400));
      this.deps.fly.launch(button, product);
      this.deps.notifier.notify(`${product.name} masuk keranjang`, {
        type: "success",
        action: "Lihat",
        onAction: this.deps.openCart
      });
    }
    /* ==================== state kosong / galat ==================== */
    emptyHTML() {
      if (this.filter === "favorit") {
        return `
        <div class="grid-state">
          <div class="grid-state-art">${ProductArt.render({ type: "bed", palette: "cream" })}</div>
          <h3>Belum ada favorit</h3>
          <p>Ketuk ikon hati di produk mana pun untuk menyimpannya di sini.</p>
          <button class="btn btn-ghost btn-sm" type="button" data-go-all>Lihat semua produk</button>
        </div>`;
      }
      return `
      <div class="grid-state">
        <div class="grid-state-art">${ProductArt.render({ type: "yarn", palette: "orange" })}</div>
        <h3>Stok sedang diisi ulang</h3>
        <p>Kategori ini belum punya produk. Cek lagi nanti, ya.</p>
        <button class="btn btn-ghost btn-sm" type="button" data-go-all>Lihat semua produk</button>
      </div>`;
    }
    static errorHTML() {
      return `
      <div class="grid-state" role="alert">
        <div class="grid-state-art">${ProductArt.render({ type: "mouse", palette: "brown" })}</div>
        <h3>Gagal memuat produk</h3>
        <p>Sepertinya koneksi sedang bermasalah. Coba muat ulang.</p>
        <button class="btn btn-primary btn-sm" type="button" data-retry>Coba lagi</button>
      </div>`;
    }
    static isFilter(value) {
      return FILTERS.includes(value);
    }
  };

  // src/pages/HomePage.ts
  var HomePage = class extends Page {
    init() {
      this.initShop();
      this.initEffects();
    }
    initShop() {
      const gridElement = $("[data-product-grid]");
      if (!gridElement) return;
      const { app: app2 } = this;
      const grid = new ProductGrid(gridElement, {
        catalog: app2.catalog,
        cart: app2.cart,
        wishlist: app2.wishlist,
        notifier: app2.notifier,
        fly: app2.fly,
        openCart: () => app2.cartDrawer.openDrawer()
      });
      grid.mount();
      grid.applyUrlParams(new URLSearchParams(location.search));
      app2.navigator.use(grid);
      app2.engine.watch(grid);
    }
    initEffects() {
      const { engine } = this.app;
      const hero = $(".hero");
      if (hero) engine.add(new HeroParallax(hero));
      const marquee = $("[data-marquee]");
      const track = $("[data-marquee-track]");
      if (marquee && track) engine.add(new Marquee(marquee, track));
      const offers = $$("[data-parallax-img]");
      if (offers.length) engine.add(new OfferParallax(offers));
      const gallery = $("[data-gallery]");
      if (gallery) engine.add(new GalleryScroll(gallery));
      const cta = $("[data-cta]");
      const card = $("[data-cta-card]");
      if (cta && card) engine.add(new CtaExpand(cta, card, $("[data-sticker] > svg")));
      const trail = $("[data-paw-trail]");
      if (trail) engine.add(new PawTrail(trail));
    }
  };

  // src/services/api/ApiNewsletterService.ts
  var ApiNewsletterService = class {
    constructor(http) {
      this.http = http;
    }
    http;
    subscribe(email) {
      return this.http.post("/newsletter", { email: email.trim() });
    }
  };

  // src/models/Product.ts
  var Product = class {
    id;
    name;
    rating;
    reviews;
    art;
    tint;
    _price;
    _oldPrice;
    badgeText;
    constructor(dto) {
      if (dto.price < 0) throw new Error(`Harga produk ${dto.id} tidak boleh negatif.`);
      this.id = dto.id;
      this.name = dto.name;
      this.rating = dto.rating;
      this.reviews = dto.reviews;
      this.art = dto.art;
      this.tint = dto.tint;
      this._price = dto.price;
      this._oldPrice = dto.oldPrice ?? null;
      this.badgeText = dto.badge ?? null;
    }
    /* ---------- getter (ENCAPSULATION) ---------- */
    get price() {
      return this._price;
    }
    get oldPrice() {
      return this._oldPrice;
    }
    get isOnSale() {
      return this._oldPrice !== null && this._oldPrice > this._price;
    }
    get discountPercent() {
      if (!this.isOnSale || this._oldPrice === null) return 0;
      return Math.round((1 - this._price / this._oldPrice) * 100);
    }
    /* ---------- perilaku bersama ---------- */
    /** Badge di kartu produk: diskon diutamakan, lalu label dari backend. */
    getBadge() {
      if (this.isOnSale) return { label: `-${this.discountPercent}%`, variant: "sale" };
      if (this.badgeText === "Baru") return { label: "Baru", variant: "new" };
      if (this.badgeText) return { label: this.badgeText, variant: "hot" };
      return null;
    }
    /** Dipakai fitur pencarian: cocokkan dengan nama & label kategori. */
    matches(query) {
      const q = query.trim().toLowerCase();
      return q.length > 0 && `${this.name} ${this.categoryLabel}`.toLowerCase().includes(q);
    }
  };
  var FoodProduct = class extends Product {
    get category() {
      return "makanan" /* Makanan */;
    }
    get categoryLabel() {
      return "Makanan";
    }
    get returnWindowDays() {
      return 14;
    }
  };
  var TreatProduct = class extends FoodProduct {
    get category() {
      return "camilan" /* Camilan */;
    }
    get categoryLabel() {
      return "Camilan";
    }
  };
  var ToyProduct = class extends Product {
    get category() {
      return "mainan" /* Mainan */;
    }
    get categoryLabel() {
      return "Mainan";
    }
    get returnWindowDays() {
      return 30;
    }
  };
  var SupplyProduct = class extends Product {
    get category() {
      return "perlengkapan" /* Perlengkapan */;
    }
    get categoryLabel() {
      return "Perlengkapan";
    }
    get returnWindowDays() {
      return 30;
    }
  };

  // src/models/ProductFactory.ts
  var ProductFactory = class _ProductFactory {
    constructor() {
    }
    static create(dto) {
      switch (dto.category) {
        case "makanan" /* Makanan */:
          return new FoodProduct(dto);
        case "camilan" /* Camilan */:
          return new TreatProduct(dto);
        case "mainan" /* Mainan */:
          return new ToyProduct(dto);
        case "perlengkapan" /* Perlengkapan */:
          return new SupplyProduct(dto);
        default:
          throw new Error(`Kategori produk tidak dikenal: "${dto.category}"`);
      }
    }
    static createMany(dtos) {
      return dtos.map((dto) => _ProductFactory.create(dto));
    }
  };

  // src/services/api/HttpClient.ts
  var HttpError = class extends Error {
    constructor(status, body) {
      super(`Permintaan gagal (HTTP ${status})`);
      this.status = status;
      this.body = body;
      this.name = "HttpError";
    }
    status;
    body;
  };
  var HttpClient = class {
    constructor(baseUrl) {
      this.baseUrl = baseUrl;
    }
    baseUrl;
    get(path) {
      return this.request(path, { method: "GET" });
    }
    post(path, body) {
      return this.request(path, { method: "POST", body: JSON.stringify(body) }, { "Content-Type": "application/json" });
    }
    postForm(path, form) {
      return this.request(path, { method: "POST", body: form });
    }
    async request(path, init, headers = {}) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: { Accept: "application/json", ...headers }
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new HttpError(response.status, body);
      return body;
    }
  };

  // src/services/api/ApiOrderService.ts
  var ApiOrderService = class {
    constructor(http) {
      this.http = http;
    }
    http;
    async track(orderId, email) {
      try {
        const dto = await this.http.post("/orders/track", {
          orderId: Order.normalizeId(orderId),
          email: email.trim()
        });
        const lines = dto.items.map((item) => {
          if (!item.product) throw new Error("Respons backend tidak menyertakan data produk.");
          return new OrderLine(ProductFactory.create(item.product), item.qty);
        });
        return { ok: true, order: new Order(dto, lines) };
      } catch (error) {
        if (error instanceof HttpError && error.status === 404) return { ok: false, error: "not_found" };
        throw error;
      }
    }
    async requestReturn(request) {
      const form = new FormData();
      form.append("orderId", Order.normalizeId(request.orderId));
      form.append("email", request.email.trim());
      form.append("reason", request.reason);
      form.append("note", request.note);
      if (request.photo) form.append("photo", request.photo);
      try {
        const result = await this.http.postForm("/returns", form);
        return { ok: true, ticket: result.ticket };
      } catch (error) {
        if (error instanceof HttpError && error.status === 404) return { ok: false, error: "not_found" };
        if (error instanceof HttpError && error.status === 409) {
          const status = error.body?.status;
          if (status) return { ok: false, error: "not_delivered", status };
        }
        throw error;
      }
    }
  };

  // src/services/api/ApiProductRepository.ts
  var ApiProductRepository = class {
    constructor(http) {
      this.http = http;
    }
    http;
    async getAll() {
      const dtos = await this.http.get("/products");
      return ProductFactory.createMany(dtos);
    }
  };

  // src/services/mock/MockNewsletterService.ts
  var MockNewsletterService = class {
    async subscribe(_email) {
      await delay(600);
      return { voucher: "MEOW10" };
    }
  };

  // src/services/mock/mockData.ts
  var MOCK_PRODUCTS = [
    { id: "p01", name: "Salmon Kitten Dry Food 1,5 kg", category: "makanan" /* Makanan */, price: 145e3, oldPrice: 189e3, rating: 4.9, reviews: 1240, art: { type: "bag", palette: "orange" }, tint: "#FFE9D6" },
    { id: "p02", name: "Tuna P\xE2t\xE9 in Gravy 85 g", category: "makanan" /* Makanan */, price: 18500, rating: 4.8, reviews: 3410, badge: "Terlaris", art: { type: "can", palette: "tangerine" }, tint: "#FFF1CC" },
    { id: "p03", name: "Chicken Crunch Treats 60 g", category: "camilan" /* Camilan */, price: 32e3, oldPrice: 4e4, rating: 4.8, reviews: 2120, art: { type: "pouch", palette: "rust" }, tint: "#FDE5DC" },
    { id: "p04", name: "Tikus Plush Isi Catnip", category: "mainan" /* Mainan */, price: 25e3, rating: 4.9, reviews: 980, art: { type: "mouse", palette: "brown" }, tint: "#F6ECE1" },
    { id: "p05", name: "Menara Garukan Sisal 60 cm", category: "perlengkapan" /* Perlengkapan */, price: 289e3, oldPrice: 349e3, rating: 4.8, reviews: 720, art: { type: "scratcher", palette: "brown" }, tint: "#FFE9D6" },
    { id: "p06", name: "Kasur Donat Fluffy", category: "perlengkapan" /* Perlengkapan */, price: 175e3, rating: 4.9, reviews: 1930, badge: "Terlaris", art: { type: "bed", palette: "cream" }, tint: "#FDE5DC" },
    { id: "p07", name: "Salmon Bites Dental 80 g", category: "camilan" /* Camilan */, price: 29e3, rating: 4.6, reviews: 540, badge: "Baru", art: { type: "pouch", palette: "honey" }, tint: "#FFF1CC" },
    { id: "p08", name: "Pasir Gumpal Lavender 10 L", category: "perlengkapan" /* Perlengkapan */, price: 89e3, oldPrice: 105e3, rating: 4.8, reviews: 2710, art: { type: "litter", palette: "honey" }, tint: "#F6ECE1" },
    { id: "p09", name: "Adult Indoor Chicken 2 kg", category: "makanan" /* Makanan */, price: 168e3, rating: 4.7, reviews: 860, art: { type: "bag", palette: "brown" }, tint: "#F6ECE1" },
    { id: "p10", name: "Tongkat Bulu Interaktif", category: "mainan" /* Mainan */, price: 35e3, oldPrice: 45e3, rating: 4.7, reviews: 1500, art: { type: "wand", palette: "rust" }, tint: "#FFE9D6" },
    { id: "p11", name: "Air Mancur Minum 2 L", category: "perlengkapan" /* Perlengkapan */, price: 219e3, rating: 4.7, reviews: 650, badge: "Baru", art: { type: "fountain", palette: "cream" }, tint: "#FDE5DC" },
    { id: "p12", name: "Bola Benang Wol Isi 3", category: "mainan" /* Mainan */, price: 15e3, rating: 4.5, reviews: 410, art: { type: "yarn", palette: "orange" }, tint: "#FFF1CC" }
  ];
  var MOCK_ORDERS = [
    {
      id: "MP-261106",
      email: "demo@meowplace.id",
      status: "dikemas" /* Dikemas */,
      courier: "Kurir MeowPlace (Same Day)",
      resi: null,
      eta: "Jumat, 7 Nov 2026",
      address: "Jl. Me**** No. 12, Jakarta Timur",
      items: [{ productId: "p01", qty: 1 }, { productId: "p08", qty: 2 }],
      timeline: { dibuat: "2026-11-06T09:12:00+07:00", dibayar: "2026-11-06T09:15:00+07:00", dikemas: "2026-11-06T10:40:00+07:00" }
    },
    {
      id: "MP-261104",
      email: "demo@meowplace.id",
      status: "dikirim" /* Dikirim */,
      courier: "JNE REG",
      resi: "JNE0012345678",
      eta: "Sabtu, 8 Nov 2026",
      address: "Jl. Ce***** Raya No. 4, Bandung",
      items: [{ productId: "p06", qty: 1 }, { productId: "p03", qty: 2 }],
      timeline: { dibuat: "2026-11-04T19:02:00+07:00", dibayar: "2026-11-04T19:09:00+07:00", dikemas: "2026-11-05T08:30:00+07:00", dikirim: "2026-11-05T16:45:00+07:00" }
    },
    {
      id: "MP-261028",
      email: "demo@meowplace.id",
      status: "sampai" /* Sampai */,
      courier: "SiCepat BEST",
      resi: "SCP0098765432",
      eta: "Diterima 30 Okt 2026",
      address: "Jl. An***** No. 7, Depok",
      items: [{ productId: "p02", qty: 6 }, { productId: "p12", qty: 1 }],
      timeline: { dibuat: "2026-10-28T11:20:00+07:00", dibayar: "2026-10-28T11:22:00+07:00", dikemas: "2026-10-28T14:05:00+07:00", dikirim: "2026-10-29T09:10:00+07:00", sampai: "2026-10-30T13:05:00+07:00" }
    }
  ];

  // src/services/mock/MockOrderService.ts
  var MockOrderService = class {
    constructor(latencyMs = 700) {
      this.latencyMs = latencyMs;
    }
    latencyMs;
    async track(orderId, email) {
      await delay(this.latencyMs);
      const record = this.find(orderId, email);
      if (!record) return { ok: false, error: "not_found" };
      return { ok: true, order: this.toOrder(record) };
    }
    async requestReturn(request) {
      await delay(this.latencyMs + 100);
      const record = this.find(request.orderId, request.email);
      if (!record) return { ok: false, error: "not_found" };
      if (record.status !== "sampai" /* Sampai */) return { ok: false, error: "not_delivered", status: record.status };
      return { ok: true, ticket: `RT-${Math.floor(1e4 + Math.random() * 9e4)}` };
    }
    /**
     * Cocokkan nomor pesanan + email. "Tidak ada" dan "email salah" sengaja
     * menghasilkan hal yang sama agar nomor pesanan valid tidak bisa ditebak.
     */
    find(orderId, email) {
      const id = Order.normalizeId(orderId);
      const mail = email.trim().toLowerCase();
      return MOCK_ORDERS.find((order) => order.id === id && order.email === mail);
    }
    toOrder(record) {
      const lines = record.items.map((item) => {
        const dto = MOCK_PRODUCTS.find((product) => product.id === item.productId);
        if (!dto) throw new Error(`Produk ${item.productId} tidak ditemukan.`);
        return new OrderLine(ProductFactory.create(dto), item.qty);
      });
      return new Order(record, lines);
    }
  };

  // src/services/mock/MockProductRepository.ts
  var MockProductRepository = class {
    constructor(latencyMs = 450) {
      this.latencyMs = latencyMs;
    }
    latencyMs;
    async getAll() {
      await delay(this.latencyMs);
      return ProductFactory.createMany(MOCK_PRODUCTS);
    }
  };

  // src/services/storage/LocalStorageService.ts
  var LocalStorageService = class {
    constructor(prefix = "meow:") {
      this.prefix = prefix;
    }
    prefix;
    static isAvailable() {
      try {
        const key = "__meow_test__";
        localStorage.setItem(key, "1");
        localStorage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    }
    read(key, fallback) {
      try {
        const raw = localStorage.getItem(this.prefix + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    }
    write(key, value) {
      try {
        localStorage.setItem(this.prefix + key, JSON.stringify(value));
      } catch {
      }
    }
  };

  // src/services/storage/MemoryStorage.ts
  var MemoryStorage = class {
    data = /* @__PURE__ */ new Map();
    read(key, fallback) {
      const raw = this.data.get(key);
      return raw === void 0 ? fallback : JSON.parse(raw);
    }
    write(key, value) {
      this.data.set(key, JSON.stringify(value));
    }
  };

  // src/services/storage/StorageFactory.ts
  var StorageFactory = class {
    constructor() {
    }
    static create() {
      return LocalStorageService.isAvailable() ? new LocalStorageService() : new MemoryStorage();
    }
  };

  // src/main.ts
  function createServices() {
    const storage = StorageFactory.create();
    if (config.useApi) {
      const http = new HttpClient(config.apiBaseUrl);
      return {
        products: new ApiProductRepository(http),
        orders: new ApiOrderService(http),
        newsletter: new ApiNewsletterService(http),
        storage
      };
    }
    return {
      products: new MockProductRepository(),
      orders: new MockOrderService(),
      newsletter: new MockNewsletterService(),
      storage
    };
  }
  function createPage(app2) {
    switch (document.body.dataset.page) {
      case "bantuan":
        return new HelpPage(app2);
      default:
        return new HomePage(app2);
    }
  }
  var app = new App(createServices());
  app.start(createPage(app));
})();
//# sourceMappingURL=app.js.map
