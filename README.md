# taxdeedpack.com

Production storefront for **Joshua Israel Ventures LLC** selling the **Tax Deed Due Diligence Research Pack** at **$149 USD per property**.

This repository is a free-hosting stack:

- **Marketing site:** static files in `site/`, hosted on **GitHub Pages** at `taxdeedpack.com`
- **API, Stripe, PDF, email, ops:** Cloudflare Worker + D1 in `api/` and `worker/`
- **Shared compliance copy and US-state gate:** `shared/`

Paid Vercel is not required.

## Product (locked)

INFORMATION AND RESEARCH PRODUCT ONLY. Not appraisal, attorney, title, broker, investment adviser, surveyor, engineer, or zoning professional.

| Item | Value |
| --- | --- |
| Price | $149 USD per property |
| Turnaround | Within about 4 business hours after payment and a usable address or APN |
| Delivery | PDF emailed to the buyer |
| Ops | joshuaofisrael@gmail.com |

**What you get:** public record snapshot; sold comps data table (raw sales only); lien/tax/obligation flags as Public-Record Items Identified for Further Review; sale type and timing notes; Land-Use and Development Data checklist (PASS / FAIL / UNKNOWN); source links and open questions.

**What you do not get:** appraisal; CMA/BPO; market value opinion; recommended or maximum bid; IRR/investment advice; legal advice; title insurance, title commitment, or title search.

Compliance is locked in `shared/disclaimer.js` and must stay identical in the UI, PDFs, emails, and APIs:

- Raw comps are transaction data only (no JIV value opinion, value band, or ARV)
- Bid Scenario Analysis is labeled hypotheticals only (no recommended or maximum bid)
- Public-Record Items Identified for Further Review (never a surviving-lien or title conclusion)
- Land-Use and Development Data (no buildable conclusions)
- Cite sources; mark **NOT VERIFIED** when unknown
- Required **IMPORTANT LIMITATIONS** disclaimer on every pack (cover and last page) and as an order-form acknowledgment
- Omit conclusions when unsure
- Never claim broker or appraiser status
- No UK / London location tells in customer-facing copy

Customer-facing email copy in `shared/email-copy.js` contains no hyphens or dashes.

## Local happy path

```bash
npm install
npm test
npm run happy-path
npm run dev
```

