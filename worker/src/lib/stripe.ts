import { PRODUCT_NAME, PRODUCT_PRICE_CENTS } from "../../../shared/compliance.js";

export interface CreatedSession {
  id: string;
  url: string;
}

export async function createCheckoutSession(input: {
  secretKey: string;
  siteUrl: string;
  orderId: string;
  buyerEmail: string;
  propertyLabel: string;
}): Promise<CreatedSession> {
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${input.siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${input.siteUrl}/order.html?canceled=1`);
  params.set("customer_email", input.buyerEmail);
  params.set("client_reference_id", input.orderId);
  params.set("metadata[order_id]", input.orderId);
  params.set("payment_intent_data[metadata][order_id]", input.orderId);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", String(PRODUCT_PRICE_CENTS));
  params.set("line_items[0][price_data][product_data][name]", PRODUCT_NAME);
  params.set(
    "line_items[0][price_data][product_data][description]",
    `Research compilation for ${input.propertyLabel}. Information and research product only.`,
  );

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const data = (await response.json()) as { id?: string; url?: string; error?: { message?: string } };
  if (!response.ok || !data.id || !data.url) {
    throw new Error(data.error?.message || "Stripe Checkout Session could not be created.");
  }
  return { id: data.id, url: data.url };
}

export async function retrieveCheckoutSession(
  secretKey: string,
  sessionId: string,
): Promise<{
  id: string;
  payment_status: string;
  payment_intent: string | null;
  metadata: Record<string, string>;
}> {
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const data = (await response.json()) as {
    id?: string;
    payment_status?: string;
    payment_intent?: string | { id?: string };
    metadata?: Record<string, string>;
    error?: { message?: string };
  };
  if (!response.ok || !data.id) {
    throw new Error(data.error?.message || "Stripe session lookup failed.");
  }
  const paymentIntent =
    typeof data.payment_intent === "string"
      ? data.payment_intent
      : data.payment_intent?.id || null;
  return {
    id: data.id,
    payment_status: data.payment_status || "unpaid",
    payment_intent: paymentIntent,
    metadata: data.metadata || {},
  };
}

export async function verifyStripeSignature(
  payload: string,
  header: string,
  secret: string,
): Promise<boolean> {
  const parts = Object.fromEntries(
    header.split(",").map((piece) => {
      const [k, v] = piece.split("=");
      return [k.trim(), v];
    }),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (Number.isNaN(Number(timestamp)) || ageSeconds > 60 * 5) return false;

  const signed = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signed));
  const expected = [...new Uint8Array(mac)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
