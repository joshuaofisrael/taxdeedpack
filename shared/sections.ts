export const RESEARCH_SECTION_IDS = [
  "public_record_snapshot",
  "sold_comps_raw",
  "public_record_items_for_review",
  "sale_type_timing",
  "land_use_development_data",
  "bid_scenario_analysis",
  "sources_and_open_questions",
] as const;

export type ResearchSectionId = (typeof RESEARCH_SECTION_IDS)[number];

export const PROFESSIONAL_SERVICE_IDS = [
  "appraisal_or_value_opinion",
  "recommended_or_max_bid",
  "title_opinion_or_commitment",
  "legal_or_tax_advice",
  "buildability_conclusion",
] as const;

export type ProfessionalServiceId = (typeof PROFESSIONAL_SERVICE_IDS)[number];

export type ChecklistItemId = ResearchSectionId | ProfessionalServiceId;

export const RESEARCH_SECTION_META: Record<
  ResearchSectionId,
  { title: string; buyerLabel: string }
> = {
  public_record_snapshot: {
    title: "Public record snapshot",
    buyerLabel: "Public record snapshot",
  },
  sold_comps_raw: {
    title: "Sold comps data table (raw sales only)",
    buyerLabel: "Sold comps data table, raw sales only",
  },
  public_record_items_for_review: {
    title: "Public-Record Items Identified for Further Review",
    buyerLabel: "Lien, tax, and obligation flags (research level, not a title search)",
  },
  sale_type_timing: {
    title: "Sale type and timing notes",
    buyerLabel: "Sale type and timing notes",
  },
  land_use_development_data: {
    title: "Land-Use and Development Data",
    buyerLabel: "Zoning, flood, and use checklist (PASS / FAIL / UNKNOWN)",
  },
  bid_scenario_analysis: {
    title: "Bid Scenario Analysis",
    buyerLabel: "Bid Scenario Analysis (labeled hypotheticals only)",
  },
  sources_and_open_questions: {
    title: "Source links and open questions",
    buyerLabel: "Source links and open questions",
  },
};

export const PROFESSIONAL_SERVICE_META: Record<
  ProfessionalServiceId,
  { title: string; buyerLabel: string }
> = {
  appraisal_or_value_opinion: {
    title: "Appraisal or market value opinion",
    buyerLabel: "Appraisal, CMA, BPO, ARV, or market value opinion",
  },
  recommended_or_max_bid: {
    title: "Recommended or maximum bid",
    buyerLabel: "Recommended bid or maximum bid",
  },
  title_opinion_or_commitment: {
    title: "Title opinion or title commitment",
    buyerLabel: "Title search, title opinion, or title insurance",
  },
  legal_or_tax_advice: {
    title: "Legal or tax advice",
    buyerLabel: "Legal advice or tax advice",
  },
  buildability_conclusion: {
    title: "Buildability conclusion",
    buyerLabel: "Buildability determination from a licensed professional",
  },
};

export function isResearchSectionId(value: string): value is ResearchSectionId {
  return (RESEARCH_SECTION_IDS as readonly string[]).includes(value);
}

export function isProfessionalServiceId(
  value: string,
): value is ProfessionalServiceId {
  return (PROFESSIONAL_SERVICE_IDS as readonly string[]).includes(value);
}
