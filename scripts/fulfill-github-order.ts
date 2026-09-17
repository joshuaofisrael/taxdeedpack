import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { generatePackPdf } from "../worker/src/lib/pdf.js";
import { assembleResearch } from "../worker/src/lib/public-data.js";
import { ADMINJ_DELIVER_ONLY_TO, isFreeTestCode, FREE_TEST_CODE } from "../shared/partners.js";
import {
  buyerEmailHtml,
  buyerEmailText,
  EMAIL_SUBJECT,
} from "../shared/compliance.js";
import type { OrderRecord } from "../worker/src/types.js";

interface OrderPayload {
  orderId?: string;
  buyerName: string;
  buyerEmail: string;
  propertyAddress?: string;
  apn?: string;
  county: string;
  state: string;
  sections: string[];
  referralCode?: string;
  disclaimerAcceptedAt?: string;
}

function loadPayload(): OrderPayload {
  const fromFile = process.env.ORDER_JSON_FILE;
  const raw = fromFile ? readFileSync(fromFile, "utf8") : process.env.ORDER_JSON || "";
  if (!raw.trim()) throw new Error("ORDER_JSON or ORDER_JSON_FILE is required");
  return JSON.parse(raw) as OrderPayload;
}

async function sendResend(pdfBytes: Uint8Array, filename: string, order: OrderRecord) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log("RESEND_API_KEY not set; skipping email. PDF saved as artifact only.");
    return { emailed: false };
  }
  const to = isFreeTestCode(order.referral_code) ? ADMINJ_DELIVER_ONLY_TO : order.buyer_email;
  const contentBase64 = Buffer.from(pdfBytes).toString("base64");
  const label = order.property_address || order.apn || "subject property";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Tax Deed Pack <onboarding@resend.dev>",
      to: [to],
      subject: EMAIL_SUBJECT,
      text: buyerEmailText({
        buyerName: order.buyer_name,
        propertyLabel: label,
        orderId: order.id,
      }),
      html: buyerEmailHtml({
        buyerName: order.buyer_name,
        propertyLabel: label,
        orderId: order.id,
      }),
      attachments: [{ filename, content: contentBase64 }],
    }),
  });
  if (!response.ok) {
    throw new Error(`Resend failed: ${response.status} ${await response.text()}`);
  }
  console.log(`Emailed PDF to ${to}`);
  return { emailed: true, to };
}

const payload = loadPayload();
const referral = (payload.referralCode || "").toUpperCase();
if (!isFreeTestCode(referral)) {
  throw new Error("GitHub Actions fulfillment currently accepts ADMINJ free tests only.");
}

const orderId =
  payload.orderId ||
  `JIV${new Date().toISOString().slice(0, 10).replace(/-/g, "")}ADMINJ`;

const order: OrderRecord = {
  id: orderId,
  stripe_session_id: null,
  stripe_payment_intent: "adminj_comp_github",
  status: "paid",
  buyer_name: payload.buyerName,
  buyer_email: ADMINJ_DELIVER_ONLY_TO,
  property_address: payload.propertyAddress || null,
  apn: payload.apn || null,
  county: payload.county,
  state: payload.state.toUpperCase(),
  sections: JSON.stringify(payload.sections || []),
  referral_code: FREE_TEST_CODE,
  amount_cents: 0,
  disclaimer_accepted_at: payload.disclaimerAcceptedAt || new Date().toISOString(),
  created_at: new Date().toISOString(),
  paid_at: new Date().toISOString(),
  fulfilled_at: null,
  pdf_generated_at: null,
  email_sent_at: null,
  last_error: null,
};

const research = await assembleResearch(order);
const pdf = await generatePackPdf(order, research);
mkdirSync("artifacts", { recursive: true });
const outPath = `artifacts/${pdf.filename}`;
writeFileSync(outPath, pdf.bytes);
writeFileSync("artifacts/order-summary.json", JSON.stringify({ orderId, referral: FREE_TEST_CODE, deliverTo: ADMINJ_DELIVER_ONLY_TO }, null, 2));
const emailResult = await sendResend(pdf.bytes, pdf.filename, order);
writeFileSync(
  "artifacts/fulfill-result.json",
  JSON.stringify({ orderId, filename: pdf.filename, ...emailResult }, null, 2),
);
console.log(`Wrote ${outPath}`);
