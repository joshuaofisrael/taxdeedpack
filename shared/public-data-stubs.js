/**
 * Public-data fetch stubs.
 * Replace these adapters with live county/assessor pulls later.
 * Stubs must stay research-level: cite sources, mark NOT VERIFIED, omit conclusions.
 */

import { NOT_VERIFIED_LABEL } from "./disclaimer.js";

export function stubPublicRecordSnapshot(order) {
  return {
    heading: "Public record snapshot",
    intro:
      "Compiled identifiers only. This is a research snapshot, not a title search and not confirmation of ownership.",
    rows: [
      field("Street address as submitted", order.street || NOT_VERIFIED_LABEL, order.street ? "Buyer submission" : "Not provided"),
      field("City as submitted", order.city || NOT_VERIFIED_LABEL, order.city ? "Buyer submission" : "Not provided"),
      field("County", order.county || NOT_VERIFIED_LABEL, "Buyer submission"),
      field("State", order.state || NOT_VERIFIED_LABEL, "Buyer submission"),
      field("APN / parcel", order.apn || NOT_VERIFIED_LABEL, order.apn ? "Buyer submission" : "Not provided"),
      field(
        "Assessor owner of record (published)",
        NOT_VERIFIED_LABEL,
        `${order.county} County assessor public portal (live fetch stub)`,
      ),
      field(
        "Legal description (published)",
        NOT_VERIFIED_LABEL,
        `${order.county} County recorder or assessor (live fetch stub)`,
      ),
      field(
        "Land / building use code (published)",
        NOT_VERIFIED_LABEL,
        `${order.county} County assessor (live fetch stub)`,
      ),
    ],
  };
}

export function stubSoldComps(order) {
  return {
    heading: "Sold comps data table (raw sales only)",
    intro:
      "Transaction data only. These rows are not a CMA, BPO, adjustment grid, ARV, value band, or Joshua Israel Ventures LLC value opinion.",
    columns: ["Reported address", "Reported close date", "Reported sale price", "Reported deed type", "Source", "Status"],
    rows: [
      [
        NOT_VERIFIED_LABEL,
        NOT_VERIFIED_LABEL,
        NOT_VERIFIED_LABEL,
        NOT_VERIFIED_LABEL,
        `${order.county} County recorded sales / published sold list (live fetch stub)`,
        NOT_VERIFIED_LABEL,
      ],
      [
        NOT_VERIFIED_LABEL,
        NOT_VERIFIED_LABEL,
        NOT_VERIFIED_LABEL,
        NOT_VERIFIED_LABEL,
        "Statewide or vendor sold-data feed (live fetch stub)",
        NOT_VERIFIED_LABEL,
      ],
    ],
    footnotes: [
      "No comparable selection opinion is made.",
      "No time, condition, or location adjustment is applied.",
      "Omit any sale that cannot be sourced. Do not invent prices.",
    ],
  };
}

export function stubPublicRecordItems(order) {
  return {
    heading: "Public-Record Items Identified for Further Review",
    intro:
      "Research-level flags only. This section never concludes that a lien survived or did not survive, and it is not a title search, title commitment, or title insurance.",
    items: [
      {
        item: "Published ad valorem tax / assessment balance",
        flag: NOT_VERIFIED_LABEL,
        source: `${order.county} County tax collector public portal (live fetch stub)`,
        nextStep: "A title or tax professional can verify current amounts and payoff instructions.",
      },
      {
        item: "Published municipal or special assessment notices",
        flag: NOT_VERIFIED_LABEL,
        source: "Municipal or county published assessment lists (live fetch stub)",
        nextStep: "A title professional can search recorded instruments.",
      },
      {
        item: "Recorded instrument index hits matching the APN or address",
        flag: NOT_VERIFIED_LABEL,
        source: `${order.county} County recorder official records index (live fetch stub)`,
        nextStep: "A title professional can read the instruments and issue any title product.",
      },
    ],
  };
}

export function stubSaleTypeTiming(order) {
  return {
    heading: "Sale type and timing notes",
    intro:
      "Published calendar and sale-type notes. Not legal advice about redemption, notice, overbid, or title.",
    rows: [
      field("Sale type as published", NOT_VERIFIED_LABEL, `${order.state} county tax sale calendar (live fetch stub)`),
      field("Published sale or list date", NOT_VERIFIED_LABEL, "County tax collector or clerk calendar (live fetch stub)"),
      field("Published application or deposit notes", NOT_VERIFIED_LABEL, "County sale instructions (live fetch stub)"),
    ],
    openQuestions: [
      "Confirm whether this parcel appears on the current published list.",
      "Confirm any published redemption or vacancy notes with the county, not with this pack.",
    ],
  };
}

