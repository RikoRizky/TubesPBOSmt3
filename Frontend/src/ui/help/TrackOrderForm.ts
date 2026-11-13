import type { IOrderService } from '../../contracts/IOrderService';
import { escapeHtml } from '../../core/dom';
import { Formatter } from '../../core/Formatter';
import { Motion } from '../../core/Motion';
import { Order } from '../../models/Order';
import { ProductArt } from '../ProductArt';
import { AsyncForm } from '../forms/AsyncForm';
import { FormField } from '../forms/FormField';
import { EmailValidator, OrderIdValidator, RequiredValidator } from '../forms/Validators';

const DEMO_EMAIL = 'demo@meowplace.id';

/** Lacak pesanan tanpa login: nomor pesanan + email saat checkout. */
export class TrackOrderForm extends AsyncForm {
  protected readonly loadingLabel = 'Mencari…';

  /** Dipanggil saat pengguna klik "Ajukan pengembalian" dari hasil lacak. */
  onReturnRequested: ((orderId: string, email: string) => void) | null = null;

  private readonly orderField: FormField;
  private readonly emailField: FormField;

  constructor(
    root: HTMLFormElement,
    private readonly orders: IOrderService,
    alert: HTMLElement,
    private readonly result: HTMLElement,
  ) {
    super(root);
    this.alertElement = alert;
    this.orderField = new FormField(
      this.require<HTMLInputElement>('#track-order'),
      [new RequiredValidator('Nomor pesanan wajib diisi.'), new OrderIdValidator()],
      Order.normalizeId,
    );
    this.emailField = new FormField(
      this.require<HTMLInputElement>('#track-email'),
      [new RequiredValidator('Email wajib diisi.'), new EmailValidator()],
    );
  }

  protected override setup(): void {
    this.findAll('[data-demo-track]').forEach((chip) =>
      chip.addEventListener('click', () => {
        this.orderField.value = chip.dataset.demoTrack ?? '';
        this.emailField.value = DEMO_EMAIL;
        this.root.requestSubmit();
      }),
    );

    this.result.addEventListener('click', (event) => {
      const link = (event.target as HTMLElement).closest<HTMLElement>('[data-goto-return]');
      if (link?.dataset.gotoReturn) this.onReturnRequested?.(link.dataset.gotoReturn, this.emailField.value);
    });
  }

  protected validate(): boolean {
    const orderOk = this.orderField.validate();
    const emailOk = this.emailField.validate();
    if (!orderOk) this.orderField.focus();
    else if (!emailOk) this.emailField.focus();
    return orderOk && emailOk;
  }

  protected async send(): Promise<void> {
    const orderId = this.orderField.value;
    const result = await this.orders.track(orderId, this.emailField.value);

    if (!result.ok) {
      this.result.hidden = true;
      this.showAlert(`Pesanan <strong>${escapeHtml(orderId)}</strong> tidak ditemukan untuk email tersebut.
        Pastikan nomor pesanan dan email sama persis dengan yang dipakai saat checkout.`);
      return;
    }

    this.renderOrder(result.order);
    this.result.scrollIntoView({ behavior: Motion.scrollBehavior, block: 'nearest' });
  }

  private renderOrder(order: Order): void {
    const current = order.stepIndex;
    const steps = Order.STEPS;

    const stepsHTML = steps.map((step, i) => {
      const state = i < current || order.isDelivered ? 'is-done' : i === current ? 'is-current' : 'is-pending';
      const time = order.timeOf(step.status);
      return `
        <li class="track-step ${state}" style="--sd:${i * 180}ms">
          <span class="track-dot"><svg class="icon"><use href="#i-check"/></svg></span>
          <p class="track-step-label">${step.label}</p>
          <p class="track-step-time">${time ? Formatter.dateTime(time) : 'Menunggu'}</p>
        </li>`;
    }).join('');

    const itemsHTML = order.lines.map((line) => `
      <li class="track-item">
        <span class="track-thumb" style="--tint:${line.product.tint}">${ProductArt.render(line.product.art)}</span>
        <p class="track-item-name">${escapeHtml(line.product.name)}<span>${line.quantity} × ${Formatter.rupiah(line.product.price)}</span></p>
        <p class="track-item-price">${Formatter.rupiah(line.total)}</p>
      </li>`).join('');

    this.result.innerHTML = `
      <div class="track-head">
        <div>
          <p class="track-label">Nomor pesanan</p>
          <p class="track-id">${escapeHtml(order.id)}</p>
        </div>
        <span class="status-pill status-pill--${order.status}">${order.statusLabel}</span>
      </div>

      <ol class="track-steps" style="--p:0">${stepsHTML}</ol>

      <dl class="track-meta">
        <div><dt>Kurir</dt><dd>${escapeHtml(order.courier)}</dd></div>
        <div><dt>No. resi</dt><dd>${order.trackingNumber ? escapeHtml(order.trackingNumber) : 'Tersedia setelah dikirim'}</dd></div>
        <div><dt>${order.isDelivered ? 'Status' : 'Estimasi tiba'}</dt><dd>${escapeHtml(order.eta)}</dd></div>
        <div><dt>Alamat</dt><dd>${escapeHtml(order.maskedAddress)}</dd></div>
      </dl>

      <ul class="track-items">${itemsHTML}</ul>
      <p class="track-total"><span>Total belanja</span><strong>${Formatter.rupiah(order.total)}</strong></p>

      ${order.canBeReturned() ? `
        <div class="track-actions">
          <a href="#pengembalian" class="btn btn-ghost btn-sm" data-goto-return="${escapeHtml(order.id)}">
            Ajukan pengembalian <svg class="icon icon-arrow"><use href="#i-arrow-right"/></svg>
          </a>
        </div>` : ''}`;

    this.result.hidden = false;

    // animasikan garis progres & titik setelah elemen tampil
    const list = this.result.querySelector<HTMLElement>('.track-steps');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      list?.style.setProperty('--p', (current / (steps.length - 1)).toFixed(3));
      list?.classList.add('is-ready');
    }));
  }
}
