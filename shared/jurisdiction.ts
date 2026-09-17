import {
  PROFESSIONAL_SERVICE_IDS,
  PROFESSIONAL_SERVICE_META,
  RESEARCH_SECTION_IDS,
  RESEARCH_SECTION_META,
  type ChecklistItemId,
  type ProfessionalServiceId,
  type ResearchSectionId,
} from "./sections.js";
import { isUsStateCode, stateName, US_STATE_CODES } from "./us-states.js";

export type TitleMarket =
  | "title_company"
  | "attorney"
  | "abstractor_license"
  | "mixed"
  | "unverified";

export type ItemStatus = "offered" | "disabled";

export interface ItemPolicy {
  status: ItemStatus;
  reason: string;
}

export interface StatePolicy {
  code: string;
  name: string;
  titleMarket: TitleMarket;
  extraNotice: string;
  items: Record<ChecklistItemId, ItemPolicy>;
}

const ALWAYS_DISABLED_REASONS: Record<ProfessionalServiceId, string> = {
  appraisal_or_value_opinion:
    "Disabled in every US jurisdiction. An appraisal, CMA, BPO, ARV, or market value opinion requires a licensed appraiser or broker. This pack never provides a JIV value opinion or value band.",
  recommended_or_max_bid:
    "Disabled in every US jurisdiction. A recommended bid or maximum bid is not public-record research. Bid Scenario Analysis, when offered, is labeled hypotheticals only.",
  title_opinion_or_commitment:
    "Disabled in every US jurisdiction. A title search, title opinion, title commitment, or title insurance product requires a licensed title producer or attorney. This pack never states title conclusions.",
  legal_or_tax_advice:
    "Disabled in every US jurisdiction. Legal conclusions and tax advice require a licensed attorney or tax professional.",
  buildability_conclusion:
    "Disabled in every US jurisdiction. A determination that a parcel is buildable requires licensed survey, engineering, or zoning professionals. Land-Use and Development Data is a PASS/FAIL/UNKNOWN checklist only.",
};

const RESEARCH_REASONS: Record<ResearchSectionId, string> = {
  public_record_snapshot:
    "Offered as public-record research. Assessor and parcel fields are copied as published and cited. Unknown fields are marked NOT VERIFIED. No value opinion.",
  sold_comps_raw:
    "Offered as raw recorded transaction data only. No JIV value opinion, value band, or ARV is computed from the table.",
  public_record_items_for_review:
    "Offered as research-level flags from public indexes. Labeled Public-Record Items Identified for Further Review. Not a title search and not a title conclusion.",
  sale_type_timing:
    "Offered as published sale type and timing notes from public notices. Not legal advice about redemption or sale validity.",
  land_use_development_data:
    "Offered as Land-Use and Development Data. Zoning, flood, and use fields scored PASS, FAIL, or UNKNOWN. No buildable conclusion.",
  bid_scenario_analysis:
    "Offered as Bid Scenario Analysis with labeled hypotheticals only. Not a recommended bid and not a maximum bid.",
  sources_and_open_questions:
    "Offered in every jurisdiction. Source citations and open questions. Unknown items marked NOT VERIFIED.",
};

/**
 * Title-market classification is a research operations aid only.
 * When a state is not confidently classified, it is "unverified" and the
 * safer research-only default applies: research sections offered with
 * disclaimer; licensed-service items disabled.
 */
const TITLE_MARKETS: Record<string, TitleMarket> = {
  AL: "mixed",
  AK: "title_company",
  AZ: "title_company",
  AR: "mixed",
  CA: "title_company",
  CO: "title_company",
  CT: "attorney",
  DE: "attorney",
  DC: "mixed",
  FL: "title_company",
  GA: "attorney",
  HI: "title_company",
  ID: "title_company",
  IL: "title_company",
  IN: "mixed",
  IA: "abstractor_license",
  KS: "abstractor_license",
  KY: "mixed",
  LA: "mixed",
  ME: "attorney",
  MD: "title_company",
  MA: "attorney",
  MI: "title_company",
  MN: "mixed",
  MS: "mixed",
  MO: "mixed",
  MT: "abstractor_license",
  NE: "abstractor_license",
  NV: "title_company",
  NH: "attorney",
  NJ: "title_company",
  NM: "title_company",
  NY: "attorney",
  NC: "attorney",
  ND: "abstractor_license",
  OH: "title_company",
  OK: "abstractor_license",
  OR: "title_company",
  PA: "title_company",
  RI: "attorney",
  SC: "attorney",
  SD: "abstractor_license",
  TN: "mixed",
  TX: "title_company",
  UT: "title_company",
  VT: "attorney",
  VA: "title_company",
  WA: "title_company",
  WV: "attorney",
  WI: "title_company",
  WY: "abstractor_license",
};

const MARKET_NOTICE: Record<TitleMarket, string> = {
  title_company:
    "Title work in this jurisdiction is commonly performed by licensed title companies. This pack is public-record research only and is not a title product.",
  attorney:
    "This jurisdiction is commonly treated as an attorney title or attorney closing market. A licensed attorney must examine title. This pack does not include a title opinion.",
  abstractor_license:
    "This jurisdiction commonly licenses abstractors or treats an abstract of title as a licensed product. This pack is not an abstract of title.",
  mixed:
    "Title practice in this jurisdiction can involve attorneys, title companies, or abstractors. This pack remains public-record research only.",
  unverified:
    "Title-market practice for this jurisdiction is not verified in the matrix. The safer research-only default applies. Licensed-service items stay disabled.",
};

