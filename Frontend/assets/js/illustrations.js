/**
 * MeowPlace — ilustrasi produk (SVG inline, karya orisinal)
 *
 * Pemakaian:
 *   MeowArt.render('bag', 'orange')            -> string <svg>
 *   <div data-art="bag:orange"></div>          -> otomatis diisi oleh MeowArt.hydrate()
 *
 * Saat backend siap dan produk punya foto asli, cukup ganti pemanggilan
 * MeowArt.render(...) dengan <img src="product.image">.
 */

'use strict';

(function (global) {
  const INK = '#2B1B12';

  const PALETTES = {
    orange:    { main: '#F97316', dark: '#C2410C', light: '#FFF4E6', soft: '#FDBA74' },
    tangerine: { main: '#FB923C', dark: '#EA580C', light: '#FFF7ED', soft: '#FED7AA' },
    brown:     { main: '#9A5B34', dark: '#6B3A1E', light: '#FBEBDD', soft: '#D9A47C' },
    honey:     { main: '#F5B342', dark: '#C77D12', light: '#FFF8E6', soft: '#FCD98F' },
    rust:      { main: '#DC5A2A', dark: '#9F3A16', light: '#FFF1EA', soft: '#F4A383' },
    cream:     { main: '#F1DEC6', dark: '#B98B5E', light: '#FFFFFF', soft: '#E3C7A4' },
  };

  /* ---------- bagian-bagian kecil ---------- */

  const shadow = (cx, cy, rx) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="7" fill="${INK}" opacity=".1"/>`;

  const gloss = (d) =>
    `<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="7" stroke-linecap="round"/>`;

  const catFace = (cx, cy, s, fill) => `
    <g transform="translate(${cx} ${cy}) scale(${s})">
      <path d="M-16 -6 L-18 -22 L-6 -14 H6 L18 -22 L16 -6 C19 -2 20 1 20 5 C20 14 11 20 0 20 S-20 14 -20 5 C-20 1 -19 -2 -16 -6 Z" fill="${fill}"/>
      <circle cx="-7" cy="3" r="2.6" fill="${INK}"/>
      <circle cx="7" cy="3" r="2.6" fill="${INK}"/>
      <path d="M-2.5 9 H2.5 L0 11.8 Z" fill="${INK}"/>
    </g>`;

  /* ---------- template per jenis produk (viewBox 0 0 200 200) ---------- */

  const TEMPLATES = {
    // Makanan kering (kantong)
    bag: (c) => `
      ${shadow(100, 186, 60)}
      <path d="M54 44h92l10 128a10 10 0 0 1-10 11H54a10 10 0 0 1-10-11Z" fill="${c.main}"/>
      <path d="M146 44l10 128a10 10 0 0 1-10 11h-14l10-139Z" fill="${c.dark}" opacity=".22"/>
      <rect x="49" y="28" width="102" height="22" rx="5" fill="${c.dark}"/>
      <path d="M60 34v10M70 34v10M80 34v10M90 34v10M100 34v10M110 34v10M120 34v10M130 34v10M140 34v10" stroke="#fff" stroke-opacity=".28" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="100" cy="104" r="36" fill="${c.light}"/>
      ${catFace(100, 104, 1.15, c.main)}
      <rect x="68" y="152" width="64" height="9" rx="4.5" fill="${c.light}"/>
      <rect x="80" y="166" width="40" height="6" rx="3" fill="${c.light}" opacity=".6"/>
      ${gloss('M62 58l-5 104')}`,

    // Makanan basah (kaleng)
    can: (c) => `
      ${shadow(100, 182, 54)}
      <path d="M54 76v86c0 9 20.6 16 46 16s46-7 46-16V76Z" fill="${c.main}"/>
      <path d="M54 98c0 9 20.6 16 46 16s46-7 46-16v44c0 9-20.6 16-46 16s-46-7-46-16Z" fill="${c.light}"/>
      <ellipse cx="100" cy="76" rx="46" ry="16" fill="#EDE3D8"/>
      <ellipse cx="100" cy="76" rx="38" ry="12" fill="#DCCBBB"/>
      <rect x="88" y="66" width="24" height="9" rx="4.5" fill="#fff" opacity=".9"/>
      <path d="M78 133c8-10 24-10 32 0-8 10-24 10-32 0Z" fill="${c.main}"/>
      <path d="M108 133l12-8v16Z" fill="${c.main}"/>
      <circle cx="86" cy="131" r="2" fill="${INK}"/>
      ${gloss('M64 90v66')}`,

    // Camilan (pouch berdiri)
    pouch: (c) => `
      ${shadow(100, 186, 54)}
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
      ${gloss('M66 62l-4 100')}`,

    // Mainan tikus catnip
    mouse: (c) => `
      ${shadow(108, 170, 64)}
      <path d="M52 150c-18 2-28-8-24-18 4-12 22-10 20 2" fill="none" stroke="${c.dark}" stroke-width="5" stroke-linecap="round"/>
      <path d="M48 154C48 116 78 90 116 90c30 0 56 32 56 50 0 10-8 14-18 14Z" fill="${c.main}"/>
      <circle cx="122" cy="86" r="18" fill="${c.main}"/>
      <circle cx="122" cy="86" r="10" fill="${c.soft}"/>
      <circle cx="148" cy="122" r="4.5" fill="${INK}"/>
      <circle cx="149.5" cy="120.5" r="1.4" fill="#fff"/>
      <circle cx="171" cy="141" r="6" fill="${c.soft}"/>
      <path d="M160 147l18 4M158 151l14 10" stroke="${INK}" stroke-opacity=".45" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M66 148c4-22 18-38 38-46" fill="none" stroke="${c.light}" stroke-opacity=".8" stroke-width="2.5" stroke-dasharray="3 6" stroke-linecap="round"/>`,

    // Bola benang
    yarn: (c) => `
      ${shadow(100, 178, 56)}
      <path d="M146 140c18 8 28 24 20 40" fill="none" stroke="${c.main}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="100" cy="110" r="58" fill="${c.main}"/>
      <g fill="none" stroke="${c.dark}" stroke-width="4" stroke-linecap="round" opacity=".5">
        <path d="M48 86c34 6 66 36 76 76"/>
        <path d="M56 142c22-34 54-62 92-64"/>
        <path d="M80 56c-6 34 6 76 40 108"/>
        <path d="M122 56c10 34 2 76-30 108"/>
      </g>
      <path d="M66 82a44 44 0 0 1 28-22" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="7" stroke-linecap="round"/>`,

    // Tongkat bulu
    wand: (c) => `
      ${shadow(100, 186, 50)}
      <path d="M46 178 150 52" stroke="${c.dark}" stroke-width="6" stroke-linecap="round"/>
      <path d="M46 178l20-24" stroke="${INK}" stroke-opacity=".75" stroke-width="9" stroke-linecap="round"/>
      <path d="M150 52c18 8 22 28 12 46" fill="none" stroke="${INK}" stroke-opacity=".5" stroke-width="1.8"/>
      <g transform="translate(162 100)">
        <path d="M0 0c-14 10-18 34-8 52 10-14 14-36 8-52Z" fill="${c.main}"/>
        <path d="M0 0c10 8 18 30 10 50-10-12-14-34-10-50Z" fill="${c.soft}"/>
        <path d="M0 0c-2 14 0 40 2 56" stroke="${c.dark}" stroke-width="1.5" fill="none"/>
      </g>
      <circle cx="162" cy="100" r="4" fill="${c.dark}"/>`,

    // Tiang garukan
    scratcher: (c) => {
      let sisal = '';
      for (let y = 70; y <= 158; y += 8) sisal += `M80 ${y}h40`;
      return `
      ${shadow(100, 188, 66)}
      <rect x="36" y="164" width="128" height="20" rx="7" fill="${c.dark}"/>
      <rect x="80" y="62" width="40" height="104" fill="#E9C99B"/>
      <path d="${sisal}" stroke="#C99B62" stroke-width="2"/>
      <rect x="44" y="44" width="112" height="22" rx="7" fill="${c.main}"/>
      <rect x="48" y="47" width="104" height="6" rx="3" fill="#fff" opacity=".2"/>
      <path d="M140 66v34" stroke="${INK}" stroke-opacity=".6" stroke-width="2"/>
      <circle cx="140" cy="108" r="9" fill="#F97316"/>
      <path d="M134 104a8 8 0 0 1 8-4" stroke="#fff" stroke-opacity=".6" stroke-width="2.5" stroke-linecap="round" fill="none"/>`;
    },

    // Kasur donat (dengan kucing tidur)
    bed: (c) => `
      ${shadow(100, 172, 84)}
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

    // Pasir (ember)
    litter: (c) => `
      ${shadow(100, 188, 56)}
      <path d="M66 64c0-34 68-34 68 0" fill="none" stroke="${c.dark}" stroke-width="6" stroke-linecap="round"/>
      <path d="M52 66h96l-8 108a9 9 0 0 1-9 8H69a9 9 0 0 1-9-8Z" fill="${c.main}"/>
      <rect x="46" y="56" width="108" height="18" rx="6" fill="${c.dark}"/>
      <rect x="66" y="94" width="68" height="60" rx="14" fill="${c.light}"/>
      <rect x="78" y="104" width="44" height="7" rx="3.5" fill="${c.main}" opacity=".7"/>
      <g fill="${c.soft}">
        <circle cx="84" cy="130" r="5"/><circle cx="96" cy="136" r="4"/><circle cx="108" cy="128" r="5.5"/>
        <circle cx="119" cy="138" r="4"/><circle cx="92" cy="122" r="3.5"/><circle cx="105" cy="143" r="3"/>
      </g>
      ${gloss('M62 82l5 84')}`,

    // Air mancur minum
    fountain: (c) => `
      ${shadow(100, 186, 60)}
      <path d="M46 118h108l-9 56a10 10 0 0 1-10 8H65a10 10 0 0 1-10-8Z" fill="${c.main}"/>
      <ellipse cx="100" cy="118" rx="54" ry="14" fill="${c.dark}"/>
      <ellipse cx="100" cy="118" rx="46" ry="10" fill="#A8DCEB"/>
      <rect x="93" y="70" width="14" height="48" rx="7" fill="${c.light}"/>
      <path d="M100 74c-4-18-26-22-34 6M100 74c4-18 26-22 34 6" fill="none" stroke="#A8DCEB" stroke-width="5" stroke-linecap="round"/>
      <circle cx="64" cy="96" r="3" fill="#A8DCEB"/><circle cx="136" cy="96" r="3" fill="#A8DCEB"/>
      <rect x="86" y="148" width="28" height="6" rx="3" fill="${c.light}" opacity=".8"/>
      ${gloss('M58 132l5 36')}`,
  };

  function render(type, paletteName = 'orange') {
    const tpl = TEMPLATES[type] || TEMPLATES.bag;
    const palette = PALETTES[paletteName] || PALETTES.orange;
    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${tpl(palette)}</svg>`;
  }

  /** Isi semua elemen [data-art="jenis:palet"] di dalam root. */
  function hydrate(root = document) {
    root.querySelectorAll('[data-art]').forEach((el) => {
      if (el.dataset.artReady) return;
      const [type, palette] = el.dataset.art.split(':');
      el.innerHTML = render(type, palette);
      el.dataset.artReady = 'true';
    });
  }

  global.MeowArt = { render, hydrate, PALETTES };
})(window);
