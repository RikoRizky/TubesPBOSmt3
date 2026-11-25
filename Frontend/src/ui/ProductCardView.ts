import { escapeHtml } from '../core/dom';
import { Formatter } from '../core/Formatter';
import type { Product } from '../models/Product';

const BADGE_CLASS = {
  sale: 'badge',
  new: 'badge badge--new',
  hot: 'badge badge--hot',
  out: 'badge badge--out',
} as const;

/** Template HTML kartu produk & foto produk (kelas statis, tanpa state). */
export class ProductCardView {
  private constructor() {}

  /** Foto produk sebagai elemen <img>. */
  static photo(product: Product, className = '', lazy = true): string {
    return `<img class="${className}" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}"
      width="600" height="600" ${lazy ? 'loading="lazy"' : ''} decoding="async">`;
  }

  static render(product: Product, options: { wished: boolean; index: number }): string {
    const { wished, index } = options;
    const name = escapeHtml(product.name);
    const badge = product.getBadge();
    const available = product.isAvailable;

    return `
      <article class="product-card is-entering${available ? '' : ' is-out'}" data-id="${product.id}" style="--d:${Math.min(index * 40, 300)}ms">
        <div class="product-media">
          ${ProductCardView.photo(product, 'product-img')}
          ${badge ? `<span class="${BADGE_CLASS[badge.variant]}">${escapeHtml(badge.label)}</span>` : ''}
          <button class="wish-btn" type="button" data-wish="${product.id}" aria-pressed="${wished}"
            aria-label="${wished ? 'Hapus dari' : 'Simpan ke'} favorit: ${name}">
            <svg class="icon"><use href="#i-heart"/></svg>
          </button>
        </div>
        <div class="product-body">
          <p class="product-cat">
            <svg class="icon"><use href="#${product.pet.icon}"/></svg>
            ${product.pet.label} · ${product.categoryLabel}
          </p>
          <h3 class="product-name">${name}</h3>
          <p class="product-rating">
            <svg class="icon icon--fill"><use href="#i-star"/></svg>
            ${Formatter.decimal(product.rating, 1)} <span>(${Formatter.compact(product.reviews)} ulasan)</span>
          </p>
          <div class="product-foot">
            <p class="price">
              <strong>${Formatter.rupiah(product.price)}</strong>${product.oldPrice ? `<s>${Formatter.rupiah(product.oldPrice)}</s>` : ''}
            </p>
            <button class="add-btn" type="button" data-add="${product.id}" ${available ? '' : 'disabled'}
              aria-label="${available ? 'Tambah ke keranjang' : 'Stok habis'}: ${name}">
              <svg class="icon"><use href="#i-bag-plus"/></svg>
            </button>
          </div>
        </div>
      </article>`;
  }

  static skeleton(): string {
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
}
