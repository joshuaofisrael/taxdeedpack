/**
 * Referral codes. Seed Brenda / US Tax Deed Solutions as BRENDA.
 * Tracking fields: code, order id, amount, timestamp.
 */

export const SEEDED_REFERRAL_CODES = [
  {
    code: "BRENDA",
    partnerName: "Brenda / US Tax Deed Solutions",
    notes: "Primary US Tax Deed Solutions referral code.",
  },
  {
    code: "USTDS",
    partnerName: "Brenda / US Tax Deed Solutions",
    notes: "Alias for the same US Tax Deed Solutions partner.",
  },
];

export function normalizeReferralCode(raw) {
  if (raw == null) return "";
  return String(raw).trim().toUpperCase();
}

export function isKnownReferralCode(code, knownCodes = SEEDED_REFERRAL_CODES.map((row) => row.code)) {
  const normalized = normalizeReferralCode(code);
  if (!normalized) return false;
  return knownCodes.includes(normalized);
}
