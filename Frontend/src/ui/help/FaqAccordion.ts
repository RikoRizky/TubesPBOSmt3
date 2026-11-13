import { Motion } from '../../core/Motion';
import { Component } from '../Component';

/** FAQ: buka-tutup jawaban + saring pertanyaan. */
export class FaqAccordion extends Component {
  private readonly items: HTMLElement[];
  private readonly groups: HTMLElement[];
  private readonly empty: HTMLElement | null;
  private readonly queryLabel: HTMLElement | null;
  private debounce = 0;

  constructor(
    root: HTMLElement,
    private readonly searchInput: HTMLInputElement | null,
    private readonly heroSearch: HTMLFormElement | null,
  ) {
    super(root);
    this.items = this.findAll('.faq-item');
    this.groups = this.findAll('.faq-group');
    this.empty = this.find('[data-faq-empty]');
    this.queryLabel = this.find('[data-faq-query]');
  }

  mount(): void {
    this.items.forEach((item) => {
      this.setOpen(item, false);
      item.querySelector('.faq-q')?.addEventListener('click', () => this.setOpen(item, !this.isOpen(item)));
    });

    this.searchInput?.addEventListener('input', () => {
      window.clearTimeout(this.debounce);
      this.debounce = window.setTimeout(() => this.filter(this.searchInput?.value ?? ''), 120);
    });

    // kolom cari di hero: saring FAQ lalu gulir ke sana
    this.heroSearch?.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = this.heroSearch?.querySelector('input')?.value ?? '';
      if (this.searchInput) this.searchInput.value = value;
      this.filter(value);
      document.getElementById('faq')?.scrollIntoView({ behavior: Motion.scrollBehavior });
    });
  }

  filter(raw: string): void {
    const query = raw.trim().toLowerCase();
    let firstMatch: HTMLElement | null = null;

    for (const item of this.items) {
      const match = !query || (item.textContent ?? '').toLowerCase().includes(query);
      item.hidden = !match;
      if (match && query && !firstMatch) firstMatch = item;
    }
    for (const group of this.groups) {
      group.hidden = Array.from(group.querySelectorAll<HTMLElement>('.faq-item')).every((item) => item.hidden);
    }

    if (this.empty) this.empty.hidden = !(query && !firstMatch);
    if (this.queryLabel) this.queryLabel.textContent = raw.trim();

    // buka otomatis hasil teratas supaya jawabannya langsung terbaca
    this.items.forEach((item) => this.setOpen(item, item === firstMatch));
  }

  private isOpen(item: HTMLElement): boolean {
    return item.querySelector('.faq-q')?.getAttribute('aria-expanded') === 'true';
  }

  private setOpen(item: HTMLElement, open: boolean): void {
    const button = item.querySelector('.faq-q');
    const panel = item.querySelector<HTMLElement>('.faq-a');
    button?.setAttribute('aria-expanded', String(open));
    if (panel) {
      panel.classList.toggle('is-open', open);
      panel.inert = !open;
    }
  }
}
