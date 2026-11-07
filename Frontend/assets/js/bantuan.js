/**
 * MeowPlace — bantuan.js (Pusat Bantuan)
 *
 * Bergantung pada:
 *  - data.js   -> MeowAPI.trackOrder(), MeowAPI.requestReturn()
 *  - script.js -> window.Meow (toast, esc, formatRp, reduced, ...)
 *
 * Isi:
 *  1. Navigasi topik (scrollspy)
 *  2. Timeline "Cara belanja" yang terisi saat digulir
 *  3. Utilitas formulir
 *  4. Lacak pesanan (tanpa login: nomor pesanan + email)
 *  5. Pengembalian (tanpa login: nomor pesanan + email)
 *  6. FAQ: akordeon + penyaring
 */

'use strict';

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const { toast, esc, formatRp, reduced, scrollBehavior } = window.Meow;

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const ORDER_RE = /^MP-\d{6}$/;
  const DEMO_EMAIL = 'demo@meowplace.id';


  /* ==========================================================
   * 1. NAVIGASI TOPIK (scrollspy)
   * ======================================================== */

  const navList = $('[data-help-nav-list]');
  const navLinks = $$('[data-help-link]');
  const topics = navLinks.map((l) => document.getElementById(l.getAttribute('href').slice(1))).filter(Boolean);

  function setActiveTopic(id) {
    navLinks.forEach((link) => {
      const on = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', on);
      if (on) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');

      // di HP daftar topik bisa digeser: pastikan topik aktif terlihat
      if (on && navList.scrollWidth > navList.clientWidth) {
        const left = link.parentElement.offsetLeft - (navList.clientWidth - link.offsetWidth) / 2;
        navList.scrollTo({ left, behavior: scrollBehavior() });
      }
    });
  }

  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setActiveTopic(entry.target.id);
    });
  }, { rootMargin: '-30% 0px -65% 0px' });

  topics.forEach((section) => spy.observe(section));


  /* ==========================================================
   * 2. TIMELINE "CARA BELANJA"
   * ======================================================== */

  const steps = $('[data-steps]');
  const stepsFill = $('[data-steps-fill]');
  const stepItems = $$('.step', steps);
  let stepsTicking = false;

  function updateSteps() {
    stepsTicking = false;
    const r = steps.getBoundingClientRect();
    const line = stepsFill.parentElement;
    // titik "baca" berada di 60% tinggi layar
    const reader = window.innerHeight * 0.6 - r.top;
    const lineTop = line.offsetTop;
    const p = reduced() ? 1 : clamp((reader - lineTop) / line.offsetHeight, 0, 1);
    stepsFill.style.transform = `scaleY(${p.toFixed(4)})`;

    stepItems.forEach((li) => {
      const center = li.offsetTop + 24 + 12;
      li.classList.toggle('is-done', reduced() || reader >= center);
    });
  }

  if (steps) {
    window.addEventListener('scroll', () => {
      if (stepsTicking) return;
      stepsTicking = true;
      requestAnimationFrame(updateSteps);
    }, { passive: true });
    window.addEventListener('resize', updateSteps);
    updateSteps();
  }


  /* ==========================================================
   * 3. UTILITAS FORMULIR
   * ======================================================== */

  function setFieldError(input, message) {
    const field = input.closest('.field');
    const error = $('.field-error', field);
    field.classList.toggle('is-invalid', Boolean(message));
    if (error) error.textContent = message || '';
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  /** Mengembalikan nomor pesanan yang sudah dirapikan, atau null bila tidak valid. */
  function validateOrder(input) {
    const value = MeowAPI.normalizeOrderId(input.value);
    let message = '';
    if (!input.value.trim()) message = 'Nomor pesanan wajib diisi.';
    else if (!ORDER_RE.test(value)) message = 'Format nomor pesanan: MP-123456.';
    setFieldError(input, message);
    if (message) return null;
    input.value = value;
    return value;
  }

  /** Mengembalikan email, atau null bila tidak valid. */
  function validateEmail(input) {
    const value = input.value.trim();
    let message = '';
    if (!value) message = 'Email wajib diisi.';
    else if (!EMAIL_RE.test(value)) message = 'Format email belum benar. Contoh: nama@email.com';
    setFieldError(input, message);
    return message ? null : value;
  }

  function setLoading(btn, loading, label) {
    const text = $('span:not(.spinner)', btn);
    if (loading) {
      btn.dataset.label = text.textContent;
      btn.classList.add('is-loading');
      btn.disabled = true;
      text.textContent = label;
      btn.insertAdjacentHTML('afterbegin', '<span class="spinner" aria-hidden="true"></span>');
    } else {
      btn.classList.remove('is-loading');
      btn.disabled = false;
      text.textContent = btn.dataset.label || text.textContent;
      $('.spinner', btn)?.remove();
    }
  }

  function showAlert(el, message) {
    el.innerHTML = `<svg class="icon"><use href="#i-alert"/></svg><p>${message}</p>`;
    el.hidden = false;
  }

  // hapus pesan galat begitu pengguna mulai mengetik ulang
  $$('.field input, .field textarea').forEach((input) => {
    input.addEventListener('input', () => {
      if (input.closest('.field').classList.contains('is-invalid')) setFieldError(input, '');
    });
  });

  const dateFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const formatDate = (iso) => dateFmt.format(new Date(iso)).replace(' pukul', ',');


  /* ==========================================================
   * 4. LACAK PESANAN
   * ======================================================== */

  const trackForm = $('[data-track-form]');
  const trackOrder = $('#track-order');
  const trackEmail = $('#track-email');
  const trackBtn = $('[data-submit]', trackForm);
  const trackAlert = $('[data-track-alert]');
  const trackResult = $('[data-track-result]');

  function renderTrack(order) {
    const stepsDef = MeowAPI.ORDER_STEPS;
    const current = stepsDef.findIndex((s) => s.key === order.status);
    const isFinal = current === stepsDef.length - 1;

    const stepsHTML = stepsDef.map((step, i) => {
      const state = i < current || isFinal ? 'is-done' : i === current ? 'is-current' : 'is-pending';
      const time = order.timeline[step.key];
      return `
        <li class="track-step ${state}" style="--sd:${i * 180}ms">
          <span class="track-dot"><svg class="icon"><use href="#i-check"/></svg></span>
          <p class="track-step-label">${step.label}</p>
          <p class="track-step-time">${time ? formatDate(time) : 'Menunggu'}</p>
        </li>`;
    }).join('');

    const itemsHTML = order.items.map(({ product, qty }) => `
      <li class="track-item">
        <span class="track-thumb" style="--tint:${product.tint}">${MeowArt.render(product.art.type, product.art.palette)}</span>
        <p class="track-item-name">${esc(product.name)}<span>${qty} × ${formatRp(product.price)}</span></p>
        <p class="track-item-price">${formatRp(qty * product.price)}</p>
      </li>`).join('');

    trackResult.innerHTML = `
      <div class="track-head">
        <div>
          <p class="track-label">Nomor pesanan</p>
          <p class="track-id">${esc(order.id)}</p>
        </div>
        <span class="status-pill status-pill--${order.status}">${stepsDef[current].label}</span>
      </div>

      <ol class="track-steps" style="--p:0">${stepsHTML}</ol>

      <dl class="track-meta">
        <div><dt>Kurir</dt><dd>${esc(order.courier)}</dd></div>
        <div><dt>No. resi</dt><dd>${order.resi ? esc(order.resi) : 'Tersedia setelah dikirim'}</dd></div>
        <div><dt>${isFinal ? 'Status' : 'Estimasi tiba'}</dt><dd>${esc(order.eta)}</dd></div>
        <div><dt>Alamat</dt><dd>${esc(order.address)}</dd></div>
      </dl>

      <ul class="track-items">${itemsHTML}</ul>
      <p class="track-total"><span>Total belanja</span><strong>${formatRp(order.total)}</strong></p>

      ${isFinal ? `
        <div class="track-actions">
          <a href="#pengembalian" class="btn btn-ghost btn-sm" data-goto-return="${esc(order.id)}">
            Ajukan pengembalian <svg class="icon icon-arrow"><use href="#i-arrow-right"/></svg>
          </a>
        </div>` : ''}`;

    trackResult.hidden = false;

    // animasikan garis progres & titik setelah elemen ada di layar
    const list = $('.track-steps', trackResult);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      list.style.setProperty('--p', (current / (stepsDef.length - 1)).toFixed(3));
      list.classList.add('is-ready');
    }));
  }

  trackForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    trackAlert.hidden = true;

    const orderId = validateOrder(trackOrder);
    const email = validateEmail(trackEmail);
    if (!orderId || !email) {
      (orderId ? trackEmail : trackOrder).focus();
      return;
    }

    setLoading(trackBtn, true, 'Mencari…');
    try {
      const res = await MeowAPI.trackOrder(orderId, email);
      if (!res.ok) {
        trackResult.hidden = true;
        showAlert(trackAlert, `Pesanan <strong>${esc(orderId)}</strong> tidak ditemukan untuk email tersebut.
          Pastikan nomor pesanan dan email sama persis dengan yang dipakai saat checkout.`);
        return;
      }
      renderTrack(res.order);
      trackResult.scrollIntoView({ behavior: scrollBehavior(), block: 'nearest' });
    } catch {
      showAlert(trackAlert, 'Gagal terhubung ke server. Coba lagi sebentar lagi.');
    } finally {
      setLoading(trackBtn, false);
    }
  });

  $$('[data-demo-track]').forEach((chip) => chip.addEventListener('click', () => {
    trackOrder.value = chip.dataset.demoTrack;
    trackEmail.value = DEMO_EMAIL;
    setFieldError(trackOrder, '');
    setFieldError(trackEmail, '');
    trackForm.requestSubmit();
  }));

  // dari hasil lacak (pesanan sudah sampai) -> isi otomatis formulir pengembalian
  trackResult?.addEventListener('click', (e) => {
    const link = e.target.closest('[data-goto-return]');
    if (!link) return;
    $('#return-order').value = link.dataset.gotoReturn;
    $('#return-email').value = trackEmail.value.trim();
  });


  /* ==========================================================
   * 5. PENGEMBALIAN
   * ======================================================== */

  const returnCard = $('[data-return-card]');
  const returnForm = $('[data-return-form]');
  const returnOrder = $('#return-order');
  const returnEmail = $('#return-email');
  const returnBtn = $('[data-submit]', returnForm);
  const returnAlert = $('[data-return-alert]');
  const reasonInputs = $$('input[name="reason"]', returnForm);
  const reasonError = $('#return-reason-error');
  const note = $('#return-note');
  const charCount = $('[data-char-count]');
  const photo = $('[data-return-photo]');
  const fileName = $('[data-file-name]');
  const photoError = $('#return-photo-error');
  const MAX_PHOTO = 5 * 1024 * 1024;

  const STATUS_LABEL = Object.fromEntries(MeowAPI.ORDER_STEPS.map((s) => [s.key, s.label.toLowerCase()]));

  note?.addEventListener('input', () => { charCount.textContent = note.value.length; });

  reasonInputs.forEach((r) => r.addEventListener('change', () => {
    reasonError.textContent = '';
    reasonError.closest('.field').classList.remove('is-invalid');
  }));

  function validatePhoto() {
    const file = photo.files[0];
    photoError.textContent = '';
    photo.closest('.field').classList.remove('is-invalid');
    if (!file) {
      fileName.textContent = 'Pilih foto';
      return true;
    }
    fileName.textContent = file.name;
    let message = '';
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) message = 'File harus berupa gambar JPG, PNG, atau WEBP.';
    else if (file.size > MAX_PHOTO) message = `Ukuran foto ${(file.size / 1048576).toFixed(1).replace('.', ',')} MB. Maksimal 5 MB.`;
    if (message) {
      photoError.textContent = message;
      photo.closest('.field').classList.add('is-invalid');
      return false;
    }
    return true;
  }

  photo?.addEventListener('change', validatePhoto);

  function returnSuccessHTML(ticket, orderId, email) {
    return `
      <div class="success-card" role="status">
        <span class="success-icon"><svg class="icon"><use href="#i-check"/></svg></span>
        <h3>Pengajuan diterima!</h3>
        <p>Nomor tiket kamu <code>${esc(ticket)}</code> untuk pesanan <strong>${esc(orderId)}</strong>.</p>
        <p>Kami cek dalam 48 jam dan mengabari lewat <strong>${esc(email)}</strong>. Simpan nomor tiketnya, ya.</p>
        <button type="button" class="btn btn-ghost btn-sm" data-return-again>Ajukan pengembalian lain</button>
      </div>`;
  }

  returnForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    returnAlert.hidden = true;

    const orderId = validateOrder(returnOrder);
    const email = validateEmail(returnEmail);
    const reason = reasonInputs.find((r) => r.checked)?.value;
    reasonError.textContent = reason ? '' : 'Pilih salah satu alasan.';
    reasonError.closest('.field').classList.toggle('is-invalid', !reason);
    const photoOk = validatePhoto();

    if (!orderId || !email || !reason || !photoOk) {
      const firstInvalid = $('.is-invalid input', returnForm);
      firstInvalid?.focus();
      return;
    }

    setLoading(returnBtn, true, 'Mengirim…');
    try {
      const res = await MeowAPI.requestReturn({ orderId, email, reason, note: note.value.trim(), photo: photo.files[0] || null });
      if (!res.ok) {
        const message = res.error === 'not_delivered'
          ? `Pesanan <strong>${esc(orderId)}</strong> masih <strong>${STATUS_LABEL[res.status]}</strong>.
             Pengembalian bisa diajukan setelah pesanan sampai.`
          : `Pesanan <strong>${esc(orderId)}</strong> tidak ditemukan untuk email tersebut.
             Pastikan nomor pesanan dan email sama dengan yang dipakai saat checkout.`;
        showAlert(returnAlert, message);
        return;
      }

      returnForm.hidden = true;
      returnAlert.insertAdjacentHTML('afterend', returnSuccessHTML(res.ticket, orderId, email));
      toast(`Pengajuan ${res.ticket} terkirim`, { type: 'success' });
    } catch {
      showAlert(returnAlert, 'Gagal terhubung ke server. Coba lagi sebentar lagi.');
    } finally {
      setLoading(returnBtn, false);
    }
  });

  returnCard?.addEventListener('click', (e) => {
    if (!e.target.closest('[data-return-again]')) return;
    $('.success-card', returnCard).remove();
    returnForm.reset();
    charCount.textContent = '0';
    fileName.textContent = 'Pilih foto';
    returnForm.hidden = false;
    returnOrder.focus();
  });

  $$('[data-demo-return]').forEach((chip) => chip.addEventListener('click', () => {
    returnOrder.value = chip.dataset.demoReturn;
    returnEmail.value = DEMO_EMAIL;
    setFieldError(returnOrder, '');
    setFieldError(returnEmail, '');
    if (!reasonInputs.some((r) => r.checked)) reasonInputs[0].checked = true;
    reasonError.textContent = '';
    reasonError.closest('.field').classList.remove('is-invalid');
  }));


  /* ==========================================================
   * 6. FAQ: AKORDEON + PENYARING
   * ======================================================== */

  const faq = $('[data-faq]');
  const faqItems = $$('.faq-item', faq);
  const faqGroups = $$('.faq-group', faq);
  const faqSearch = $('[data-faq-search]');
  const faqEmpty = $('[data-faq-empty]');
  const faqQuery = $('[data-faq-query]');

  function setOpen(item, open) {
    const btn = $('.faq-q', item);
    const panel = $('.faq-a', item);
    btn.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('is-open', open);
    panel.inert = !open;
  }

  faqItems.forEach((item) => {
    setOpen(item, false);
    $('.faq-q', item).addEventListener('click', () => {
      setOpen(item, $('.faq-q', item).getAttribute('aria-expanded') !== 'true');
    });
  });

  function filterFaq(raw) {
    const query = raw.trim().toLowerCase();
    let firstMatch = null;

    faqItems.forEach((item) => {
      const match = !query || item.textContent.toLowerCase().includes(query);
      item.hidden = !match;
      if (match && query && !firstMatch) firstMatch = item;
    });
    faqGroups.forEach((group) => {
      group.hidden = $$('.faq-item', group).every((item) => item.hidden);
    });

    const nothing = Boolean(query) && !firstMatch;
    faqEmpty.hidden = !nothing;
    faqQuery.textContent = raw.trim();

    // buka otomatis hasil teratas supaya jawabannya langsung terbaca
    faqItems.forEach((item) => setOpen(item, item === firstMatch));
  }

  let faqTimer;
  faqSearch?.addEventListener('input', () => {
    clearTimeout(faqTimer);
    faqTimer = setTimeout(() => filterFaq(faqSearch.value), 120);
  });

  // kolom cari di hero -> saring FAQ lalu gulir ke sana
  $('[data-help-search]')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = $('input', e.currentTarget).value;
    faqSearch.value = value;
    filterFaq(value);
    document.getElementById('faq').scrollIntoView({ behavior: scrollBehavior() });
  });
})();
