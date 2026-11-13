import type { OrderStatus } from './enums';

/*
 * DTO (Data Transfer Object) = bentuk data JSON mentah dari backend.
 * Interface ini harus sama dengan class DTO di backend C#.
 * DTO tidak punya perilaku; perilakunya ada di kelas model (Product, Order).
 */

export type ArtType =
  | 'bag' | 'can' | 'pouch' | 'mouse' | 'yarn'
  | 'wand' | 'scratcher' | 'bed' | 'litter' | 'fountain';

export type PaletteName = 'orange' | 'tangerine' | 'brown' | 'honey' | 'rust' | 'cream';

export interface ArtSpec {
  type: ArtType;
  palette: PaletteName;
}

export interface ProductDTO {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  badge?: string;
  art: ArtSpec;
  tint: string;
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
