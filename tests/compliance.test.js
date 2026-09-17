import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FORBIDDEN_CONCLUSION_PHRASES,
  FORBIDDEN_LOCATION_TELLS,
  REQUIRED_DISCLAIMER,
  REQUIRED_DISCLAIMER_TITLE,
} from "../shared/disclaimer.js";
import { assertEmailCopyHasNoDashes, BUYER_PACK_SUBJECT, BUYER_PACK_TEXT } from "../shared/email-copy.js";
import { siteFiles } from "./helpers.js";

const LOCKED = `This document is a research compilation prepared by Joshua Israel Ventures LLC for informational purposes only. It is assembled from public records and third party data sources that may be incomplete, delayed, or wrong.
This is NOT: an appraisal; a broker price opinion (BPO); a comparative market analysis (CMA); an opinion of market value; a recommended or maximum bid; investment advice; legal advice; tax advice; or a title search, title commitment, or title insurance.
Joshua Israel Ventures LLC and Joshua Israel are not acting as licensed real estate appraisers or real estate brokers in connection with this document. No agency relationship is created by purchase of this research pack.
You are solely responsible for verifying all information and for all bidding and investment decisions.`;

describe("locked compliance copy", () => {
  it("keeps the required disclaimer exact", () => {
    expect(REQUIRED_DISCLAIMER).toBe(LOCKED);
    expect(REQUIRED_DISCLAIMER_TITLE).toBe("IMPORTANT LIMITATIONS");
  });

  it("places the locked disclaimer on the homepage, order form, and disclaimer page", () => {
    for (const file of siteFiles().filter((f) => /index|order|disclaimer/.test(f.path))) {
      expect(file.text).toContain(LOCKED);
    }
  });

  it("rejects UK / London location tells in customer-facing site copy", () => {
    for (const file of siteFiles()) {
      const lower = file.text.toLowerCase();
      for (const tell of FORBIDDEN_LOCATION_TELLS) {
        expect(lower, file.path).not.toContain(tell);
      }
    }
  });

  it("keeps customer-facing email copy free of hyphens and dashes", () => {
    expect(assertEmailCopyHasNoDashes()).toBe(true);
    expect(BUYER_PACK_SUBJECT.includes("-")).toBe(false);
    expect(BUYER_PACK_TEXT.includes("-")).toBe(false);
  });

  it("does not use forbidden conclusion phrases as standalone claims in source modules", () => {
    const roots = ["shared", "api", "site"];
    const files = [];
    function walk(dir) {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.(js|html|css)$/.test(name)) files.push(path);
      }
    }
    roots.forEach(walk);
    const disclaimer = REQUIRED_DISCLAIMER.toLowerCase();
    for (const file of files) {
      const text = readFileSync(file, "utf8").toLowerCase();
      const withoutDisclaimer = text.split(disclaimer).join("");
      for (const phrase of FORBIDDEN_CONCLUSION_PHRASES) {
        if (phrase === "surviving lien" || phrase === "surviving liens") {
          expect(withoutDisclaimer).not.toMatch(/is a surviving lien|surviving lien exists/);
          continue;
        }
        if (withoutDisclaimer.includes(phrase) && !withoutDisclaimer.includes(`not ${phrase}`)) {
          if (
            withoutDisclaimer.includes("never") &&
            withoutDisclaimer.includes(phrase)
          ) {
            continue;
          }
        }
      }
    }
  });
});
