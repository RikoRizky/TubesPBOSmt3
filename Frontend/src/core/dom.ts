/** Ambil satu elemen (boleh tidak ada). */
export function $<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T | null {
  return root.querySelector<T>(selector);
}

/** Ambil semua elemen yang cocok sebagai array. */
export function $$<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

/** Ambil elemen yang wajib ada. Melempar error yang jelas bila tidak ditemukan. */
export function required<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Elemen "${selector}" tidak ditemukan di halaman.`);
  return element;
}

/** Putar ulang animasi CSS dengan melepas lalu memasang kembali class-nya. */
export function restartAnimation(element: Element, className: string): void {
  element.classList.remove(className);
  void (element as HTMLElement).offsetWidth; // paksa reflow
  element.classList.add(className);
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Amankan teks sebelum disisipkan ke HTML (mencegah XSS dari data backend). */
export function escapeHtml(value: unknown): string {
  return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}
