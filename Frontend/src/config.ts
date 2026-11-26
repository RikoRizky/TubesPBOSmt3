export interface AppConfig {
  /** false = pakai data contoh (Mock). Ubah ke true setelah backend C# berjalan. */
  useApi: boolean;
  /** Alamat API backend ASP.NET Core (sesuaikan port-nya). */
  apiBaseUrl: string;
}

export const config: AppConfig = {
  useApi: false,
  apiBaseUrl: 'http://localhost:5000/api',
};
