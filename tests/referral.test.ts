import { describe, expect, it } from "vitest";
import { normalizeReferralCode } from "../shared/order-id.js";
import { SEEDED_REFERRAL_CODES } from "../shared/partners.js";

describe("referral tracking", () => {
  it("seeds Brenda / US Tax Deed Solutions as BRENDA", () => {
    expect(SEEDED_REFERRAL_CODES[0]).toEqual({
      code: "BRENDA",
      label: "Brenda / US Tax Deed Solutions",
      partner: "US Tax Deed Solutions",
    });
    expect(normalizeReferralCode("brenda")).toBe("BRENDA");
    expect(normalizeReferralCode("not a code")).toBeNull();
  });
});
