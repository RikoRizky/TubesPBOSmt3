import { Category, OrderStatus } from '../../models/enums';
import type { OrderDTO, ProductDTO } from '../../models/dto';

/*
 * Data contoh selama backend belum siap.
 * Bentuknya sama persis dengan JSON yang nanti dikirim backend C#.
 */

export const MOCK_PRODUCTS: readonly ProductDTO[] = [
  { id: 'p01', name: 'Salmon Kitten Dry Food 1,5 kg', category: Category.Makanan, price: 145000, oldPrice: 189000, rating: 4.9, reviews: 1240, art: { type: 'bag', palette: 'orange' }, tint: '#FFE9D6' },
  { id: 'p02', name: 'Tuna Pâté in Gravy 85 g', category: Category.Makanan, price: 18500, rating: 4.8, reviews: 3410, badge: 'Terlaris', art: { type: 'can', palette: 'tangerine' }, tint: '#FFF1CC' },
  { id: 'p03', name: 'Chicken Crunch Treats 60 g', category: Category.Camilan, price: 32000, oldPrice: 40000, rating: 4.8, reviews: 2120, art: { type: 'pouch', palette: 'rust' }, tint: '#FDE5DC' },
  { id: 'p04', name: 'Tikus Plush Isi Catnip', category: Category.Mainan, price: 25000, rating: 4.9, reviews: 980, art: { type: 'mouse', palette: 'brown' }, tint: '#F6ECE1' },
  { id: 'p05', name: 'Menara Garukan Sisal 60 cm', category: Category.Perlengkapan, price: 289000, oldPrice: 349000, rating: 4.8, reviews: 720, art: { type: 'scratcher', palette: 'brown' }, tint: '#FFE9D6' },
  { id: 'p06', name: 'Kasur Donat Fluffy', category: Category.Perlengkapan, price: 175000, rating: 4.9, reviews: 1930, badge: 'Terlaris', art: { type: 'bed', palette: 'cream' }, tint: '#FDE5DC' },
  { id: 'p07', name: 'Salmon Bites Dental 80 g', category: Category.Camilan, price: 29000, rating: 4.6, reviews: 540, badge: 'Baru', art: { type: 'pouch', palette: 'honey' }, tint: '#FFF1CC' },
  { id: 'p08', name: 'Pasir Gumpal Lavender 10 L', category: Category.Perlengkapan, price: 89000, oldPrice: 105000, rating: 4.8, reviews: 2710, art: { type: 'litter', palette: 'honey' }, tint: '#F6ECE1' },
  { id: 'p09', name: 'Adult Indoor Chicken 2 kg', category: Category.Makanan, price: 168000, rating: 4.7, reviews: 860, art: { type: 'bag', palette: 'brown' }, tint: '#F6ECE1' },
  { id: 'p10', name: 'Tongkat Bulu Interaktif', category: Category.Mainan, price: 35000, oldPrice: 45000, rating: 4.7, reviews: 1500, art: { type: 'wand', palette: 'rust' }, tint: '#FFE9D6' },
  { id: 'p11', name: 'Air Mancur Minum 2 L', category: Category.Perlengkapan, price: 219000, rating: 4.7, reviews: 650, badge: 'Baru', art: { type: 'fountain', palette: 'cream' }, tint: '#FDE5DC' },
  { id: 'p12', name: 'Bola Benang Wol Isi 3', category: Category.Mainan, price: 15000, rating: 4.5, reviews: 410, art: { type: 'yarn', palette: 'orange' }, tint: '#FFF1CC' },
];

/** Interface turunan: data pesanan + email pemilik (hanya disimpan di server). */
export interface MockOrderRecord extends OrderDTO {
  email: string;
}

export const MOCK_ORDERS: readonly MockOrderRecord[] = [
  {
    id: 'MP-261106', email: 'demo@meowplace.id', status: OrderStatus.Dikemas,
    courier: 'Kurir MeowPlace (Same Day)', resi: null, eta: 'Jumat, 7 Nov 2026',
    address: 'Jl. Me**** No. 12, Jakarta Timur',
    items: [{ productId: 'p01', qty: 1 }, { productId: 'p08', qty: 2 }],
    timeline: { dibuat: '2026-11-06T09:12:00+07:00', dibayar: '2026-11-06T09:15:00+07:00', dikemas: '2026-11-06T10:40:00+07:00' },
  },
  {
    id: 'MP-261104', email: 'demo@meowplace.id', status: OrderStatus.Dikirim,
    courier: 'JNE REG', resi: 'JNE0012345678', eta: 'Sabtu, 8 Nov 2026',
    address: 'Jl. Ce***** Raya No. 4, Bandung',
    items: [{ productId: 'p06', qty: 1 }, { productId: 'p03', qty: 2 }],
    timeline: { dibuat: '2026-11-04T19:02:00+07:00', dibayar: '2026-11-04T19:09:00+07:00', dikemas: '2026-11-05T08:30:00+07:00', dikirim: '2026-11-05T16:45:00+07:00' },
  },
  {
    id: 'MP-261028', email: 'demo@meowplace.id', status: OrderStatus.Sampai,
    courier: 'SiCepat BEST', resi: 'SCP0098765432', eta: 'Diterima 30 Okt 2026',
    address: 'Jl. An***** No. 7, Depok',
    items: [{ productId: 'p02', qty: 6 }, { productId: 'p12', qty: 1 }],
    timeline: { dibuat: '2026-10-28T11:20:00+07:00', dibayar: '2026-10-28T11:22:00+07:00', dikemas: '2026-10-28T14:05:00+07:00', dikirim: '2026-10-29T09:10:00+07:00', sampai: '2026-10-30T13:05:00+07:00' },
  },
];
