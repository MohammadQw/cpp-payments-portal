import { describe, expect, it } from 'vitest';
import { PaymentService } from '../src/payments/service.js';

describe('PaymentService', () => {
  it('creates once per idempotency key', () => {
    const s = new PaymentService();
    const a = s.create({ customerId: 'c1', amountFils: 12_500, idempotencyKey: 'k1' });
    const b = s.create({ customerId: 'c1', amountFils: 12_500, idempotencyKey: 'k1' });
    expect(b.replayed).toBe(true);
    expect(b.payment.id).toBe(a.payment.id);
  });

  it('refuses a reused key with a different amount', () => {
    const s = new PaymentService();
    s.create({ customerId: 'c1', amountFils: 1000, idempotencyKey: 'k1' });
    expect(() => s.create({ customerId: 'c1', amountFils: 2000, idempotencyKey: 'k1' })).toThrow(/different request/);
  });

  it('rejects non-integer or excessive amounts', () => {
    const s = new PaymentService();
    expect(() => s.create({ customerId: 'c1', amountFils: 10.5, idempotencyKey: 'k1' })).toThrow();
    expect(() => s.create({ customerId: 'c1', amountFils: 6_000_000, idempotencyKey: 'k2' })).toThrow(/5,000 KWD/);
  });

  it('only allows valid state transitions, and repeats are harmless', () => {
    const s = new PaymentService();
    const { payment } = s.create({ customerId: 'c1', amountFils: 500, idempotencyKey: 'k1' });
    s.transition(payment.id, 'pending');
    s.transition(payment.id, 'captured', 'K1');
    expect(s.transition(payment.id, 'captured').status).toBe('captured');
    expect(() => s.transition(payment.id, 'failed')).toThrow(/Cannot move/);
  });
});
