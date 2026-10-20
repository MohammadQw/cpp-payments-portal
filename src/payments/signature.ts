import { createHmac, timingSafeEqual } from 'node:crypto';

/** HMAC-SHA256 of the exact raw body, hex encoded — what the gateway sends in X-Signature. */
export function sign(rawBody: string, secret: string): string {
  return createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
}

/** Constant-time comparison; false for any malformed or missing signature. */
export function verify(rawBody: string, signature: string | undefined, secret: string): boolean {
  if (!signature || !/^[0-9a-f]{64}$/i.test(signature)) return false;
  const expected = Buffer.from(sign(rawBody, secret), 'hex');
  const given = Buffer.from(signature, 'hex');
  return expected.length === given.length && timingSafeEqual(expected, given);
}
