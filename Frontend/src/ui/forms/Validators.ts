import { Order } from '../../models/Order';

/**
 * INTERFACE: aturan validasi satu isian.
 * Mengembalikan pesan galat, atau null bila valid.
 * Setiap aturan adalah kelas sendiri, lalu dipakai bersama secara
 * POLIMORFIS oleh FormField: (validator.validate(...)).
 */
export interface IValidator {
  validate(value: string): string | null;
}

export class RequiredValidator implements IValidator {
  constructor(private readonly message: string) {}

  validate(value: string): string | null {
    return value.trim() ? null : this.message;
  }
}

export class EmailValidator implements IValidator {
  private static readonly PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  constructor(private readonly message = 'Format email belum benar. Contoh: nama@email.com') {}

  validate(value: string): string | null {
    const email = value.trim();
    return !email || EmailValidator.PATTERN.test(email) ? null : this.message;
  }
}

export class OrderIdValidator implements IValidator {
  validate(value: string): string | null {
    if (!value.trim()) return null;
    return Order.isValidId(Order.normalizeId(value)) ? null : 'Format nomor pesanan: MP-123456.';
  }
}
