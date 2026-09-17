import { describe, expect, it } from "vitest";
import { normalizeReferralCode } from "../shared/order-id.js";
import {
  SEEDED_REFERRAL_CODES,
  isFreeTestCode,
  ADMINJ_DELIVER_ONLY_TO,
  FREE_TEST_CODE,
} from "../shared/partners.js";

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

  it("treats ADMINJ as free test code with Joshua-only delivery", () => {
    expect(FREE_TEST_CODE).toBe("ADMINJ");
    expect(isFreeTestCode("adminj")).toBe(true);
    expect(isFreeTestCode("BRENDA")).toBe(false);
    expect(ADMINJ_DELIVER_ONLY_TO).toBe("joshuaofisrael@gmail.com");
    expect(SEEDED_REFERRAL_CODES.some((row) => row.code === "ADMINJ")).toBe(false);
  });
});
