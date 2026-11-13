/**
 * ABSTRACTION: kelas dasar semua komponen tampilan.
 *
 * Setiap komponen terikat ke satu elemen HTML (root) dan wajib
 * mengimplementasikan mount() untuk memasang event listener-nya.
 * Helper find/findAll/require mencari elemen HANYA di dalam root-nya.
 */
export abstract class Component<TRoot extends HTMLElement = HTMLElement> {
  constructor(protected readonly root: TRoot) {}

  /** Pasang event listener & tampilan awal. Dipanggil sekali oleh halaman. */
  abstract mount(): void;

  protected find<T extends Element = HTMLElement>(selector: string): T | null {
    return this.root.querySelector<T>(selector);
  }

  protected findAll<T extends Element = HTMLElement>(selector: string): T[] {
    return Array.from(this.root.querySelectorAll<T>(selector));
  }

  protected require<T extends Element = HTMLElement>(selector: string): T {
    const element = this.find<T>(selector);
    if (!element) throw new Error(`[${this.constructor.name}] elemen "${selector}" tidak ditemukan.`);
    return element;
  }
}
