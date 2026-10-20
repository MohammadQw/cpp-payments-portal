# CPP — Customer Payments Portal

Online bill payment for Diyar customers: create a payment, redirect to KNET, and confirm the
result through a **signed** callback. Governed by **AKB** project **CPP** (https://akb.diyardemo.com).

| Environment | Repository | Branches |
|---|---|---|
| Development | [cpp-payments-portal-dev](https://github.com/MohammadQw/cpp-payments-portal-dev) | `develop`, `feature/TASK-NNN-*` |
| Staging (UAT) | [cpp-payments-portal-uat](https://github.com/MohammadQw/cpp-payments-portal-uat) | `uat`, `release/*` |
| Production | [cpp-payments-portal](https://github.com/MohammadQw/cpp-payments-portal) | `main` only |

## Security properties (reviewed at Checkpoint B)

- **Idempotent creation** — the same `Idempotency-Key` never creates two payments.
- **Signed callbacks** — HMAC-SHA256 over the raw body, compared in constant time; unsigned or
  tampered callbacks are rejected and never change a payment's state.
- **No card data** — the portal never sees card numbers; KNET hosts the card page.
- **Amounts in fils** (integer, 1 KWD = 1000 fils) — no floating-point money.

## Run

```bash
npm install
KNET_CALLBACK_SECRET=dev-secret npm run dev   # http://localhost:3000
npm test
```
