import type { OrderStatus } from './enums';

/*
 * DTO (Data Transfer Object) = bentuk data JSON mentah dari backend.
 * Interface ini harus sama dengan class DTO di backend C#.
 * DTO tidak punya perilaku; perilakunya ada di kelas model (Product, Order).
 */

export interface ProductDTO {
  id: string;
  name: string;
  /** makanan | camilan | mainan | perlengkapan */
  category: string;
  /** kucing | anjing | burung | ikan (bila kosong dianggap kucing) */
  pet?: string | null;
  price: number;
  oldPrice?: number | null;
  rating: number;
  reviews: number;
  badge?: string | null;
  /** URL foto produk (bila kosong memakai foto jenis hewannya) */
  image?: string | null;
  /** sisa stok; bila tidak dikirim dianggap selalu tersedia */
  stock?: number | null;
}

export interface OrderItemDTO {
  productId: string;
  qty: number;
  /** Disertakan backend saat melacak pesanan */
  product?: ProductDTO;
}

export interface OrderDTO {
  id: string;
  status: OrderStatus;
  courier: string;
  resi: string | null;
  eta: string;
  /** Alamat yang sudah disamarkan oleh backend */
  address: string;
  items: OrderItemDTO[];
  timeline: Partial<Record<OrderStatus, string>>;
}
