import { Motion } from '../core/Motion';
import { ScrollEffect, type ScrollState } from './ScrollEffect';

/** Pita teks berjalan yang kecepatan & arahnya mengikuti gulir. */
export class Marquee extends ScrollEffect {
  private static readonly BASE_SPEED = 42; // px per detik
  private static readonly MAX_BOOST = 900;

  private groupWidth = 0;
  private offset = 0;
  private boost = 0;
  private direction = 1;
  private visible = false;
  private lastTime = 0;
  private frame = 0;

  constructor(
    private readonly root: HTMLElement,
    private readonly track: HTMLElement,
  ) {
    super();
    new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting && !Motion.reduced;
      if (this.visible && !this.frame) {
        this.lastTime = 0;
        this.frame = requestAnimationFrame(this.loop);
      }
    }).observe(this.root);
  }

  /** Gandakan grup teks secukupnya agar pita tidak pernah terlihat putus. */
  override measure(): void {
    if (Motion.reduced) return;
    const group = this.track.firstElementChild as HTMLElement | null;
    if (!group) return;

    this.track.querySelectorAll('.marquee-group[aria-hidden]').forEach((copy) => copy.remove());
    this.groupWidth = group.offsetWidth;
    let guard = 0;
    while (this.track.offsetWidth < window.innerWidth * 1.2 + this.groupWidth && guard++ < 10) {
      const copy = group.cloneNode(true) as HTMLElement;
      copy.setAttribute('aria-hidden', 'true');
      this.track.append(copy);
    }
  }

  /** Gulir memberi "dorongan" kecepatan searah gulir. */
  update({ dy }: ScrollState): void {
    if (Math.abs(dy) < 0.5) return;
    this.direction = dy > 0 ? 1 : -1;
    this.boost = Math.min(Marquee.MAX_BOOST, this.boost + Math.abs(dy) * 9);
  }

  private readonly loop = (now: number): void => {
    const dt = this.lastTime ? Math.min(0.05, (now - this.lastTime) / 1000) : 0;
    this.lastTime = now;
    this.boost *= Math.pow(0.03, dt); // meluruh ke ~3% per detik
    this.offset += this.direction * (Marquee.BASE_SPEED + this.boost) * dt;

    if (this.groupWidth) {
      const x = -(((this.offset % this.groupWidth) + this.groupWidth) % this.groupWidth);
      this.track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    }
    this.frame = this.visible ? requestAnimationFrame(this.loop) : 0;
  };
}
