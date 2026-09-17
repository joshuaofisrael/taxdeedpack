import { IMPORTANT_LIMITATIONS } from "../../../shared/compliance.js";
import { assertSectionsAllowed } from "../../../shared/jurisdiction.js";
import { isValidEmail, normalizeReferralCode } from "../../../shared/order-id.js";
import { isUsStateCode } from "../../../shared/us-states.js";
import type { CheckoutInput } from "../types.js";

export interface ParsedCheckout {
  buyerName: string;
  buyerEmail: string;
  propertyAddress: string | null;
  apn: string | null;
  county: string;
  state: string;
  sections: CheckoutInput["sections"];
  referralCode: string | null;
  disclaimerAcceptedAt: string;
}

export function parseCheckoutBody(body: unknown): { ok: true; value: ParsedCheckout } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Submit a complete order form." };
  }
  const input = body as Record<string, unknown>;
  const buyerName = stringField(input.buyerName);
  const buyerEmail = stringField(input.buyerEmail).toLowerCase();
  const propertyAddress = stringField(input.propertyAddress) || null;
  const apn = stringField(input.apn) || null;
  const county = stringField(input.county);
  const state = stringField(input.state).toUpperCase();
  const referralCode = normalizeReferralCode(stringField(input.referralCode));
  const disclaimerAccepted = input.disclaimerAccepted === true;
  const disclaimerText = stringField(input.disclaimerText);

  if (buyerName.length < 2) return { ok: false, error: "Buyer name is required." };
  if (!isValidEmail(buyerEmail)) return { ok: false, error: "A valid buyer email is required." };
  if (!propertyAddress && !apn) {
    return { ok: false, error: "Provide a property address and/or APN." };
  }
  if (county.length < 2) return { ok: false, error: "County is required." };
  if (!isUsStateCode(state)) {
    return { ok: false, error: "Select a US state or the District of Columbia." };
  }
  if (!disclaimerAccepted) {
    return { ok: false, error: "You must acknowledge the Important Limitations disclaimer before payment." };
  }
  if (disclaimerText && disclaimerText !== IMPORTANT_LIMITATIONS) {
    return { ok: false, error: "Disclaimer text does not match the required Important Limitations language." };
  }

  const rawSections = Array.isArray(input.sections)
    ? input.sections.filter((item): item is string => typeof item === "string")
    : [];
  const sectionResult = assertSectionsAllowed(state, rawSections);
  if (!sectionResult.ok) return sectionResult;

  return {
    ok: true,
    value: {
      buyerName,
      buyerEmail,
      propertyAddress,
      apn,
      county,
      state,
      sections: sectionResult.sections,
      referralCode,
      disclaimerAcceptedAt: new Date().toISOString(),
    },
  };
}

function stringField(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
