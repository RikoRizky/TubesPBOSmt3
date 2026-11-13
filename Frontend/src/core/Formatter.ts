/**
 * Kelas utilitas statis untuk format angka & tanggal gaya Indonesia.
 * Constructor dibuat private: kelas ini tidak untuk dibuat objeknya.
 */
export class Formatter {
  private static readonly rupiahFormat = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  });

  private static readonly dateTimeFormat = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  private constructor() {}

  /** 145000 -> "Rp145.000" */
  static rupiah(amount: number): string {
    return Formatter.rupiahFormat.format(amount).replace(/\s/g, '');
  }

  /** 1240 -> "1,2rb" */
  static compact(value: number): string {
    if (value < 1000) return String(value);
    return `${(value / 1000).toFixed(1).replace('.', ',').replace(',0', '')}rb`;
  }

  /** 4.9 -> "4,9" */
  static decimal(value: number, digits = 0): string {
    return value.toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  /** ISO -> "4 Nov, 19.02" */
  static dateTime(iso: string): string {
    return Formatter.dateTimeFormat.format(new Date(iso)).replace(' pukul', ',');
  }
}
