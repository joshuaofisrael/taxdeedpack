import { generateResearchPackPdf } from "../shared/pdf.js";
import { normalizeReferralCode } from "../shared/referrals.js";

export async function fulfillPaidOrder(store, mailer, order, { forceResend = false } = {}) {
  if (!order) throw new Error("Order not found.");
  if (order.status === "pending_payment") throw new Error("Order is not paid.");
  if (order.status === "fulfilled" && !forceResend) {
    return { already: true, order };
  }

  try {
    const pdf = await generateResearchPackPdf(order, order.requestedSections);
    const email = await mailer.sendPack({ to: order.buyerEmail, order, pdf });
    const referralCode = normalizeReferralCode(order.referralCode);
    if (referralCode) {
      await store.recordReferral({
        code: referralCode,
        orderId: order.id,
        amountCents: order.amountCents,
        createdAt: order.paidAt,
      });
    }
    const updated = await store.markFulfilled(order.id, { emailStatus: email.provider || "sent" });
    return { already: false, order: updated, email, fileName: pdf.fileName, pdfBytes: pdf.bytes };
  } catch (error) {
    await store.markFulfillmentError(order.id, error.message || String(error));
    throw error;
  }
}

export async function markPaidAndFulfill(store, mailer, order, payment) {
  const paid = await store.markPaid(order.id, payment);
  return fulfillPaidOrder(store, mailer, paid);
}
