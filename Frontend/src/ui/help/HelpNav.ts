import { Motion } from '../../core/Motion';
import { Component } from '../Component';

/** Daftar topik bantuan yang menandai section yang sedang dibaca. */
export class HelpNav extends Component {
  private readonly list: HTMLElement;
  private readonly links: HTMLAnchorElement[];

  constructor(root: HTMLElement) {
    super(root);
    this.list = this.require('[data-help-nav-list]');
    this.links = this.findAll<HTMLAnchorElement>('[data-help-link]');
  }

  mount(): void {
    const topics = this.links
      .map((link) => document.getElementById((link.getAttribute('href') ?? '').slice(1)))
      .filter((section): section is HTMLElement => section !== null);

    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) this.setActive(entry.target.id);
      });
    }, { rootMargin: '-30% 0px -65% 0px' });

    topics.forEach((section) => spy.observe(section));
  }

  private setActive(id: string): void {
    for (const link of this.links) {
      const on = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', on);
      if (on) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');

      // di HP daftar topik bisa digeser: pastikan topik aktif terlihat
      if (on && this.list.scrollWidth > this.list.clientWidth) {
        const item = link.parentElement ?? link;
        const left = item.offsetLeft - (this.list.clientWidth - link.offsetWidth) / 2;
        this.list.scrollTo({ left, behavior: Motion.scrollBehavior });
      }
    }
  }
}
