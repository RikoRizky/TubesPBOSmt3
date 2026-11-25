import { Category, OrderStatus, PetType } from '../../models/enums';
import type { OrderDTO, ProductDTO } from '../../models/dto';

/*
 * Data contoh selama backend belum siap.
 * Bentuknya sama persis dengan JSON yang nanti dikirim backend C#.
 * Urutan sengaja diselang-seling antar jenis hewan agar halaman pertama beragam.
 */

const img = (id: string): string => `assets/images/products/${id}.jpg`;
const { Kucing, Anjing, Burung, Ikan } = PetType;
const { Makanan, Camilan, Mainan, Perlengkapan } = Category;

export const MOCK_PRODUCTS: readonly ProductDTO[] = [
  { id: 'p01', pet: Kucing, category: Makanan, name: 'Makanan Kering Kitten Salmon 1,5 kg', price: 145000, oldPrice: 189000, rating: 4.9, reviews: 1240, stock: 32, image: img('p01') },
  { id: 'p07', pet: Anjing, category: Makanan, name: 'Makanan Kering Anjing Dewasa 3 kg', price: 189000, oldPrice: 229000, rating: 4.8, reviews: 980, stock: 25, image: img('p07') },
  { id: 'p14', pet: Burung, category: Makanan, name: 'Pakan Biji Campur Lovebird 1 kg', price: 38000, rating: 4.8, reviews: 1340, badge: 'Terlaris', stock: 140, image: img('p14') },
  { id: 'p19', pet: Ikan, category: Makanan, name: 'Pelet Ikan Hias Tropis 100 g', price: 25000, rating: 4.8, reviews: 1890, badge: 'Terlaris', stock: 200, image: img('p19') },
  { id: 'p09', pet: Anjing, category: Camilan, name: 'Biskuit Tulang Keju & Bacon 500 g', price: 45000, rating: 4.9, reviews: 1820, badge: 'Terlaris', stock: 55, image: img('p09') },
  { id: 'p03', pet: Kucing, category: Camilan, name: 'Camilan Creamy Tuna isi 4', price: 32000, oldPrice: 40000, rating: 4.8, reviews: 2120, stock: 85, image: img('p03') },
  { id: 'p20', pet: Ikan, category: Makanan, name: 'Pelet Koi Pewarna 1 kg', price: 78000, oldPrice: 92000, rating: 4.8, reviews: 760, stock: 50, image: img('p20') },
  { id: 'p10', pet: Anjing, category: Mainan, name: 'Boneka Gajah Squeaky', price: 59000, rating: 4.8, reviews: 760, stock: 30, image: img('p10') },
  { id: 'p05', pet: Kucing, category: Perlengkapan, name: 'Kasur Donat Fluffy', price: 175000, rating: 4.9, reviews: 1930, badge: 'Terlaris', stock: 18, image: img('p05') },
  { id: 'p15', pet: Burung, category: Camilan, name: 'Millet Tangkai 250 g', price: 22000, rating: 4.7, reviews: 620, stock: 90, image: img('p15') },
  { id: 'p02', pet: Kucing, category: Makanan, name: 'Makanan Basah Kucing Tuna 400 g', price: 28500, rating: 4.8, reviews: 3410, badge: 'Terlaris', stock: 120, image: img('p02') },
  { id: 'p11', pet: Anjing, category: Mainan, name: 'Mainan Tulang Karet Anti Gigit', price: 69000, oldPrice: 85000, rating: 4.7, reviews: 530, stock: 22, image: img('p11') },
  { id: 'p23', pet: Ikan, category: Perlengkapan, name: 'Akuarium Set 60 cm + Lampu LED', price: 689000, oldPrice: 799000, rating: 4.9, reviews: 180, stock: 7, image: img('p23') },
  { id: 'p16', pet: Burung, category: Camilan, name: 'Biji Bunga Matahari 500 g', price: 27000, oldPrice: 32000, rating: 4.6, reviews: 480, stock: 75, image: img('p16') },
  { id: 'p13', pet: Anjing, category: Perlengkapan, name: 'Kasur Anjing Ortopedi Ukuran M', price: 329000, oldPrice: 389000, rating: 4.9, reviews: 690, stock: 9, image: img('p13') },
  { id: 'p04', pet: Kucing, category: Mainan, name: 'Tongkat Bulu Interaktif', price: 35000, oldPrice: 45000, rating: 4.7, reviews: 1500, stock: 40, image: img('p04') },
  { id: 'p21', pet: Ikan, category: Camilan, name: 'Udang Kering Premium 200 g', price: 35000, rating: 4.7, reviews: 390, stock: 65, image: img('p21') },
  { id: 'p06', pet: Kucing, category: Perlengkapan, name: 'Pasir Kayu Pinus 10 L', price: 89000, oldPrice: 105000, rating: 4.8, reviews: 2710, stock: 60, image: img('p06') },
  { id: 'p08', pet: Anjing, category: Makanan, name: 'Makanan Basah Anjing Chicken Stew', price: 32000, rating: 4.7, reviews: 640, badge: 'Baru', stock: 70, image: img('p08') },
  { id: 'p17', pet: Burung, category: Perlengkapan, name: 'Sangkar Burung Bulat Antik', price: 245000, rating: 4.8, reviews: 210, stock: 6, image: img('p17') },
  { id: 'p12', pet: Anjing, category: Perlengkapan, name: 'Tali Tuntun Nilon 1,5 m', price: 55000, rating: 4.6, reviews: 410, stock: 48, image: img('p12') },
  { id: 'p18', pet: Burung, category: Perlengkapan, name: 'Tempat Pakan Gantung Anti Tumpah', price: 49000, rating: 4.5, reviews: 330, badge: 'Baru', stock: 40, image: img('p18') },
  { id: 'p22', pet: Ikan, category: Perlengkapan, name: 'Akuarium Bulat 5 L', price: 129000, rating: 4.6, reviews: 270, badge: 'Baru', stock: 0, image: img('p22') },
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
    items: [{ productId: 'p07', qty: 1 }, { productId: 'p06', qty: 2 }],
    timeline: { dibuat: '2026-11-06T09:12:00+07:00', dibayar: '2026-11-06T09:15:00+07:00', dikemas: '2026-11-06T10:40:00+07:00' },
  },
  {
    id: 'MP-261104', email: 'demo@meowplace.id', status: OrderStatus.Dikirim,
    courier: 'JNE REG', resi: 'JNE0012345678', eta: 'Sabtu, 8 Nov 2026',
    address: 'Jl. Ce***** Raya No. 4, Bandung',
    items: [{ productId: 'p05', qty: 1 }, { productId: 'p03', qty: 2 }],
    timeline: { dibuat: '2026-11-04T19:02:00+07:00', dibayar: '2026-11-04T19:09:00+07:00', dikemas: '2026-11-05T08:30:00+07:00', dikirim: '2026-11-05T16:45:00+07:00' },
  },
  {
    id: 'MP-261028', email: 'demo@meowplace.id', status: OrderStatus.Sampai,
    courier: 'SiCepat BEST', resi: 'SCP0098765432', eta: 'Diterima 30 Okt 2026',
    address: 'Jl. An***** No. 7, Depok',
    items: [{ productId: 'p19', qty: 3 }, { productId: 'p14', qty: 1 }],
    timeline: { dibuat: '2026-10-28T11:20:00+07:00', dibayar: '2026-10-28T11:22:00+07:00', dikemas: '2026-10-28T14:05:00+07:00', dikirim: '2026-10-29T09:10:00+07:00', sampai: '2026-10-30T13:05:00+07:00' },
  },
];
