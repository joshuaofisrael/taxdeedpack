import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("site disclaimer copy", () => {
  it("matches the locked Important Limitations text", () => {
    const source = readFileSync("site/assets/js/compliance-copy.js", "utf8");
    expect(source.replace(/\s+/g, " ")).toContain(
      "This document is a research compilation prepared by Tax Deed Pack for informational purposes only. It is assembled from public records and third party data sources that may be incomplete, delayed, or wrong.",
    );
    expect(source).not.toContain("Joshua Israel");
    expect(source).toContain("not acting as licensed real estate appraisers or real estate brokers");
  });

  it("lists preferred partner URLs on the home page", () => {
    const home = readFileSync("site/index.html", "utf8");
    expect(home).toContain("https://www.titleandabstract.com");
    expect(home).toContain("https://www.ustaxdeedsolutions.com");
    expect(home).toContain("Preferred partners");
    expect(home.toLowerCase()).not.toContain("london");
  });
});
