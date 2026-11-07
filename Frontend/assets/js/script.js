/**
 * MeowPlace — script.js
 *
 * Isi:
 *  1. Utilitas
 *  2. Toast
 *  3. Layer (menu mobile, pencarian, keranjang) + overlay
 *  4. Navigasi: scrollspy + indikator
 *  5. Mesin animasi gulir (progress, header pintar, parallax, galeri, CTA, jejak kaki)
 *  6. Marquee yang mengikuti kecepatan gulir
 *  7. Reveal saat gulir & angka berjalan
 *  8. Produk: skeleton, filter, muat lebih banyak
 *  9. Favorit & keranjang
 * 10. Pencarian
 * 11. Newsletter
 * 12. Init
 */

'use strict';

(() => {

  /* ==========================================================
   * 1. UTILITAS
   * ======================================================== */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => motionQuery.matches;
  const desktopQuery = window.matchMedia('(min-width: 992px)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
  const formatRp = (n) => rupiah.format(n).replace(/\s/g, '');

  const compact = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace('.', ',').replace(',0', '')}rb` : String(n));

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* mode privat: abaikan */ }
    },
  };

  const restart = (el, className) => {
    el.classList.remove(className);
    void el.offsetWidth; // paksa reflow supaya animasi bisa diputar ulang
    el.classList.add(className);
  };

  const scrollBehavior = () => (reduced() ? 'auto' : 'smooth');


  /* ==========================================================
   * 2. TOAST
   * ======================================================== */

  const toastStack = $('[data-toasts]');

  function toast(message, { type = 'info', action, onAction, duration = 2800 } = {}) {
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.setAttribute('role', 'status');

    const icon = type === 'success' ? 'i-check' : type === 'error' ? 'i-alert' : 'i-paw';
    el.innerHTML = `
      <span class="toast-icon"><svg class="icon ${icon === 'i-paw' ? 'icon--fill' : ''}"><use href="#${icon}"/></svg></span>
      <span class="toast-msg"></span>`;
    $('.toast-msg', el).textContent = message;

    let timer;
    const dismiss = () => {
      if (el.classList.contains('is-leaving')) return;
      clearTimeout(timer);
      el.classList.add('is-leaving');
      el.addEventListener('animationend', () => el.remove(), { once: true });
      setTimeout(() => el.remove(), 400);
    };

    if (action) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'toast-action';
      btn.textContent = action;
      btn.addEventListener('click', () => { onAction?.(); dismiss(); });
      el.append(btn);
    }

    toastStack.append(el);
    while (toastStack.children.length > 2) toastStack.firstElementChild.remove();

    timer = setTimeout(dismiss, duration);
    el.addEventListener('pointerenter', () => clearTimeout(timer));
    el.addEventListener('pointerleave', () => { timer = setTimeout(dismiss, 1200); });
  }


  /* ==========================================================
   * 3. LAYER + OVERLAY
   * ======================================================== */

  const header = $('[data-header]');
  const overlay = $('[data-overlay]');
  const navbar = $('[data-navbar]');
  const navOpenBtn = $('[data-nav-open]');
  const searchPanel = $('[data-search]');
  const cartDrawer = $('[data-cart]');

  let activeLayer = null;

  function showOverlay() {
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('is-visible'));
  }

  function hideOverlay() {
    overlay.classList.remove('is-visible');
    setTimeout(() => { if (!activeLayer) overlay.hidden = true; }, 300);
  }

  function openLayer(name, el, focusEl) {
    if (activeLayer) closeLayer({ restoreFocus: false });

    activeLayer = { name, el, returnFocus: document.activeElement };
    el.inert = false;
    el.classList.add('is-open');
    document.body.classList.add('is-locked');
    header.classList.remove('is-hidden');
    showOverlay();

    if (name === 'nav') {
      header.classList.add('is-nav-open');
      navOpenBtn.setAttribute('aria-expanded', 'true');
    }

    setTimeout(() => focusEl?.focus({ preventScroll: true }), 80);
  }

  function closeLayer({ restoreFocus = true } = {}) {
    if (!activeLayer) return;
    const { name, el, returnFocus } = activeLayer;

    el.classList.remove('is-open');
    if (name !== 'nav') el.inert = true;
    activeLayer = null;
    document.body.classList.remove('is-locked');
    hideOverlay();

    if (name === 'nav') {
      header.classList.remove('is-nav-open');
      navOpenBtn.setAttribute('aria-expanded', 'false');
    }

    if (restoreFocus && returnFocus instanceof HTMLElement) {
      returnFocus.focus({ preventScroll: true });
    }
  }

  overlay.addEventListener('click', () => closeLayer());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeLayer) {
      closeLayer();
      return;
    }

    // jebak fokus di dalam layer yang terbuka
    if (e.key === 'Tab' && activeLayer) {
      const focusables = $$('a[href], button:not([disabled]), input:not([disabled])', activeLayer.el)
        .filter((el) => el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // menu mobile
  navOpenBtn.addEventListener('click', () => openLayer('nav', navbar, $('[data-nav-close]')));
  $('[data-nav-close]').addEventListener('click', () => closeLayer());
  $$('[data-nav-link]').forEach((link) => link.addEventListener('click', () => {
    if (activeLayer?.name === 'nav') closeLayer({ restoreFocus: false });
  }));

  desktopQuery.addEventListener('change', () => {
    if (activeLayer?.name === 'nav') closeLayer({ restoreFocus: false });
    placeIndicator(activeLink());
  });


  /* ==========================================================
   * 4. NAVIGASI: SCROLLSPY + INDIKATOR
   * ======================================================== */

  const navList = $('[data-nav-list]');
  const navLinks = $$('.navbar-link', navList);
  const navIndicator = $('[data-nav-indicator]');
  let activeId = 'beranda';

  const activeLink = () => navLinks.find((l) => l.getAttribute('href') === `#${activeId}`);

  function placeIndicator(link) {
    if (!navIndicator) return;
    if (!link || !desktopQuery.matches) {
      navIndicator.style.setProperty('--o', 0);
      return;
    }
    navIndicator.style.setProperty('--x', `${link.offsetLeft}px`);
    navIndicator.style.setProperty('--w', `${link.offsetWidth}px`);
    navIndicator.style.setProperty('--o', 1);
  }

  function setActive(id) {
    activeId = id;
    const current = activeLink();
    navLinks.forEach((l) => {
      const on = l === current;
      l.classList.toggle('is-active', on);
      if (on) l.setAttribute('aria-current', 'true');
      else l.removeAttribute('aria-current');
    });
    placeIndicator(current);
  }

  // indikator ikut kursor saat hover, kembali ke link aktif saat kursor keluar
  navLinks.forEach((l) => l.addEventListener('pointerenter', () => placeIndicator(l)));
  navList.addEventListener('pointerleave', () => placeIndicator(activeLink()));

  const navIds = new Set(navLinks.map((l) => l.getAttribute('href').slice(1)));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && navIds.has(entry.target.id)) setActive(entry.target.id);
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  $$('[data-section][id]').forEach((s) => spy.observe(s));


  /* ==========================================================
   * 5. MESIN ANIMASI GULIR
   * ======================================================== */

  const progressBar = $('[data-progress-bar]');
  const backTop = $('[data-back-top]');
  const backTopRing = $('[data-back-top-ring]');

  const hero = $('.hero');
  const heroLayers = $$('[data-parallax]').map((el) => ({ el, speed: parseFloat(el.dataset.parallax) || 0 }));
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, raf: 0 };

  const offerImgs = $$('[data-parallax-img]');

  const gallery = $('[data-gallery]');
  const galleryRows = $$('[data-gallery-row]');
  const galleryShift = [0, 0];

  const ctaSection = $('[data-cta]');
  const ctaCard = $('[data-cta-card]');
  const stickerRing = $('[data-sticker] > svg');

  const trail = $('[data-paw-trail]');
  let paws = [];
  let pawsOn = 0;

  let vh = window.innerHeight;
  let docMax = 1;
  let lastY = window.scrollY;
  let dirAccum = 0;
  let ticking = false;
  let holdHeaderUntil = 0;

  function measure() {
    vh = window.innerHeight;
    docMax = Math.max(1, document.documentElement.scrollHeight - vh);
    galleryRows.forEach((row, i) => {
      galleryShift[i] = Math.max(0, row.offsetWidth - window.innerWidth);
    });
  }

  /* hero: parallax gulir + sedikit ikut kursor */
  function applyHero(y) {
    if (y > vh * 1.3) return;
    // layar kecil: visual lebih kecil, jadi parallax diperhalus agar kartu tidak saling tumpuk
    const strength = desktopQuery.matches ? 1 : 0.35;
    for (const { el, speed } of heroLayers) {
      const depth = speed * 140;
      const tx = pointer.x * depth;
      const ty = -y * speed * strength + pointer.y * depth;
      el.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
    }
  }

  function pointerLoop() {
    pointer.x = lerp(pointer.x, pointer.tx, 0.08);
    pointer.y = lerp(pointer.y, pointer.ty, 0.08);
    applyHero(window.scrollY);
    const settled = Math.abs(pointer.x - pointer.tx) < 0.001 && Math.abs(pointer.y - pointer.ty) < 0.001;
    pointer.raf = settled ? 0 : requestAnimationFrame(pointerLoop);
  }

  if (finePointer && hero) {
    hero.addEventListener('pointermove', (e) => {
      if (reduced()) return;
      const r = hero.getBoundingClientRect();
      pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!pointer.raf) pointer.raf = requestAnimationFrame(pointerLoop);
    });
    hero.addEventListener('pointerleave', () => {
      pointer.tx = 0;
      pointer.ty = 0;
      if (!pointer.raf) pointer.raf = requestAnimationFrame(pointerLoop);
    });
  }

  /* promo: foto bergeser di dalam bingkainya */
  function updateOffers() {
    for (const img of offerImgs) {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
      img.style.setProperty('--py', `${(p * r.height * 0.06).toFixed(1)}px`);
    }
  }

  /* testimoni: dua baris bergerak berlawanan arah mengikuti gulir */
  function updateGallery() {
    if (!gallery) return;
    const r = gallery.getBoundingClientRect();
    if (r.bottom < -100 || r.top > vh + 100) return;
    const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
    if (galleryRows[0]) galleryRows[0].style.transform = `translate3d(${(-p * galleryShift[0]).toFixed(1)}px, 0, 0)`;
    if (galleryRows[1]) galleryRows[1].style.transform = `translate3d(${(-(1 - p) * galleryShift[1]).toFixed(1)}px, 0, 0)`;
  }

  /* CTA: kartu "mengembang" saat masuk layar, stiker berputar */
  function updateCta(y) {
    if (!ctaSection) return;
    const r = ctaSection.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    const p = clamp((vh - r.top) / (vh * 0.7), 0, 1);
    const e = 1 - Math.pow(1 - p, 3);
    ctaCard.style.setProperty('--cta-scale', (0.9 + 0.1 * e).toFixed(4));
    ctaCard.style.setProperty('--cta-radius', `${(64 - 32 * e).toFixed(1)}px`);
    if (stickerRing) stickerRing.style.transform = `rotate(${((y * 0.12) % 360).toFixed(2)}deg)`;
  }

  /* jejak kaki kucing yang muncul satu per satu */
  function buildTrail() {
    if (!trail) return;
    const w = trail.offsetWidth;
    const h = trail.offsetHeight;
    const pad = parseFloat(getComputedStyle(trail.parentElement).paddingBottom) || 64;
    const count = clamp(Math.round(w / 84), 6, 18);
    const baseY = h - pad / 2 - 13;

    trail.innerHTML = '';
    paws = [];
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const side = i % 2 ? 1 : -1;
      const x = w * 0.04 + t * w * 0.9;
      const y = baseY - Math.sin(t * Math.PI) * pad * 0.18 + side * 9;
      const paw = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      paw.classList.add('paw');
      paw.innerHTML = '<use href="#i-paw"/>';
      paw.style.left = `${x.toFixed(1)}px`;
      paw.style.top = `${y.toFixed(1)}px`;
      paw.style.transform = `rotate(${90 + side * 8}deg)`;
      trail.append(paw);
      paws.push(paw);
    }
    pawsOn = 0;
    if (reduced()) paws.forEach((p) => p.classList.add('is-on'));
  }

  function updateTrail() {
    if (!paws.length) return;
    const r = trail.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    const p = clamp((vh * 0.95 - r.top) / r.height, 0, 1);
    const target = Math.round(p * paws.length);
    if (target === pawsOn) return;
    paws.forEach((paw, i) => paw.classList.toggle('is-on', i < target));
    pawsOn = target;
  }

  function update() {
    ticking = false;
    const y = window.scrollY;
    const dy = y - lastY;
    const p = clamp(y / docMax, 0, 1);

    progressBar.style.transform = `scaleX(${p.toFixed(4)})`;
    backTopRing.style.setProperty('--p', (1 - p).toFixed(4));
    backTop.classList.toggle('is-visible', y > vh * 0.8);

    // header pintar: sembunyi saat gulir ke bawah, muncul saat gulir ke atas
    header.classList.toggle('is-scrolled', y > 24);
    dirAccum = Math.sign(dy) === Math.sign(dirAccum) ? dirAccum + dy : dy;
    if (!activeLayer && performance.now() > holdHeaderUntil) {
      if (y < vh * 0.5 || dirAccum < -48) header.classList.remove('is-hidden');
      else if (dirAccum > 48) header.classList.add('is-hidden');
    }

    marqueeImpulse(dy);

    if (!reduced()) {
      applyHero(y);
      updateOffers();
      updateGallery();
      updateCta(y);
    }
    updateTrail();

    lastY = y;
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));


  /* ==========================================================
   * 6. MARQUEE (arah & kecepatan mengikuti gulir)
   * ======================================================== */

  const marquee = $('[data-marquee]');
  const marqueeTrack = $('[data-marquee-track]');
  const mq = { groupW: 0, offset: 0, boost: 0, dir: 1, visible: false, last: 0, raf: 0 };
  const MARQUEE_BASE = 42; // px per detik

  function setupMarquee() {
    if (!marqueeTrack || reduced()) return;
    const group = marqueeTrack.firstElementChild;
    $$('.marquee-group[aria-hidden]', marqueeTrack).forEach((g) => g.remove());
    mq.groupW = group.offsetWidth;
    let guard = 0;
    while (marqueeTrack.offsetWidth < window.innerWidth * 1.2 + mq.groupW && guard++ < 10) {
      const copy = group.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      marqueeTrack.append(copy);
    }
  }

  function marqueeImpulse(dy) {
    if (Math.abs(dy) < 0.5) return;
    mq.dir = dy > 0 ? 1 : -1;
    mq.boost = Math.min(900, mq.boost + Math.abs(dy) * 9);
  }

  function marqueeLoop(now) {
    const dt = mq.last ? Math.min(0.05, (now - mq.last) / 1000) : 0;
    mq.last = now;
    mq.boost *= Math.pow(0.03, dt); // meluruh ke ~3% per detik
    mq.offset += mq.dir * (MARQUEE_BASE + mq.boost) * dt;
    if (mq.groupW) {
      const x = -(((mq.offset % mq.groupW) + mq.groupW) % mq.groupW);
      marqueeTrack.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    }
    mq.raf = mq.visible ? requestAnimationFrame(marqueeLoop) : 0;
  }

  if (marquee) {
    new IntersectionObserver(([entry]) => {
      mq.visible = entry.isIntersecting && !reduced();
      if (mq.visible && !mq.raf) {
        mq.last = 0;
        mq.raf = requestAnimationFrame(marqueeLoop);
      }
    }).observe(marquee);
  }


  /* ==========================================================
   * 7. REVEAL SAAT GULIR & ANGKA BERJALAN
   * ======================================================== */

  function initReveal() {
    // jeda berjenjang 40ms per item (maks. 300ms)
    $$('[data-stagger]').forEach((group) => {
      $$('[data-reveal]', group).forEach((el, i) => el.style.setProperty('--d', `${Math.min(i * 40, 300)}ms`));
    });

    const items = $$('[data-reveal]');
    if (reduced() || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        io.unobserve(el);
        el.classList.add('is-in');
        // setelah selesai, lepas atribut agar transisi hover milik elemen tidak tertimpa
        const delay = parseFloat(el.style.getPropertyValue('--d')) || 0;
        setTimeout(() => {
          el.removeAttribute('data-reveal');
          el.style.removeProperty('--d');
        }, 1200 + delay);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    items.forEach((el) => io.observe(el));
  }

  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const fmt = new Intl.NumberFormat('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    if (reduced()) {
      el.textContent = fmt.format(target);
      return;
    }
    const duration = 1600;
    const start = performance.now();
    const tick = (now) => {
      const t = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = fmt.format(target * eased);
      if (t < 1) requestAnimationFrame(tick);
    };
    el.textContent = fmt.format(0);
    requestAnimationFrame(tick);
  }

  function initCounters() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        setTimeout(() => countUp(entry.target), 500);
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach((el) => io.observe(el));
  }


  /* ==========================================================
   * 8. PRODUK
   * ======================================================== */

  const grid = $('[data-product-grid]');
  const tabsWrap = $('[data-filter-tabs]');
  const tabs = tabsWrap ? $$('[data-filter]', tabsWrap) : [];
  const filterIndicator = $('[data-filter-indicator]');
  const loadMoreBtn = $('[data-load-more]');
  const loadMoreCount = $('[data-load-more-count]');
  const PAGE_SIZE = 8;

  const state = {
    products: [],
    loaded: false,
    loading: null,
    filter: 'semua',
    visible: PAGE_SIZE,
  };

  const wishlist = new Set(store.get('meow:wishlist', []));
  const cart = new Map(store.get('meow:cart', []));

  const allProducts = () => (state.loaded ? state.products : MeowAPI.getProductsSync());
  const findProduct = (id) => allProducts().find((p) => p.id === id);

  function filtered() {
    if (state.filter === 'semua') return state.products;
    if (state.filter === 'favorit') return state.products.filter((p) => wishlist.has(p.id));
    return state.products.filter((p) => p.category === state.filter);
  }

  function badgeHTML(p) {
    if (p.oldPrice) return `<span class="badge">-${Math.round((1 - p.price / p.oldPrice) * 100)}%</span>`;
    if (p.badge) return `<span class="badge ${p.badge === 'Baru' ? 'badge--new' : 'badge--hot'}">${esc(p.badge)}</span>`;
    return '';
  }

  function productCardHTML(p, i) {
    const wished = wishlist.has(p.id);
    const name = esc(p.name);
    return `
      <article class="product-card is-entering" data-id="${p.id}" style="--d:${Math.min(i * 40, 300)}ms">
        <div class="product-media" style="--tint:${p.tint}">
          ${badgeHTML(p)}
          <button class="wish-btn" type="button" data-wish="${p.id}" aria-pressed="${wished}"
            aria-label="${wished ? 'Hapus dari' : 'Simpan ke'} favorit: ${name}">
            <svg class="icon"><use href="#i-heart"/></svg>
          </button>
          <div class="product-art">${MeowArt.render(p.art.type, p.art.palette)}</div>
        </div>
        <div class="product-body">
          <p class="product-cat">${MeowAPI.CATEGORIES[p.category] || ''}</p>
          <h3 class="product-name">${name}</h3>
          <p class="product-rating">
            <svg class="icon icon--fill"><use href="#i-star"/></svg>
            ${p.rating.toLocaleString('id-ID')} <span>(${compact(p.reviews)} ulasan)</span>
          </p>
          <div class="product-foot">
            <p class="price"><strong>${formatRp(p.price)}</strong>${p.oldPrice ? `<s>${formatRp(p.oldPrice)}</s>` : ''}</p>
            <button class="add-btn" type="button" data-add="${p.id}" aria-label="Tambah ke keranjang: ${name}">
              <svg class="icon"><use href="#i-bag-plus"/></svg>
            </button>
          </div>
        </div>
      </article>`;
  }

  const skeletonHTML = `
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

  function emptyStateHTML() {
    if (state.filter === 'favorit') {
      return `
        <div class="grid-state">
          <div class="grid-state-art">${MeowArt.render('bed', 'cream')}</div>
          <h3>Belum ada favorit</h3>
          <p>Ketuk ikon hati di produk mana pun untuk menyimpannya di sini.</p>
          <button class="btn btn-ghost btn-sm" type="button" data-go-all>Lihat semua produk</button>
        </div>`;
    }
    return `
      <div class="grid-state">
        <div class="grid-state-art">${MeowArt.render('yarn', 'orange')}</div>
        <h3>Stok sedang diisi ulang</h3>
        <p>Kategori ini belum punya produk. Cek lagi nanti, ya.</p>
        <button class="btn btn-ghost btn-sm" type="button" data-go-all>Lihat semua produk</button>
      </div>`;
  }

  const errorStateHTML = `
    <div class="grid-state" role="alert">
      <div class="grid-state-art">${MeowArt.render('mouse', 'brown')}</div>
      <h3>Gagal memuat produk</h3>
      <p>Sepertinya koneksi sedang bermasalah. Coba muat ulang.</p>
      <button class="btn btn-primary btn-sm" type="button" data-retry>Coba lagi</button>
    </div>`;

  function updateLoadMore(list) {
    const remaining = list.length - Math.min(list.length, state.visible);
    loadMoreBtn.hidden = remaining <= 0;
    loadMoreCount.textContent = remaining > 0 ? `(${remaining} lagi)` : '';
  }

  function renderGrid({ animate = true } = {}) {
    const list = filtered();
    grid.innerHTML = list.length
      ? list.slice(0, state.visible).map(productCardHTML).join('')
      : emptyStateHTML();
    if (!animate) $$('.product-card', grid).forEach((c) => c.classList.remove('is-entering'));
    grid.setAttribute('aria-busy', 'false');
    updateLoadMore(list);
  }

  grid?.addEventListener('animationend', (e) => {
    if (e.target.classList?.contains('is-entering')) e.target.classList.remove('is-entering');
    if (e.target.classList?.contains('is-flash')) e.target.classList.remove('is-flash');
  });

  function loadProducts() {
    if (!grid || state.loaded) return Promise.resolve();
    if (state.loading) return state.loading;

    grid.innerHTML = skeletonHTML.repeat(PAGE_SIZE);
    grid.setAttribute('aria-busy', 'true');

    state.loading = MeowAPI.getProducts()
      .then((products) => {
        state.products = products;
        state.loaded = true;
        renderGrid();
      })
      .catch(() => {
        grid.innerHTML = errorStateHTML;
        grid.setAttribute('aria-busy', 'false');
      })
      .finally(() => { state.loading = null; });

    return state.loading;
  }

  function syncTabs({ scrollTab = true } = {}) {
    let current = null;
    tabs.forEach((t) => {
      const on = t.dataset.filter === state.filter;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on) current = t;
    });
    if (!current) return;
    filterIndicator.style.setProperty('--x', `${current.offsetLeft}px`);
    filterIndicator.style.setProperty('--w', `${current.offsetWidth}px`);

    // pastikan tab aktif terlihat bila daftar tab bisa digeser (mobile)
    if (scrollTab && tabsWrap.scrollWidth > tabsWrap.clientWidth) {
      const left = current.offsetLeft - (tabsWrap.clientWidth - current.offsetWidth) / 2;
      tabsWrap.scrollTo({ left, behavior: scrollBehavior() });
    }
  }

  function setFilter(filter) {
    if (filter === state.filter && state.loaded) return;
    state.filter = filter;
    state.visible = PAGE_SIZE;
    syncTabs();
    if (!state.loaded) return; // akan dirender saat data datang

    if (reduced()) {
      renderGrid();
      return;
    }
    grid.classList.add('is-swapping');
    setTimeout(() => {
      renderGrid();
      grid.classList.remove('is-swapping');
    }, 180);
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => setFilter(tab.dataset.filter));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      next.focus();
      setFilter(next.dataset.filter);
    });
  });

  // tautan kategori di mana pun (kartu kategori, promo, footer)
  $$('[data-filter-link]').forEach((link) => link.addEventListener('click', () => {
    if (!grid) return; // di halaman lain, biarkan tautan pindah ke index.html
    setFilter(link.dataset.filterLink);
    loadProducts();
  }));

  loadMoreBtn?.addEventListener('click', () => {
    const list = filtered();
    const start = state.visible;
    state.visible += PAGE_SIZE;
    const html = list.slice(start, state.visible).map(productCardHTML).join('');
    grid.insertAdjacentHTML('beforeend', html);
    updateLoadMore(list);
  });

  grid?.addEventListener('click', (e) => {
    const wishBtn = e.target.closest('[data-wish]');
    const addBtn = e.target.closest('[data-add]');
    if (wishBtn) toggleWish(wishBtn.dataset.wish, wishBtn);
    else if (addBtn) addToCart(addBtn.dataset.add, addBtn);
    else if (e.target.closest('[data-retry]')) loadProducts();
    else if (e.target.closest('[data-go-all]')) setFilter('semua');
  });

  // muat produk saat section mulai terlihat (simulasi lazy-load dari API)
  if (grid) {
    new IntersectionObserver(([entry], obs) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      loadProducts();
    }, { rootMargin: '0px 0px -10% 0px' }).observe(grid);
  }

  async function goToProduct(id) {
    if (!grid) {
      location.href = `index.html?produk=${encodeURIComponent(id)}`;
      return;
    }
    await loadProducts();
    let index = filtered().findIndex((p) => p.id === id);
    if (index === -1) {
      state.filter = 'semua';
      syncTabs();
      index = state.products.findIndex((p) => p.id === id);
    }
    if (index === -1) return;
    state.visible = Math.max(PAGE_SIZE, Math.ceil((index + 1) / PAGE_SIZE) * PAGE_SIZE);
    renderGrid({ animate: false });

    const card = $(`[data-id="${id}"]`, grid);
    if (!card) return;
    card.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
    restart(card, 'is-flash');
  }


  /* ==========================================================
   * 9. FAVORIT & KERANJANG
   * ======================================================== */

  const wishCount = $('[data-wish-count]');
  const cartCount = $('[data-cart-count]');
  const cartBtn = $('[data-cart-open]');
  const cartList = $('[data-cart-list]');
  const cartEmpty = $('[data-cart-empty]');
  const cartFoot = $('[data-cart-foot]');
  const cartSubtotal = $('[data-cart-subtotal]');
  const cartTotalQty = $('[data-cart-total-qty]');
  const ship = $('[data-ship]');
  const shipText = $('[data-ship-text]');
  const shipBar = $('[data-ship-bar]');
  const FREE_SHIPPING = 150000;

  function updateWishCount(bump = false) {
    wishCount.textContent = wishlist.size;
    wishCount.hidden = wishlist.size === 0;
    if (bump) restart(wishCount, 'is-bump');
  }

  function showFavorites() {
    closeLayer({ restoreFocus: false });
    if (!grid) {
      location.href = 'index.html?kategori=favorit#belanja';
      return;
    }
    setFilter('favorit');
    loadProducts();
    $('#belanja').scrollIntoView({ behavior: scrollBehavior() });
  }

  function toggleWish(id, btn) {
    const p = findProduct(id);
    if (!p) return;
    const on = !wishlist.has(id);
    if (on) wishlist.add(id);
    else wishlist.delete(id);
    store.set('meow:wishlist', [...wishlist]);

    if (btn) {
      btn.setAttribute('aria-pressed', String(on));
      btn.setAttribute('aria-label', `${on ? 'Hapus dari' : 'Simpan ke'} favorit: ${p.name}`);
      restart(btn, 'is-pop');
    }
    updateWishCount(true);

    if (on) toast(`${p.name} disimpan ke favorit`, { action: 'Lihat', onAction: showFavorites });
    else if (state.filter === 'favorit') setTimeout(() => renderGrid({ animate: false }), 300);
  }

  $('[data-wish-open]').addEventListener('click', showFavorites);

  function saveCart() {
    store.set('meow:cart', [...cart.entries()]);
  }

  function cartItemHTML(p, qty) {
    const name = esc(p.name);
    return `
      <div class="cart-thumb" style="--tint:${p.tint}">${MeowArt.render(p.art.type, p.art.palette)}</div>
      <div>
        <p class="cart-name">${name}</p>
        <p class="cart-unit">${formatRp(p.price)}</p>
      </div>
      <div class="cart-side">
        <p class="cart-line-total" data-line-total>${formatRp(p.price * qty)}</p>
        <div class="qty" role="group" aria-label="Jumlah ${name}">
          <button type="button" data-qty="-1" aria-label="Kurangi jumlah ${name}"><svg class="icon"><use href="#i-minus"/></svg></button>
          <span class="qty-value" data-qty-value>${qty}</span>
          <button type="button" data-qty="1" aria-label="Tambah jumlah ${name}"><svg class="icon"><use href="#i-plus"/></svg></button>
        </div>
        <button class="cart-remove" type="button" data-remove aria-label="Hapus ${name} dari keranjang">
          <svg class="icon"><use href="#i-trash"/></svg> Hapus
        </button>
      </div>`;
  }

  function updateCartSummary() {
    let qtyTotal = 0;
    let subtotal = 0;
    cart.forEach((qty, id) => {
      const p = findProduct(id);
      if (!p) return;
      qtyTotal += qty;
      subtotal += qty * p.price;
    });

    cartCount.textContent = qtyTotal;
    cartCount.hidden = qtyTotal === 0;
    cartTotalQty.textContent = qtyTotal ? `(${qtyTotal})` : '';
    cartSubtotal.textContent = formatRp(subtotal);

    const left = Math.max(0, FREE_SHIPPING - subtotal);
    shipText.innerHTML = left
      ? `Tambah <strong>${formatRp(left)}</strong> lagi untuk gratis ongkir`
      : 'Yeay! Pesananmu dapat <strong>gratis ongkir</strong>';
    shipBar.style.setProperty('--p', Math.min(1, subtotal / FREE_SHIPPING).toFixed(3));
    ship.classList.toggle('is-free', left === 0);

    cartBtn.setAttribute('aria-label', qtyTotal ? `Buka keranjang, ${qtyTotal} barang` : 'Buka keranjang');
  }

  function syncCartList() {
    // hapus item yang sudah tidak ada (kecuali yang sedang dianimasikan keluar)
    $$('.cart-item', cartList).forEach((li) => {
      if (!cart.has(li.dataset.id) && !li.classList.contains('is-removing')) li.remove();
    });

    cart.forEach((qty, id) => {
      const p = findProduct(id);
      if (!p) return;
      let li = $(`.cart-item[data-id="${id}"]`, cartList);
      if (!li) {
        li = document.createElement('li');
        li.className = 'cart-item';
        li.dataset.id = id;
        li.innerHTML = cartItemHTML(p, qty);
        cartList.append(li);
      } else {
        $('[data-qty-value]', li).textContent = qty;
        $('[data-line-total]', li).textContent = formatRp(p.price * qty);
      }
    });

    const isEmpty = cart.size === 0;
    const animatingOut = !!$('.is-removing', cartList);
    cartList.hidden = isEmpty && !animatingOut;
    cartEmpty.classList.toggle('is-visible', isEmpty && !animatingOut);
    cartFoot.hidden = isEmpty;
    ship.hidden = isEmpty;
  }

  function renderCart() {
    updateCartSummary();
    syncCartList();
  }

  function removeFromCart(id) {
    cart.delete(id);
    saveCart();
    updateCartSummary();
    const li = $(`.cart-item[data-id="${id}"]`, cartList);
    if (!li || reduced()) {
      li?.remove();
      syncCartList();
      return;
    }
    li.classList.add('is-removing');
    li.addEventListener('animationend', () => {
      li.remove();
      syncCartList();
    }, { once: true });
  }

  function flyToCart(fromEl, p) {
    if (reduced()) {
      restart(cartCount, 'is-bump');
      return;
    }
    // pastikan header terlihat; hitung posisi tujuan tanpa geseran header
    header.classList.remove('is-hidden');
    holdHeaderUntil = performance.now() + 1400;

    const a = fromEl.getBoundingClientRect();
    const b = cartBtn.getBoundingClientRect();
    const headerOffset = header.getBoundingClientRect().top;
    const x0 = a.left + a.width / 2 - 22;
    const y0 = a.top + a.height / 2 - 22;
    const x1 = b.left + b.width / 2 - 22;
    const y1 = b.top - headerOffset + b.height / 2 - 22;
    const xm = (x0 + x1) / 2;
    const ym = Math.min(y0, y1) - 120;

    const dot = document.createElement('div');
    dot.className = 'fly-dot';
    dot.style.left = '0px';
    dot.style.top = '0px';
    dot.innerHTML = MeowArt.render(p.art.type, p.art.palette);
    document.body.append(dot);

    const anim = dot.animate([
      { transform: `translate(${x0}px, ${y0}px) scale(.6)`, opacity: 0 },
      { transform: `translate(${x0}px, ${y0 - 24}px) scale(1)`, opacity: 1, offset: 0.15 },
      { transform: `translate(${xm}px, ${ym}px) scale(.85)`, offset: 0.55 },
      { transform: `translate(${x1}px, ${y1}px) scale(.3)`, opacity: 0.5 },
    ], { duration: 820, easing: 'cubic-bezier(.45, 0, .25, 1)' });

    anim.onfinish = () => {
      dot.remove();
      restart(cartCount, 'is-bump');
    };
  }

  function addToCart(id, btn) {
    const p = findProduct(id);
    if (!p) return;
    cart.set(id, (cart.get(id) || 0) + 1);
    saveCart();
    renderCart();

    if (btn) {
      btn.classList.add('is-added');
      btn.innerHTML = '<svg class="icon"><use href="#i-check"/></svg>';
      clearTimeout(btn._resetTimer);
      btn._resetTimer = setTimeout(() => {
        btn.classList.remove('is-added');
        btn.innerHTML = '<svg class="icon"><use href="#i-bag-plus"/></svg>';
      }, 1400);
      flyToCart(btn, p);
    }

    toast(`${p.name} masuk keranjang`, { type: 'success', action: 'Lihat', onAction: openCart });
  }

  cartList.addEventListener('click', (e) => {
    const li = e.target.closest('.cart-item');
    if (!li) return;
    const id = li.dataset.id;
    const qtyBtn = e.target.closest('[data-qty]');
    if (qtyBtn) {
      const next = (cart.get(id) || 0) + Number(qtyBtn.dataset.qty);
      if (next <= 0) {
        removeFromCart(id);
        return;
      }
      cart.set(id, next);
      saveCart();
      renderCart();
    } else if (e.target.closest('[data-remove]')) {
      removeFromCart(id);
    }
  });

  function openCart() {
    renderCart();
    openLayer('cart', cartDrawer, $('[data-cart-close]', cartDrawer));
  }

  cartBtn.addEventListener('click', openCart);
  $$('[data-cart-close]', cartDrawer).forEach((b) => b.addEventListener('click', () => closeLayer({ restoreFocus: false })));

  $('[data-checkout]').addEventListener('click', () => {
    toast('Checkout akan aktif setelah backend terhubung. Sabar ya, meong!', { duration: 3600 });
  });


  /* ==========================================================
   * 10. PENCARIAN
   * ======================================================== */

  const searchInput = $('[data-search-input]');
  const searchBody = $('[data-search-results]');
  const POPULAR = ['Salmon', 'Kasur', 'Pasir', 'Catnip', 'Camilan'];

  function highlight(text, query) {
    const i = text.toLowerCase().indexOf(query);
    if (i === -1) return esc(text);
    return `${esc(text.slice(0, i))}<mark>${esc(text.slice(i, i + query.length))}</mark>${esc(text.slice(i + query.length))}`;
  }

  function renderSearch(raw) {
    const query = raw.trim().toLowerCase();

    if (!query) {
      searchBody.innerHTML = `
        <p class="search-label">Pencarian populer</p>
        <div class="search-chips">
          ${POPULAR.map((w) => `<button type="button" class="chip" data-chip="${w}">${w}</button>`).join('')}
        </div>`;
      return;
    }

    const hits = MeowAPI.getProductsSync().filter((p) =>
      `${p.name} ${MeowAPI.CATEGORIES[p.category]}`.toLowerCase().includes(query)
    ).slice(0, 6);

    if (!hits.length) {
      searchBody.innerHTML = `<p class="search-empty">Belum ada yang cocok dengan “${esc(raw.trim())}”. Coba kata lain, misalnya “tuna”.</p>`;
      return;
    }

    searchBody.innerHTML = `
      <p class="search-label">${hits.length} produk ditemukan</p>
      <div class="search-results">
        ${hits.map((p, i) => `
          <button type="button" class="search-result" data-result="${p.id}" style="animation-delay:${i * 30}ms">
            <span class="search-thumb" style="--tint:${p.tint}">${MeowArt.render(p.art.type, p.art.palette)}</span>
            <span>
              <span class="search-result-name">${highlight(p.name, query)}</span>
              <span class="search-result-meta">${MeowAPI.CATEGORIES[p.category]} · ${formatRp(p.price)}</span>
            </span>
          </button>`).join('')}
      </div>`;
  }

  function openSearch() {
    renderSearch(searchInput.value);
    openLayer('search', searchPanel, searchInput);
  }

  $('[data-search-open]').addEventListener('click', openSearch);
  $('[data-search-close]').addEventListener('click', () => closeLayer());
  searchInput.addEventListener('input', () => renderSearch(searchInput.value));

  $('[data-search-form]').addEventListener('submit', (e) => {
    e.preventDefault();
    $('[data-result]', searchBody)?.click();
  });

  searchBody.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-chip]');
    const result = e.target.closest('[data-result]');
    if (chip) {
      searchInput.value = chip.dataset.chip;
      renderSearch(searchInput.value);
      searchInput.focus();
    } else if (result) {
      closeLayer({ restoreFocus: false });
      goToProduct(result.dataset.result);
    }
  });

  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
    if (e.key === '/' && !activeLayer && !typing) {
      e.preventDefault();
      openSearch();
    }
  });


  /* ==========================================================
   * 11. NEWSLETTER
   * ======================================================== */

  const nlForm = $('[data-newsletter]');
  const nlInput = $('#nl-email');
  const nlBtn = $('[data-newsletter-btn]');
  const nlMsg = $('[data-newsletter-msg]');

  function clearNlError() {
    nlForm.classList.remove('is-error');
    nlInput.removeAttribute('aria-invalid');
    nlMsg.textContent = '';
  }

  nlInput?.addEventListener('input', () => {
    if (nlForm.classList.contains('is-error')) clearNlError();
  });

  nlForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = nlInput.value.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      restart(nlForm, 'is-error');
      nlInput.setAttribute('aria-invalid', 'true');
      nlMsg.textContent = email ? 'Format email belum benar. Contoh: nama@email.com' : 'Email-nya diisi dulu, ya.';
      nlInput.focus();
      return;
    }

    clearNlError();
    nlBtn.disabled = true;
    nlBtn.textContent = 'Mendaftar…';

    try {
      const res = await MeowAPI.subscribeNewsletter(email);
      nlForm.innerHTML = `
        <div class="newsletter-done" style="grid-column: 1 / -1" role="status">
          <svg class="icon"><use href="#i-check"/></svg>
          <p>Berhasil! Pakai kode <code>${esc(res.voucher)}</code> untuk diskon 10% di pesanan pertamamu.</p>
        </div>`;
    } catch {
      nlMsg.textContent = 'Gagal terhubung. Coba lagi sebentar lagi.';
      nlBtn.disabled = false;
      nlBtn.textContent = 'Daftar';
    }
  });


  /* ==========================================================
   * 12. INIT
   * ======================================================== */

  function buildGallerySecondRow() {
    const [row1, row2] = galleryRows;
    if (!row1 || !row2 || row2.children.length) return;
    const items = [...row1.children];
    const half = Math.ceil(items.length / 2);
    [...items.slice(half), ...items.slice(0, half)].forEach((li, i) => {
      const copy = li.cloneNode(true);
      copy.style.setProperty('--r', `${i % 2 ? 1.5 : -1.5}deg`);
      $('img', copy).alt = '';
      row2.append(copy);
    });
  }

  function relayout() {
    measure();
    setupMarquee();
    buildTrail();
    syncTabs({ scrollTab: false });
    placeIndicator(activeLink());
    requestUpdate();
  }

  function init() {
    MeowArt.hydrate();
    const year = $('[data-year]');
    if (year) year.textContent = new Date().getFullYear();

    buildGallerySecondRow();
    setupMarquee();
    measure();
    buildTrail();
    initReveal();
    initCounters();

    updateWishCount();
    renderCart();
    syncTabs({ scrollTab: false });
    setActive(activeId);

    if (grid) {
      grid.id = 'produk-grid';
      tabs.forEach((t) => t.setAttribute('aria-controls', grid.id));

      // tautan dari halaman lain: index.html?kategori=mainan atau index.html?produk=p01
      const params = new URLSearchParams(location.search);
      const kategori = params.get('kategori');
      const produk = params.get('produk');
      if (kategori && tabs.some((t) => t.dataset.filter === kategori)) {
        state.filter = kategori;
        syncTabs({ scrollTab: false });
      }
      if (produk) setTimeout(() => goToProduct(produk), 300);
      if (kategori || produk) history.replaceState(null, '', location.pathname + location.hash);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(relayout, 150);
    });

    // ukuran teks berubah setelah font selesai dimuat
    document.fonts?.ready.then(relayout);
    window.addEventListener('load', relayout);

    update();
  }

  // utilitas yang dipakai ulang oleh skrip halaman lain (mis. bantuan.js)
  window.Meow = { toast, esc, formatRp, reduced, restart, scrollBehavior };

  init();
})();
