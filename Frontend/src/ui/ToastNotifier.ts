import type { INotifier, NotifyOptions, NotifyType } from '../contracts/INotifier';

/** Implementasi INotifier berupa toast kecil di bawah layar. */
export class ToastNotifier implements INotifier {
  private static readonly MAX_VISIBLE = 2;

  constructor(private readonly stack: HTMLElement) {}

  notify(message: string, options: NotifyOptions = {}): void {
    const { type = 'info', action, onAction, duration = 2800 } = options;
    const icon = ToastNotifier.iconFor(type);

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
      <span class="toast-icon"><svg class="icon ${icon === 'i-paw' ? 'icon--fill' : ''}"><use href="#${icon}"/></svg></span>
      <span class="toast-msg"></span>`;
    toast.querySelector('.toast-msg')!.textContent = message;

    let timer = 0;
    const dismiss = (): void => {
      if (toast.classList.contains('is-leaving')) return;
      window.clearTimeout(timer);
      toast.classList.add('is-leaving');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
      window.setTimeout(() => toast.remove(), 400);
    };

    if (action) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'toast-action';
      button.textContent = action;
      button.addEventListener('click', () => {
        onAction?.();
        dismiss();
      });
      toast.append(button);
    }

    this.stack.append(toast);
    while (this.stack.children.length > ToastNotifier.MAX_VISIBLE) this.stack.firstElementChild?.remove();

    timer = window.setTimeout(dismiss, duration);
    toast.addEventListener('pointerenter', () => window.clearTimeout(timer));
    toast.addEventListener('pointerleave', () => {
      timer = window.setTimeout(dismiss, 1200);
    });
  }

  private static iconFor(type: NotifyType): string {
    if (type === 'success') return 'i-check';
    if (type === 'error') return 'i-alert';
    return 'i-paw';
  }
}