Then open [http://127.0.0.1:8787](http://127.0.0.1:8787).

Local mode (no Stripe key) still runs the full pipeline:

1. Complete `/order.html` (address and/or APN, county, state, buyer, checklist, disclaimer)
2. Submit creates an order and a test checkout URL
3. Success page (or `POST /api/test/pay/:orderId`) marks the order paid
4. Worker generates a structured PDF for the selected sections (public-data **stubs** until live county adapters are wired)
5. Email is logged when `RESEND_API_KEY` is empty, or sent through Resend when the key is set
6. Referral code `BRENDA` is stored as `code`, `order_id`, `amount_cents`, `timestamp`

Ops view: [http://127.0.0.1:8787/ops](http://127.0.0.1:8787/ops)  
Default local password: `local-ops` (HTTP Basic or `Authorization: Bearer local-ops`)

### Stripe test mode (optional)

```bash
cp .env.example .env
# set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET
npx stripe listen --forward-to localhost:8787/api/webhook
npm run dev
```

Use Stripe Checkout test cards. The webhook handler verifies `Stripe-Signature` when `STRIPE_WEBHOOK_SECRET` is set. Amount is always $149.00 from the server (`shared/disclaimer.js`), never from the browser.

## Referral seed

Seeded in the database migration:

| Code | Partner |
| --- | --- |
| `BRENDA` | Brenda / US Tax Deed Solutions |
| `USTDS` | Same partner (alias) |

Tracking columns: `code`, `order_id`, `amount_cents`, `created_at`. Brenda totals appear on the ops summary.

## Jurisdiction matrix

`shared/jurisdiction.js` is the documented US-state (plus DC and territories) safety gate.

- Only public-record research items are offerable
- Appraisal, CMA/BPO, recommended/max bid, title opinions, surviving-lien conclusions, legal/tax/investment advice, and buildable conclusions are **never** offered
- Heightened appraisal-enforcement states keep Bid Scenario Analysis on extra-caution hypotheticals only
- Unreviewed jurisdictions use the **safer research-only default** plus the required disclaimer
- The API re-applies the gate on checkout; the order form disables items in the browser

`GET /api/jurisdiction/FL` and `GET /api/jurisdiction` expose the matrix.

## Repository layout

```
site/                 GitHub Pages marketing + order form + legal pages
api/                  Hono API (Node and Cloudflare Worker)
shared/               Locked copy, sections, jurisdiction, PDF, email
worker/               wrangler.toml + D1 migrations
tests/                Vitest: compliance, gate, PDF, Brenda happy path
.github/workflows/    Test, Pages deploy, Worker deploy
```

## Deploy

### 1. GitHub Pages (marketing)

1. Push `main`
2. Repo **Settings → Pages → GitHub Actions**
3. The `Deploy GitHub Pages` workflow publishes `site/`
4. `site/CNAME` is `taxdeedpack.com`

### 2. taxdeedpack.com DNS

At the DNS host for `taxdeedpack.com` (if GitHub Pages is **not** proxied):

**Apex A records**

- `185.199.108.153`
- `185.199.109.153`
- `185.199.110.153`
- `185.199.111.153`

**AAAA records**

- `2606:50c0:8000::153`
- `2606:50c0:8001::153`
- `2606:50c0:8002::153`
- `2606:50c0:8003::153`

**www CNAME** → `joshuaofisrael.github.io`

In the GitHub repo, add the custom domain `taxdeedpack.com` and wait for the TLS certificate. Enable **Enforce HTTPS**.

If Cloudflare is the DNS host, use CNAME flattening for `@` → `joshuaofisrael.github.io` and a CNAME for `www`. Do **not** orange-cloud proxy GitHub Pages unless you have tested HTTPS and the GitHub custom-domain check still passes.

### 3. Cloudflare Worker API (free tier)

```bash
npx wrangler login
npx wrangler d1 create taxdeedpack
# paste the database_id into worker/wrangler.toml
npx wrangler d1 migrations apply taxdeedpack --remote --config worker/wrangler.toml
npx wrangler deploy --config worker/wrangler.toml
```

Attach a custom route or Worker custom domain:

- `api.taxdeedpack.com` → this Worker

Set Worker secrets (Cloudflare dashboard or CLI):

```bash
npx wrangler secret put STRIPE_SECRET_KEY --config worker/wrangler.toml
npx wrangler secret put STRIPE_WEBHOOK_SECRET --config worker/wrangler.toml
npx wrangler secret put RESEND_API_KEY --config worker/wrangler.toml
npx wrangler secret put OPS_PASSWORD --config worker/wrangler.toml
```

Worker vars already in `worker/wrangler.toml`:

- `SITE_URL=https://taxdeedpack.com`
- `ALLOW_ORIGIN=https://taxdeedpack.com`
- `ALLOW_TEST_CHECKOUT=0` (keep off in production)
- `MAIL_FROM=Joshua Israel Ventures LLC <reports@taxdeedpack.com>`

GitHub Actions workflow `Deploy Cloudflare Worker` runs on `workflow_dispatch` after you add repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

### 4. Stripe

1. Create a product-less Checkout price in code (`price_data`, $149.00 USD)
2. Add a webhook endpoint: `https://api.taxdeedpack.com/api/webhook`
3. Subscribe to `checkout.session.completed` (and `checkout.session.async_payment_succeeded` if you enable delayed methods)
4. Put the signing secret in `STRIPE_WEBHOOK_SECRET`

### 5. Email (Resend, free tier)

1. Add and verify `taxdeedpack.com` in Resend
2. Send from `reports@taxdeedpack.com` (or change `MAIL_FROM`)
3. Until the key is set, fulfillment still generates the PDF and logs the email payload (useful in CI)

### 6. Ops

Production ops: `https://api.taxdeedpack.com/ops`

HTTP Basic or `Authorization: Bearer $OPS_PASSWORD`.

Shows orders, status, Brenda referral stats, and resend email.

## Preferred partners

Verified working URLs, labeled as preferred partners (independent of this pack):

- [Title and Abstract Agency of America](https://www.titleandabstract.com)
- [US Tax Deed Solutions](https://www.ustaxdeedsolutions.com)

## Legal pages

- [Disclaimer](https://taxdeedpack.com/disclaimer.html)
- [Terms](https://taxdeedpack.com/terms.html)
- [Privacy](https://taxdeedpack.com/privacy.html)

## Tests

```bash
npm test
npm run happy-path
```

Coverage includes the locked disclaimer, US-state matrix, Brenda referral row (`code`, order id, $149, timestamp), PDF `%PDF` output, and webhook idempotency.

Public-data adapters in `shared/public-data-stubs.js` are honest stubs: they cite the intended source and mark values **NOT VERIFIED** until live county pulls are connected.
