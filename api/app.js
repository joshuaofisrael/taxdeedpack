import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import {
  COMPANY_LEGAL_NAME,
  OPS_EMAIL,
  PRICE_CENTS,
  PRODUCT_NAME,
  REQUIRED_DISCLAIMER,
  REQUIRED_DISCLAIMER_TITLE,
} from "../shared/disclaimer.js";
import { OFFER_WHAT_YOU_DO_NOT_GET, OFFER_WHAT_YOU_GET, PREFERRED_PARTNERS } from "../shared/copy.js";
import { REQUESTABLE_SECTIONS } from "../shared/sections.js";
import { getJurisdictionGate, listJurisdictionMatrix } from "../shared/jurisdiction.js";
import { US_JURISDICTIONS } from "../shared/us-states.js";
import { validateOrderInput } from "../shared/validation.js";
import { createCheckoutSession, retrieveCheckoutSession, verifyStripeWebhook } from "./stripe.js";
import { fulfillPaidOrder, markPaidAndFulfill } from "./fulfill.js";
import { renderOpsPage } from "./ops-page.js";

export function createApp({ store, mailer, env, pdfCache = new Map() }) {
  const app = new Hono();
  const siteUrl = (env.SITE_URL || "https://taxdeedpack.com").replace(/\/$/, "");
  const allowOrigin = env.ALLOW_ORIGIN || siteUrl;

  app.use("*", async (c, next) => {
    await next();
    c.header("Access-Control-Allow-Origin", allowOrigin);
    c.header("Access-Control-Allow-Credentials", "true");
    c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Stripe-Signature");
    c.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    c.header("X-Content-Type-Options", "nosniff");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  });

  app.options("*", (c) => c.body(null, 204));

  app.get("/api/health", (c) =>
    c.json({
      ok: true,
      product: PRODUCT_NAME,
      company: COMPANY_LEGAL_NAME,
      priceCents: PRICE_CENTS,
    }),
  );

  app.get("/api/catalog", (c) =>
    c.json({
      product: PRODUCT_NAME,
      company: COMPANY_LEGAL_NAME,
      priceCents: PRICE_CENTS,
      opsEmail: OPS_EMAIL,
      disclaimerTitle: REQUIRED_DISCLAIMER_TITLE,
      disclaimer: REQUIRED_DISCLAIMER,
      whatYouGet: OFFER_WHAT_YOU_GET,
      whatYouDoNotGet: OFFER_WHAT_YOU_DO_NOT_GET,
      preferredPartners: PREFERRED_PARTNERS,
      sections: REQUESTABLE_SECTIONS,
      jurisdictions: US_JURISDICTIONS,
    }),
  );

  app.get("/api/jurisdiction/:state", (c) => {
    const gate = getJurisdictionGate(c.req.param("state"));
    return c.json(gate, gate.valid ? 200 : 400);
  });

  app.get("/api/jurisdiction", (c) => c.json({ matrix: listJurisdictionMatrix() }));

  app.post("/api/checkout", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const checked = validateOrderInput(body);
    if (!checked.ok) return c.json({ ok: false, errors: checked.errors }, 400);

    const order = await store.createOrder(checked.value);
    const session = await createCheckoutSession({ env, order, siteUrl });
    if (session.id) await store.attachStripeSession(order.id, session.id);

    return c.json({
      ok: true,
      orderId: order.id,
      checkoutUrl: session.url,
      testMode: Boolean(session.testMode),
    });
  });

  app.post("/api/webhook", async (c) => {
    const raw = await c.req.text();
    let event;
    try {
      if (env.STRIPE_WEBHOOK_SECRET) {
        event = await verifyStripeWebhook(raw, c.req.header("Stripe-Signature"), env.STRIPE_WEBHOOK_SECRET);
      } else if (env.ALLOW_TEST_CHECKOUT === "1") {
        event = JSON.parse(raw);
      } else {
        return c.json({ error: "Webhook secret required." }, 400);
      }
    } catch (error) {
      return c.json({ error: error.message }, 400);
    }

    if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
      return c.json({ received: true, ignored: event.type });
    }

    const session = event.data?.object || {};
    const orderId = session.metadata?.order_id || session.client_reference_id;
    const order = (orderId && (await store.getOrder(orderId))) || (session.id && (await store.getOrderByStripeSession(session.id)));
    if (!order) return c.json({ error: "Order not found for Stripe session." }, 404);
    if (session.amount_total && session.amount_total !== order.amountCents) {
      return c.json({ error: "Amount mismatch." }, 400);
    }

    const result = await markPaidAndFulfill(store, mailer, order, {
      paymentIntent: session.payment_intent || "",
      paidAt: new Date().toISOString(),
    });
    if (result.pdfBytes) pdfCache.set(order.id, result.pdfBytes);
    return c.json({ ok: true, orderId: order.id, already: result.already });
  });

  app.get("/api/checkout/session/:id", async (c) => {
    const sessionId = c.req.param("id");
    let order = await store.getOrderByStripeSession(sessionId);

    if (!order && env.STRIPE_SECRET_KEY && !sessionId.startsWith("cs_test_local_")) {
      const session = await retrieveCheckoutSession(env, sessionId);
      const orderId = session.metadata?.order_id || session.client_reference_id;
      order = await store.getOrder(orderId);
      if (order && session.payment_status === "paid" && order.status === "pending_payment") {
        const result = await markPaidAndFulfill(store, mailer, order, {
          paymentIntent: session.payment_intent || "",
        });
        if (result.pdfBytes) pdfCache.set(order.id, result.pdfBytes);
        order = result.order;
      }
    }

    if (sessionId.startsWith("cs_test_local_") && env.ALLOW_TEST_CHECKOUT === "1") {
      if (!order) {
        order = await store.getOrder(sessionId.replace("cs_test_local_", ""));
      }
      if (order && order.status === "pending_payment") {
        const result = await markPaidAndFulfill(store, mailer, order, { paymentIntent: "test_local" });
        if (result.pdfBytes) pdfCache.set(order.id, result.pdfBytes);
        order = result.order;
      }
    }

    if (!order) return c.json({ error: "Unknown checkout session." }, 404);
    return c.json({
      ok: true,
      status: order.status,
      orderId: order.id,
      emailStatus: order.emailStatus,
    });
  });

  app.post("/api/test/pay/:orderId", async (c) => {
    if (env.ALLOW_TEST_CHECKOUT !== "1") return c.json({ error: "Test checkout is disabled." }, 403);
    const order = await store.getOrder(c.req.param("orderId"));
    if (!order) return c.json({ error: "Order not found." }, 404);
    const result = await markPaidAndFulfill(store, mailer, order, { paymentIntent: "test_local" });
    if (result.pdfBytes) pdfCache.set(order.id, result.pdfBytes);
    return c.json({ ok: true, orderId: order.id, status: result.order.status });
  });

  app.get("/ops", async (c) => {
    if (!(await requireOps(c, env))) return opsUnauthorized(c);
    return c.html(renderOpsPage());
  });

  app.get("/api/ops/summary", async (c) => {
    if (!(await requireOps(c, env))) return c.json({ error: "Unauthorized" }, 401);
    const [orders, referralStats, referralCodes, referrals] = await Promise.all([
      store.listOrders(),
      store.referralStats(),
      store.listReferralCodes(),
      store.listReferrals(),
    ]);
    return c.json({ orders, referralStats, referralCodes, referrals });
  });

  app.post("/api/ops/resend/:orderId", async (c) => {
    if (!(await requireOps(c, env))) return c.json({ error: "Unauthorized" }, 401);
    const order = await store.getOrder(c.req.param("orderId"));
    if (!order) return c.json({ error: "Order not found." }, 404);
    const result = await fulfillPaidOrder(store, mailer, order, { forceResend: true });
    if (result.pdfBytes) pdfCache.set(order.id, result.pdfBytes);
    return c.json({ ok: true, orderId: order.id, email: result.email });
  });

  app.get("/api/ops/pdf/:orderId", async (c) => {
    if (!(await requireOps(c, env))) return c.json({ error: "Unauthorized" }, 401);
    const bytes = pdfCache.get(c.req.param("orderId"));
    if (!bytes) return c.json({ error: "PDF not in memory. Resend or re-fulfill first." }, 404);
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="taxdeedpack-${c.req.param("orderId")}.pdf"`,
      },
    });
  });

  app.post("/api/ops/login", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    if (!secureCompare(body.password || "", env.OPS_PASSWORD || "")) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    setCookie(c, "ops", env.OPS_PASSWORD || "", {
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
      secure: Boolean(env.COOKIE_SECURE),
    });
    return c.json({ ok: true });
  });

  return app;
}

async function requireOps(c, env) {
  const header = c.req.header("authorization") || "";
  const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7) : "";
  const basic = decodeBasic(header);
  const cookie = getCookie(c, "ops") || "";
  const password = env.OPS_PASSWORD || "";
  if (!password) return false;
  return [bearer, basic.password, cookie, c.req.query("key")].some((value) => value && secureCompare(value, password));
}

function decodeBasic(header) {
  if (!header.toLowerCase().startsWith("basic ")) return {};
  try {
    const decoded = atob(header.slice(6));
    const idx = decoded.indexOf(":");
    return { user: decoded.slice(0, idx), password: decoded.slice(idx + 1) };
  } catch {
    return {};
  }
}

function secureCompare(a, b) {
  const left = String(a);
  const right = String(b);
  if (!left || !right || left.length !== right.length) return false;
  let out = 0;
  for (let i = 0; i < left.length; i += 1) out |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return out === 0;
}

function opsUnauthorized(c) {
  c.header("WWW-Authenticate", 'Basic realm="taxdeedpack-ops"');
  return c.text("Unauthorized", 401);
}
