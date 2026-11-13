import type { IProductNavigator } from '../../contracts/IProductNavigator';
import { escapeHtml } from '../../core/dom';
import { Formatter } from '../../core/Formatter';
import type { Product } from '../../models/Product';
import type { ProductCatalog } from '../../services/ProductCatalog';
import { ProductArt } from '../ProductArt';
import { Layer } from './Layer';
import type { LayerManager } from './LayerManager';

/** Panel pencarian produk (buka lewat ikon kaca pembesar atau tombol "/"). */
export class SearchPanel extends Layer {
  private static readonly POPULAR = ['Salmon', 'Kasur', 'Pasir', 'Catnip', 'Camilan'];

  private readonly input: HTMLInputElement;
  private readonly results: HTMLElement;

  constructor(
    root: HTMLElement,
    layers: LayerManager,
    private readonly catalog: ProductCatalog,
    private readonly navigator: IProductNavigator,
    private readonly trigger: HTMLElement | null,
  ) {
    super(root, layers);
    this.input = this.require<HTMLInputElement>('[data-search-input]');
    this.results = this.require('[data-search-results]');
  }

  protected override get initialFocus(): HTMLElement {
    return this.input;
  }

  mount(): void {
    this.trigger?.addEventListener('click', () => this.openPanel());
    this.find('[data-search-close]')?.addEventListener('click', () => this.hide());
    this.input.addEventListener('input', () => void this.render(this.input.value));

    this.find('[data-search-form]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      this.results.querySelector<HTMLElement>('[data-result]')?.click();
    });

    this.results.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const chip = target.closest<HTMLElement>('[data-chip]');
      const result = target.closest<HTMLElement>('[data-result]');
      if (chip) {
        this.input.value = chip.dataset.chip ?? '';
        void this.render(this.input.value);
        this.input.focus();
      } else if (result?.dataset.result) {
        this.hide({ restoreFocus: false });
        this.navigator.showProduct(result.dataset.result);
      }
    });

    // tombol "/" membuka pencarian dari mana saja (kecuali sedang mengetik)
    document.addEventListener('keydown', (event) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? '');
      if (event.key === '/' && !this.layers.current && !typing) {
        event.preventDefault();
        this.openPanel();
      }
    });
  }

  private openPanel(): void {
    void this.render(this.input.value);
    this.show();
  }

  private async render(raw: string): Promise<void> {
    const query = raw.trim().toLowerCase();

    if (!query) {
      this.results.innerHTML = `
        <p class="search-label">Pencarian populer</p>
        <div class="search-chips">
          ${SearchPanel.POPULAR.map((word) => `<button type="button" class="chip" data-chip="${word}">${word}</button>`).join('')}
        </div>`;
      return;
    }

    try {
      await this.catalog.load();
    } catch {
      this.results.innerHTML = '<p class="search-empty">Gagal memuat produk. Coba lagi sebentar lagi.</p>';
      return;
    }
    if (this.input.value.trim().toLowerCase() !== query) return; // sudah diketik ulang

    const hits = this.catalog.search(query, 6);
    if (!hits.length) {
      this.results.innerHTML = `<p class="search-empty">Belum ada yang cocok dengan “${escapeHtml(raw.trim())}”. Coba kata lain, misalnya “tuna”.</p>`;
      return;
    }

    this.results.innerHTML = `
      <p class="search-label">${hits.length} produk ditemukan</p>
      <div class="search-results">${hits.map((product, i) => SearchPanel.resultHTML(product, query, i)).join('')}</div>`;
  }

  private static resultHTML(product: Product, query: string, index: number): string {
    return `
      <button type="button" class="search-result" data-result="${product.id}" style="animation-delay:${index * 30}ms">
        <span class="search-thumb" style="--tint:${product.tint}">${ProductArt.render(product.art)}</span>
        <span>
          <span class="search-result-name">${SearchPanel.highlight(product.name, query)}</span>
          <span class="search-result-meta">${product.categoryLabel} · ${Formatter.rupiah(product.price)}</span>
        </span>
      </button>`;
  }

  private static highlight(text: string, query: string): string {
    const index = text.toLowerCase().indexOf(query);
    if (index === -1) return escapeHtml(text);
    const end = index + query.length;
    return `${escapeHtml(text.slice(0, index))}<mark>${escapeHtml(text.slice(index, end))}</mark>${escapeHtml(text.slice(end))}`;
  }
}
