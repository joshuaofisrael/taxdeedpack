import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  COMPANY_LEGAL_NAME,
  IMPORTANT_LIMITATIONS,
  PRODUCT_NAME,
  SECTION_LABELS,
} from "../../../shared/compliance.js";
import { getStatePolicy } from "../../../shared/jurisdiction.js";
import { RESEARCH_SECTION_META, type ResearchSectionId } from "../../../shared/sections.js";
import { propertyLabel } from "../../../shared/compliance.js";
import type { AssembledResearch, OrderRecord } from "../types.js";

const NAVY = rgb(0.047, 0.137, 0.251);
const INK = rgb(0.102, 0.122, 0.149);
const MUTED = rgb(0.361, 0.396, 0.439);
const RULE = rgb(0.722, 0.584, 0.29);
const LIGHT = rgb(0.93, 0.91, 0.88);

export interface PackPdfResult {
  bytes: Uint8Array;
  filename: string;
  textManifest: string[];
}

export async function generatePackPdf(
  order: OrderRecord,
  research: AssembledResearch,
): Promise<PackPdfResult> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const pages: PackPage[] = [];
  const manifest: string[] = [];

  const sections = JSON.parse(order.sections) as ResearchSectionId[];
  const label = propertyLabel({
    propertyAddress: order.property_address,
    apn: order.apn,
  });
  const policy = getStatePolicy(order.state);

  const cover = [
    COMPANY_LEGAL_NAME,
    PRODUCT_NAME,
    `Property: ${label}`,
    `County: ${order.county}`,
    `State: ${order.state}`,
    `Order: ${order.id}`,
    `Prepared: ${new Date().toISOString().slice(0, 10)}`,
    "INFORMATION AND RESEARCH PRODUCT ONLY",
    "IMPORTANT LIMITATIONS",
    ...IMPORTANT_LIMITATIONS.split("\n"),
  ];
  if (policy) {
    cover.push(policy.extraNotice);
    manifest.push(policy.extraNotice);
  }
  pages.push({ title: "Cover", lines: cover });
  manifest.push(...cover);

  if (sections.includes("public_record_snapshot")) {
    const s = research.snapshot;
    const lines = [
      RESEARCH_SECTION_META.public_record_snapshot.title,
      "Fields below are copied as published or marked NOT VERIFIED. This is not an appraisal.",
      `Situs address: ${s.situsAddress}`,
      `APN: ${s.apn}`,
      `County: ${s.county}`,
      `State: ${s.state}`,
      `Legal description: ${s.legalDescription}`,
      `Owner of record: ${s.ownerOfRecord}`,
      `Land use as published: ${s.landUseAsPublished}`,
      `Assessed land as published: ${s.assessedLand}`,
      `Assessed improvement as published: ${s.assessedImprovement}`,
      `Assessed total as published: ${s.assessedTotal}`,
      `Tax year as published: ${s.taxYear}`,
      ...s.notes,
      "Sources:",
      ...s.sources.map((source) => `Source: ${source}`),
    ];
    pages.push({ title: "Public record snapshot", lines });
    manifest.push(...lines);
  }

  if (sections.includes("sold_comps_raw")) {
    const lines = [
      RESEARCH_SECTION_META.sold_comps_raw.title,
      SECTION_LABELS.raw_comps_notice,
      "Address | Sale date | Recorded price | Deed type | Source",
      ...research.comps.map(
        (row) =>
          `${row.address} | ${row.saleDate} | ${row.recordedPrice} | ${row.deedType} | ${row.source}`,
      ),
    ];
    pages.push({ title: "Sold comps data table", lines });
    manifest.push(...lines);
  }

  if (sections.includes("public_record_items_for_review")) {
    const lines = [
      RESEARCH_SECTION_META.public_record_items_for_review.title,
      SECTION_LABELS.public_record_items_notice,
      ...research.publicRecordItems.flatMap((item) => [
        `Item: ${item.item}`,
        `Public index: ${item.publicIndex}`,
        `As published: ${item.asPublished}`,
        `Further review: ${item.reviewNote}`,
        `Source: ${item.source}`,
        "",
      ]),
    ];
    pages.push({ title: "Public-Record Items Identified for Further Review", lines });
    manifest.push(...lines);
  }

  if (sections.includes("sale_type_timing")) {
    const t = research.saleTypeTiming;
    const lines = [
      RESEARCH_SECTION_META.sale_type_timing.title,
      `Sale type as published: ${t.saleTypeAsPublished}`,
      `Scheduled date as published: ${t.scheduledDate}`,
      t.timingNotes,
      `Source: ${t.source}`,
    ];
    pages.push({ title: "Sale type and timing notes", lines });
    manifest.push(...lines);
  }

  if (sections.includes("land_use_development_data")) {
    const lines = [
      RESEARCH_SECTION_META.land_use_development_data.title,
      SECTION_LABELS.land_use_notice,
      ...research.landUseChecks.flatMap((check) => [
        `${check.label}: ${check.publishedValue} | ${check.score}`,
        `Source: ${check.source}`,
      ]),
    ];
    pages.push({ title: "Land-Use and Development Data", lines });
    manifest.push(...lines);
  }

  if (sections.includes("bid_scenario_analysis")) {
    const lines = [
      RESEARCH_SECTION_META.bid_scenario_analysis.title,
      SECTION_LABELS.bid_scenario_notice,
      ...research.bidHypotheticals.flatMap((row) => [
        `${row.label}: cash outlay ${row.cashOutlay}`,
        row.assumption,
      ]),
    ];
    pages.push({ title: "Bid Scenario Analysis", lines });
    manifest.push(...lines);
  }

  if (sections.includes("sources_and_open_questions")) {
    const lines = [
      RESEARCH_SECTION_META.sources_and_open_questions.title,
      "Sources:",
      ...research.sources.map((source) => `Source: ${source}`),
      "Open questions:",
      ...research.openQuestions.map((q) => `NOT VERIFIED: ${q}`),
    ];
    pages.push({ title: "Source links and open questions", lines });
    manifest.push(...lines);
  }

  const closing = [
    "IMPORTANT LIMITATIONS",
    ...IMPORTANT_LIMITATIONS.split("\n"),
    "Omit conclusions when a fact is not verified. Cite the source for every assembled field.",
  ];
  pages.push({ title: "Important Limitations", lines: closing });
  manifest.push(...closing);

  for (const page of pages) {
    writeWrappedPages(doc, page, regular, bold);
  }

  const bytes = await doc.save();
  const filename = `tax-deed-research-pack-${order.id}.pdf`;
  return { bytes, filename, textManifest: manifest };
}

