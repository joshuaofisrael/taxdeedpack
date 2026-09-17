/** Locked compliance copy. Tests fail if this text is changed without a deliberate update. */

export const COMPANY_LEGAL_NAME = "Joshua Israel Ventures LLC";
export const COMPANY_PRINCIPAL = "Joshua Israel";
export const PRODUCT_NAME = "Tax Deed Due Diligence Research Pack";
export const PRODUCT_PRICE_USD = 149;
export const PRODUCT_PRICE_CENTS = 14900;
export const TURNAROUND_COPY =
  "within about 4 business hours after payment and the property address or APN are received";
export const OPS_EMAIL = "joshuaofisrael@gmail.com";
export const SITE_HOST = "taxdeedpack.com";
export const SITE_URL = "https://taxdeedpack.com";

export const IMPORTANT_LIMITATIONS = `This document is a research compilation prepared by Joshua Israel Ventures LLC for informational purposes only. It is assembled from public records and third party data sources that may be incomplete, delayed, or wrong.
This is NOT: an appraisal; a broker price opinion (BPO); a comparative market analysis (CMA); an opinion of market value; a recommended or maximum bid; investment advice; legal advice; tax advice; or a title search, title commitment, or title insurance.
Joshua Israel Ventures LLC and Joshua Israel are not acting as licensed real estate appraisers or real estate brokers in connection with this document. No agency relationship is created by purchase of this research pack.
You are solely responsible for verifying all information and for all bidding and investment decisions.`;

export const PRODUCT_POSITIONING =
  "INFORMATION AND RESEARCH PRODUCT ONLY. Not appraisal, attorney, title, broker, investment adviser, surveyor, engineer, or zoning professional.";

export const WHAT_YOU_GET = [
  {
    id: "public_record_snapshot",
    title: "Public record snapshot",
    summary:
      "Assessor, parcel, and recorded owner fields as published, with sources cited. Unknown fields are marked NOT VERIFIED.",
  },
  {
    id: "sold_comps_raw",
    title: "Sold comps data table",
    summary:
      "Raw recorded sales only. Transaction data. Not a JIV value opinion, value band, or ARV.",
  },
  {
    id: "public_record_items_for_review",
    title: "Public-Record Items Identified for Further Review",
    summary:
      "Research-level tax, instrument, and obligation flags from public indexes. Not a title search and not a title conclusion.",
  },
  {
    id: "sale_type_timing",
    title: "Sale type and timing notes",
    summary:
      "Published sale type, scheduled dates, and timing notes as found in public notices.",
  },
  {
    id: "land_use_development_data",
    title: "Land-Use and Development Data",
    summary:
      "Zoning, flood, and use checklist scored PASS, FAIL, or UNKNOWN against published data. No buildable conclusion.",
  },
  {
    id: "sources_and_open_questions",
    title: "Source links and open questions",
    summary:
      "Citations for every assembled field plus open questions marked NOT VERIFIED.",
  },
] as const;

export const OPTIONAL_RESEARCH_SECTIONS = [
  {
    id: "bid_scenario_analysis",
    title: "Bid Scenario Analysis",
    summary:
      "Labeled hypothetical cash outlay scenarios only. Not a recommended bid and not a maximum bid.",
  },
] as const;

export const WHAT_YOU_DO_NOT_GET = [
  "No appraisal",
  "No CMA or BPO",
  "No market value opinion",
  "No recommended bid or maximum bid",
  "No IRR or investment advice",
  "No legal advice",
  "No title insurance, title commitment, or title search",
] as const;

export const SECTION_LABELS = {
  raw_comps_notice:
    "Raw comps are transaction data only. This table is not a Joshua Israel Ventures LLC value opinion, value band, or after repair value.",
  bid_scenario_notice:
    "Bid Scenario Analysis. Each row is a labeled hypothetical only. This is not a recommended bid and not a maximum bid.",
  public_record_items_notice:
    "Public-Record Items Identified for Further Review. Research-level flags from public indexes. This is not a title search, title commitment, or title conclusion.",
  land_use_notice:
    "Land-Use and Development Data. Checklist scores are PASS, FAIL, or UNKNOWN against published sources. This is not a determination that the parcel is buildable.",
  not_verified: "NOT VERIFIED",
} as const;

export const FORBIDDEN_CUSTOMER_PHRASES = [
  "surviving lien",
  "surviving liens",
  "recommended bid",
  "recommended maximum",
  "maximum bid",
  "max bid",
  "after repair value",
  "value band",
  "opinion of value",
  "we appraise",
  "licensed appraiser",
  "licensed real estate broker",
  "acting as broker",
  "acting as appraiser",
  "the property is buildable",
  "parcel is buildable",
  "quiet title complete",
  "clear title",
  "market value is",
  "arv of",
  "london",
  "united kingdom",
  "£",
] as const;

/** Customer-facing email copy. No hyphen or dash characters. */
export const EMAIL_SUBJECT = "Your Tax Deed Research Pack is ready";

export function buyerEmailText(input: {
  buyerName: string;
  propertyLabel: string;
  orderId: string;
}): string {
  return [
    `Hello ${input.buyerName}`,
    "",
    "Thank you for your purchase from Joshua Israel Ventures LLC.",
    "",
    `Your Tax Deed Due Diligence Research Pack for ${input.propertyLabel} is attached as a PDF. Please read the Important Limitations pages before you use this research.`,
    "",
    "This delivery is a research compilation only. It is not an appraisal, title product, or bid recommendation.",
    "",
    `Order ID: ${input.orderId}`,
    "Amount paid: $149.00 USD",
    "",
    "If you have questions, write to joshuaofisrael@gmail.com.",
    "",
    "Joshua Israel Ventures LLC",
    "taxdeedpack.com",
  ].join("\n");
}

export function buyerEmailHtml(input: {
  buyerName: string;
  propertyLabel: string;
  orderId: string;
}): string {
  const text = buyerEmailText(input);
  const paragraphs = text
    .split("\n\n")
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("");
  return `<!DOCTYPE html><html><body style="font-family:Georgia,serif;color:#1A1F26;line-height:1.5">${paragraphs}</body></html>`;
}

export function opsNotifyText(input: {
  orderId: string;
  buyerEmail: string;
  propertyLabel: string;
  referralCode: string | null;
}): string {
  return [
    "A Tax Deed Due Diligence Research Pack order was paid.",
    `Order ID: ${input.orderId}`,
    `Buyer email: ${input.buyerEmail}`,
    `Property: ${input.propertyLabel}`,
    `Referral code: ${input.referralCode || "none"}`,
    "The buyer PDF was generated and emailed.",
  ].join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function hasHyphenOrDash(value: string): boolean {
  return /[-–—]/.test(value);
}

export function propertyLabel(input: {
  propertyAddress?: string | null;
  apn?: string | null;
}): string {
  const address = input.propertyAddress?.trim();
  const apn = input.apn?.trim();
  if (address && apn) return `${address} / APN ${apn}`;
  if (address) return address;
  if (apn) return `APN ${apn}`;
  return "Property NOT VERIFIED";
}
