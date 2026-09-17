import { describe, expect, it } from "vitest";
import { assertSectionsAllowed, getStatePolicy, JURISDICTION_MATRIX } from "../shared/jurisdiction.js";
import { PROFESSIONAL_SERVICE_IDS, RESEARCH_SECTION_IDS } from "../shared/sections.js";
import { US_STATE_CODES } from "../shared/us-states.js";

describe("US jurisdiction matrix", () => {
  it("covers every US state and DC", () => {
    expect(Object.keys(JURISDICTION_MATRIX).sort()).toEqual([...US_STATE_CODES].sort());
  });

  it("offers public-record research and disables licensed conclusions in every state", () => {
    for (const code of US_STATE_CODES) {
      const policy = getStatePolicy(code);
      expect(policy).not.toBeNull();
      for (const id of RESEARCH_SECTION_IDS) {
        expect(policy!.items[id].status).toBe("offered");
      }
      for (const id of PROFESSIONAL_SERVICE_IDS) {
        expect(policy!.items[id].status).toBe("disabled");
      }
    }
  });

  it("rejects appraisal and title opinion requests in Florida and Oklahoma", () => {
    const fl = assertSectionsAllowed("FL", ["appraisal_or_value_opinion"]);
    expect(fl.ok).toBe(false);
    const ok = assertSectionsAllowed("OK", ["title_opinion_or_commitment"]);
    expect(ok.ok).toBe(false);
  });

  it("accepts research sections and rejects unknown states", () => {
    const allowed = assertSectionsAllowed("TX", [
      "public_record_snapshot",
      "sold_comps_raw",
      "bid_scenario_analysis",
    ]);
    expect(allowed.ok).toBe(true);
    expect(assertSectionsAllowed("ZZ", ["public_record_snapshot"]).ok).toBe(false);
    expect(assertSectionsAllowed("london", ["public_record_snapshot"]).ok).toBe(false);
  });

  it("uses attorney-title notices in NY and abstractor notices in OK", () => {
    expect(getStatePolicy("NY")?.titleMarket).toBe("attorney");
    expect(getStatePolicy("NY")?.extraNotice.toLowerCase()).toContain("attorney");
    expect(getStatePolicy("OK")?.titleMarket).toBe("abstractor_license");
    expect(getStatePolicy("OK")?.extraNotice.toLowerCase()).toContain("abstract");
  });
});
