import { randomUUID } from 'node:crypto';
import type { CreatePaymentInput, Payment, PaymentStatus } from './types.js';

const ALLOWED: Record<PaymentStatus, PaymentStatus[]> = {
  created: ['pending', 'failed'],
  pending: ['captured', 'failed'],
  captured: ['refunded'],
  failed: [],
  refunded: [],
};

export class PaymentError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

/** In-memory store for the MVP; SQL Server persistence is TASK-003 (see ARC-001 in AKB). */
export class PaymentService {
  private readonly byId = new Map<string, Payment>();
  private readonly byKey = new Map<string, string>();

  create(input: CreatePaymentInput): { payment: Payment; replayed: boolean } {
    if (!Number.isInteger(input.amountFils) || input.amountFils <= 0) throw new PaymentError('amountFils must be a positive integer.', 400);
    if (input.amountFils > 5_000_000) throw new PaymentError('Online payments are limited to 5,000 KWD.', 400);
    if (!input.idempotencyKey || input.idempotencyKey.length > 100) throw new PaymentError('Idempotency-Key header is required.', 400);

    const existing = this.byKey.get(input.idempotencyKey);
    if (existing) {
      const p = this.byId.get(existing)!;
      if (p.amountFils !== input.amountFils || p.customerId !== input.customerId)
        throw new PaymentError('Idempotency-Key was reused with a different request.', 409);
      return { payment: p, replayed: true };
    }

    const now = new Date().toISOString();
    const payment: Payment = {
      id: randomUUID(), customerId: input.customerId, amountFils: input.amountFils, currency: 'KWD',
      status: 'created', idempotencyKey: input.idempotencyKey, createdAt: now, updatedAt: now,
    };
    this.byId.set(payment.id, payment);
    this.byKey.set(input.idempotencyKey, payment.id);
    return { payment, replayed: false };
  }

  get(id: string): Payment | undefined { return this.byId.get(id); }

  transition(id: string, to: PaymentStatus, gatewayReference?: string): Payment {
    const p = this.byId.get(id);
    if (!p) throw new PaymentError('Payment not found.', 404);
    if (p.status === to) return p; // gateways retry callbacks — a repeat is not an error
    if (!ALLOWED[p.status].includes(to)) throw new PaymentError(`Cannot move a ${p.status} payment to ${to}.`, 409);
    p.status = to;
    p.gatewayReference = gatewayReference ?? p.gatewayReference;
    p.updatedAt = new Date().toISOString();
    return p;
  }
}
