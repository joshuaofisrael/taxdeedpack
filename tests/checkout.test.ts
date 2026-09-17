import { describe, expect, it } from "vitest";
import { IMPORTANT_LIMITATIONS } from "../shared/compliance.js";
import { parseCheckoutBody } from "../worker/src/lib/validate-checkout.js";

const base = {
  buyerName: "Jordan Buyer",
  buyerEmail: "jordan@example.com",
  propertyAddress: "100 Example Road",
  county: "Hillsborough",
  state: "FL",
  sections: ["public_record_snapshot", "sources_and_open_questions"],
  referralCode: "brenda",
  disclaimerAccepted: true,
  disclaimerText: IMPORTANT_LIMITATIONS,
};

describe("checkout validation", () => {
  it("accepts a complete form and normalizes the Brenda referral code", () => {
    const result = parseCheckoutBody(base);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.referralCode).toBe("BRENDA");
      expect(result.value.state).toBe("FL");
    }
  });

  it("requires address or APN, disclaimer, and offered sections only", () => {
    expect(parseCheckoutBody({ ...base, propertyAddress: "", apn: "" }).ok).toBe(false);
    expect(parseCheckoutBody({ ...base, disclaimerAccepted: false }).ok).toBe(false);
    expect(
      parseCheckoutBody({
        ...base,
        sections: ["recommended_or_max_bid"],
      }).ok,
    ).toBe(false);
    expect(
      parseCheckoutBody({
        ...base,
        disclaimerText: "short disclaimer",
      }).ok,
    ).toBe(false);
  });

  it("allows APN-only orders", () => {
    const result = parseCheckoutBody({
      ...base,
      propertyAddress: "",
      apn: "00-00-00-00000-0000",
    });
    expect(result.ok).toBe(true);
  });
});