export function stubLandUse(order) {
  return {
    heading: "Land-Use and Development Data",
    intro:
      "Checklist only. Scores are PASS, FAIL, or UNKNOWN from published layers. This is not a buildable, developable, or permit-ready conclusion.",
    rows: [
      checklist("Published zoning district code located", "UNKNOWN", `${order.county} zoning map or GIS (live fetch stub)`),
      checklist("Published flood hazard layer located", "UNKNOWN", "FEMA MSC or county flood GIS (live fetch stub)"),
      checklist("Published land use or future land use label located", "UNKNOWN", "County or city comprehensive plan GIS (live fetch stub)"),
      checklist("Published wetland or overlay layer located", "UNKNOWN", "County or state overlay GIS (live fetch stub)"),
    ],
    footnotes: [
      "UNKNOWN means the automated stub did not retrieve a source. A researcher should cite a source or leave UNKNOWN.",
      "FAIL means a published source was missing or contradicted, not that the lot cannot be used.",
      "No setback, density, access, or utility conclusion is made.",
    ],
  };
}

export function stubBidScenarios(order) {
  return {
    heading: "Bid Scenario Analysis (labeled hypotheticals only)",
    intro:
      "Illustrative arithmetic using buyer-supplied or unpublished placeholders. These are labeled hypotheticals only. They are not a recommended bid, a maximum bid, an ARV, or a value opinion.",
    scenarios: [
      {
        label: "HYPOTHETICAL SCENARIO A",
        lines: [
          `Placeholder cash outlay: ${NOT_VERIFIED_LABEL} (no bid is recommended)`,
          `Placeholder later resale input: ${NOT_VERIFIED_LABEL} (not an ARV or value opinion)`,
          `Placeholder holding or closing items: ${NOT_VERIFIED_LABEL}`,
          "Result: arithmetic is omitted until the buyer supplies the inputs. No result is a bid instruction.",
        ],
      },
      {
        label: "HYPOTHETICAL SCENARIO B",
        lines: [
          "Same structure as Scenario A with a different placeholder outlay.",
          "Omitted because inputs are NOT VERIFIED. When unsure, omit the conclusion.",
        ],
      },
    ],
    footnotes: [
      `Property reference: ${order.county} County, ${order.state}.`,
      "Do not treat either scenario as a suggested bid ceiling or floor.",
    ],
  };
}

export function stubSourcesAndQuestions(order) {
  return {
    heading: "Source links and open questions",
    sources: [
      {
        label: "County assessor public portal",
        href: NOT_VERIFIED_LABEL,
        note: `Lookup ${order.county} County, ${order.state}. Live URL stub.`,
      },
      {
        label: "County recorder official records",
        href: NOT_VERIFIED_LABEL,
        note: "Live URL stub.",
      },
      {
        label: "County tax collector",
        href: NOT_VERIFIED_LABEL,
        note: "Live URL stub.",
      },
      {
        label: "FEMA Flood Map Service Center",
        href: "https://msc.fema.gov/portal/home",
        note: "Public flood map portal.",
      },
    ],
    questions: [
      "What published owner of record appears on the assessor site today?",
      "Which recorded instruments index to this APN?",
      "What tax or assessment balances does the collector publish?",
      "What zoning district does the official map show?",
    ],
  };
}

function field(label, value, source) {
  return { label, value, source };
}

function checklist(label, score, source) {
  return { label, score, source };
}

export function buildResearchPayload(order, sectionIds) {
  const wanted = new Set(sectionIds);
  const payload = {};
  if (wanted.has("public_record_snapshot")) payload.public_record_snapshot = stubPublicRecordSnapshot(order);
  if (wanted.has("sold_comps_raw")) payload.sold_comps_raw = stubSoldComps(order);
  if (wanted.has("public_record_items_review")) payload.public_record_items_review = stubPublicRecordItems(order);
  if (wanted.has("sale_type_timing")) payload.sale_type_timing = stubSaleTypeTiming(order);
  if (wanted.has("land_use_development")) payload.land_use_development = stubLandUse(order);
  if (wanted.has("bid_scenario_analysis")) payload.bid_scenario_analysis = stubBidScenarios(order);
  payload.sources_and_questions = stubSourcesAndQuestions(order);
  return payload;
}
