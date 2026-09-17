import { buyerEmailText, hasHyphenOrDash } from "../shared/compliance.js";
import { normalizeReferralCode } from "../shared/order-id.js";
import { generatePackPdf } from "../worker/src/lib/pdf.js";
import { assembleResearch } from "../worker/src/lib/public-data.js";
import type { OrderRecord } from "../worker/src/types.js";

const order: OrderRecord = {
  id: "JIV20260917BRENDA",
  stripe_session_id: "cs_test_brenda",
  stripe_payment_intent: "pi_test_brenda",
  status: "paid",
  buyer_name: "Brenda Referral Buyer",
  buyer_email: "buyer@example.com",
  property_address: "200 Auction Lane",
  apn: "12-34-56-78900-0000",
  county: "Duval",
  state: "FL",
  sections: JSON.stringify([
    "public_record_snapshot",
    "sold_comps_raw",
    "sources_and_open_questions",
  ]),
  referral_code: normalizeReferralCode("brenda"),
  amount_cents: 14900,
  disclaimer_accepted_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  paid_at: new Date().toISOString(),
  fulfilled_at: null,
  pdf_generated_at: null,
  email_sent_at: null,
  last_error: null,
};

const research = await assembleResearch(order);
const pdf = await generatePackPdf(order, research);
const email = buyerEmailText({
  buyerName: order.buyer_name,
  propertyLabel: "200 Auction Lane",
  orderId: order.id,
});

if (hasHyphenOrDash(email)) {
  throw new Error("Customer email copy contains a hyphen or dash.");
}

const referralRow = {
  code: order.referral_code,
  order_id: order.id,
  amount_cents: order.amount_cents,
  created_at: new Date().toISOString(),
};

console.log(
  JSON.stringify(
    {
      happyPath: "form -> stripe test (simulated paid) -> pdf -> email copy",
      orderId: order.id,
      referral: referralRow,
      pdfBytes: pdf.bytes.byteLength,
      filename: pdf.filename,
      emailSubjectReady: true,
    },
    null,
    2,
  ),
);
