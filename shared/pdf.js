import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  COMPANY_LEGAL_NAME,
  NOT_VERIFIED_LABEL,
  PRODUCT_CLASSIFICATION,
  PRODUCT_NAME,
  REQUIRED_DISCLAIMER,
  REQUIRED_DISCLAIMER_TITLE,
} from "./disclaimer.js";
import { propertyLabel } from "./validation.js";
import { buildResearchPayload } from "./public-data-stubs.js";

const PAGE = { width: 612, height: 792 };
const MARGIN = 54;
const INK = rgb(0.08, 0.1, 0.14);
const MUTED = rgb(0.28, 0.3, 0.34);
const RULE = rgb(0.45, 0.36, 0.22);
const BAND = rgb(0.96, 0.94, 0.88);
const ALERT = rgb(0.42, 0.16, 0.22);

export async function generateResearchPackPdf(order, sectionIds) {
  const pdf = await PDFDocument.create();
  const fonts = {
    regular: await pdf.embedFont(StandardFonts.TimesRoman),
    bold: await pdf.embedFont(StandardFonts.TimesRomanBold),
    italic: await pdf.embedFont(StandardFonts.TimesRomanItalic),
  };

  const payload = buildResearchPayload(order, sectionIds);
  const ctx = { pdf, fonts, order, sectionIds, payload };

  drawCover(ctx);
  if (payload.public_record_snapshot) drawSnapshot(ctx, payload.public_record_snapshot);
  if (payload.sold_comps_raw) drawComps(ctx, payload.sold_comps_raw);
  if (payload.public_record_items_review) drawItemsReview(ctx, payload.public_record_items_review);
  if (payload.sale_type_timing) drawKeyValues(ctx, payload.sale_type_timing);
  if (payload.land_use_development) drawLandUse(ctx, payload.land_use_development);
  if (payload.bid_scenario_analysis) drawBidScenarios(ctx, payload.bid_scenario_analysis);
  drawSources(ctx, payload.sources_and_questions);
  drawLimitationsPage(ctx, "Last page");

  pdf.setTitle(`${PRODUCT_NAME}: ${propertyLabel(order)}`);
  pdf.setAuthor(COMPANY_LEGAL_NAME);
  pdf.setSubject(PRODUCT_CLASSIFICATION);
  pdf.setCreator(COMPANY_LEGAL_NAME);
  pdf.setKeywords(["research compilation", "public records", "not an appraisal", "not a title search"]);

  const bytes = await pdf.save();
  return {
    bytes,
    fileName: `taxdeedpack-${order.id || "draft"}.pdf`,
    payload,
  };
}

function newPage(ctx) {
  const page = ctx.pdf.addPage([PAGE.width, PAGE.height]);
  return { page, y: PAGE.height - MARGIN };
}

function footer(page, order, label, font) {
  page.drawLine({
    start: { x: MARGIN, y: 36 },
    end: { x: PAGE.width - MARGIN, y: 36 },
    thickness: 0.5,
    color: RULE,
  });
  const text = `${COMPANY_LEGAL_NAME}  |  ${PRODUCT_NAME}  |  ${order.id || "draft"}  |  ${label}  |  Research only`;
  page.drawText(text, {
    x: MARGIN,
    y: 22,
    size: 8,
    font,
    color: MUTED,
  });
}

function drawWrapped(page, font, text, x, y, maxWidth, size, color) {
  const lines = wrap(font, text, maxWidth, size);
  let cursor = y;
  for (const line of lines) {
    page.drawText(line, { x, y: cursor, size, font, color });
    cursor -= size + 3;
  }
  return cursor;
}

