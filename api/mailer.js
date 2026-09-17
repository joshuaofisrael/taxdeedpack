import { BUYER_PACK_HTML, BUYER_PACK_SUBJECT, BUYER_PACK_TEXT, assertEmailCopyHasNoDashes } from "../shared/email-copy.js";
import { COMPANY_LEGAL_NAME, OPS_EMAIL } from "../shared/disclaimer.js";

assertEmailCopyHasNoDashes();

export function createMailer(env) {
  const sent = [];

  return {
    sent,
    async sendPack({ to, order, pdf }) {
      const payload = {
        from: env.MAIL_FROM || `${COMPANY_LEGAL_NAME} <reports@taxdeedpack.com>`,
        to,
        reply_to: env.OPS_EMAIL || OPS_EMAIL,
        subject: BUYER_PACK_SUBJECT,
        text: BUYER_PACK_TEXT,
        html: BUYER_PACK_HTML,
        attachments: [
          {
            filename: pdf.fileName,
            content: bytesToBase64(pdf.bytes),
          },
        ],
        headers: {
          "X-TaxDeedPack-Order": order.id,
        },
      };

      if (!env.RESEND_API_KEY) {
        sent.push({ ...payload, provider: "log-only" });
        return { ok: true, provider: "log-only", id: `log_${order.id}` };
      }

      const response = await fetch(env.RESEND_API_URL || "https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: payload.from,
          to: [payload.to],
          reply_to: payload.reply_to,
          subject: payload.subject,
          text: payload.text,
          html: payload.html,
          attachments: payload.attachments,
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.message || `Resend HTTP ${response.status}`);
      }
      sent.push({ ...payload, provider: "resend", id: body.id });
      return { ok: true, provider: "resend", id: body.id };
    },
  };
}

function bytesToBase64(bytes) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