interface PackPage {
  title: string;
  lines: string[];
}

function writeWrappedPages(
  doc: PDFDocument,
  content: PackPage,
  regular: PDFFont,
  bold: PDFFont,
): void {
  const width = 612;
  const height = 792;
  const margin = 54;
  const maxWidth = width - margin * 2;
  let page = doc.addPage([width, height]);
  let y = drawHeader(page, regular, bold);

  const drawFooter = (target: PDFPage, pageNo: number) => {
    target.drawLine({
      start: { x: margin, y: 40 },
      end: { x: width - margin, y: 40 },
      thickness: 0.5,
      color: RULE,
    });
    target.drawText("Research compilation. Not an appraisal or title product.", {
      x: margin,
      y: 26,
      size: 8,
      font: regular,
      color: MUTED,
    });
    target.drawText(String(pageNo), {
      x: width - margin - 18,
      y: 26,
      size: 8,
      font: regular,
      color: MUTED,
    });
  };

  let pageNo = doc.getPageCount();
  drawFooter(page, pageNo);

  page.drawText(content.title, {
    x: margin,
    y,
    size: 14,
    font: bold,
    color: NAVY,
  });
  y -= 22;

  for (const line of content.lines) {
    const wrapped = wrap(line || " ", regular, 10, maxWidth);
    for (const part of wrapped) {
      if (y < 64) {
        page = doc.addPage([width, height]);
        y = drawHeader(page, regular, bold);
        pageNo = doc.getPageCount();
        drawFooter(page, pageNo);
      }
      const isHeading =
        part === "IMPORTANT LIMITATIONS" ||
        part === COMPANY_LEGAL_NAME ||
        part === PRODUCT_NAME;
      page.drawText(part, {
        x: margin,
        y,
        size: isHeading ? 12 : 10,
        font: isHeading ? bold : regular,
        color: isHeading ? NAVY : INK,
      });
      y -= isHeading ? 16 : 13;
    }
    y -= 4;
  }

  void LIGHT;
}

function drawHeader(page: PDFPage, regular: PDFFont, bold: PDFFont): number {
  page.drawRectangle({
    x: 0,
    y: 760,
    width: 612,
    height: 32,
    color: NAVY,
  });
  page.drawText(COMPANY_LEGAL_NAME, {
    x: 54,
    y: 771,
    size: 9,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(PRODUCT_NAME, {
    x: 300,
    y: 771,
    size: 9,
    font: regular,
    color: rgb(0.85, 0.78, 0.6),
  });
  return 730;
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}
