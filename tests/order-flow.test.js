import { describe, expect, it } from "vitest";
import { generateResearchPackPdf } from "../shared/pdf.js";
import { REQUIRED_DISCLAIMER } from "../shared/disclaimer.js";
import { buildResearchPayload } from "../shared/public-data-stubs.js";
import { testApp, VALID_ORDER } from "./helpers.js";

describe("order flow", () => {
  it("requires disclaimer acknowledgment and address or APN", async () => {
    const { app } = await testApp();
    const missing = await app.request("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...VALID_ORDER, disclaimerAcknowledged: false, street: "", apn: "" }),
    });
    const body = await missing.json();
    expect(missing.status).toBe(400);
    expect(body.errors.join(" ")).toMatch(/IMPORTANT LIMITATIONS/);
    expect(body.errors.join(" ")).toMatch(/address and\/or APN/);
  });

  it("fulfills a local test checkout when the success page confirms the session", async () => {
    const { app, mailer } = await testApp();
    const checkout = await (await app.request("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...VALID_ORDER, referralCode: "USTDS" }),
    })).json();
    const confirmed = await (await app.request(`/api/checkout/session/${checkout.checkoutUrl.split("session_id=")[1].split("&")[0]}`)).json();
    expect(confirmed.status).toBe("fulfilled");
    expect(mailer.sent[0].to).toBe("alex@example.com");
  });

  it("runs form -> checkout -> payment -> PDF -> email and tracks Brenda", async () => {
    const { app, mailer, store } = await testApp();
    const checkoutRes = await app.request("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(VALID_ORDER),
    });
    const checkout = await checkoutRes.json();
    expect(checkout.ok).toBe(true);
    expect(checkout.checkoutUrl).toContain("success.html");

    const payRes = await app.request(`/api/test/pay/${checkout.orderId}`, { method: "POST" });
    const paid = await payRes.json();
    expect(paid.ok).toBe(true);

    const webhookRes = await app.request("/api/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "checkout.session.completed",
        data: {
          object: {
            id: `cs_test_local_${checkout.orderId}`,
            amount_total: 14900,
            metadata: { order_id: checkout.orderId },
            payment_intent: "pi_test",
          },
        },
      }),
    });
    const webhook = await webhookRes.json();
    expect(webhook.already).toBe(true);

    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0].to).toBe("alex@example.com");
    expect(mailer.sent[0].subject).not.toMatch(/[-–—]/);
    expect(mailer.sent[0].attachments[0].filename).toMatch(/taxdeedpack-/);

    const viaSession = await (await app.request(`/api/checkout/session/cs_test_local_${checkout.orderId}`)).json();
    expect(viaSession.status).toBe("fulfilled");

    const stats = await store.referralStats();
    const brenda = stats.find((row) => row.code === "BRENDA");
    expect(brenda.orderCount).toBe(1);
    expect(brenda.amountCents).toBe(14900);
    expect(brenda.partnerName).toMatch(/US Tax Deed Solutions/);

    const referrals = await store.listReferrals();
    expect(referrals[0].code).toBe("BRENDA");
    expect(referrals[0].order_id).toBe(checkout.orderId);
    expect(referrals[0].amount_cents).toBe(14900);
    expect(referrals[0].created_at).toBeTruthy();
  });

  it("lets ops list orders, Brenda stats, and resend email", async () => {
    const { app } = await testApp();
    const checkout = await (await app.request("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(VALID_ORDER),
    })).json();
    await app.request(`/api/test/pay/${checkout.orderId}`, { method: "POST" });

    const denied = await app.request("/api/ops/summary");
    expect(denied.status).toBe(401);

    const summary = await (await app.request("/api/ops/summary", {
      headers: { Authorization: "Bearer test-ops" },
    })).json();
    expect(summary.orders[0].id).toBe(checkout.orderId);
    expect(summary.referralStats.some((row) => row.code === "BRENDA")).toBe(true);

    const resend = await app.request(`/api/ops/resend/${checkout.orderId}`, {
      method: "POST",
      headers: { Authorization: "Bearer test-ops" },
    });
    expect(resend.status).toBe(200);
  });
});

describe("PDF research pack", () => {
  it("builds a real PDF with the locked disclaimer and research-only stubs", async () => {
    const order = {
      id: "ord_test",
      buyerName: "Alex Buyer",
      street: "200 Oak Avenue",
      city: "Jacksonville",
      county: "Duval",
      state: "FL",
      apn: "100-200-300",
    };
    const ids = VALID_ORDER.requestedSections;
    const { bytes, payload } = await generateResearchPackPdf(order, ids);
    expect(Buffer.from(bytes).subarray(0, 4).toString()).toBe("%PDF");
    expect(bytes.length).toBeGreaterThan(2000);
    expect(payload.sold_comps_raw.intro).toMatch(/transaction data only/i);
    expect(payload.sold_comps_raw.intro).toMatch(/not a CMA, BPO, adjustment grid, ARV/);
    expect(payload.public_record_items_review.heading).toBe("Public-Record Items Identified for Further Review");
    expect(JSON.stringify(payload)).not.toMatch(/surviving lien/);
    expect(payload.land_use_development.intro).toMatch(/not a buildable/i);
    expect(payload.bid_scenario_analysis.intro).toMatch(/labeled hypotheticals only/i);
    expect(payload.bid_scenario_analysis.intro).toMatch(/not a recommended bid/i);
    expect(JSON.stringify(payload)).toContain("NOT VERIFIED");
    expect(REQUIRED_DISCLAIMER).toMatch(/informational purposes only/);
  });

  it("keeps stub research from inventing values", () => {
    const payload = buildResearchPayload(
      { county: "Duval", state: "FL", street: "200 Oak Avenue", apn: "1" },
      ["sold_comps_raw", "land_use_development"],
    );
    expect(payload.sold_comps_raw.rows.every((row) => row.includes("NOT VERIFIED"))).toBe(true);
    expect(payload.land_use_development.rows.every((row) => row.score === "UNKNOWN")).toBe(true);
  });
});
