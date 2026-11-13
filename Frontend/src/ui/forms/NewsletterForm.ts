import type { INewsletterService } from '../../contracts/INewsletterService';
import { escapeHtml, restartAnimation } from '../../core/dom';
import { AsyncForm } from './AsyncForm';
import { EmailValidator, type IValidator, RequiredValidator } from './Validators';

/** Formulir "Gabung Klub Meow" di footer. */
export class NewsletterForm extends AsyncForm {
  protected readonly loadingLabel = 'Mendaftar…';

  private readonly emailInput: HTMLInputElement;
  private readonly message: HTMLElement;
  private readonly validators: readonly IValidator[] = [
    new RequiredValidator('Email-nya diisi dulu, ya.'),
    new EmailValidator(),
  ];

  constructor(
    root: HTMLFormElement,
    private readonly service: INewsletterService,
  ) {
    super(root);
    this.emailInput = this.require<HTMLInputElement>('input[type="email"]');
    this.message = this.require('[data-newsletter-msg]');
  }

  protected override setup(): void {
    this.emailInput.addEventListener('input', () => {
      if (this.root.classList.contains('is-error')) this.hideAlert();
    });
  }

  protected validate(): boolean {
    for (const validator of this.validators) {
      const error = validator.validate(this.emailInput.value);
      if (error) {
        restartAnimation(this.root, 'is-error');
        this.emailInput.setAttribute('aria-invalid', 'true');
        this.message.textContent = error;
        this.emailInput.focus();
        return false;
      }
    }
    return true;
  }

  protected async send(): Promise<void> {
    const result = await this.service.subscribe(this.emailInput.value.trim());
    this.root.innerHTML = `
      <div class="newsletter-done" style="grid-column: 1 / -1" role="status">
        <svg class="icon"><use href="#i-check"/></svg>
        <p>Berhasil! Pakai kode <code>${escapeHtml(result.voucher)}</code> untuk diskon 10% di pesanan pertamamu.</p>
      </div>`;
  }

  /* POLYMORPHISM: override cara menampilkan pesan dari kelas induk */

  protected override showAlert(text: string): void {
    this.message.textContent = text;
  }

  protected override hideAlert(): void {
    this.root.classList.remove('is-error');
    this.emailInput.removeAttribute('aria-invalid');
    this.message.textContent = '';
  }
}
