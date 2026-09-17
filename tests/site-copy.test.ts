import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { IMPORTANT_LIMITATIONS } from "../shared/compliance.js";

describe("site disclaimer copy", () => {
  it("matches the locked Important Limitations text", () => {
    const source = readFileSync("site/assets/js/compliance-copy.js", "utf8");
    expect(source.replace(/\s+/g, " ")).toContain(
      IMPORTANT_LIMITATIONS.split("\n")[0],
    );
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
