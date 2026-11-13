import type { INotifier } from '../../contracts/INotifier';
import type { IOrderService } from '../../contracts/IOrderService';
import { escapeHtml } from '../../core/dom';
import { ReturnReason } from '../../models/enums';
import { Order } from '../../models/Order';
import { AsyncForm } from '../forms/AsyncForm';
import { FormField } from '../forms/FormField';
import { EmailValidator, OrderIdValidator, RequiredValidator } from '../forms/Validators';

const DEMO_EMAIL = 'demo@meowplace.id';

/** Ajukan pengembalian tanpa login: nomor pesanan + email + alasan (+ foto). */
export class ReturnForm extends AsyncForm {
  private static readonly MAX_PHOTO_BYTES = 5 * 1024 * 1024;
  private static readonly PHOTO_TYPE = /^image\/(png|jpe?g|webp)$/;

  protected readonly loadingLabel = 'Mengirim…';

  private readonly orderField: FormField;
  private readonly emailField: FormField;
  private readonly note: HTMLTextAreaElement;
  private readonly charCount: HTMLElement;
  private readonly reasons: HTMLInputElement[];
  private readonly reasonError: HTMLElement;
  private readonly photo: HTMLInputElement;
  private readonly fileName: HTMLElement;
  private readonly photoError: HTMLElement;
  private readonly card: HTMLElement;

  constructor(
    root: HTMLFormElement,
    private readonly orders: IOrderService,
    private readonly notifier: INotifier,
    alert: HTMLElement,
  ) {
    super(root);
    this.alertElement = alert;
    this.orderField = new FormField(
      this.require<HTMLInputElement>('#return-order'),
      [new RequiredValidator('Nomor pesanan wajib diisi.'), new OrderIdValidator()],
      Order.normalizeId,
    );
    this.emailField = new FormField(
      this.require<HTMLInputElement>('#return-email'),
      [new RequiredValidator('Email wajib diisi.'), new EmailValidator()],
    );
    this.note = this.require<HTMLTextAreaElement>('#return-note');
    this.charCount = this.require('[data-char-count]');
    this.reasons = this.findAll<HTMLInputElement>('input[name="reason"]');
    this.reasonError = this.require('#return-reason-error');
    this.photo = this.require<HTMLInputElement>('[data-return-photo]');
    this.fileName = this.require('[data-file-name]');
    this.photoError = this.require('#return-photo-error');
    this.card = root.closest<HTMLElement>('[data-return-card]') ?? root;
  }

  /** Isi otomatis dari hasil lacak pesanan. */
  prefill(orderId: string, email: string): void {
    this.orderField.value = orderId;
    this.emailField.value = email;
  }

  protected override setup(): void {
    this.note.addEventListener('input', () => {
      this.charCount.textContent = String(this.note.value.length);
    });
    this.reasons.forEach((radio) => radio.addEventListener('change', () => this.setReasonError('')));
    this.photo.addEventListener('change', () => this.validatePhoto());

    this.findAll('[data-demo-return]').forEach((chip) =>
      chip.addEventListener('click', () => {
        this.prefill(chip.dataset.demoReturn ?? '', DEMO_EMAIL);
        if (!this.selectedReason) this.reasons[0].checked = true;
        this.setReasonError('');
      }),
    );

    this.card.addEventListener('click', (event) => {
      if ((event.target as HTMLElement).closest('[data-return-again]')) this.reset();
    });
  }

  protected validate(): boolean {
    const orderOk = this.orderField.validate();
    const emailOk = this.emailField.validate();
    const reasonOk = this.selectedReason !== null;
    this.setReasonError(reasonOk ? '' : 'Pilih salah satu alasan.');
    const photoOk = this.validatePhoto();

    const valid = orderOk && emailOk && reasonOk && photoOk;
    if (!valid) this.root.querySelector<HTMLElement>('.is-invalid input')?.focus();
    return valid;
  }

  protected async send(): Promise<void> {
    const orderId = this.orderField.value;
    const email = this.emailField.value;
    const result = await this.orders.requestReturn({
      orderId,
      email,
      reason: this.selectedReason ?? ReturnReason.Lainnya,
      note: this.note.value.trim(),
      photo: this.photo.files?.[0] ?? null,
    });

    if (!result.ok) {
      const id = escapeHtml(orderId);
      if (result.error === 'not_delivered') {
        const label = Order.STEPS.find((step) => step.status === result.status)?.label.toLowerCase() ?? result.status;
        this.showAlert(`Pesanan <strong>${id}</strong> masih <strong>${label}</strong>.
          Pengembalian bisa diajukan setelah pesanan sampai.`);
      } else {
        this.showAlert(`Pesanan <strong>${id}</strong> tidak ditemukan untuk email tersebut.
          Pastikan nomor pesanan dan email sama dengan yang dipakai saat checkout.`);
      }
      return;
    }

    this.root.hidden = true;
    this.alertElement?.insertAdjacentHTML('afterend', ReturnForm.successHTML(result.ticket, orderId, email));
    this.notifier.notify(`Pengajuan ${result.ticket} terkirim`, { type: 'success' });
  }

  /* ---------- bantuan ---------- */

  private get selectedReason(): ReturnReason | null {
    const checked = this.reasons.find((radio) => radio.checked);
    return checked ? (checked.value as ReturnReason) : null;
  }

  private setReasonError(message: string): void {
    this.reasonError.textContent = message;
    this.reasonError.closest('.field')?.classList.toggle('is-invalid', Boolean(message));
  }

  private validatePhoto(): boolean {
    const file = this.photo.files?.[0];
    const field = this.photo.closest('.field');
    this.photoError.textContent = '';
    field?.classList.remove('is-invalid');

    if (!file) {
      this.fileName.textContent = 'Pilih foto';
      return true;
    }

    this.fileName.textContent = file.name;
    let message = '';
    if (!ReturnForm.PHOTO_TYPE.test(file.type)) message = 'File harus berupa gambar JPG, PNG, atau WEBP.';
    else if (file.size > ReturnForm.MAX_PHOTO_BYTES) {
      message = `Ukuran foto ${(file.size / 1048576).toFixed(1).replace('.', ',')} MB. Maksimal 5 MB.`;
    }

    if (message) {
      this.photoError.textContent = message;
      field?.classList.add('is-invalid');
      return false;
    }
    return true;
  }

  private reset(): void {
    this.card.querySelector('.success-card')?.remove();
    this.root.reset();
    this.charCount.textContent = '0';
    this.fileName.textContent = 'Pilih foto';
    this.root.hidden = false;
    this.orderField.focus();
  }

  private static successHTML(ticket: string, orderId: string, email: string): string {
    return `
      <div class="success-card" role="status">
        <span class="success-icon"><svg class="icon"><use href="#i-check"/></svg></span>
        <h3>Pengajuan diterima!</h3>
        <p>Nomor tiket kamu <code>${escapeHtml(ticket)}</code> untuk pesanan <strong>${escapeHtml(orderId)}</strong>.</p>
        <p>Kami cek dalam 48 jam dan mengabari lewat <strong>${escapeHtml(email)}</strong>. Simpan nomor tiketnya, ya.</p>
        <button type="button" class="btn btn-ghost btn-sm" data-return-again>Ajukan pengembalian lain</button>
      </div>`;
  }
}
