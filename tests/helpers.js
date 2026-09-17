import { readFileSync } from "node:fs";
import Database from "better-sqlite3";
import { createApp } from "../api/app.js";
import { createMailer } from "../api/mailer.js";
import { createStore, sqliteDriver } from "../api/store.js";
import { SCHEMA_SQL } from "../api/schema.js";

export async function testApp(envExtra = {}) {
  const db = new Database(":memory:");
  const store = createStore(sqliteDriver(db));
  await store.migrate(SCHEMA_SQL);
  const mailer = createMailer({});
  const env = {
    SITE_URL: "https://taxdeedpack.com",
    ALLOW_ORIGIN: "https://taxdeedpack.com",
    ALLOW_TEST_CHECKOUT: "1",
    OPS_PASSWORD: "test-ops",
    ...envExtra,
  };
  const app = createApp({ store, mailer, env });
  return { app, store, mailer, env, db };
}

export function siteFiles() {
  return [
    "site/index.html",
    "site/order.html",
    "site/disclaimer.html",
    "site/terms.html",
    "site/privacy.html",
    "site/success.html",
  ].map((path) => ({ path, text: readFileSync(new URL(`../${path}`, import.meta.url), "utf8") }));
}

export const VALID_ORDER = {
  buyerName: "Alex Buyer",
  buyerEmail: "alex@example.com",
  street: "200 Oak Avenue",
  city: "Jacksonville",
  county: "Duval",
  state: "FL",
  apn: "100-200-300",
  referralCode: "BRENDA",
  requestedSections: [
    "public_record_snapshot",
    "sold_comps_raw",
    "public_record_items_review",
    "sale_type_timing",
    "land_use_development",
    "bid_scenario_analysis",
  ],
  disclaimerAcknowledged: true,
};
