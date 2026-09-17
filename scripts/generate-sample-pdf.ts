import { mkdirSync, writeFileSync } from "node:fs";
import { generatePackPdf } from "../worker/src/lib/pdf.js";
import { assembleResearch } from "../worker/src/lib/public-data.js";
import type { OrderRecord } from "../worker/src/types.js";

const order: OrderRecord = {
  id: "JIV20260917SAMPLE",
  stripe_session_id: "cs_test_sample",
  stripe_payment_intent: "pi_test_sample",
  status: "paid",
  buyer_name: "Sample Buyer",
  buyer_email: "buyer@example.com",
  property_address: "100 Example Road",
  apn: "00-00-00-00000-0000",
  county: "Hillsborough",
  state: "FL",
  sections: JSON.stringify([
    "public_record_snapshot",
    "sold_comps_raw",
    "public_record_items_for_review",
    "sale_type_timing",
    "land_use_development_data",
    "bid_scenario_analysis",
    "sources_and_open_questions",
  ]),
  referral_code: "BRENDA",
  amount_cents: 14900,
  disclaimer_accepted_at: "2026-09-17T00:00:00.000Z",
  created_at: "2026-09-17T00:00:00.000Z",
  paid_at: "2026-09-17T00:05:00.000Z",
  fulfilled_at: null,
  pdf_generated_at: null,
  email_sent_at: null,
  last_error: null,
};

const research = await assembleResearch(order);
const pdf = await generatePackPdf(order, research);
mkdirSync("artifacts", { recursive: true });
writeFileSync("artifacts/sample-tax-deed-research-pack.pdf", pdf.bytes);
writeFileSync("artifacts/sample-pack-manifest.txt", pdf.textManifest.join("\n"));
console.log(`Wrote artifacts/${pdf.filename.replace(order.id, "sample-tax-deed-research-pack").replace("tax-deed-research-pack-JIV20260917SAMPLE", "sample-tax-deed-research-pack")}`);
console.log(`Pages of copy: ${pdf.textManifest.length} lines`);
