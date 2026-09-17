import { PRICE_CENTS, PRODUCT_NAME } from "../shared/disclaimer.js";
import { propertyLabel } from "../shared/validation.js";

export async function createCheckoutSession({ env, order, siteUrl }) {
  if (!env.STRIPE_SECRET_KEY) {
    return {
      id: `cs_test_local_${order.id}`,
      url: `${siteUrl}/success.html?session_id=cs_test_local_${order.id}&test_order=${order.id}`,
      testMode: true,
    };
  }

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${siteUrl}/order.html?canceled=1`);
  params.set("customer_email", order.buyerEmail);
  params.set("client_reference_id", order.id);
  params.set("metadata[order_id]", order.id);
  params.set("metadata[state]", order.state);
  params.set("metadata[referral_code]", order.referralCode || "");
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", String(PRICE_CENTS));
  params.set("line_items[0][price_data][product_data][name]", PRODUCT_NAME);
  params.set(
    "line_items[0][price_data][product_data][description]",
    `Information and research product only. One property: ${propertyLabel(order)}`,
  );

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const session = await response.json();
  if (!response.ok) {
    throw new Error(session.error?.message || `Stripe Checkout HTTP ${response.status}`);
  }
  return session;
}

export async function retrieveCheckoutSession(env, sessionId) {
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
  });
  const session = await response.json();
  if (!response.ok) {
    throw new Error(session.error?.message || `Stripe retrieve HTTP ${response.status}`);
  }
  return session;
}

export function verifyStripeWebhook(rawBody, signatureHeader, secret) {
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }
  if (!signatureHeader) {
    throw new Error("Missing Stripe-Signature header.");
  }
  return parseAndVerifyStripeSignature(rawBody, signatureHeader, secret);
}

async function parseAndVerifyStripeSignature(rawBody, header, secret) {
  const parts = Object.fromEntries(
    header.split(",").map((piece) => {
      const [key, ...rest] = piece.split("=");
      return [key.trim(), rest.join("=")];
    }),
  );
  const timestamp = parts.t;
  const v1 = parts.v1;
  if (!timestamp || !v1) throw new Error("Malformed Stripe-Signature header.");

  const signed = `${timestamp}.${rawBody}`;
  const expected = await hmacSha256Hex(secret, signed);
  if (!timingSafeEqual(expected, v1)) {
    throw new Error("Invalid Stripe webhook signature.");
  }
  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (ageSeconds > 60 * 5) {
    throw new Error("Stripe webhook timestamp too old.");
  }
  return JSON.parse(rawBody);
}

async function hmacSha256Hex(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder().encode(value));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function encoder() {
  return new TextEncoder();
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}
