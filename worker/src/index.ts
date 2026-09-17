import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  COMPANY_LEGAL_NAME,
  IMPORTANT_LIMITATIONS,
  OPS_EMAIL,
  PRODUCT_NAME,
  PRODUCT_PRICE_CENTS,
  PRODUCT_PRICE_USD,
  SITE_URL,
  TURNAROUND_COPY,
  WHAT_YOU_DO_NOT_GET,
  WHAT_YOU_GET,
} from "../../shared/compliance.js";
import { matrixPublicView } from "../../shared/jurisdiction.js";
import { createOrderId } from "../../shared/order-id.js";
import { PREFERRED_PARTNERS, SEEDED_REFERRAL_CODES } from "../../shared/partners.js";
import { US_STATES } from "../../shared/us-states.js";
import {
  attachStripeSession,
  getOrderById,
  getOrderBySessionId,
  listOrders,
  markPaid,
  referralStats,
  rememberWebhook,
  seenWebhook,
} from "./lib/db.js";
import { insertPendingOrder } from "./lib/db.js";
import { describeOrder, fulfillFromStripeSession, fulfillPaidOrder } from "./lib/fulfill.js";
import {
  createCheckoutSession,
  verifyStripeSignature,
} from "./lib/stripe.js";
import { parseCheckoutBody } from "./lib/validate-checkout.js";
import type { Env } from "./types.js";

const app = new Hono<{ Bindings: Env }>();

app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      if (!origin) return SITE_URL;
      const allowed = [
        SITE_URL,
        "https://www.taxdeedpack.com",
        "https://joshuaofisrael.github.io",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:8787",
      ];
      return allowed.includes(origin) ? origin : SITE_URL;
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/api/health", (c) =>
  c.json({
    ok: true,
    product: PRODUCT_NAME,
    company: COMPANY_LEGAL_NAME,
  }),
);

app.get("/api/config", (c) =>
  c.json({
    company: COMPANY_LEGAL_NAME,
    product: PRODUCT_NAME,
    priceUsd: PRODUCT_PRICE_USD,
    priceCents: PRODUCT_PRICE_CENTS,
    turnaround: TURNAROUND_COPY,
    opsEmail: OPS_EMAIL,
    whatYouGet: WHAT_YOU_GET,
    whatYouDoNotGet: WHAT_YOU_DO_NOT_GET,
    disclaimer: IMPORTANT_LIMITATIONS,
    partners: PREFERRED_PARTNERS,
    referralSeed: SEEDED_REFERRAL_CODES,
    states: US_STATES,
  }),
);

app.get("/api/jurisdiction/:state", (c) => {
  const view = matrixPublicView(c.req.param("state"));
  if (!view) return c.json({ error: "Unknown US state." }, 400);
  return c.json(view);
});

