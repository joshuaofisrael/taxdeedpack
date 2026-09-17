import { SECTION_LABELS } from "../../../shared/compliance.js";
import { stateName } from "../../../shared/us-states.js";
import type { AssembledResearch, OrderRecord } from "../types.js";

/**
 * Public-data assembly. County GIS / assessor / recorder fetchers can replace
 * the stubs below. Every unknown field must stay marked NOT VERIFIED.
 * This function must never invent a value opinion, bid recommendation,
 * title conclusion, or buildability conclusion.
 */
export async function assembleResearch(order: OrderRecord): Promise<AssembledResearch> {
  const nv = SECTION_LABELS.not_verified;
  const address = order.property_address?.trim() || nv;
  const apn = order.apn?.trim() || nv;
  const county = order.county;
  const state = order.state;
  const stateLabel = stateName(state) ?? state;

  const assessorSource = `County assessor public index for ${county} County, ${stateLabel} (fetch stub: ${nv})`;
  const recorderSource = `County recorder / clerk instrument index for ${county} County, ${stateLabel} (fetch stub: ${nv})`;
  const saleNoticeSource = `Tax sale public notice for ${county} County, ${stateLabel} (fetch stub: ${nv})`;
  const floodSource = `FEMA National Flood Hazard Layer public map service (fetch stub: ${nv})`;
  const zoningSource = `Local zoning map or municipal GIS for ${county} County, ${stateLabel} (fetch stub: ${nv})`;

  return {
    snapshot: {
      situsAddress: address,
      apn,
      county,
      state,
      legalDescription: nv,
      ownerOfRecord: nv,
      landUseAsPublished: nv,
      assessedLand: nv,
      assessedImprovement: nv,
      assessedTotal: nv,
      taxYear: nv,
      sources: [assessorSource],
      notes: [
        "Assessor fields are copied as published when a live county fetch is wired. Until then every field is marked NOT VERIFIED.",
        "Assessed amounts are not a Joshua Israel Ventures LLC opinion of market value.",
      ],
    },
    comps: [
      {
        address: nv,
        saleDate: nv,
        recordedPrice: nv,
        deedType: nv,
        source: `${recorderSource} / sold comps query stub`,
      },
    ],
    publicRecordItems: [
      {
        item: "Ad valorem tax amount as published",
        publicIndex: "County tax collector / treasurer public inquiry",
        asPublished: nv,
        reviewNote:
          "Research-level flag only. A licensed title producer or attorney must determine what must be cleared.",
        source: `Tax collector public inquiry for ${county} County, ${stateLabel} (fetch stub: ${nv})`,
      },
      {
        item: "Recorded instrument index hits matching APN or situs",
        publicIndex: "County recorder / clerk",
        asPublished: nv,
        reviewNote:
          "Listed as Public-Record Items Identified for Further Review. Not a title conclusion.",
        source: recorderSource,
      },
    ],
    saleTypeTiming: {
      saleTypeAsPublished: nv,
      scheduledDate: nv,
      timingNotes:
        "Sale type and dates are taken from public notices when a live fetch is wired. Timing notes are not legal advice about redemption, notice, or sale validity.",
      source: saleNoticeSource,
    },
    landUseChecks: [
      {
        label: "Zoning district as published",
        publishedValue: nv,
        score: "UNKNOWN",
        source: zoningSource,
      },
      {
        label: "FEMA flood zone as published",
        publishedValue: nv,
        score: "UNKNOWN",
        source: floodSource,
      },
      {
        label: "Published land use code vs vacant land category",
        publishedValue: nv,
        score: "UNKNOWN",
        source: assessorSource,
      },
    ],
    bidHypotheticals: [
      {
        label: "Hypothetical A",
        cashOutlay: "Buyer elected example $5,000",
        assumption:
          "Labeled hypothetical only. Assumes the buyer independently chooses a $5,000 cash outlay. Not a recommended bid.",
      },
      {
        label: "Hypothetical B",
        cashOutlay: "Buyer elected example $15,000",
        assumption:
          "Labeled hypothetical only. Assumes the buyer independently chooses a $15,000 cash outlay. Not a maximum bid.",
      },
    ],
    openQuestions: [
      `Legal description for ${apn === nv && address === nv ? "the subject" : address} is ${nv}.`,
      `Owner of record is ${nv}.`,
      `Current year tax amount as published is ${nv}.`,
      `Tax sale type and scheduled date as published are ${nv}.`,
      `Zoning district and flood zone as published are ${nv}.`,
    ],
    sources: [assessorSource, recorderSource, saleNoticeSource, floodSource, zoningSource],
  };
}
