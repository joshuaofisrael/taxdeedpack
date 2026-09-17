/**
 * US jurisdiction safety gate.
 *
 * Rule: only allow checklist items that can be offered as public-record research.
 * Disable anything that needs a licensed appraisal, title opinion, or legal conclusion.
 * When a jurisdiction is not expressly reviewed, default to the safer research-only
 * profile plus the required IMPORTANT LIMITATIONS disclaimer.
 *
 * This matrix is documentation in code. It is not legal advice.
 */

import { REQUESTABLE_SECTIONS, NEVER_OFFERED_ITEMS } from "./sections.js";
import { findJurisdiction, US_JURISDICTION_CODES } from "./us-states.js";

/** Heightened appraisal / BPO / CMA enforcement. Hypothetical bid math is extra-caution only. */
export const HEIGHTENED_APPRAISAL_CODES = [
  "CA",
  "NY",
  "FL",
  "TX",
  "IL",
  "NJ",
  "PA",
  "WA",
  "OR",
  "MA",
  "CT",
  "MD",
  "VA",
  "NC",
  "GA",
  "AZ",
  "CO",
  "MI",
  "OH",
  "MN",
];

/** Expressly reviewed for this product. All other codes use the safer default. */
export const REVIEWED_CODES = [
  ...HEIGHTENED_APPRAISAL_CODES,
  "AL",
  "IN",
  "TN",
  "MS",
  "MO",
  "SC",
  "KY",
  "LA",
  "OK",
  "NV",
  "WI",
  "IA",
  "KS",
  "NE",
  "AR",
  "WV",
  "ID",
  "UT",
  "NM",
  "DC",
];

export const ALLOW = "allow";
export const ALLOW_WITH_CAUTION = "allow_with_caution";
export const DISABLE = "disable";

const PUBLIC_RECORD_ALLOW = {
  status: ALLOW,
  note: "Offerable as public-record research. Cite sources. Mark NOT VERIFIED when unknown. Omit conclusions when unsure.",
};

const COMPS_ALLOW = {
  status: ALLOW,
  note: "Raw closed-sale transaction data only. No JIV value opinion, value band, adjustment, CMA, BPO, or ARV.",
};

const ITEMS_REVIEW_ALLOW = {
  status: ALLOW,
  note: "Public-Record Items Identified for Further Review only. Never a surviving-lien or title conclusion.",
};

const LAND_USE_ALLOW = {
  status: ALLOW,
  note: "Land-Use and Development Data checklist (PASS / FAIL / UNKNOWN) only. No buildable or permit conclusion.",
};

const BID_CAUTION = {
  status: ALLOW_WITH_CAUTION,
  note: "Labeled hypotheticals only. Extra caution in this jurisdiction. Not a recommended or maximum bid.",
};

const BID_SAFER_DEFAULT = {
  status: ALLOW_WITH_CAUTION,
  note: "Jurisdiction not expressly reviewed. Safer default: labeled hypothetical arithmetic only, plus IMPORTANT LIMITATIONS. Not a recommended or maximum bid.",
};

function profileFor(code) {
  const reviewed = REVIEWED_CODES.includes(code);
  const heightened = HEIGHTENED_APPRAISAL_CODES.includes(code);

  return {
    public_record_snapshot: PUBLIC_RECORD_ALLOW,
    sold_comps_raw: COMPS_ALLOW,
    public_record_items_review: ITEMS_REVIEW_ALLOW,
    sale_type_timing: PUBLIC_RECORD_ALLOW,
    land_use_development: LAND_USE_ALLOW,
    bid_scenario_analysis: heightened || !reviewed ? BID_SAFER_DEFAULT : BID_CAUTION,
    sources_and_questions: {
      status: ALLOW,
      note: "Always included. Source links and open questions. Unknown items marked NOT VERIFIED.",
    },
  };
}

/**
 * @param {string} stateCode
 * @returns {{
 *   state: string,
 *   name: string,
 *   kind: string,
 *   reviewed: boolean,
 *   saferDefault: boolean,
 *   heightenedAppraisalRules: boolean,
 *   disclaimerRequired: true,
 *   sections: Record<string, {status: string, note: string, title: string, enabled: boolean}>,
 *   neverOffered: typeof NEVER_OFFERED_ITEMS,
 *   policy:
 *     string
 * }}
 */
