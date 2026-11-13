import { ScrollEffect, type ScrollState } from './ScrollEffect';

/** Garis oranye tipis di atas layar yang memanjang sesuai progres gulir. */
export class ProgressBar extends ScrollEffect {
  constructor(private readonly bar: HTMLElement) {
    super();
  }

  override get isDecorative(): boolean {
    return false;
  }

  update({ progress }: ScrollState): void {
    this.bar.style.transform = `scaleX(${progress.toFixed(4)})`;
  }
}
