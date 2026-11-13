import type { OrderStatus, ReturnReason } from '../models/enums';
import type { Order } from '../models/Order';

export type TrackResult =
  | { ok: true; order: Order }
  | { ok: false; error: 'not_found' };

export interface ReturnRequest {
  orderId: string;
  email: string;
  reason: ReturnReason;
  note: string;
  photo: File | null;
}

export type ReturnResult =
  | { ok: true; ticket: string }
  | { ok: false; error: 'not_found' }
  | { ok: false; error: 'not_delivered'; status: OrderStatus };

/**
 * INTERFACE: layanan pesanan tanpa login (nomor pesanan + email).
 * Implementasi: MockOrderService dan ApiOrderService.
 */
export interface IOrderService {
  track(orderId: string, email: string): Promise<TrackResult>;
  requestReturn(request: ReturnRequest): Promise<ReturnResult>;
}
