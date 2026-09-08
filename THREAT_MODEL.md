# Threat Model

Format: **Threat → Control → Test**. "Test" means how this was actually
verified in this codebase — a specific automated test, a specific curl/
browser session run during development, or (where marked) a control that
exists in code but has only been reasoned about, not exercised, because it
depends on infrastructure (a real TLS cert, a real third-party account)
this environment doesn't have.

---

### 1. Fake seller (an attacker registers and gets seller privileges without going through approval)

- **Control**: `role: 'SELLER'` is never client-settable — `registerSchema`
  is `.strict()` and has no `role` field at all; the only path to `SELLER`
  is `seller.service.decideApplication` flipping it, which only an admin
  route can reach (`adminRouter.use(requireAuth(), requireRole('ADMIN'))`).
- **Test**: `POST /auth/register` with `{"role":"ADMIN"}` in the body is
  rejected by Zod's strict-mode "unrecognized key" error before it ever
  reaches the database (verified during Phase 0).

### 2. Fake payment confirmation (client claims "payment succeeded" without actually paying)

- **Control**: `order.orderStatus` only becomes `PAID` inside
  `payment.service.handleWebhook`, never from any customer-facing route.
  The webhook itself requires a valid signature
  (`paymentProvider.verifySignature`) before touching order/inventory state.
- **Test**: verified during Phase 7 — a webhook call with a tampered
  `signature` field is rejected (400 `INVALID_WEBHOOK_SIGNATURE`) and the
  order stays `PAYMENT_PENDING`.

### 3. Price manipulation (client sends a lower price at checkout)

- **Control**: `order.service.createOrder` re-fetches every `Product`
  fresh from the database inside the transaction and computes
  `unitPrice`/`subtotal` server-side; nothing from the cart's client-visible
  `priceSnapshot` or the request body is ever used for money math.
- **Test**: verified during Phase 6 — changing a product's price after
  adding it to cart and before checkout produces an order using the new
  server-side price, not the stale client-side one.

### 4. Stock race condition (two customers buy the last unit simultaneously)

- **Control**: `inventoryReservation.service.reserveInventoryInSession`
  uses an atomic `findOneAndUpdate` with a `$gte` guard — the check-and-
  decrement is one indivisible MongoDB operation per product, and the
  whole multi-item reservation runs inside a transaction alongside the
  `Order` write.
- **Test**: `server/tests/inventory.test.ts` — "prevents overselling under
  concurrent reservation of the last unit" fires two simultaneous
  reservations against a stock=1 product and asserts exactly one succeeds.
  This is a real concurrency test, not just a code-review argument.

### 5. Coupon abuse (exceeding usage limits via concurrent requests, or reusing a failed order's coupon)

- **Control**: `Coupon.usedCount` is incremented via the same atomic
  `$inc`-with-`$lt`-guard pattern as inventory; `CouponUsage` is written
  only inside the same transaction as a successful `PAID`-bound order
  creation, so a failed/expired order never consumes a use.
- **Test**: verified during Phase 12 — a `usageLimit: 1` coupon correctly
  blocks a second customer (409) while the transaction rollback leaves
  their own checkout completable without the coupon.

### 6. Cross-seller access (Seller A reads or modifies Seller B's data)

- **Control**: every seller-facing service resolves the acting seller via
  `getSellerByUserId(req.user.sub)` and scopes every query to that
  seller's own `_id` — `SellerFulfillment`, `SellerPickupLocation`,
  `SellerEarning`, and `Product` ownership checks all work this way. A
  cross-seller request 404s (resource doesn't exist *for you*), not 403
  (which would confirm the resource exists at all).
- **Test**: verified repeatedly (Phases 2, 3, 8) — Seller B attempting to
  read/edit/delete Seller A's pickup location or product returns 404.

### 7. Order ID guessing (enumerating `/orders/:id` to view someone else's order)

- **Control**: `order.service.getMyOrder` filters by `{_id: orderId,
  customerId: userId}` — an order ID alone is never sufficient; it must
  also belong to the requesting user.
- **Test**: verified during Phase 6 — a second customer requesting another
  customer's order ID gets 404.

### 8. JWT theft (a stolen access token used from another location)

- **Control**: access tokens are short-lived (15 min) specifically to
  bound this exposure window; they're never persisted (kept in JS memory
  on the client, never localStorage), and they're stateless so a stolen
  token can't be individually revoked before it expires — see #9 for the
  mitigation on the token that CAN be revoked (the refresh token).
- **Test**: reasoned about, not directly tested — there's no practical way
  to "test" that a 15-minute window is an acceptable tradeoff versus,
  say, 5 minutes; this is a design decision, not a verifiable property.

### 9. Refresh-token replay (a captured refresh token reused after rotation)

- **Control**: refresh tokens rotate on every use (`auth.service.refresh`
  marks the old `Session.revokedAt` and issues a new one); presenting an
  already-revoked token is treated as reuse and revokes the *entire*
  session family for that user, forcing re-authentication everywhere.
