export type PaymentStatus = 'created' | 'pending' | 'captured' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  customerId: string;
  /** Integer fils (1 KWD = 1000 fils). Never a float. */
  amountFils: number;
  currency: 'KWD';
  status: PaymentStatus;
  idempotencyKey: string;
  gatewayReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentInput {
  customerId: string;
  amountFils: number;
  idempotencyKey: string;
}
