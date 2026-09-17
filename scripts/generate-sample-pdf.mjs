import { mkdirSync, writeFileSync } from "node:fs";
import { generateResearchPackPdf } from "../shared/pdf.js";

const order = {
  id: "ord_sample",
  buyerName: "Sample Buyer",
  street: "100 Main Street",
  city: "Tampa",
  county: "Hillsborough",
  state: "FL",
  apn: "A-123-456",
  createdAt: new Date().toISOString(),
};

const { bytes, fileName } = await generateResearchPackPdf(order, [
  "public_record_snapshot",
  "sold_comps_raw",
  "public_record_items_review",
  "sale_type_timing",
  "land_use_development",
  "bid_scenario_analysis",
]);

mkdirSync(new URL("../artifacts", import.meta.url), { recursive: true });
const out = new URL(`../artifacts/${fileName}`, import.meta.url);
writeFileSync(out, bytes);
console.log(`Wrote ${out.pathname}`);
