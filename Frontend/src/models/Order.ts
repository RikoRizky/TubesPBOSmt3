import { OrderStatus } from './enums';
import type { OrderDTO } from './dto';
import type { Product } from './Product';

export interface OrderStep {
  readonly status: OrderStatus;
  readonly label: string;
}

/** Satu baris barang dalam pesanan. */
export class OrderLine {
  constructor(
    readonly product: Product,
    readonly quantity: number,
  ) {}

  get total(): number {
    return this.product.price * this.quantity;
  }
}

/**
 * Pesanan milik pembeli (hasil lacak pesanan).
 * Semua properti readonly: pesanan tidak bisa diubah dari frontend.
 */
export class Order {
  static readonly STEPS: readonly OrderStep[] = [
    { status: OrderStatus.Dibuat, label: 'Pesanan dibuat' },
    { status: OrderStatus.Dibayar, label: 'Pembayaran diterima' },
    { status: OrderStatus.Dikemas, label: 'Sedang dikemas' },
    { status: OrderStatus.Dikirim, label: 'Dalam pengiriman' },
    { status: OrderStatus.Sampai, label: 'Sampai tujuan' },
  ];

  private static readonly ID_PATTERN = /^MP-\d{6}$/;

  readonly id: string;
  readonly status: OrderStatus;
  readonly courier: string;
  readonly trackingNumber: string | null;
  readonly eta: string;
  readonly maskedAddress: string;
  readonly lines: readonly OrderLine[];
  private readonly timeline: Partial<Record<OrderStatus, string>>;

  constructor(dto: OrderDTO, lines: OrderLine[]) {
    this.id = dto.id;
    this.status = dto.status;
    this.courier = dto.courier;
    this.trackingNumber = dto.resi;
    this.eta = dto.eta;
    this.maskedAddress = dto.address;
    this.lines = lines;
    this.timeline = dto.timeline;
  }

  /** "mp261104", "MP 261104", "mp-261104" -> "MP-261104" */
  static normalizeId(raw: string): string {
    return raw.trim().toUpperCase().replace(/^MP[\s-]*/, 'MP-');
  }

  static isValidId(id: string): boolean {
    return Order.ID_PATTERN.test(id);
  }

  get stepIndex(): number {
    return Order.STEPS.findIndex((step) => step.status === this.status);
  }

  get statusLabel(): string {
    return Order.STEPS[this.stepIndex]?.label ?? this.status;
  }

  get isDelivered(): boolean {
    return this.status === OrderStatus.Sampai;
  }

  get total(): number {
    return this.lines.reduce((sum, line) => sum + line.total, 0);
  }

  /** Waktu suatu tahap tercapai, atau null bila belum. */
  timeOf(status: OrderStatus): string | null {
    return this.timeline[status] ?? null;
  }

  canBeReturned(): boolean {
    return this.isDelivered;
  }
}
