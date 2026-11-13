/**
 * Informasi preferensi gerak & ukuran layar pengguna (kelas statis).
 */
export class Motion {
  private static readonly reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  static readonly desktopQuery = window.matchMedia('(min-width: 992px)');
  static readonly finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  private constructor() {}

  /** true bila pengguna meminta animasi dikurangi */
  static get reduced(): boolean {
    return Motion.reducedQuery.matches;
  }

  static get isDesktop(): boolean {
    return Motion.desktopQuery.matches;
  }

  static get scrollBehavior(): ScrollBehavior {
    return Motion.reduced ? 'auto' : 'smooth';
  }
}
