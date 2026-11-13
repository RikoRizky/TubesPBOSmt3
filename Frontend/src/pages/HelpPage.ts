import { $, required } from '../core/dom';
import { StepsTimeline } from '../effects/StepsTimeline';
import { FaqAccordion } from '../ui/help/FaqAccordion';
import { HelpNav } from '../ui/help/HelpNav';
import { ReturnForm } from '../ui/help/ReturnForm';
import { TrackOrderForm } from '../ui/help/TrackOrderForm';
import { Page } from './Page';

/** Halaman Pusat Bantuan (bantuan.html). */
export class HelpPage extends Page {
  init(): void {
    const { app } = this;

    const nav = $('[data-help-nav]');
    if (nav) new HelpNav(nav).mount();

    const steps = $('[data-steps]');
    if (steps) app.engine.add(new StepsTimeline(steps));

    const returnForm = new ReturnForm(
      required<HTMLFormElement>('[data-return-form]'),
      app.orders,
      app.notifier,
      required('[data-return-alert]'),
    );
    returnForm.mount();

    const trackForm = new TrackOrderForm(
      required<HTMLFormElement>('[data-track-form]'),
      app.orders,
      required('[data-track-alert]'),
      required('[data-track-result]'),
    );
    // dari hasil lacak (pesanan sudah sampai) -> isi otomatis formulir pengembalian
    trackForm.onReturnRequested = (orderId, email) => returnForm.prefill(orderId, email);
    trackForm.mount();

    new FaqAccordion(
      required('[data-faq]'),
      $<HTMLInputElement>('[data-faq-search]'),
      $<HTMLFormElement>('[data-help-search]'),
    ).mount();
  }
}
