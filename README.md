# taxdeedpack.com

Production storefront and fulfillment API for the **Tax Deed Due Diligence Research Pack** sold by **Joshua Israel Ventures LLC**.

- Price: **$149 USD per property**
- Delivery: PDF emailed to the buyer
- Turnaround: within about 4 business hours after payment and the property address or APN are received
- Domain: [taxdeedpack.com](https://taxdeedpack.com) (registered at Namecheap; point DNS at GitHub Pages)
- Operations contact: joshuaofisrael@gmail.com

This is an **information and research product only**. It is not an appraisal, attorney service, title product, broker service, investment adviser service, survey, engineering report, or zoning professional service.

## What buyers get

1. Public record snapshot
2. Sold comps data table (raw sales only)
3. Lien / tax / obligation flags at research level (not a title search)
4. Sale type and timing notes
5. Zoning / flood / use checklist scored PASS, FAIL, or UNKNOWN
6. Source links and open questions

Optional research section: Bid Scenario Analysis with labeled hypotheticals only.

## What buyers do not get

No appraisal, CMA/BPO, market value opinion, recommended or maximum bid, IRR or investment advice, legal advice, or title insurance.

## Stack (free hosting)

| Piece | Host | Cost |
| --- | --- | --- |
| Marketing site, order form, legal pages, ops UI | GitHub Pages from `site/` | Free on a public repo, or on a private repo with GitHub Pro |
| API, Stripe webhook, PDF, email, D1 database | Cloudflare Workers + D1 | Free tier |
| Card payments | Stripe Checkout | Stripe processing fees only |
| Transactional email | Resend | Free tier is enough to start |

Paid Vercel is **not** required.

```
site/                 GitHub Pages
  index.html          Home
  order.html          Order form + jurisdiction gate
  success.html        Post-Stripe return
  ops.html            Authenticated ops desk
  terms|privacy|disclaimer.html
worker/               Cloudflare Worker
  src/index.ts        /api/checkout, /api/stripe/webhook, /api/ops/*
shared/               Locked compliance + US-state matrix
```

## Locked compliance

Do not weaken this language in UI copy, PDFs, emails, or APIs.

- Raw comps are **transaction data only**. No JIV value opinion, value band, or ARV.
- Bid Scenario Analysis uses **labeled hypotheticals only**. No recommended bid and no maximum bid.
- Use **Public-Record Items Identified for Further Review**. Never call an item a surviving lien and never state a title conclusion.
- Use **Land-Use and Development Data**. No buildable conclusion.
- Cite sources. Mark unknown fields **NOT VERIFIED**.
- Put the required **IMPORTANT LIMITATIONS** text on the cover and last page of every PDF, and require acknowledgment on the order form.
- Omit conclusions when a fact is not verified.
- Never claim broker or appraiser status.
- No UK / London location tells in customer-facing copy.
- Customer-facing email copy uses no hyphen or dash characters.

Required disclaimer (exact):

```
This document is a research compilation prepared by Joshua Israel Ventures LLC for informational purposes only. It is assembled from public records and third party data sources that may be incomplete, delayed, or wrong.
This is NOT: an appraisal; a broker price opinion (BPO); a comparative market analysis (CMA); an opinion of market value; a recommended or maximum bid; investment advice; legal advice; tax advice; or a title search, title commitment, or title insurance.
Joshua Israel Ventures LLC and Joshua Israel are not acting as licensed real estate appraisers or real estate brokers in connection with this document. No agency relationship is created by purchase of this research pack.
You are solely responsible for verifying all information and for all bidding and investment decisions.
```

The matrix lives in `shared/jurisdiction.ts`. Every US state and DC offers public-record research sections and disables licensed appraisal, title opinion, legal conclusion, recommended/max bid, and buildability items. Attorney-title and abstractor-license states get extra notices. When a market is not verified, the safer research-only default plus disclaimer applies.

## Preferred partners

Verified working URLs, labeled **preferred partners**:

- [Title & Abstract Agency of America](https://www.titleandabstract.com)
- [US Tax Deed Solutions](https://www.ustaxdeedsolutions.com)

## Local development

Requires Node 20+.

```bash
npm install
cp .dev.vars.example .dev.vars
npm test
npm run compliance:scan
npm run sample:pdf
npm run simulate:fulfill
```

Site (http://127.0.0.1:4173):

```bash
npm run dev:site
```

API (http://127.0.0.1:8787):

```bash
# First time, create local D1 tables and the BRENDA referral seed
npx wrangler d1 execute taxdeedpack --local --file=worker/schema.sql
npx wrangler d1 execute taxdeedpack --local --file=worker/seed.sql
npm run dev:worker
```

Point the order form at the local worker by uncommenting the override in `site/assets/js/config.local.js`.

### Stripe test keys

1. Create a Stripe account and use **test mode**.
2. Put `sk_test_...` in `.dev.vars` as `STRIPE_SECRET_KEY`.
3. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and forward webhooks:

```bash
stripe listen --forward-to http://127.0.0.1:8787/api/stripe/webhook
```

4. Put the printed `whsec_...` value in `.dev.vars` as `STRIPE_WEBHOOK_SECRET`.

### Happy path (form → Stripe test → webhook → PDF → email)

1. Open http://127.0.0.1:4173/order.html
2. Enter a US property (address and/or APN), county, state, buyer name, and email.
3. Optional referral code: `BRENDA`
4. Leave offered research sections checked. Licensed-service rows stay disabled.
5. Acknowledge the Important Limitations text.
6. Pay with Stripe test card `4242 4242 4242 4242`.
7. The worker creates an order, the webhook marks it paid, a PDF is generated, and Resend emails the buyer.

Without Stripe or Resend, set `ALLOW_DEV_SIMULATE=1` and:

```bash
curl -X POST http://127.0.0.1:8787/api/dev/simulate-payment \
  -H 'content-type: application/json' \
  -d '{"orderId":"JIV..."}'
```

If `RESEND_API_KEY` is empty, fulfillment still generates the PDF and records the order. The skip reason is stored on the order.

### Brenda referral seed

`worker/seed.sql` inserts:

| Code | Partner |
| --- | --- |
| `BRENDA` | Brenda / US Tax Deed Solutions |

Every paid order with a referral code writes `code`, `order_id`, `amount_cents`, and `created_at` to the `referrals` table. The ops view totals Brenda volume separately.

## Ops view

Open `/ops.html`, enter `OPS_TOKEN`, and load orders. You can inspect status, Brenda referral stats, and resend the buyer email.

## Deploy

### 1. GitHub Pages (marketing site)

1. Push `main`.
2. Repo **Settings → Pages → Source: GitHub Actions**.
3. The workflow `.github/workflows/pages.yml` publishes the `site/` folder.
4. `site/CNAME` is `taxdeedpack.com`.

GitHub Pages for a **private** repo needs GitHub Pro. A public repo is free.

### 2. Namecheap DNS for taxdeedpack.com

At Namecheap, Advanced DNS:

**A records** for `@` / `taxdeedpack.com`:

| Type | Host | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

**CNAME** for `www`:

| Type | Host | Value |
| --- | --- | --- |
| CNAME | www | joshuaofisrael.github.io |

In the GitHub repo Pages settings, add the custom domain `taxdeedpack.com` and enable DNS enforcement after the records resolve. GitHub will serve both apex and www after the CNAME is in place.

### 3. Cloudflare Worker (API)

```bash
npx wrangler login
npx wrangler d1 create taxdeedpack
```

Put the printed database id into `wrangler.toml` (`database_id`). Then:

```bash
npx wrangler d1 execute taxdeedpack --remote --file=worker/schema.sql
npx wrangler d1 execute taxdeedpack --remote --file=worker/seed.sql
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put OPS_TOKEN
npx wrangler deploy
```

Set GitHub Actions secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` so `.github/workflows/worker.yml` can deploy from `main`.

Update `site/assets/js/config.js` `apiBase` to your `*.workers.dev` URL (or a later `api.taxdeedpack.com` Worker custom domain). Keep apex A records on GitHub Pages. If you add `api.taxdeedpack.com`, CNAME that host to the Worker target after the zone is on Cloudflare, or use the `workers.dev` URL as-is.

### 4. Stripe production

- Switch to live keys.
- Webhook endpoint: `https://<your-worker>/api/stripe/webhook`
- Event: `checkout.session.completed`
- Success URL is set by the API to `/success.html?session_id={CHECKOUT_SESSION_ID}`

### 5. Resend

- Verify `taxdeedpack.com` (or use the Resend onboarding sender for tests).
- Set `EMAIL_FROM` to a from-address on that domain, for example `Tax Deed Pack <orders@taxdeedpack.com>`.

## Public data fetch stubs

`worker/src/lib/public-data.ts` returns a real pack structure with assessor, recorder, sale-notice, flood, and zoning source rows. Until county GIS / assessor fetchers are wired, unknown fields stay **NOT VERIFIED**. The function must never invent a value opinion, bid recommendation, title conclusion, or buildability conclusion.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm test` | Jurisdiction matrix, checkout gate, disclaimer lock, Stripe signatures, Brenda seed |
| `npm run compliance:scan` | Customer-facing copy scan |
| `npm run sample:pdf` | Writes `artifacts/sample-tax-deed-research-pack.pdf` |
| `npm run simulate:fulfill` | Simulated paid order + Brenda referral + email copy check |

## License

Private. All rights reserved by Joshua Israel Ventures LLC.
