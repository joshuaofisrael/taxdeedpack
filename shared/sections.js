/**
 * Report sections a buyer may request.
 * All offerable sections are public-record research. Licensed conclusions are never listed.
 */

export const ALWAYS_INCLUDED_SECTION_IDS = ["important_limitations", "sources_and_questions"];

export const REQUESTABLE_SECTIONS = [
  {
    id: "public_record_snapshot",
    title: "Public record snapshot",
    shortLabel: "Public record snapshot",
    buyerFacingDescription:
      "Assessor, recorder, and published parcel identifiers compiled as a snapshot. Sources cited. Unknown fields marked NOT VERIFIED.",
    licenseRisk: "public_record_research",
    defaultSelected: true,
  },
  {
    id: "sold_comps_raw",
    title: "Sold comps data table (raw sales only)",
    shortLabel: "Raw sold comps table",
    buyerFacingDescription:
      "A table of reported closed sales as transaction data only. No Joshua Israel Ventures LLC value opinion, value band, adjustment, CMA, BPO, or ARV.",
    licenseRisk: "transaction_table",
    defaultSelected: true,
  },
  {
    id: "public_record_items_review",
    title: "Public-Record Items Identified for Further Review",
    shortLabel: "Public-record items for further review",
    buyerFacingDescription:
      "Research-level flags for published tax, assessment, and obligation items that a buyer may want a title or legal professional to review. This is not a title search and never states that a lien survived or did not survive.",
    licenseRisk: "public_record_research",
    defaultSelected: true,
  },
  {
    id: "sale_type_timing",
    title: "Sale type and timing notes",
    shortLabel: "Sale type and timing notes",
    buyerFacingDescription:
      "Published sale type, calendar, and timing notes compiled from public sources. Not legal advice about redemption, notice, or title.",
    licenseRisk: "public_record_research",
    defaultSelected: true,
  },
  {
    id: "land_use_development",
    title: "Land-Use and Development Data",
    shortLabel: "Land-use and development data",
    buyerFacingDescription:
      "Zoning, flood, and use checklist scored PASS, FAIL, or UNKNOWN from published sources. No buildable, developable, or permit-ready conclusion.",
    licenseRisk: "public_record_research",
    defaultSelected: true,
  },
  {
    id: "bid_scenario_analysis",
    title: "Bid Scenario Analysis (labeled hypotheticals only)",
    shortLabel: "Bid Scenario Analysis",
    buyerFacingDescription:
      "Labeled hypothetical arithmetic only. Not a recommended bid, maximum bid, or value opinion.",
    licenseRisk: "hypothetical_arithmetic",
    defaultSelected: false,
  },
];

export const NEVER_OFFERED_ITEMS = [
  {
    id: "appraisal_value_opinion",
    title: "Appraisal or market value opinion",
    reason: "Requires a licensed appraiser. Never offered.",
  },
  {
    id: "cma_bpo",
    title: "CMA or BPO",
    reason: "Broker or appraiser work product. Never offered.",
  },
  {
    id: "recommended_or_max_bid",
    title: "Recommended or maximum bid",
    reason: "Investment conclusion. Never offered.",
  },
  {
    id: "title_opinion",
    title: "Title opinion, title commitment, or title insurance",
    reason: "Requires a title or legal professional. Never offered.",
  },
  {
    id: "surviving_lien_conclusion",
    title: "Surviving lien or title conclusion",
    reason: "Title conclusion. Never offered. Use Public-Record Items Identified for Further Review only.",
  },
  {
    id: "legal_tax_investment_advice",
    title: "Legal, tax, or investment advice including IRR",
    reason: "Licensed advice. Never offered.",
  },
  {
    id: "buildable_conclusion",
    title: "Buildable or developable lot conclusion",
    reason: "Engineering, survey, or zoning professional conclusion. Never offered.",
  },
];

export function sectionById(id) {
  return REQUESTABLE_SECTIONS.find((section) => section.id === id) ?? null;
}

export function defaultSelectedSectionIds() {
  return REQUESTABLE_SECTIONS.filter((section) => section.defaultSelected).map((section) => section.id);
}
