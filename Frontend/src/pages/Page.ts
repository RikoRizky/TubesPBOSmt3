import type { App } from '../app/App';

/**
 * ABSTRACTION: setiap halaman punya bagian khususnya sendiri.
 * App memanggil page.init() tanpa perlu tahu halaman mana (POLYMORPHISM).
 */
export abstract class Page {
  constructor(protected readonly app: App) {}

  /** Pasang komponen & efek yang hanya ada di halaman ini. */
  abstract init(): void;
}
