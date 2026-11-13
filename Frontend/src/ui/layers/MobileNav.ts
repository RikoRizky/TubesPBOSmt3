import { Motion } from '../../core/Motion';
import { Layer } from './Layer';
import type { LayerManager } from './LayerManager';

/** Menu navigasi versi HP (drawer dari kanan). */
export class MobileNav extends Layer {
  constructor(
    root: HTMLElement,
    layers: LayerManager,
    private readonly header: HTMLElement,
    private readonly toggle: HTMLButtonElement,
  ) {
    super(root, layers);
  }

  /** Di desktop menu selalu tampil, jadi jangan pernah di-inert. */
  protected override get usesInert(): boolean {
    return false;
  }

  protected override get initialFocus(): HTMLElement | null {
    return this.find('[data-nav-close]');
  }

  mount(): void {
    this.toggle.addEventListener('click', () => this.show());
    this.find('[data-nav-close]')?.addEventListener('click', () => this.hide());
    this.findAll('[data-nav-link]').forEach((link) =>
      link.addEventListener('click', () => this.hide({ restoreFocus: false })),
    );
    Motion.desktopQuery.addEventListener('change', () => this.hide({ restoreFocus: false }));
  }

  protected override onOpen(): void {
    this.header.classList.add('is-nav-open');
    this.toggle.setAttribute('aria-expanded', 'true');
  }

  protected override onClose(): void {
    this.header.classList.remove('is-nav-open');
    this.toggle.setAttribute('aria-expanded', 'false');
  }
}