- **Test**: verified directly this session — after an admin-suspend action
  revoked a customer's session, presenting that same (now-revoked) refresh
  cookie again correctly triggered `REFRESH_TOKEN_REUSE_DETECTED` and was
  rejected (401), visible in the audit log.

### 10. Malicious upload (executable content disguised as an image)

- **Control**: three layers — (a) MIME allowlist, (b) magic-byte
  verification of the actual file bytes against the claimed type (a
  renamed `.txt` claiming `image/png` fails this even though multer's own
  mimetype check would pass it), (c) dimension-limit check on the decoded
  header, (d) the storage filename is always server-generated (a random
  UUID), never the client's original filename, and served with
  `X-Content-Type-Options: nosniff` — so even a maliciously crafted file
  that passed the above can't be served as anything other than its
  declared content-type or under an attacker-chosen name.
- **Test**: verified this session — a `.txt` file renamed to claim
  `image/png` is rejected (400 `INVALID_FILE_CONTENT`); a genuine but
  oversized PNG (7000×100px) is rejected (400 `IMAGE_TOO_LARGE`).

### 11. Webhook spoofing (a forged payment or shipment webhook call)

- **Control**: both webhook handlers verify a provider signature before
  processing (`paymentProvider.verifySignature`,
  `shippingProvider.verifyWebhookSignature`) and are idempotent via a
  unique index on the event id (`PaymentEvent`/`ShipmentEvent`), so a
  replayed *legitimate* event can't double-process either.
- **Test**: verified this session for both — an invalid signature is
  rejected (400) and audit-logged (`PAYMENT_WEBHOOK_INVALID_SIGNATURE` /
  `SHIPMENT_WEBHOOK_INVALID_SIGNATURE`); a duplicate valid event is a
  no-op (`{"duplicate": true}`), verified for both payment and shipment
  webhooks in Phases 7 and 9.
- **Known gap**: `RazorpayPaymentProvider.verifySignature` implements
  Razorpay's *client-checkout* signature scheme, not its *webhook*
  scheme (different secret, different algorithm, raw-body-based) — see
  the detailed comment in that file. This app's mock-first webhook
  contract is solid; a real Razorpay webhook integration needs that gap
  closed first.

### 12. API brute force (credential stuffing against login, or password-reset token guessing)

- **Control**: `/auth/login` and `/auth/register` are rate-limited (20
  requests/15min per IP); `/auth/forgot-password` and `/auth/reset-password`
  carry a tighter limit (5/15min) since they're a higher-value target with
  lower legitimate volume. The reset token itself is 256 bits of random
  entropy (`crypto.randomBytes(32)`), making brute force computationally
  infeasible independent of rate limiting.
- **Test**: rate limiting itself wasn't load-tested (would require
  sending 20+ real requests in an automated test, which felt like more
  noise than signal); the *logic* each limiter gates was tested directly
  instead (invalid credentials, invalid/expired/reused reset tokens).

### 13. Admin privilege escalation

- **Control**: `role` is never client-settable at registration (#1); the
  only role transitions are `CUSTOMER→SELLER` (admin-gated, `#1`) and
  there is no route anywhere that sets `role: 'ADMIN'` — admin accounts
  only exist via the dev-only seed script or (in a real deployment) direct
  database provisioning. `user.service.setUserStatus` explicitly refuses
  to suspend an admin account, and no endpoint lets one admin promote a
  user to admin.
- **Test**: verified by code inspection — grepping the entire codebase for
  every place `role` is written confirms `ADMIN` is never assignable
  through any HTTP route.

### 14. Account enumeration via password reset

- **Control**: `POST /auth/forgot-password` returns the identical generic
  message regardless of whether the email exists, and only sends an email
  (and only logs anything distinguishing) when it does — the HTTP
  response never reveals which case occurred.
- **Test**: verified this session — both a real and a fake email produced
  byte-identical API responses; the mock email log confirmed the real
  send only fired for the real account.

### 15. CSRF (forged cross-site state-changing request)

- **Control**: the primary defense is architectural — all Bearer-
  authenticated routes (the vast majority of mutating endpoints: orders,
  payments, addresses, seller/admin actions) aren't CSRF-exposed at all,
  since a cross-site request can't attach an `Authorization` header the
  way a cookie is attached ambiently. The narrower cookie-only surface
  (`/auth/refresh`, `/auth/logout`, guest cart mutations) is protected by
  a double-submit CSRF cookie (`requireCsrfToken` middleware), primed
  globally on first contact so a brand-new session's first mutation
  doesn't fail the check.
- **Test**: verified this session directly — a guest cart mutation with no
  `X-CSRF-Token` header (403), a wrong token (403), and the correct token
  (201) all behaved as designed; a Bearer-authenticated request needs no
  CSRF header at all and still succeeds.

---

## What this document doesn't cover

This maps threats *this application's code* defends against. It does not
cover infrastructure-level threats (DDoS, BGP hijacking, a compromised
cloud account, a malicious dependency in the supply chain) — those are
real and belong in a platform-level threat model once this app has an
actual deployment target, not a code-level one.
