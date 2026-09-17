import type { ResearchSectionId } from "../../shared/sections.js";

export interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  OPS_TOKEN: string;
  SITE_URL: string;
  ALLOW_DEV_SIMULATE: string;
  OPS_NOTIFY_EMAIL: string;
}

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "fulfilling"
  | "fulfilled"
  | "fulfillment_failed";

export interface OrderRecord {
  id: string;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  status: OrderStatus;
  buyer_name: string;
  buyer_email: string;
  property_address: string | null;
  apn: string | null;
  county: string;
  state: string;
  sections: string;
  referral_code: string | null;
  amount_cents: number;
  disclaimer_accepted_at: string;
  created_at: string;
  paid_at: string | null;
  fulfilled_at: string | null;
  pdf_generated_at: string | null;
  email_sent_at: string | null;
  last_error: string | null;
}

export interface CheckoutInput {
  buyerName: string;
  buyerEmail: string;
  propertyAddress?: string;
  apn?: string;
  county: string;
  state: string;
  sections: ResearchSectionId[];
  referralCode?: string;
  disclaimerAccepted: boolean;
}

export interface PublicRecordSnapshot {
  situsAddress: string;
  apn: string;
  county: string;
  state: string;
  legalDescription: string;
  ownerOfRecord: string;
  landUseAsPublished: string;
  assessedLand: string;
  assessedImprovement: string;
  assessedTotal: string;
  taxYear: string;
  sources: string[];
  notes: string[];
}

export interface RawCompRow {
  address: string;
  saleDate: string;
  recordedPrice: string;
  deedType: string;
  source: string;
}

export interface PublicRecordItemFlag {
  item: string;
  publicIndex: string;
  asPublished: string;
  reviewNote: string;
  source: string;
}

export interface SaleTypeTiming {
  saleTypeAsPublished: string;
  scheduledDate: string;
  timingNotes: string;
  source: string;
}

export interface LandUseCheck {
  label: string;
  publishedValue: string;
  score: "PASS" | "FAIL" | "UNKNOWN";
  source: string;
}

export interface BidHypothetical {
  label: string;
  cashOutlay: string;
  assumption: string;
}

export interface AssembledResearch {
  snapshot: PublicRecordSnapshot;
  comps: RawCompRow[];
  publicRecordItems: PublicRecordItemFlag[];
  saleTypeTiming: SaleTypeTiming;
  landUseChecks: LandUseCheck[];
  bidHypotheticals: BidHypothetical[];
  openQuestions: string[];
  sources: string[];
}
