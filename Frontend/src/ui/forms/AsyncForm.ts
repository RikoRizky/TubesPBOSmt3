import { Component } from '../Component';

/**
 * ABSTRACTION + POLA TEMPLATE METHOD
 *
 * Alur kirim formulir selalu sama: sembunyikan pesan lama -> validasi ->
 * tampilkan loading -> kirim -> tangani galat jaringan -> matikan loading.
 * Turunan hanya mengisi bagian yang berbeda: validate() dan send().
 */
export abstract class AsyncForm extends Component<HTMLFormElement> {
  protected readonly submitButton: HTMLButtonElement;
  protected alertElement: HTMLElement | null = null;
  private busy = false;

  /** Teks tombol saat sedang memproses, mis. "Mencari…" */
  protected abstract readonly loadingLabel: string;

  constructor(root: HTMLFormElement) {
    super(root);
    this.submitButton = this.require<HTMLButtonElement>('[type="submit"]');
  }

  mount(): void {
    this.root.addEventListener('submit', (event) => {
      event.preventDefault();
      void this.handleSubmit();
    });
    this.setup();
  }

  /** Kait opsional untuk event listener tambahan milik turunan. */
  protected setup(): void {}

  /** true bila semua isian valid. */
  protected abstract validate(): boolean;

  /** Kirim data ke service. Galat jaringan cukup dilempar. */
  protected abstract send(): Promise<void>;

  /** Template method: urutan langkah yang sama untuk semua formulir. */
  private async handleSubmit(): Promise<void> {
    if (this.busy) return;
    this.hideAlert();
    if (!this.validate()) return;

    this.setLoading(true);
    try {
      await this.send();
    } catch {
      this.showAlert('Gagal terhubung ke server. Coba lagi sebentar lagi.');
    } finally {
      this.setLoading(false);
    }
  }

  /** Bisa di-override (POLYMORPHISM): newsletter memakai baris pesan sendiri. */
  protected showAlert(html: string): void {
    if (!this.alertElement) return;
    this.alertElement.innerHTML = `<svg class="icon"><use href="#i-alert"/></svg><p>${html}</p>`;
    this.alertElement.hidden = false;
  }

  protected hideAlert(): void {
    if (this.alertElement) this.alertElement.hidden = true;
  }

  private setLoading(loading: boolean): void {
    const button = this.submitButton;
    const label = button.querySelector<HTMLElement>('span:not(.spinner)');
    this.busy = loading;
    button.disabled = loading;
    button.classList.toggle('is-loading', loading);

    if (loading) {
      if (label) {
        button.dataset.label = label.textContent ?? '';
        label.textContent = this.loadingLabel;
      }
      button.insertAdjacentHTML('afterbegin', '<span class="spinner" aria-hidden="true"></span>');
    } else {
      if (label && button.dataset.label) label.textContent = button.dataset.label;
      button.querySelector('.spinner')?.remove();
    }
  }
}
