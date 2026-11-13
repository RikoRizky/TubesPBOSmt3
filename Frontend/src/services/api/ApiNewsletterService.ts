import type { INewsletterService, SubscribeResult } from '../../contracts/INewsletterService';
import type { HttpClient } from './HttpClient';

/** Implementasi INewsletterService ke backend C#: POST /newsletter */
export class ApiNewsletterService implements INewsletterService {
  constructor(private readonly http: HttpClient) {}

  subscribe(email: string): Promise<SubscribeResult> {
    return this.http.post<SubscribeResult>('/newsletter', { email: email.trim() });
  }
}
