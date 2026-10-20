import { describe, expect, it } from 'vitest';
import { sign, verify } from '../src/payments/signature.js';

describe('callback signatures', () => {
  const body = '{"paymentId":"p1","result":"CAPTURED","reference":"K123"}';
  it('accepts the gateway signature', () => expect(verify(body, sign(body, 's3cret'), 's3cret')).toBe(true));
  it('rejects a tampered body', () => expect(verify(body.replace('CAPTURED', 'FAILED'), sign(body, 's3cret'), 's3cret')).toBe(false));
  it('rejects the wrong secret', () => expect(verify(body, sign(body, 'other'), 's3cret')).toBe(false));
  it('rejects missing or malformed signatures', () => {
    expect(verify(body, undefined, 's3cret')).toBe(false);
    expect(verify(body, 'not-hex', 's3cret')).toBe(false);
  });
});