function extraNoticeFor(code: string, market: TitleMarket): string {
  const base = MARKET_NOTICE[market];
  const extras: Record<string, string> = {
    FL: "Florida public records research only. Not a title opinion or appraisal.",
    TX: "Texas property research only. Not a licensed appraisal or title insurance product.",
    NY: "New York attorney closing custom. A licensed attorney must examine title.",
    CA: "California public records research only. Not a broker price opinion or appraisal.",
    OK: "Oklahoma licenses abstractors. This pack does not compile an abstract of title.",
    NE: "Nebraska licenses abstracters. This pack does not compile an abstract of title.",
    KS: "Kansas licenses abstracters. This pack does not compile an abstract of title.",
    IA: "Iowa licenses abstractors. This pack does not compile an abstract of title.",
    GA: "Georgia is commonly an attorney title market. This pack is not a title opinion.",
    NC: "North Carolina is commonly an attorney title market. This pack is not a title opinion.",
    SC: "South Carolina is commonly an attorney title market. This pack is not a title opinion.",
    MA: "Massachusetts is commonly an attorney title market. This pack is not a title opinion.",
  };
  return extras[code] ? `${extras[code]} ${base}` : base;
}

function itemPolicyFor(
  itemId: ChecklistItemId,
  _market: TitleMarket,
): ItemPolicy {
  if ((PROFESSIONAL_SERVICE_IDS as readonly string[]).includes(itemId)) {
    return {
      status: "disabled",
      reason: ALWAYS_DISABLED_REASONS[itemId as ProfessionalServiceId],
    };
  }
  return {
    status: "offered",
    reason: RESEARCH_REASONS[itemId as ResearchSectionId],
  };
}

function buildStatePolicy(code: string): StatePolicy {
  const market = TITLE_MARKETS[code] ?? "unverified";
  const items = {} as Record<ChecklistItemId, ItemPolicy>;
  for (const id of RESEARCH_SECTION_IDS) {
    items[id] = itemPolicyFor(id, market);
  }
  for (const id of PROFESSIONAL_SERVICE_IDS) {
    items[id] = itemPolicyFor(id, market);
  }
  return {
    code,
    name: stateName(code) ?? code,
    titleMarket: market,
    extraNotice: extraNoticeFor(code, market),
    items,
  };
}

export const JURISDICTION_MATRIX: Record<string, StatePolicy> = Object.fromEntries(
  US_STATE_CODES.map((code) => [code, buildStatePolicy(code)]),
);

export function getStatePolicy(stateCode: string): StatePolicy | null {
  const code = stateCode.trim().toUpperCase();
  if (!isUsStateCode(code)) return null;
  return JURISDICTION_MATRIX[code] ?? buildStatePolicy(code);
}

export function offeredResearchSections(stateCode: string): ResearchSectionId[] {
  const policy = getStatePolicy(stateCode);
  if (!policy) return [];
  return RESEARCH_SECTION_IDS.filter((id) => policy.items[id].status === "offered");
}

export function disabledProfessionalServices(
  stateCode: string,
): ProfessionalServiceId[] {
  const policy = getStatePolicy(stateCode);
  if (!policy) return [...PROFESSIONAL_SERVICE_IDS];
  return PROFESSIONAL_SERVICE_IDS.filter(
    (id) => policy.items[id].status === "disabled",
  );
}

export function assertSectionsAllowed(
  stateCode: string,
  sections: string[],
): { ok: true; sections: ResearchSectionId[] } | { ok: false; error: string } {
  const policy = getStatePolicy(stateCode);
  if (!policy) {
    return {
      ok: false,
      error: "Orders are limited to US states and the District of Columbia.",
    };
  }
  if (sections.length === 0) {
    return { ok: false, error: "Select at least one research section that is offered in this state." };
  }
  const allowed: ResearchSectionId[] = [];
  for (const raw of sections) {
    const id = raw.trim();
    if ((PROFESSIONAL_SERVICE_IDS as readonly string[]).includes(id)) {
      return {
        ok: false,
        error: `${PROFESSIONAL_SERVICE_META[id as ProfessionalServiceId].title} is not offered. ${policy.items[id as ProfessionalServiceId].reason}`,
      };
    }
    if (!(RESEARCH_SECTION_IDS as readonly string[]).includes(id)) {
      return { ok: false, error: `Unknown checklist item: ${id}` };
    }
    const item = policy.items[id as ResearchSectionId];
    if (item.status !== "offered") {
      return {
        ok: false,
        error: `${RESEARCH_SECTION_META[id as ResearchSectionId].title} is not offered in ${policy.name}. ${item.reason}`,
      };
    }
    if (!allowed.includes(id as ResearchSectionId)) {
      allowed.push(id as ResearchSectionId);
    }
  }
  return { ok: true, sections: allowed };
}

export function matrixPublicView(stateCode: string) {
  const policy = getStatePolicy(stateCode);
  if (!policy) return null;
  return {
    code: policy.code,
    name: policy.name,
    titleMarket: policy.titleMarket,
    extraNotice: policy.extraNotice,
    offered: RESEARCH_SECTION_IDS.filter((id) => policy.items[id].status === "offered").map(
      (id) => ({
        id,
        title: RESEARCH_SECTION_META[id].buyerLabel,
        reason: policy.items[id].reason,
      }),
    ),
    disabled: PROFESSIONAL_SERVICE_IDS.map((id) => ({
      id,
      title: PROFESSIONAL_SERVICE_META[id].buyerLabel,
      reason: policy.items[id].reason,
    })),
  };
}

export function saferDefaultApplies(stateCode: string): boolean {
  const policy = getStatePolicy(stateCode);
  if (!policy) return true;
  return policy.titleMarket === "unverified";
}
