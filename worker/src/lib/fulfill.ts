import { PRODUCT_PRICE_CENTS, propertyLabel } from "../../../shared/compliance.js";
import type { Env, OrderRecord } from "../types.js";
import {
  attachStripeSession,
  getOrderById,
  getOrderBySessionId,
  markPaid,
  markStatus,
  recordReferral,
} from "./db.js";
import { emailBuyerPdf } from "./email.js";
import { generatePackPdf } from "./pdf.js";
import { assembleResearch } from "./public-data.js";

export async function fulfillPaidOrder(
  env: Env,
  orderId: string,
): Promise<{ order: OrderRecord; filename: string; emailed: boolean }> {
  const current = await getOrderById(env.DB, orderId);
  if (!current) throw new Error("Order not found.");
  if (current.status === "fulfilled") {
    return { order: current, filename: `tax-deed-research-pack-${current.id}.pdf`, emailed: true };
  }

  await markStatus(env.DB, orderId, "fulfilling", { lastError: null });
  try {
    const research = await assembleResearch(current);
    const pdf = await generatePackPdf(current, research);
    const emailResult = await emailBuyerPdf(env, current, {
      filename: pdf.filename,
      contentBase64: uint8ToBase64(pdf.bytes),
    });

    if (current.referral_code) {
      await recordReferral(
        env.DB,
        current.referral_code,
        current.id,
        current.amount_cents || PRODUCT_PRICE_CENTS,
      );
    }

    await markStatus(env.DB, orderId, "fulfilled", {
      pdf: true,
      email: emailResult.emailed,
      fulfilled: true,
      lastError: emailResult.emailed ? null : emailResult.skippedReason || null,
    });
    const updated = await getOrderById(env.DB, orderId);
    if (!updated) throw new Error("Order missing after fulfill.");
    return { order: updated, filename: pdf.filename, emailed: emailResult.emailed };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fulfillment failed.";
    await markStatus(env.DB, orderId, "fulfillment_failed", { lastError: message });
    throw error;
  }
}

export async function fulfillFromStripeSession(
  env: Env,
  sessionId: string,
  paymentIntent: string | null,
  metadataOrderId?: string,
): Promise<void> {
  let order = await getOrderBySessionId(env.DB, sessionId);
  if (!order && metadataOrderId) {
    order = await getOrderById(env.DB, metadataOrderId);
    if (order && !order.stripe_session_id) {
      await attachStripeSession(env.DB, order.id, sessionId);
    }
  }
  if (!order) {
    throw new Error(`No order for Stripe session ${sessionId}`);
  }
  if (order.status === "pending_payment") {
    await markPaid(env.DB, order.id, paymentIntent);
  }
  await fulfillPaidOrder(env, order.id);
}

export function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function describeOrder(order: OrderRecord) {
  return {
    id: order.id,
    status: order.status,
    buyerName: order.buyer_name,
    buyerEmail: order.buyer_email,
    property: propertyLabel({
      propertyAddress: order.property_address,
      apn: order.apn,
    }),
    county: order.county,
    state: order.state,
    sections: JSON.parse(order.sections),
    referralCode: order.referral_code,
    amountCents: order.amount_cents,
    createdAt: order.created_at,
    paidAt: order.paid_at,
    fulfilledAt: order.fulfilled_at,
    emailSentAt: order.email_sent_at,
    lastError: order.last_error,
  };
}
