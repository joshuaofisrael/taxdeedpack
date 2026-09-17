export const PREFERRED_PARTNERS = [
  {
    name: "Title & Abstract Agency of America",
    url: "https://www.titleandabstract.com",
    blurb:
      "Preferred partner for title and settlement services. Licensed in multiple states with nationwide resources. Joshua Israel Ventures LLC does not provide title insurance or title opinions.",
  },
  {
    name: "US Tax Deed Solutions",
    url: "https://www.ustaxdeedsolutions.com",
    blurb:
      "Preferred partner for tax deed certification paths toward insurability. Joshua Israel Ventures LLC does not certify title or issue title insurance.",
  },
] as const;

export const SEEDED_REFERRAL_CODES = [
  {
    code: "BRENDA",
    label: "Brenda / US Tax Deed Solutions",
    partner: "US Tax Deed Solutions",
  },
] as const;

/** Internal only. Never show as a public form example. */
export const FREE_TEST_CODE = "ADMINJ" as const;

/** Delivery for ADMINJ free tests goes only to Joshua's personal inbox. */
export const ADMINJ_DELIVER_ONLY_TO = "joshuaofisrael@gmail.com" as const;

export function isFreeTestCode(code: string | null | undefined): boolean {
  return Boolean(code && code.toUpperCase() === FREE_TEST_CODE);
}
