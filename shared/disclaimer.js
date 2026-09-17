/**
 * Locked compliance copy. Do not paraphrase in UI, PDFs, emails, or APIs.
 * Import this module everywhere customer-facing limitation language is shown.
 */

export const REQUIRED_DISCLAIMER_TITLE = "IMPORTANT LIMITATIONS";

export const REQUIRED_DISCLAIMER = `This document is a research compilation prepared by Joshua Israel Ventures LLC for informational purposes only. It is assembled from public records and third party data sources that may be incomplete, delayed, or wrong.
This is NOT: an appraisal; a broker price opinion (BPO); a comparative market analysis (CMA); an opinion of market value; a recommended or maximum bid; investment advice; legal advice; tax advice; or a title search, title commitment, or title insurance.
Joshua Israel Ventures LLC and Joshua Israel are not acting as licensed real estate appraisers or real estate brokers in connection with this document. No agency relationship is created by purchase of this research pack.
You are solely responsible for verifying all information and for all bidding and investment decisions.`;

export const PRODUCT_CLASSIFICATION =
  "INFORMATION AND RESEARCH PRODUCT ONLY. Not appraisal, attorney, title, broker, investment adviser, surveyor, engineer, or zoning professional.";

export const NOT_VERIFIED_LABEL = "NOT VERIFIED";

export const COMPANY_LEGAL_NAME = "Joshua Israel Ventures LLC";
export const COMPANY_PRINCIPAL = "Joshua Israel";
export const OPS_EMAIL = "joshuaofisrael@gmail.com";
export const SITE_DOMAIN = "taxdeedpack.com";
export const PRODUCT_NAME = "Tax Deed Due Diligence Research Pack";
export const PRICE_USD = 149;
export const PRICE_CENTS = 14900;
export const TURNAROUND_COPY =
  "Within about 4 business hours after payment and a usable property address or APN.";
export const DELIVERY_COPY = "PDF emailed to the buyer.";

/** Phrases that must never appear as JIV conclusions (negation in the required disclaimer is allowed). */
export const FORBIDDEN_CONCLUSION_PHRASES = [
  "surviving lien",
  "surviving liens",
  "title is clear",
  "clear title",
  "marketable title",
  "we recommend a bid",
  "recommended bid is",
  "maximum bid is",
  "max bid is",
  "our arv",
  "after repair value",
  "value opinion",
  "value band",
  "opinion of value",
  "buildable lot",
  "lot is buildable",
  "you should bid",
  "licensed real estate appraiser for this assignment",
  "acting as your broker",
];

/** Customer-facing copy must not use these location tells. */
export const FORBIDDEN_LOCATION_TELLS = [
  "london",
  "united kingdom",
  "u.k.",
  "uk-based",
  "british",
  "pound sterling",
  "£",
];
