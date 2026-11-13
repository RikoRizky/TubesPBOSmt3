export interface SubscribeResult {
  voucher: string;
}

/** INTERFACE: pendaftaran newsletter Klub Meow. */
export interface INewsletterService {
  subscribe(email: string): Promise<SubscribeResult>;
}
