import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyStripeSignature } from "../worker/src/lib/stripe.js";

describe("Stripe webhook signatures", () => {
  it("accepts a fresh valid HMAC and rejects a bad one", async () => {
    const secret = "whsec_test";
    const payload = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });
    const timestamp = Math.floor(Date.now() / 1000);
    const v1 = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
    await expect(verifyStripeSignature(payload, `t=${timestamp},v1=${v1}`, secret)).resolves.toBe(true);
    await expect(verifyStripeSignature(payload, `t=${timestamp},v1=deadbeef`, secret)).resolves.toBe(false);
  });
});
