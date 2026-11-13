import type { INewsletterService, SubscribeResult } from '../../contracts/INewsletterService';
import { delay } from '../../core/utils';

/** Implementasi INewsletterService tanpa backend. */
export class MockNewsletterService implements INewsletterService {
  async subscribe(_email: string): Promise<SubscribeResult> {
    await delay(600);
    return { voucher: 'MEOW10' };
  }
}
