import { Component } from '../Component';
import type { LayerManager } from './LayerManager';

export interface HideOptions {
  restoreFocus?: boolean;
}

/**
 * ABSTRACTION + POLA TEMPLATE METHOD
 *
 * Panel yang bisa dibuka-tutup di atas halaman (menu HP, pencarian, keranjang).
 * Langkah buka/tutup sama untuk semua panel; turunan cukup mengisi
 * "kait" onOpen()/onClose() dan menentukan elemen yang difokuskan.
 */
export abstract class Layer extends Component {
  constructor(
    root: HTMLElement,
    protected readonly layers: LayerManager,
  ) {
    super(root);
  }

  /** Elemen yang menerima fokus keyboard saat panel dibuka. */
  protected abstract get initialFocus(): HTMLElement | null;

  /** Panel yang tertutup dibuat `inert` agar tidak bisa difokus. Bisa di-override. */
  protected get usesInert(): boolean {
    return true;
  }

  get isOpen(): boolean {
    return this.layers.current === this;
  }

  get element(): HTMLElement {
    return this.root;
  }

  /** Minta LayerManager membuka panel ini (menutup panel lain bila ada). */
  show(): void {
    this.layers.open(this);
  }

  hide(options?: HideOptions): void {
    if (this.isOpen) this.layers.close(options);
  }

  /* ---------- dipanggil oleh LayerManager ---------- */

  activate(): void {
    if (this.usesInert) this.root.inert = false;
    this.root.classList.add('is-open');
    this.onOpen();
  }

  deactivate(): void {
    this.root.classList.remove('is-open');
    if (this.usesInert) this.root.inert = true;
    this.onClose();
  }

  focusInitial(): void {
    const target = this.initialFocus;
    window.setTimeout(() => target?.focus({ preventScroll: true }), 80);
  }

  /* ---------- kait (hook) untuk turunan ---------- */

  protected onOpen(): void {}

  protected onClose(): void {}
}
