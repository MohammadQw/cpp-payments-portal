import express from 'express';
import { verify } from './payments/signature.js';
import { PaymentError, PaymentService } from './payments/service.js';

export function createApp(service = new PaymentService(), secret = process.env.KNET_CALLBACK_SECRET ?? '') {
  if (!secret) throw new Error('KNET_CALLBACK_SECRET must be set.');
  const app = express();

  app.get('/health', (_req, res) => res.json({ status: 'healthy', service: 'cpp-payments-portal' }));

  app.post('/payments', express.json(), (req, res) => {
    try {
      const { payment, replayed } = service.create({
        customerId: String(req.body?.customerId ?? ''),
        amountFils: Number(req.body?.amountFils),
        idempotencyKey: String(req.header('Idempotency-Key') ?? ''),
      });
      service.transition(payment.id, 'pending');
      res.status(replayed ? 200 : 201).json({ ...payment, redirectUrl: `https://knet.example/pay/${payment.id}` });
    } catch (e) {
      const err = e as PaymentError;
      res.status(err.status ?? 500).json({ error: err.message });
    }
  });

  // Raw body: the signature covers the exact bytes the gateway sent.
  app.post('/callbacks/knet', express.text({ type: '*/*' }), (req, res) => {
    const raw = typeof req.body === 'string' ? req.body : '';
    if (!verify(raw, req.header('X-Signature'), secret)) return res.status(401).json({ error: 'Invalid signature.' });
    try {
      const body = JSON.parse(raw) as { paymentId: string; result: 'CAPTURED' | 'FAILED'; reference: string };
      const p = service.transition(body.paymentId, body.result === 'CAPTURED' ? 'captured' : 'failed', body.reference);
      return res.json({ id: p.id, status: p.status });
    } catch (e) {
      const err = e as PaymentError;
      return res.status(err.status ?? 400).json({ error: err.message ?? 'Malformed callback.' });
    }
  });

  return app;
}

if (process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  const port = Number(process.env.PORT ?? 3000);
  createApp().listen(port, () => console.log(`CPP listening on http://localhost:${port}`));
}
