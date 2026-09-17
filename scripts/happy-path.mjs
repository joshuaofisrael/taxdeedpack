import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import Database from "better-sqlite3";
import { createStore, sqliteDriver } from "../api/store.js";
import { createMailer } from "../api/mailer.js";
import { createApp } from "../api/app.js";
import { REQUIRED_DISCLAIMER } from "../shared/disclaimer.js";

const schemaSql = readFileSync(new URL("../api/schema.sql", import.meta.url), "utf8");
const db = new Database(":memory:");
const store = createStore(sqliteDriver(db));
await store.migrate(schemaSql);
const mailer = createMailer({});
const env = {
  SITE_URL: "https://taxdeedpack.com",
  ALLOW_ORIGIN: "https://taxdeedpack.com",
  ALLOW_TEST_CHECKOUT: "1",
  OPS_PASSWORD: "test-ops",
};
const app = createApp({ store, mailer, env });

const checkoutRes = await app.request("http://local/api/checkout", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    buyerName: "Brenda Test Buyer",
    buyerEmail: "buyer@example.com",
    street: "100 Main Street",
    city: "Tampa",
    county: "Hillsborough",
    state: "FL",
    apn: "A-123-456",
    referralCode: "BRENDA",
    requestedSections: [
      "public_record_snapshot",
      "sold_comps_raw",
      "public_record_items_review",
      "sale_type_timing",
      "land_use_development",
      "bid_scenario_analysis",
    ],
    disclaimerAcknowledged: true,
  }),
});
const checkout = await checkoutRes.json();
if (!checkout.ok) {
  console.error(checkout);
  process.exit(1);
}

const payRes = await app.request(`http://local/api/test/pay/${checkout.orderId}`, { method: "POST" });
const paid = await payRes.json();
if (!paid.ok) {
  console.error(paid);
  process.exit(1);
}

const webhookRes = await app.request("http://local/api/webhook", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "checkout.session.completed",
    data: {
      object: {
        id: `cs_test_local_${checkout.orderId}`,
        amount_total: 14900,
        metadata: { order_id: checkout.orderId },
        payment_intent: "pi_test_brenda",
      },
    },
  }),
});
const webhook = await webhookRes.json();

const summaryRes = await app.request("http://local/api/ops/summary", {
  headers: { Authorization: "Bearer test-ops" },
});
const summary = await summaryRes.json();
const brenda = summary.referralStats.find((row) => row.code === "BRENDA");
const email = mailer.sent[0];
const dir = mkdtempSync(join(tmpdir(), "taxdeedpack-"));
const pdfPath = join(dir, "happy-path.pdf");
if (email?.attachments?.[0]?.content) {
  writeFileSync(pdfPath, Buffer.from(email.attachments[0].content, "base64"));
}

const checks = {
  checkoutOk: checkout.ok,
  paidOk: paid.ok,
  webhookIdempotent: webhook.already === true,
  emailTo: email?.to === "buyer@example.com",
  emailHasPdf: Boolean(email?.attachments?.[0]?.filename),
  brendaTracked: brenda?.orderCount === 1 && brenda?.amountCents === 14900,
  disclaimerAck: summary.orders[0]?.disclaimerAcknowledged === true,
  disclaimerLocked: REQUIRED_DISCLAIMER.includes("not acting as licensed real estate appraisers"),
};

const failed = Object.entries(checks).filter(([, value]) => !value);
console.log(JSON.stringify({ checks, pdfPath, orderId: checkout.orderId, brenda, webhook }, null, 2));
if (failed.length) {
  console.error("Happy path failed:", failed);
  process.exit(1);
}
console.log("Happy path passed: form -> checkout -> payment/webhook -> PDF -> email -> Brenda referral.");
