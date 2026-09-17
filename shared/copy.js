import {
  COMPANY_LEGAL_NAME,
  DELIVERY_COPY,
  OPS_EMAIL,
  PRICE_USD,
  PRODUCT_CLASSIFICATION,
  PRODUCT_NAME,
  TURNAROUND_COPY,
} from "./disclaimer.js";

export const OFFER_WHAT_YOU_GET = [
  {
    title: "Public record snapshot",
    body: "Published parcel, assessor, and recorder identifiers compiled for one property.",
  },
  {
    title: "Sold comps data table, raw sales only",
    body: "Closed-sale transaction data. No Joshua Israel Ventures LLC value opinion, value band, or ARV.",
  },
  {
    title: "Lien, tax, and obligation flags",
    body: "Research level only. Labeled Public-Record Items Identified for Further Review. Not a title search.",
  },
  {
    title: "Sale type and timing notes",
    body: "Published sale type and calendar notes. Not legal advice.",
  },
  {
    title: "Zoning, flood, and use checklist",
    body: "Land-Use and Development Data scored PASS, FAIL, or UNKNOWN. No buildable conclusion.",
  },
  {
    title: "Source links and open questions",
    body: "Citations plus items that remain NOT VERIFIED.",
  },
];

export const OFFER_WHAT_YOU_DO_NOT_GET = [
  "No appraisal",
  "No CMA or BPO",
  "No market value opinion",
  "No recommended bid and no maximum bid",
  "No IRR or investment advice",
  "No legal advice",
  "No title insurance, title commitment, or title search",
];

export const PREFERRED_PARTNERS = [
  {
    name: "Title and Abstract Agency of America",
    href: "https://www.titleandabstract.com",
    blurb: "Preferred partner for title and settlement services. Independent of this research pack. Joshua Israel Ventures LLC does not issue title insurance or title opinions.",
  },
  {
    name: "US Tax Deed Solutions",
    href: "https://www.ustaxdeedsolutions.com",
    blurb: "Preferred partner for tax deed certification paths that some investors use after a sale. Independent of this research pack. Joshua Israel Ventures LLC does not certify title or provide legal services.",
  },
];

export const SEO = {
  title: `${PRODUCT_NAME} | ${COMPANY_LEGAL_NAME}`,
  description: `Public record research pack for one US tax deed property. $${PRICE_USD}. ${PRODUCT_CLASSIFICATION}`,
  canonical: "https://taxdeedpack.com/",
};

export const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Send the property",
    body: "Address and/or APN, county, and US state. Pick the research sections you want.",
  },
  {
    step: "2",
    title: "Pay through Stripe Checkout",
    body: `$${PRICE_USD} USD per property. The form must be complete and the IMPORTANT LIMITATIONS acknowledgment checked.`,
  },
  {
    step: "3",
    title: "Receive the PDF",
    body: `${TURNAROUND_COPY} ${DELIVERY_COPY}`,
  },
];

export const OPS_CONTACT_LINE = `Operations contact: ${OPS_EMAIL}`;
