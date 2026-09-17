import { describe, expect, it } from "vitest";
import { gateRequestedSections, getJurisdictionGate, listJurisdictionMatrix } from "../shared/jurisdiction.js";
import { NEVER_OFFERED_ITEMS } from "../shared/sections.js";
import { US_JURISDICTION_CODES } from "../shared/us-states.js";
import { validateOrderInput } from "../shared/validation.js";

describe("jurisdiction safety gate", () => {
  it("covers every listed US jurisdiction", () => {
    const matrix = listJurisdictionMatrix();
    expect(matrix).toHaveLength(US_JURISDICTION_CODES.length);
    expect(matrix.every((row) => row.valid && row.disclaimerRequired)).toBe(true);
  });

  it("never enables licensed conclusion items", () => {
    for (const code of US_JURISDICTION_CODES) {
      const gate = getJurisdictionGate(code);
      for (const item of NEVER_OFFERED_ITEMS) {
        expect(gate.sections[item.id]).toBeUndefined();
      }
      expect(gate.neverOffered.map((row) => row.id)).toEqual(NEVER_OFFERED_ITEMS.map((row) => row.id));
    }
  });

  it("uses safer default when the state is not expressly reviewed", () => {
    const gate = getJurisdictionGate("WY");
    expect(gate.saferDefault).toBe(true);
    expect(gate.sections.bid_scenario_analysis.status).toBe("allow_with_caution");
    expect(gate.policy.toLowerCase()).toContain("safer default");
  });

  it("marks Florida as heightened appraisal caution", () => {
    const gate = getJurisdictionGate("FL");
    expect(gate.reviewed).toBe(true);
    expect(gate.heightenedAppraisalRules).toBe(true);
    expect(gate.sections.sold_comps_raw.enabled).toBe(true);
    expect(gate.sections.public_record_items_review.note).toMatch(/Further Review/);
    expect(gate.sections.land_use_development.note).toMatch(/No buildable/);
  });

  it("drops never-offered ids from a request", () => {
    const result = gateRequestedSections("TX", ["public_record_snapshot", "title_opinion", "recommended_or_max_bid"]);
    expect(result.ok).toBe(true);
    expect(result.allowedIds).toContain("public_record_snapshot");
    expect(result.allowedIds).not.toContain("title_opinion");
    expect(result.rejected.map((row) => row.id)).toEqual(expect.arrayContaining(["title_opinion", "recommended_or_max_bid"]));
  });

  it("rejects unknown jurisdictions on the order form", () => {
    const checked = validateOrderInput({
      buyerName: "Pat",
      buyerEmail: "pat@example.com",
      county: "Unknown",
      state: "ZZ",
      street: "1 Main",
      disclaimerAcknowledged: true,
      requestedSections: ["public_record_snapshot"],
    });
    expect(checked.ok).toBe(false);
    expect(checked.errors.join(" ")).toMatch(/US state/);
  });
});