export function getJurisdictionGate(stateCode) {
  const jurisdiction = findJurisdiction(stateCode);
  if (!jurisdiction) {
    return {
      state: String(stateCode || "").toUpperCase(),
      name: "Unknown",
      kind: "unknown",
      reviewed: false,
      saferDefault: true,
      heightenedAppraisalRules: false,
      valid: false,
      disclaimerRequired: true,
      sections: Object.fromEntries(
        REQUESTABLE_SECTIONS.map((section) => [
          section.id,
          {
            ...DISABLE_ITEM(section),
            note: "Unknown jurisdiction. Orders are limited to listed US states, DC, and territories.",
          },
        ]),
      ),
      neverOffered: NEVER_OFFERED_ITEMS,
      policy: "Unknown jurisdiction. Do not accept the order.",
    };
  }

  const reviewed = REVIEWED_CODES.includes(jurisdiction.code);
  const heightened = HEIGHTENED_APPRAISAL_CODES.includes(jurisdiction.code);
  const profile = profileFor(jurisdiction.code);

  const sections = {};
  for (const section of REQUESTABLE_SECTIONS) {
    const rule = profile[section.id] ?? {
      status: ALLOW_WITH_CAUTION,
      note: "When unsure, default to safer research-only treatment plus IMPORTANT LIMITATIONS.",
    };
    sections[section.id] = {
      id: section.id,
      title: section.title,
      licenseRisk: section.licenseRisk,
      status: rule.status,
      enabled: rule.status !== DISABLE,
      note: rule.note,
    };
  }

  return {
    state: jurisdiction.code,
    name: jurisdiction.name,
    kind: jurisdiction.kind,
    reviewed,
    saferDefault: !reviewed,
    heightenedAppraisalRules: heightened,
    valid: true,
    disclaimerRequired: true,
    sections,
    neverOffered: NEVER_OFFERED_ITEMS,
    policy: reviewed
      ? heightened
        ? "Reviewed jurisdiction with heightened appraisal and opinion rules. Public-record research only. Hypothetical bid math is extra-caution. Licensed conclusions are disabled."
        : "Reviewed jurisdiction. Public-record research items are offerable. Licensed appraisal, title, and legal conclusions are disabled."
      : "Not expressly reviewed. Safer default: research-only items plus IMPORTANT LIMITATIONS. Licensed conclusions are disabled.",
  };
}

function DISABLE_ITEM(section) {
  return {
    id: section.id,
    title: section.title,
    licenseRisk: section.licenseRisk,
    status: DISABLE,
    enabled: false,
  };
}

/**
 * Filter requested section ids through the state gate.
 * Disabled and never-offered ids are dropped. Always-included research sections stay.
 */
export function gateRequestedSections(stateCode, requestedIds) {
  const gate = getJurisdictionGate(stateCode);
  if (!gate.valid) {
    return { ok: false, error: "Select a US state, DC, or territory.", allowedIds: [], gate };
  }

  const requested = Array.isArray(requestedIds) ? requestedIds : [];
  const allowedIds = [];
  const rejected = [];

  for (const id of requested) {
    if (NEVER_OFFERED_ITEMS.some((item) => item.id === id)) {
      rejected.push({ id, reason: "This item is never offered. It requires a licensed professional conclusion." });
      continue;
    }
    const rule = gate.sections[id];
    if (!rule) {
      rejected.push({ id, reason: "Unknown section." });
      continue;
    }
    if (!rule.enabled) {
      rejected.push({ id, reason: rule.note });
      continue;
    }
    allowedIds.push(id);
  }

  if (!allowedIds.includes("sources_and_questions")) {
    allowedIds.push("sources_and_questions");
  }

  return { ok: true, allowedIds, rejected, gate };
}

export function listJurisdictionMatrix() {
  return US_JURISDICTION_CODES.map((code) => getJurisdictionGate(code));
}
