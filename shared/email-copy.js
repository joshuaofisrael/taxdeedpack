/**
 * Customer-facing email copy.
 * No hyphens or dashes in this copy (including em dash and en dash).
 */

import { COMPANY_LEGAL_NAME, OPS_EMAIL, PRODUCT_NAME } from "./disclaimer.js";

export const BUYER_PACK_SUBJECT = `Your ${PRODUCT_NAME} from ${COMPANY_LEGAL_NAME}`;

export const BUYER_PACK_TEXT = `Thank you for your purchase.

Your ${PRODUCT_NAME} PDF is attached. This is an information and research product only. It is not an appraisal, CMA, BPO, title search, or bid recommendation.

IMPORTANT LIMITATIONS appear on the cover and the last page of the PDF. Read them before you use the compilation.

You are solely responsible for verifying all information and for all bidding and investment decisions.

Questions: ${OPS_EMAIL}

${COMPANY_LEGAL_NAME}
`;

export const BUYER_PACK_HTML = `<p>Thank you for your purchase.</p>
<p>Your ${PRODUCT_NAME} PDF is attached. This is an information and research product only. It is not an appraisal, CMA, BPO, title search, or bid recommendation.</p>
<p>IMPORTANT LIMITATIONS appear on the cover and the last page of the PDF. Read them before you use the compilation.</p>
<p>You are solely responsible for verifying all information and for all bidding and investment decisions.</p>
<p>Questions: <a href="mailto:${OPS_EMAIL}">${OPS_EMAIL}</a></p>
<p>${COMPANY_LEGAL_NAME}</p>`;

const DASH_RE = /[-–—]/;

export function assertEmailCopyHasNoDashes() {
  const samples = [BUYER_PACK_SUBJECT, BUYER_PACK_TEXT, BUYER_PACK_HTML];
  for (const sample of samples) {
    if (DASH_RE.test(sample)) {
      throw new Error("Customer facing email copy must not contain hyphens or dashes.");
    }
  }
  return true;
}

export function emailHasDash(text) {
  return DASH_RE.test(String(text || ""));
}
