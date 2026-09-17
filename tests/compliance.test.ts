import { describe, expect, it } from "vitest";
import {
  buyerEmailText,
  EMAIL_SUBJECT,
  hasHyphenOrDash,
  IMPORTANT_LIMITATIONS,
  PRODUCT_PRICE_CENTS,
  propertyLabel,
} from "../shared/compliance.js";
import { generatePackPdf } from "../worker/src/lib/pdf.js";
import { assembleResearch } from "../worker/src/lib/public-data.js";
import type { OrderRecord } from "../worker/src/types.js";

const disclaimer = `This document is a research compilation prepared by Joshua Israel Ventures LLC for informational purposes only. It is assembled from public records and third party data sources that may be incomplete, delayed, or wrong.
This is NOT: an appraisal; a broker price opinion (BPO); a comparative market analysis (CMA); an opinion of market value; a recommended or maximum bid; investment advice; legal advice; tax advice; or a title search, title commitment, or title insurance.
Joshua Israel Ventures LLC and Joshua Israel are not acting as licensed real estate appraisers or real estate brokers in connection with this document. No agency relationship is created by purchase of this research pack.
You are solely responsible for verifying all information and for all bidding and investment decisions.`;

describe("locked compliance", () => {
  it("keeps the required Important Limitations text exact", () => {
    expect(IMPORTANT_LIMITATIONS).toBe(disclaimer);
    expect(PRODUCT_PRICE_CENTS).toBe(14900);
  });

  it("keeps customer email copy free of hyphens and dashes", () => {
    const text = buyerEmailText({
      buyerName: "Jordan Buyer",
      propertyLabel: "100 Example Road",
      orderId: "JIVTEST1",
    });
    expect(hasHyphenOrDash(text)).toBe(false);
    expect(hasHyphenOrDash(EMAIL_SUBJECT)).toBe(false);
    expect(text).toContain("research compilation only");
  });

  it("builds a PDF whose cover and last page include the required disclaimer", async () => {
    const order: OrderRecord = {
      id: "JIVTESTPDF1",
      stripe_session_id: null,
      stripe_payment_intent: null,
      status: "paid",
      buyer_name: "Jordan Buyer",
      buyer_email: "jordan@example.com",
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
    const manifest = pdf.textManifest.join("\n");
    expect(pdf.bytes.byteLength).toBeGreaterThan(2000);
    expect(manifest).toContain(disclaimer);
    expect(manifest).toContain("Raw comps are transaction data only");
    expect(manifest).toContain("labeled hypothetical only");
    expect(manifest).toContain("Public-Record Items Identified for Further Review");
    expect(manifest).toContain("Land-Use and Development Data");
    expect(manifest).toContain("NOT VERIFIED");
    expect(manifest.toLowerCase()).not.toContain("surviving lien");
    expect(manifest).toContain("100 Example Road");
    expect(
      propertyLabel({
        propertyAddress: order.property_address,
        apn: order.apn,
      }),
    ).toContain("100 Example Road");
  });
});
