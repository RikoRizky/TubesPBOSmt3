import { $$ } from '../../core/dom';
import { Observable } from '../../core/Observable';
import type { HideOptions, Layer } from './Layer';

/**
 * Mengatur panel yang sedang terbuka: overlay gelap, kunci scroll,
 * tombol Esc, dan "jebakan fokus" agar Tab tidak keluar dari panel.
 *
 * Catatan OOP: kelas ini sudah mewarisi Observable, jadi tidak bisa
 * sekaligus mewarisi Component (TypeScript hanya mendukung single
 * inheritance). Solusinya COMPOSITION: elemen overlay disimpan sebagai properti.
 */
export class LayerManager extends Observable<Layer | null> {
  private active: Layer | null = null;
  private returnFocus: HTMLElement | null = null;

  constructor(private readonly overlay: HTMLElement) {
    super();
  }

  get current(): Layer | null {
    return this.active;
  }

  mount(): void {
    this.overlay.addEventListener('click', () => this.close());
    document.addEventListener('keydown', (event) => {
      if (!this.active) return;
      if (event.key === 'Escape') this.close();
      else if (event.key === 'Tab') this.trapFocus(event);
    });
  }

  open(layer: Layer): void {
    if (this.active === layer) return;
    if (this.active) this.close({ restoreFocus: false });

    this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.active = layer;
    layer.activate();
    document.body.classList.add('is-locked');
    this.showOverlay();
    this.notify(layer);
    layer.focusInitial();
  }

  close({ restoreFocus = true }: HideOptions = {}): void {
    const layer = this.active;
    if (!layer) return;

    this.active = null;
    layer.deactivate();
    document.body.classList.remove('is-locked');
    this.hideOverlay();
    this.notify(null);
    if (restoreFocus) this.returnFocus?.focus({ preventScroll: true });
  }

  private showOverlay(): void {
    this.overlay.hidden = false;
    requestAnimationFrame(() => this.overlay.classList.add('is-visible'));
  }

  private hideOverlay(): void {
    this.overlay.classList.remove('is-visible');
    window.setTimeout(() => {
      if (!this.active) this.overlay.hidden = true;
    }, 300);
  }

  private trapFocus(event: KeyboardEvent): void {
    if (!this.active) return;
    const focusables = $$('a[href], button:not([disabled]), input:not([disabled])', this.active.element)
      .filter((element) => element.offsetParent !== null);
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
}