app.post("/api/checkout", async (c) => {
  const parsed = parseCheckoutBody(await c.req.json().catch(() => null));
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);
  if (!c.env.STRIPE_SECRET_KEY) {
    return c.json({ error: "Stripe is not configured on the API." }, 503);
  }

  const orderId = createOrderId();
  await insertPendingOrder(c.env.DB, orderId, parsed.value, PRODUCT_PRICE_CENTS);
  const label = [
    parsed.value.propertyAddress,
    parsed.value.apn ? `APN ${parsed.value.apn}` : "",
  ]
    .filter(Boolean)
    .join(" / ");

  try {
    const session = await createCheckoutSession({
      secretKey: c.env.STRIPE_SECRET_KEY,
      siteUrl: c.env.SITE_URL || SITE_URL,
      orderId,
      buyerEmail: parsed.value.buyerEmail,
      propertyLabel: label || "subject property",
    });
    await attachStripeSession(c.env.DB, orderId, session.id);
    return c.json({ orderId, url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed.";
    return c.json({ error: message, orderId }, 502);
  }
});

app.post("/api/stripe/webhook", async (c) => {
  const payload = await c.req.text();
  const signature = c.req.header("stripe-signature") || "";
  if (!c.env.STRIPE_WEBHOOK_SECRET) {
    return c.json({ error: "Webhook secret is not configured." }, 503);
  }
  const valid = await verifyStripeSignature(payload, signature, c.env.STRIPE_WEBHOOK_SECRET);
  if (!valid) return c.json({ error: "Invalid Stripe signature." }, 400);

  const event = JSON.parse(payload) as {
    id: string;
    type: string;
    data: { object: Record<string, unknown> };
  };
  if (await seenWebhook(c.env.DB, event.id)) {
    return c.json({ received: true, duplicate: true });
  }
  await rememberWebhook(c.env.DB, event.id, event.type);

  if (event.type === "checkout.session.completed") {
    const obj = event.data.object;
    const sessionId = String(obj.id || "");
    const paymentIntent =
      typeof obj.payment_intent === "string" ? obj.payment_intent : null;
    const paymentStatus = String(obj.payment_status || "");
    const metadata = (obj.metadata || {}) as Record<string, string>;
    if (sessionId && (paymentStatus === "paid" || paymentStatus === "no_payment_required")) {
      await fulfillFromStripeSession(c.env, sessionId, paymentIntent, metadata.order_id);
    }
  }

  return c.json({ received: true });
});

app.get("/api/order-status", async (c) => {
  const sessionId = c.req.query("session_id");
  if (!sessionId) return c.json({ error: "session_id is required." }, 400);
  const order = await getOrderBySessionId(c.env.DB, sessionId);
  if (!order) return c.json({ status: "unknown" });
  return c.json({
    status: order.status,
    orderId: order.id,
    emailSent: Boolean(order.email_sent_at),
  });
});

app.post("/api/dev/simulate-payment", async (c) => {
  if (c.env.ALLOW_DEV_SIMULATE !== "1") {
    return c.json({ error: "Dev simulate is disabled." }, 403);
  }
  const body = (await c.req.json().catch(() => ({}))) as { orderId?: string };
  if (!body.orderId) return c.json({ error: "orderId is required." }, 400);
  const order = await getOrderById(c.env.DB, body.orderId);
  if (!order) return c.json({ error: "Order not found." }, 404);
  await markPaid(c.env.DB, order.id, "dev_simulate");
  const result = await fulfillPaidOrder(c.env, order.id);
  return c.json({
    order: describeOrder(result.order),
    emailed: result.emailed,
    filename: result.filename,
  });
});

function requireOps(c: { req: { header: (name: string) => string | undefined }; env: Env }) {
  const header = c.req.header("authorization") || "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7) : header;
  return Boolean(c.env.OPS_TOKEN) && token === c.env.OPS_TOKEN;
}

app.get("/api/ops/orders", async (c) => {
  if (!requireOps(c)) return c.json({ error: "Unauthorized." }, 401);
  const orders = await listOrders(c.env.DB);
  return c.json({ orders: orders.map(describeOrder) });
});

app.get("/api/ops/referrals", async (c) => {
  if (!requireOps(c)) return c.json({ error: "Unauthorized." }, 401);
  return c.json(await referralStats(c.env.DB));
});

app.post("/api/ops/resend", async (c) => {
  if (!requireOps(c)) return c.json({ error: "Unauthorized." }, 401);
  const body = (await c.req.json().catch(() => ({}))) as { orderId?: string };
  if (!body.orderId) return c.json({ error: "orderId is required." }, 400);
  const result = await fulfillPaidOrder(c.env, body.orderId);
  return c.json({
    order: describeOrder(result.order),
    emailed: result.emailed,
    filename: result.filename,
  });
});

app.get("/api/ops/order/:id", async (c) => {
  if (!requireOps(c)) return c.json({ error: "Unauthorized." }, 401);
  const order = await getOrderById(c.env.DB, c.req.param("id"));
  if (!order) return c.json({ error: "Order not found." }, 404);
  return c.json({ order: describeOrder(order) });
});

app.all("*", (c) => c.json({ error: "Not found." }, 404));

export default app;
