import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  buyerEmailText,
  EMAIL_SUBJECT,
  hasHyphenOrDash,
  IMPORTANT_LIMITATIONS,
  opsNotifyText,
} from "../shared/compliance.js";

const banned = [
  "surviving lien",
  "london",
  "united kingdom",
  "£",
  "the property is buildable",
  "parcel is buildable",
  "market value is",
  "we appraise",
];

const roots = ["site"];
const files: string[] = [];

function walk(dir: string) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path);
    else if (/\.(html|js|css|txt|xml)$/.test(entry)) files.push(path);
  }
}
roots.forEach(walk);

const failures: string[] = [];
for (const file of files) {
  const text = readFileSync(file, "utf8").toLowerCase();
  for (const phrase of banned) {
    if (text.includes(phrase)) {
      failures.push(`${file} contains banned phrase: ${phrase}`);
    }
  }
}

const email = buyerEmailText({
  buyerName: "Jordan Buyer",
  propertyLabel: "100 Example Road",
  orderId: "JIVTEST",
});
if (hasHyphenOrDash(email) || hasHyphenOrDash(EMAIL_SUBJECT)) {
  failures.push("Customer email copy contains a hyphen or dash.");
}
if (hasHyphenOrDash(opsNotifyText({
  orderId: "JIVTEST",
  buyerEmail: "buyer@example.com",
  propertyLabel: "100 Example Road",
  referralCode: "BRENDA",
}))) {
  failures.push("Ops notify copy contains a hyphen or dash.");
}

if (!IMPORTANT_LIMITATIONS.includes("not acting as licensed real estate appraisers")) {
  failures.push("Required disclaimer is missing the appraiser/broker sentence.");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Compliance scan passed on ${files.length} site files.`);
