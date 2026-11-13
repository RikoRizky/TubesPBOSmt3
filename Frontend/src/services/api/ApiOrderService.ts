import type { IOrderService, ReturnRequest, ReturnResult, TrackResult } from '../../contracts/IOrderService';
import type { OrderDTO } from '../../models/dto';
import type { OrderStatus } from '../../models/enums';
import { Order, OrderLine } from '../../models/Order';
import { ProductFactory } from '../../models/ProductFactory';
import { HttpError, type HttpClient } from './HttpClient';

/**
 * Implementasi IOrderService ke backend C#.
 *  - POST /orders/track  -> 200 OrderDTO | 404
 *  - POST /returns       -> 200 { ticket } | 404 | 409 { status }
 */
export class ApiOrderService implements IOrderService {
  constructor(private readonly http: HttpClient) {}

  async track(orderId: string, email: string): Promise<TrackResult> {
    try {
      const dto = await this.http.post<OrderDTO>('/orders/track', {
        orderId: Order.normalizeId(orderId),
        email: email.trim(),
      });
      const lines = dto.items.map((item) => {
        if (!item.product) throw new Error('Respons backend tidak menyertakan data produk.');
        return new OrderLine(ProductFactory.create(item.product), item.qty);
      });
      return { ok: true, order: new Order(dto, lines) };
    } catch (error) {
      if (error instanceof HttpError && error.status === 404) return { ok: false, error: 'not_found' };
      throw error;
    }
  }

  async requestReturn(request: ReturnRequest): Promise<ReturnResult> {
    const form = new FormData();
    form.append('orderId', Order.normalizeId(request.orderId));
    form.append('email', request.email.trim());
    form.append('reason', request.reason);
    form.append('note', request.note);
    if (request.photo) form.append('photo', request.photo);

    try {
      const result = await this.http.postForm<{ ticket: string }>('/returns', form);
      return { ok: true, ticket: result.ticket };
    } catch (error) {
      if (error instanceof HttpError && error.status === 404) return { ok: false, error: 'not_found' };
      if (error instanceof HttpError && error.status === 409) {
        const status = (error.body as { status?: OrderStatus } | null)?.status;
        if (status) return { ok: false, error: 'not_delivered', status };
      }
      throw error;
    }
  }
}
