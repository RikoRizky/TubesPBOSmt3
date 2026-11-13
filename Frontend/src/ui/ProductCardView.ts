import { escapeHtml } from '../core/dom';
import { Formatter } from '../core/Formatter';
import type { Product } from '../models/Product';
import { ProductArt } from './ProductArt';

const BADGE_CLASS = { sale: 'badge', new: 'badge badge--new', hot: 'badge badge--hot' } as const;

/** Template HTML kartu produk (kelas statis, tanpa state). */
export class ProductCardView {
  private constructor() {}

  static render(product: Product, options: { wished: boolean; index: number }): string {
    const { wished, index } = options;
    const name = escapeHtml(product.name);
    const badge = product.getBadge();

    return `
      <article class="product-card is-entering" data-id="${product.id}" style="--d:${Math.min(index * 40, 300)}ms">
        <div class="product-media" style="--tint:${product.tint}">
          ${badge ? `<span class="${BADGE_CLASS[badge.variant]}">${escapeHtml(badge.label)}</span>` : ''}
          <button class="wish-btn" type="button" data-wish="${product.id}" aria-pressed="${wished}"
            aria-label="${wished ? 'Hapus dari' : 'Simpan ke'} favorit: ${name}">
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
              <strong>${Formatter.rupiah(product.price)}</strong>${product.oldPrice ? `<s>${Formatter.rupiah(product.oldPrice)}</s>` : ''}
            </p>
            <button class="add-btn" type="button" data-add="${product.id}" aria-label="Tambah ke keranjang: ${name}">
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
