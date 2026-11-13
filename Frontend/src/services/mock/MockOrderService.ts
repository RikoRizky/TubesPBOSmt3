import type { IOrderService, ReturnRequest, ReturnResult, TrackResult } from '../../contracts/IOrderService';
import { delay } from '../../core/utils';
import { OrderStatus } from '../../models/enums';
import { Order, OrderLine } from '../../models/Order';
import { ProductFactory } from '../../models/ProductFactory';
import { MOCK_ORDERS, MOCK_PRODUCTS, type MockOrderRecord } from './mockData';

/** Implementasi IOrderService memakai data contoh. */
export class MockOrderService implements IOrderService {
  constructor(private readonly latencyMs = 700) {}

  async track(orderId: string, email: string): Promise<TrackResult> {
    await delay(this.latencyMs);
    const record = this.find(orderId, email);
    if (!record) return { ok: false, error: 'not_found' };
    return { ok: true, order: this.toOrder(record) };
  }

  async requestReturn(request: ReturnRequest): Promise<ReturnResult> {
    await delay(this.latencyMs + 100);
    const record = this.find(request.orderId, request.email);
    if (!record) return { ok: false, error: 'not_found' };
    if (record.status !== OrderStatus.Sampai) return { ok: false, error: 'not_delivered', status: record.status };
    return { ok: true, ticket: `RT-${Math.floor(10000 + Math.random() * 90000)}` };
  }

  /**
   * Cocokkan nomor pesanan + email. "Tidak ada" dan "email salah" sengaja
   * menghasilkan hal yang sama agar nomor pesanan valid tidak bisa ditebak.
   */
  private find(orderId: string, email: string): MockOrderRecord | undefined {
    const id = Order.normalizeId(orderId);
    const mail = email.trim().toLowerCase();
    return MOCK_ORDERS.find((order) => order.id === id && order.email === mail);
  }

  private toOrder(record: MockOrderRecord): Order {
    const lines = record.items.map((item) => {
      const dto = MOCK_PRODUCTS.find((product) => product.id === item.productId);
      if (!dto) throw new Error(`Produk ${item.productId} tidak ditemukan.`);
      return new OrderLine(ProductFactory.create(dto), item.qty);
    });
    return new Order(record, lines);
  }
}
