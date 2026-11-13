/**
 * INHERITANCE dari kelas bawaan JavaScript (Error).
 * Menyimpan kode status HTTP & isi respons supaya pemanggil bisa
 * membedakan, misalnya, 404 (tidak ditemukan) dan 409 (konflik).
 */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`Permintaan gagal (HTTP ${status})`);
    this.name = 'HttpError';
  }
}

/** Pembungkus fetch() sederhana untuk berbicara dengan backend ASP.NET Core. */
export class HttpClient {
  constructor(private readonly baseUrl: string) {}

  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) }, { 'Content-Type': 'application/json' });
  }

  postForm<T>(path: string, form: FormData): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: form });
  }

  private async request<T>(path: string, init: RequestInit, headers: Record<string, string> = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...headers },
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) throw new HttpError(response.status, body);
    return body as T;
  }
}
