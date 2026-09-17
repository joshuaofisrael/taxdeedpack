import {
  buyerEmailHtml,
  buyerEmailText,
  EMAIL_SUBJECT,
  OPS_EMAIL,
  opsNotifyText,
  propertyLabel,
} from "../../../shared/compliance.js";
import { ADMINJ_DELIVER_ONLY_TO, isFreeTestCode } from "../../../shared/partners.js";
import type { Env, OrderRecord } from "../types.js";

export interface EmailAttachment {
  filename: string;
  contentBase64: string;
}

export async function emailBuyerPdf(
  env: Pick<Env, "RESEND_API_KEY" | "EMAIL_FROM" | "OPS_NOTIFY_EMAIL">,
  order: OrderRecord,
  attachment: EmailAttachment,
): Promise<{ emailed: boolean; skippedReason?: string }> {
  if (!env.RESEND_API_KEY) {
    return { emailed: false, skippedReason: "RESEND_API_KEY is not configured" };
  }
  const label = propertyLabel({
    propertyAddress: order.property_address,
    apn: order.apn,
  });
  const deliverTo = isFreeTestCode(order.referral_code)
    ? ADMINJ_DELIVER_ONLY_TO
    : order.buyer_email;
  const payload = {
    from: env.EMAIL_FROM || "Tax Deed Pack <delivered@resend.dev>",
    to: [deliverTo],
    subject: EMAIL_SUBJECT,
    text: buyerEmailText({
      buyerName: order.buyer_name,
      propertyLabel: label,
      orderId: order.id,
    }),
    html: buyerEmailHtml({
      buyerName: order.buyer_name,
      propertyLabel: label,
      orderId: order.id,
    }),
    attachments: [
      {
        filename: attachment.filename,
        content: attachment.contentBase64,
      },
    ],
  };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Buyer email failed: ${response.status} ${detail}`);
  }

  const notifyTo = env.OPS_NOTIFY_EMAIL || OPS_EMAIL;
  if (notifyTo && !isFreeTestCode(order.referral_code)) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM || "Tax Deed Pack <delivered@resend.dev>",
        to: [notifyTo],
        subject: "Research pack order paid",
        text: opsNotifyText({
          orderId: order.id,
          buyerEmail: order.buyer_email,
          propertyLabel: label,
          referralCode: order.referral_code,
        }),
      }),
    });
  }

  return { emailed: true };
}
