export type NotifyType = 'info' | 'success' | 'error';

export interface NotifyOptions {
  type?: NotifyType;
  /** Teks tombol aksi, mis. "Lihat" */
  action?: string;
  onAction?: () => void;
  duration?: number;
}

/** INTERFACE: cara menampilkan notifikasi ke pengguna (implementasi: ToastNotifier). */
export interface INotifier {
  notify(message: string, options?: NotifyOptions): void;
}
