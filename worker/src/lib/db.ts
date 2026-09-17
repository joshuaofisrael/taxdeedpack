import type { OrderRecord, OrderStatus } from "../types.js";
import type { ParsedCheckout } from "./validate-checkout.js";

export async function insertPendingOrder(
  db: D1Database,
  id: string,
  checkout: ParsedCheckout,
  amountCents: number,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO orders (
        id, stripe_session_id, stripe_payment_intent, status,
        buyer_name, buyer_email, property_address, apn, county, state,
        sections, referral_code, amount_cents, disclaimer_accepted_at, created_at
      ) VALUES (?, NULL, NULL, 'pending_payment', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      checkout.buyerName,
      checkout.buyerEmail,
      checkout.propertyAddress,
      checkout.apn,
      checkout.county,
      checkout.state,
      JSON.stringify(checkout.sections),
      checkout.referralCode,
      amountCents,
      checkout.disclaimerAcceptedAt,
      new Date().toISOString(),
    )
    .run();
}

export async function attachStripeSession(
  db: D1Database,
  orderId: string,
  sessionId: string,
): Promise<void> {
  await db
    .prepare("UPDATE orders SET stripe_session_id = ? WHERE id = ?")
    .bind(sessionId, orderId)
    .run();
}

export async function getOrderById(
  db: D1Database,
  id: string,
): Promise<OrderRecord | null> {
  return db.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first<OrderRecord>();
}

export async function getOrderBySessionId(
  db: D1Database,
  sessionId: string,
): Promise<OrderRecord | null> {
  return db
    .prepare("SELECT * FROM orders WHERE stripe_session_id = ?")
    .bind(sessionId)
    .first<OrderRecord>();
}

export async function markPaid(
  db: D1Database,
  orderId: string,
  paymentIntent: string | null,
): Promise<void> {
  await db
    .prepare(
      "UPDATE orders SET status = 'paid', paid_at = ?, stripe_payment_intent = COALESCE(?, stripe_payment_intent) WHERE id = ? AND status = 'pending_payment'",
    )
    .bind(new Date().toISOString(), paymentIntent, orderId)
    .run();
}

export async function markStatus(
  db: D1Database,
  orderId: string,
  status: OrderStatus,
  extra?: { lastError?: string | null; pdf?: boolean; email?: boolean; fulfilled?: boolean },
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `UPDATE orders SET
        status = ?,
        last_error = ?,
        pdf_generated_at = CASE WHEN ? THEN ? ELSE pdf_generated_at END,
        email_sent_at = CASE WHEN ? THEN ? ELSE email_sent_at END,
        fulfilled_at = CASE WHEN ? THEN ? ELSE fulfilled_at END
      WHERE id = ?`,
    )
    .bind(
      status,
      extra?.lastError ?? null,
      extra?.pdf ? 1 : 0,
      extra?.pdf ? now : null,
      extra?.email ? 1 : 0,
      extra?.email ? now : null,
      extra?.fulfilled ? 1 : 0,
      extra?.fulfilled ? now : null,
      orderId,
    )
    .run();
}

export async function recordReferral(
  db: D1Database,
  code: string,
  orderId: string,
  amountCents: number,
): Promise<void> {
  await db
    .prepare(
      "INSERT OR IGNORE INTO referrals (code, order_id, amount_cents, created_at) VALUES (?, ?, ?, ?)",
    )
    .bind(code, orderId, amountCents, new Date().toISOString())
    .run();
}

export async function listOrders(db: D1Database, limit = 100): Promise<OrderRecord[]> {
  const result = await db
    .prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT ?")
    .bind(limit)
    .all<OrderRecord>();
  return result.results ?? [];
}

export async function referralStats(db: D1Database) {
  const codes = await db
    .prepare("SELECT code, label, partner, active FROM referral_codes ORDER BY code")
    .all<{ code: string; label: string; partner: string | null; active: number }>();
  const rows = await db
    .prepare(
      `SELECT code, COUNT(*) as order_count, SUM(amount_cents) as total_cents, MAX(created_at) as last_at
       FROM referrals GROUP BY code ORDER BY code`,
    )
    .all<{
      code: string;
      order_count: number;
      total_cents: number;
      last_at: string;
    }>();
  const events = await db
    .prepare(
      "SELECT code, order_id, amount_cents, created_at FROM referrals ORDER BY created_at DESC LIMIT 200",
    )
    .all<{ code: string; order_id: string; amount_cents: number; created_at: string }>();

  return {
    codes: codes.results ?? [],
    totals: rows.results ?? [],
    events: events.results ?? [],
  };
}

export async function seenWebhook(db: D1Database, eventId: string): Promise<boolean> {
  const existing = await db
    .prepare("SELECT id FROM webhook_events WHERE id = ?")
    .bind(eventId)
    .first();
  return Boolean(existing);
}

export async function rememberWebhook(
  db: D1Database,
  eventId: string,
  type: string,
): Promise<void> {
  await db
    .prepare("INSERT OR IGNORE INTO webhook_events (id, type, processed_at) VALUES (?, ?, ?)")
    .bind(eventId, type, new Date().toISOString())
    .run();
}

export async function isKnownReferralCode(db: D1Database, code: string): Promise<boolean> {
  const row = await db
    .prepare("SELECT code FROM referral_codes WHERE code = ? AND active = 1")
    .bind(code)
    .first();
  return Boolean(row);
}
