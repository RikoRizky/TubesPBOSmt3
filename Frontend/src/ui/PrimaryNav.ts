import type { IMeasurable } from '../contracts/IMeasurable';
import { $$ } from '../core/dom';
import { Motion } from '../core/Motion';
import { Component } from './Component';

/**
 * Navigasi utama (desktop): menandai section yang sedang dilihat (scrollspy)
 * dan menggeser "pil" indikator ke link aktif / link yang di-hover.
 */
export class PrimaryNav extends Component implements IMeasurable {
  private readonly links: HTMLAnchorElement[];
  private readonly indicator: HTMLElement | null;
  private activeId = 'beranda';

  constructor(root: HTMLElement) {
    super(root);
    this.links = this.findAll<HTMLAnchorElement>('.navbar-link');
    this.indicator = this.find('[data-nav-indicator]');
  }

  mount(): void {
    this.links.forEach((link) => link.addEventListener('pointerenter', () => this.place(link)));
    this.root.addEventListener('pointerleave', () => this.place(this.activeLink));
    Motion.desktopQuery.addEventListener('change', () => this.place(this.activeLink));

    const ids = new Set(this.links.map((link) => PrimaryNav.sectionId(link)).filter((id): id is string => id !== null));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && ids.has(entry.target.id)) this.setActive(entry.target.id);
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    $$('[data-section][id]').forEach((section) => spy.observe(section));

    this.setActive(this.activeId);
  }

  measure(): void {
    this.place(this.activeLink);
  }

  private get activeLink(): HTMLAnchorElement | undefined {
    return this.links.find((link) => PrimaryNav.sectionId(link) === this.activeId);
  }

  private setActive(id: string): void {
    this.activeId = id;
    const current = this.activeLink;
    this.links.forEach((link) => {
      const on = link === current;
      link.classList.toggle('is-active', on);
      if (on) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    this.place(current);
  }

  private place(link: HTMLAnchorElement | undefined): void {
    if (!this.indicator) return;
    if (!link || !Motion.isDesktop) {
      this.indicator.style.setProperty('--o', '0');
      return;
    }
    this.indicator.style.setProperty('--x', `${link.offsetLeft}px`);
    this.indicator.style.setProperty('--w', `${link.offsetWidth}px`);
    this.indicator.style.setProperty('--o', '1');
  }

  /** "#kategori" -> "kategori"; link ke halaman lain -> null */
  private static sectionId(link: HTMLAnchorElement): string | null {
    const href = link.getAttribute('href') ?? '';
    return href.startsWith('#') ? href.slice(1) : null;
  }
}