function wrap(font, text, maxWidth, size) {
  const normalized = String(text || "").replace(/\r/g, "");
  const paragraphs = normalized.split("\n");
  const lines = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of words) {
      const trial = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(trial, size) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = trial;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

function ensureSpace(ctx, holder, needed) {
  if (holder.y - needed < 56) {
    footer(holder.page, ctx.order, "continued", ctx.fonts.regular);
    const next = newPage(ctx);
    holder.page = next.page;
    holder.y = next.y;
    return true;
  }
  return false;
}

function heading(ctx, holder, title) {
  ensureSpace(ctx, holder, 36);
  holder.page.drawText(title, {
    x: MARGIN,
    y: holder.y,
    size: 14,
    font: ctx.fonts.bold,
    color: INK,
  });
  holder.y -= 10;
  holder.page.drawLine({
    start: { x: MARGIN, y: holder.y },
    end: { x: PAGE.width - MARGIN, y: holder.y },
    thickness: 1,
    color: RULE,
  });
  holder.y -= 18;
}

function paragraph(ctx, holder, text, opts = {}) {
  const size = opts.size || 10;
  const font = opts.italic ? ctx.fonts.italic : ctx.fonts.regular;
  const color = opts.alert ? ALERT : opts.muted ? MUTED : INK;
  const lines = wrap(font, text, PAGE.width - MARGIN * 2, size);
  for (const line of lines) {
    ensureSpace(ctx, holder, size + 6);
    holder.page.drawText(line, { x: MARGIN, y: holder.y, size, font, color });
    holder.y -= size + 3;
  }
  holder.y -= opts.after ?? 8;
}

function drawCover(ctx) {
  const { page, y: startY } = newPage(ctx);
  let y = startY;
  page.drawRectangle({
    x: 0,
    y: PAGE.height - 120,
    width: PAGE.width,
    height: 120,
    color: rgb(0.05, 0.12, 0.2),
  });
  page.drawText(COMPANY_LEGAL_NAME, {
    x: MARGIN,
    y: PAGE.height - 58,
    size: 12,
    font: ctx.fonts.regular,
    color: rgb(0.86, 0.78, 0.58),
  });
  page.drawText(PRODUCT_NAME, {
    x: MARGIN,
    y: PAGE.height - 86,
    size: 22,
    font: ctx.fonts.bold,
    color: rgb(0.98, 0.97, 0.93),
  });

  y = PAGE.height - 150;
  page.drawText("Information and research product only", {
    x: MARGIN,
    y,
    size: 12,
    font: ctx.fonts.italic,
    color: ALERT,
  });
  y -= 28;
  page.drawText(propertyLabel(ctx.order), {
    x: MARGIN,
    y,
    size: 13,
    font: ctx.fonts.bold,
    color: INK,
  });
  y -= 20;
  const meta = [
    `Prepared for: ${ctx.order.buyerName || "Buyer"}`,
    `Order: ${ctx.order.id || "draft"}`,
    `Prepared: ${ctx.order.fulfilledAt || ctx.order.createdAt || new Date().toISOString()}`,
    `Price paid: $149 USD per property (research compilation)`,
  ];
  for (const line of meta) {
    page.drawText(line, { x: MARGIN, y, size: 10, font: ctx.fonts.regular, color: MUTED });
    y -= 14;
  }
  y -= 10;
  y = drawWrapped(
    page,
    ctx.fonts.regular,
    PRODUCT_CLASSIFICATION,
    MARGIN,
    y,
    PAGE.width - MARGIN * 2,
    9,
    MUTED,
  );
  y -= 16;

  page.drawRectangle({
    x: MARGIN - 8,
    y: 70,
    width: PAGE.width - MARGIN * 2 + 16,
    height: y - 70,
    color: BAND,
  });
  let boxY = y - 18;
  page.drawText(REQUIRED_DISCLAIMER_TITLE, {
    x: MARGIN,
    y: boxY,
    size: 12,
    font: ctx.fonts.bold,
    color: ALERT,
  });
  boxY -= 18;
  drawWrapped(page, ctx.fonts.regular, REQUIRED_DISCLAIMER, MARGIN, boxY, PAGE.width - MARGIN * 2, 9, INK);
  footer(page, ctx.order, "Cover", ctx.fonts.regular);
}

function drawLimitationsPage(ctx, label) {
  const holder = newPage(ctx);
  heading(ctx, holder, REQUIRED_DISCLAIMER_TITLE);
  paragraph(ctx, holder, REQUIRED_DISCLAIMER, { size: 11 });
  paragraph(
    ctx,
    holder,
    "Joshua Israel Ventures LLC omits conclusions when source data is incomplete. Unknown items are marked " +
      NOT_VERIFIED_LABEL +
      ". This pack does not create an agency relationship and does not claim broker or appraiser status.",
  );
  paragraph(ctx, holder, PRODUCT_CLASSIFICATION, { muted: true });
  footer(holder.page, ctx.order, label, ctx.fonts.regular);
}

function drawSnapshot(ctx, data) {
  const holder = newPage(ctx);
  heading(ctx, holder, data.heading);
  paragraph(ctx, holder, data.intro, { italic: true, muted: true });
  for (const row of data.rows) {
    ensureSpace(ctx, holder, 36);
    holder.page.drawText(row.label, { x: MARGIN, y: holder.y, size: 10, font: ctx.fonts.bold, color: INK });
    holder.y -= 13;
    paragraph(ctx, holder, `Value: ${row.value}`, { size: 10, after: 2 });
    paragraph(ctx, holder, `Source: ${row.source}`, { size: 9, muted: true, after: 10 });
  }
  footer(holder.page, ctx.order, data.heading, ctx.fonts.regular);
}

function drawComps(ctx, data) {
  const holder = newPage(ctx);
  heading(ctx, holder, data.heading);
  paragraph(ctx, holder, data.intro, { italic: true, muted: true });
  for (const [index, row] of data.rows.entries()) {
    ensureSpace(ctx, holder, 70);
    holder.page.drawText(`Reported transaction ${index + 1}`, {
      x: MARGIN,
      y: holder.y,
      size: 11,
      font: ctx.fonts.bold,
      color: INK,
    });
    holder.y -= 16;
    data.columns.forEach((col, i) => {
      paragraph(ctx, holder, `${col}: ${row[i]}`, { size: 10, after: 2 });
    });
    holder.y -= 8;
  }
  for (const note of data.footnotes) paragraph(ctx, holder, note, { size: 9, muted: true, after: 4 });
  footer(holder.page, ctx.order, data.heading, ctx.fonts.regular);
}

function drawItemsReview(ctx, data) {
  const holder = newPage(ctx);
  heading(ctx, holder, data.heading);
  paragraph(ctx, holder, data.intro, { italic: true, muted: true });
  for (const item of data.items) {
    ensureSpace(ctx, holder, 64);
    paragraph(ctx, holder, item.item, { size: 11, after: 2 });
    paragraph(ctx, holder, `Flag: ${item.flag}`, { size: 10, after: 2 });
    paragraph(ctx, holder, `Source: ${item.source}`, { size: 9, muted: true, after: 2 });
    paragraph(ctx, holder, `Further review: ${item.nextStep}`, { size: 9, muted: true, after: 12 });
  }
  footer(holder.page, ctx.order, data.heading, ctx.fonts.regular);
}

function drawKeyValues(ctx, data) {
  const holder = newPage(ctx);
  heading(ctx, holder, data.heading);
  paragraph(ctx, holder, data.intro, { italic: true, muted: true });
  for (const row of data.rows) {
    paragraph(ctx, holder, row.label, { size: 11, after: 2 });
    paragraph(ctx, holder, `Value: ${row.value}`, { size: 10, after: 2 });
    paragraph(ctx, holder, `Source: ${row.source}`, { size: 9, muted: true, after: 10 });
  }
  if (data.openQuestions) {
    paragraph(ctx, holder, "Open questions", { size: 11, after: 6 });
    for (const q of data.openQuestions) paragraph(ctx, holder, q, { size: 10, after: 4 });
  }
  footer(holder.page, ctx.order, data.heading, ctx.fonts.regular);
}

function drawLandUse(ctx, data) {
  const holder = newPage(ctx);
  heading(ctx, holder, data.heading);
  paragraph(ctx, holder, data.intro, { italic: true, muted: true });
  for (const row of data.rows) {
    paragraph(ctx, holder, `${row.label}: ${row.score}`, { size: 11, after: 2 });
    paragraph(ctx, holder, `Source: ${row.source}`, { size: 9, muted: true, after: 10 });
  }
  for (const note of data.footnotes) paragraph(ctx, holder, note, { size: 9, muted: true, after: 4 });
  footer(holder.page, ctx.order, data.heading, ctx.fonts.regular);
}

function drawBidScenarios(ctx, data) {
  const holder = newPage(ctx);
  heading(ctx, holder, data.heading);
  paragraph(ctx, holder, data.intro, { italic: true, alert: true });
  for (const scenario of data.scenarios) {
    paragraph(ctx, holder, scenario.label, { size: 12, after: 6 });
    for (const line of scenario.lines) paragraph(ctx, holder, line, { size: 10, after: 4 });
    holder.y -= 8;
  }
  for (const note of data.footnotes) paragraph(ctx, holder, note, { size: 9, muted: true, after: 4 });
  footer(holder.page, ctx.order, data.heading, ctx.fonts.regular);
}

function drawSources(ctx, data) {
  const holder = newPage(ctx);
  heading(ctx, holder, data.heading);
  paragraph(
    ctx,
    holder,
    "Cite every source. If a URL or record cannot be confirmed, mark it " + NOT_VERIFIED_LABEL + " and omit the conclusion.",
    { italic: true, muted: true },
  );
  for (const source of data.sources) {
    paragraph(ctx, holder, source.label, { size: 11, after: 2 });
    paragraph(ctx, holder, `Link: ${source.href}`, { size: 10, after: 2 });
    paragraph(ctx, holder, source.note, { size: 9, muted: true, after: 10 });
  }
  paragraph(ctx, holder, "Open questions", { size: 12, after: 6 });
  for (const q of data.questions) paragraph(ctx, holder, q, { size: 10, after: 4 });
  footer(holder.page, ctx.order, data.heading, ctx.fonts.regular);
}
