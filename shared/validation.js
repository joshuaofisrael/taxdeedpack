import { PRICE_CENTS } from "./disclaimer.js";
import { gateRequestedSections } from "./jurisdiction.js";
import { normalizeReferralCode } from "./referrals.js";
import { findJurisdiction } from "./us-states.js";

export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function isEmail(value) {
  if (!isNonEmptyString(value)) return false;
  // Practical validation only. Final delivery still depends on the mail provider.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) && value.length <= 254;
}

/**
 * Validate an order request before Stripe Checkout.
 * Requires address and/or APN, county, US state, buyer name, email, disclaimer ack.
 */
export function validateOrderInput(input) {
  const errors = [];
  const body = input && typeof input === "object" ? input : {};

  const buyerName = String(body.buyerName || "").trim();
  const buyerEmail = String(body.buyerEmail || "").trim().toLowerCase();
  const street = String(body.street || "").trim();
  const city = String(body.city || "").trim();
  const county = String(body.county || "").trim();
  const apn = String(body.apn || "").trim();
  const state = String(body.state || "").trim().toUpperCase();
  const referralCode = normalizeReferralCode(body.referralCode);
  const requestedSections = Array.isArray(body.requestedSections) ? body.requestedSections : [];
  const disclaimerAcknowledged = body.disclaimerAcknowledged === true || body.disclaimerAcknowledged === "true";

  if (!isNonEmptyString(buyerName)) errors.push("Buyer name is required.");
  if (!isEmail(buyerEmail)) errors.push("A valid buyer email is required.");
  if (!isNonEmptyString(county)) errors.push("County is required.");

  const jurisdiction = findJurisdiction(state);
  if (!jurisdiction) errors.push("Select a US state, DC, or territory.");

  if (!isNonEmptyString(street) && !isNonEmptyString(apn)) {
    errors.push("Provide a property street address and/or APN.");
  }

  if (!disclaimerAcknowledged) {
    errors.push("You must acknowledge the IMPORTANT LIMITATIONS disclaimer before payment.");
  }

  const gated = jurisdiction
    ? gateRequestedSections(state, requestedSections)
    : { ok: false, allowedIds: [], rejected: [], gate: null };

  if (jurisdiction && gated.allowedIds.filter((id) => id !== "sources_and_questions").length === 0) {
    errors.push("Select at least one offerable research section for this state.");
  }

  return {
    ok: errors.length === 0,
    errors,
    value: {
      buyerName,
      buyerEmail,
      street,
      city,
      county,
      apn,
      state,
      referralCode,
      requestedSections: gated.allowedIds,
      rejectedSections: gated.rejected || [],
      disclaimerAcknowledged,
      amountCents: PRICE_CENTS,
      currency: "usd",
      jurisdiction: gated.gate,
    },
  };
}

export function propertyLabel(order) {
  const bits = [];
  if (order.street) bits.push(order.street);
  if (order.city) bits.push(order.city);
  if (order.county) bits.push(`${order.county} County`);
  if (order.state) bits.push(order.state);
  if (order.apn) bits.push(`APN ${order.apn}`);
  return bits.join(", ") || "Property not specified";
}
