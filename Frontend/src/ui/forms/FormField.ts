import type { IValidator } from './Validators';

type Input = HTMLInputElement | HTMLTextAreaElement;

/**
 * Satu isian formulir + daftar aturan validasinya (COMPOSITION).
 * Menampilkan/menghapus pesan galat pada elemen .field pembungkusnya.
 */
export class FormField {
  private readonly field: HTMLElement;
  private readonly error: HTMLElement | null;

  constructor(
    readonly input: Input,
    private readonly validators: readonly IValidator[] = [],
    private readonly normalizer?: (value: string) => string,
  ) {
    const field = input.closest<HTMLElement>('.field');
    if (!field) throw new Error(`Input #${input.id} harus berada di dalam .field`);
    this.field = field;
    this.error = field.querySelector('.field-error');

    input.addEventListener('input', () => {
      if (this.field.classList.contains('is-invalid')) this.clearError();
    });
  }

  get value(): string {
    return this.input.value.trim();
  }

  set value(value: string) {
    this.input.value = value;
    this.clearError();
  }

  /** Jalankan semua validator berurutan; berhenti di galat pertama. */
  validate(): boolean {
    for (const validator of this.validators) {
      const message = validator.validate(this.input.value);
      if (message) {
        this.showError(message);
        return false;
      }
    }
    if (this.normalizer) this.input.value = this.normalizer(this.input.value);
    this.clearError();
    return true;
  }

  showError(message: string): void {
    this.field.classList.add('is-invalid');
    if (this.error) this.error.textContent = message;
    this.input.setAttribute('aria-invalid', 'true');
  }

  clearError(): void {
    this.field.classList.remove('is-invalid');
    if (this.error) this.error.textContent = '';
    this.input.removeAttribute('aria-invalid');
  }

  focus(): void {
    this.input.focus();
  }
}
